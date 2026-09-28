import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { test } from "@jest/globals";
import { once } from "node:events";
import { eq } from "drizzle-orm";
import { createApp } from "../src/app.js";
import { loadConfig } from "../src/config/env.js";
import { createDb } from "../src/db/index.js";
import { authAttempts, users } from "../src/db/schema/index.js";
import type { EmailSender } from "../src/integrations/email/email-sender.js";

(process.env.TEST_DATABASE_URL ? test : test.skip)("HTTP auth and Swagger contract", async () => {
  const config = loadConfig({ NODE_ENV: "test", DATABASE_URL: process.env.TEST_DATABASE_URL!, REDIS_URL: "redis://localhost:6381", WEB_ORIGIN: "http://localhost:3000", COOKIE_SECURE: "false" });
  const { db, pool } = createDb(config.DATABASE_URL);
  const rateKey = createHash("sha256").update("auth:127.0.0.1").digest("hex");
  await db.delete(authAttempts).where(eq(authAttempts.key, rateKey));
  let verificationUrl = "";
  const sender: EmailSender = { async sendAction(_to, purpose, url) { if (purpose === "verify_email") verificationUrl = url; } };
  let redisAvailable = true;
  const server = createApp({ db, config, redis: { ping: async () => { if (!redisAvailable) throw new Error("redis_unavailable"); return "PONG"; } }, emailSender: sender }).listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const base = `http://127.0.0.1:${address.port}`;
  const email = `http-${randomUUID()}@example.test`;
  const post = (path: string, body: object, cookie?: string) => fetch(`${base}${path}`, { method: "POST", headers: { "Content-Type": "application/json", Origin: config.WEB_ORIGIN, ...(cookie ? { Cookie: cookie } : {}) }, body: JSON.stringify(body) });
  try {
    assert.equal((await fetch(`${base}/health/ready`)).status, 200);
    redisAvailable = false;
    assert.equal((await fetch(`${base}/health/ready`)).status, 503);
    redisAvailable = true;
    const spec = await fetch(`${base}/openapi.json`);
    assert.equal(spec.status, 200);
    const specBody = await spec.json() as { paths: Record<string, unknown> };
    assert.ok(specBody.paths["/api/auth/register"]);
    assert.equal((await fetch(`${base}/docs/`)).status, 200);
    assert.equal((await post("/api/auth/register", { email, password: "A strong passphrase 123!", displayName: "HTTP Test" })).status, 202);
    assert.ok(verificationUrl);
    assert.equal((await post("/api/auth/login", { email, password: "A strong passphrase 123!" })).status, 403);
    const token = new URL(verificationUrl).searchParams.get("token")!;
    assert.equal((await post("/api/auth/verify-email", { token })).status, 204);
    const login = await post("/api/auth/login", { email, password: "A strong passphrase 123!" });
    assert.equal(login.status, 200);
    const cookie = login.headers.get("set-cookie")?.split(";")[0] ?? "";
    assert.ok(cookie?.startsWith("pursio_session="));
    assert.equal((await fetch(`${base}/api/auth/me`, { headers: { Cookie: cookie } })).status, 200);
    assert.equal((await post("/api/auth/logout", {}, cookie)).status, 204);
    assert.equal((await fetch(`${base}/api/auth/me`, { headers: { Cookie: cookie } })).status, 401);
  } finally {
    await db.delete(users).where(eq(users.email, email));
    await db.delete(authAttempts).where(eq(authAttempts.key, rateKey));
    server.close();
    await once(server, "close");
    await pool.end();
  }
});
