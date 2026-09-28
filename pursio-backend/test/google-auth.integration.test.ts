import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { once } from "node:events";
import { test } from "@jest/globals";
import { eq, inArray } from "drizzle-orm";
import { createApp } from "../src/app.js";
import { loadConfig } from "../src/config/env.js";
import { createDb } from "../src/db/index.js";
import { authAttempts, googleIdentities, users } from "../src/db/schema/index.js";
import type { EmailSender } from "../src/integrations/email/email-sender.js";
import type { GoogleAuthorization } from "../src/integrations/google/google-authorization.js";
import type { GoogleVerifier } from "../src/integrations/google/google-verifier.js";

(process.env.TEST_DATABASE_URL ? test : test.skip)("Google redirect sign-in checks state and nonce, creates and links accounts", async () => {
  const config = loadConfig({ NODE_ENV: "test", DATABASE_URL: process.env.TEST_DATABASE_URL!, REDIS_URL: "redis://localhost:6381", WEB_ORIGIN: "http://localhost:3000", COOKIE_SECURE: "false", GOOGLE_CLIENT_ID: "test-google-client", GOOGLE_CLIENT_SECRET: "test-google-secret", GOOGLE_REDIRECT_URI: "http://localhost:4000/api/auth/google/callback" });
  const { db, pool } = createDb(config.DATABASE_URL);
  const emailA = `google-${randomUUID()}@example.test`;
  const emailB = `password-${randomUUID()}@gmail.com`;
  const emailC = `other-${randomUUID()}@example.test`;
  const subjects = [randomUUID(), randomUUID(), randomUUID()];
  const emails = [emailA, emailB, emailC];
  let verifyUrl = "";
  let lastNonce = "";
  const sender: EmailSender = { async sendAction(_to, purpose, url) { if (purpose === "verify_email") verifyUrl = url; } };
  const authorization: GoogleAuthorization = {
    authorizationUrl({ state, nonce, codeChallenge }) {
      assert.ok(codeChallenge.length >= 43);
      lastNonce = nonce;
      return `https://accounts.google.test/authorize?state=${state}`;
    },
    async exchangeCode(code, codeVerifier) {
      assert.ok(codeVerifier.length >= 43);
      assert.match(code, /^[ABC]$/);
      return code;
    },
  };
  const verifier: GoogleVerifier = { async verify(credential, expectedNonce) {
    assert.equal(expectedNonce, lastNonce);
    const index = ["A", "B", "C"].indexOf(credential);
    assert.ok(index >= 0);
    return { subject: subjects[index], email: emails[index], displayName: "Google User", authoritativeEmail: index === 1 };
  } };
  const rateKey = createHash("sha256").update("auth:127.0.0.1").digest("hex");
  await db.delete(authAttempts).where(eq(authAttempts.key, rateKey));
  const server = createApp({ db, config, redis: { ping: async () => "PONG" }, emailSender: sender, googleVerifier: verifier, googleAuthorization: authorization }).listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const base = `http://127.0.0.1:${address.port}`;
  const post = (path: string, body: object, cookie = "") => fetch(`${base}${path}`, { method: "POST", headers: { "Content-Type": "application/json", Origin: config.WEB_ORIGIN, ...(cookie ? { Cookie: cookie } : {}) }, body: JSON.stringify(body) });
  const start = async (path = "/api/auth/google/start", session = "") => {
    const response = await fetch(`${base}${path}`, { redirect: "manual", headers: session ? { Cookie: session } : {} });
    assert.equal(response.status, 302);
    const location = new URL(response.headers.get("location")!);
    assert.equal(location.hostname, "accounts.google.test");
    const flowCookie = response.headers.get("set-cookie")!.split(";")[0];
    return { state: location.searchParams.get("state")!, flowCookie };
  };
  const callback = (state: string, code: string, cookie: string) => fetch(`${base}/api/auth/google/callback?state=${state}&code=${code}`, { redirect: "manual", headers: { Cookie: cookie } });
  try {
    assert.equal((await fetch(`${base}/api/auth/google`, { method: "POST", headers: { Origin: config.WEB_ORIGIN } })).status, 401);
    const firstFlow = await start();
    const forged = await callback(firstFlow.state, "A", "");
    assert.equal(forged.status, 303);
    assert.match(forged.headers.get("location")!, /error=google_sign_in_failed/);
    const wrongState = await callback("wrong", "A", firstFlow.flowCookie);
    assert.match(wrongState.headers.get("location")!, /error=google_sign_in_failed/);
    const first = await callback(firstFlow.state, "A", firstFlow.flowCookie);
    assert.equal(first.status, 303);
    assert.equal(first.headers.get("location"), "http://localhost:3000/auth/google/callback");
    assert.ok(first.headers.get("set-cookie")?.includes("pursio_session="));
    const [stored] = await db.select({ id: users.id, passwordHash: users.passwordHash, subject: googleIdentities.subject }).from(users).innerJoin(googleIdentities, eq(googleIdentities.userId, users.id)).where(eq(users.email, emailA));
    assert.equal(stored.passwordHash, null);
    assert.equal(stored.subject, subjects[0]);
    const again = await start();
    assert.equal((await callback(again.state, "A", again.flowCookie)).status, 303);
    assert.equal((await db.select().from(users).where(eq(users.email, emailA))).length, 1);

    assert.equal((await post("/api/auth/register", { email: emailB, password: "A strong passphrase 123!", displayName: "Password User" })).status, 202);
    assert.equal((await post("/api/auth/verify-email", { token: new URL(verifyUrl).searchParams.get("token")! })).status, 204);
    const [passwordUser] = await db.select({ id: users.id }).from(users).where(eq(users.email, emailB));
    const autoFlow = await start();
    assert.equal((await callback(autoFlow.state, "B", autoFlow.flowCookie)).status, 303);
    const [autoLinked] = await db.select({ id: users.id }).from(users).innerJoin(googleIdentities, eq(googleIdentities.userId, users.id)).where(eq(googleIdentities.subject, subjects[1]));
    assert.equal(autoLinked.id, passwordUser.id);

    await db.delete(authAttempts).where(eq(authAttempts.key, rateKey));
    assert.equal((await post("/api/auth/register", { email: emailC, password: "A strong passphrase 123!", displayName: "Other User" })).status, 202);
    assert.equal((await post("/api/auth/verify-email", { token: new URL(verifyUrl).searchParams.get("token")! })).status, 204);
    const blockedFlow = await start();
    const blocked = await callback(blockedFlow.state, "C", blockedFlow.flowCookie);
    assert.match(blocked.headers.get("location")!, /error=account_link_required/);
    const passwordLogin = await post("/api/auth/login", { email: emailC, password: "A strong passphrase 123!" });
    assert.equal(passwordLogin.status, 200);
    const session = passwordLogin.headers.get("set-cookie")!.split(";")[0];
    const linkFlow = await start("/api/auth/google/link/start", session);
    const linked = await callback(linkFlow.state, "C", `${session}; ${linkFlow.flowCookie}`);
    assert.equal(linked.headers.get("location"), "http://localhost:3000/auth/google/callback?linked=1");
    const [linkedUser] = await db.select({ id: users.id }).from(users).innerJoin(googleIdentities, eq(googleIdentities.userId, users.id)).where(eq(googleIdentities.subject, subjects[2]));
    assert.equal(linkedUser.id, (await passwordLogin.json() as { user: { id: string } }).user.id);
  } finally {
    await db.delete(authAttempts).where(eq(authAttempts.key, rateKey));
    await db.delete(users).where(inArray(users.email, emails));
    server.close();
    await once(server, "close");
    await pool.end();
  }
});
