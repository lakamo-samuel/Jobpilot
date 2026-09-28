import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { test } from "@jest/globals";
import { eq } from "drizzle-orm";
import { createDb } from "../src/db/index.js";
import { users } from "../src/db/schema/index.js";
import { loadConfig } from "../src/config/env.js";
import type { GmailProvider } from "../src/integrations/gmail/gmail-provider.js";
import type { GoogleVerifier } from "../src/integrations/google/google-verifier.js";
import { GmailRepository } from "../src/modules/gmail/gmail.repository.js";
import { GmailService } from "../src/modules/gmail/gmail.service.js";
import { AppError } from "../src/shared/errors/app-error.js";

const config = loadConfig({ DATABASE_URL: "postgresql://test:test@localhost:5432/test", REDIS_URL: "redis://localhost:6379", WEB_ORIGIN: "http://localhost:3000", GOOGLE_CLIENT_ID: "test-client-id", GOOGLE_CLIENT_SECRET: "test-client-secret", GOOGLE_REDIRECT_URI: "http://localhost:4000/api/auth/google/callback", GMAIL_REDIRECT_URI: "http://localhost:4000/api/integrations/gmail/callback", GMAIL_TOKEN_ENCRYPTION_KEY: randomBytes(32).toString("hex") });

(process.env.TEST_DATABASE_URL ? test : test.skip)("Gmail connection encrypts tokens, scopes messages to owner, limits sync, and deletes on disconnect", async () => {
  const { db, pool } = createDb(process.env.TEST_DATABASE_URL!);
  const [owner, other] = await db.insert(users).values([{ email: `${randomUUID()}@example.test`, passwordHash: "test", displayName: "Owner" }, { email: `${randomUUID()}@example.test`, passwordHash: "test", displayName: "Other" }]).returning({ id: users.id });
  let revoked = "";
  const provider: GmailProvider = {
    authorizationUrl: () => "https://accounts.google.com/test",
    exchangeCode: async () => ({ idToken: "id-token", refreshToken: "private-refresh-token" }),
    listRecent: async token => { assert.equal(token, "private-refresh-token"); return [{ id: "gmail-1", threadId: "thread-1", subject: "Interview invitation", sender: "jobs@example.com", snippet: "Please select a time.", receivedAt: new Date() }]; },
    revoke: async token => { revoked = token; },
  };
  const verifier: GoogleVerifier = { verify: async (_token, nonce) => { assert.equal(nonce, "expected-nonce"); return { subject: "google-subject", email: "owner@gmail.com", displayName: "Owner", authoritativeEmail: true }; } };
  const repository = new GmailRepository(db);
  const service = new GmailService(repository, provider, verifier, config);
  try {
    await service.connect(owner.id, "code", "verifier", "expected-nonce");
    const row = await repository.connection(owner.id);
    assert.ok(row);
    assert.ok(!row.encryptedRefreshToken.includes("private-refresh-token"));
    assert.equal((await service.status(owner.id)).email, "owner@gmail.com");
    assert.deepEqual(await repository.claimDueSyncs(), [owner.id]);
    assert.deepEqual(await repository.claimDueSyncs(), []);
    assert.equal((await service.sync(owner.id)).matched, 1);
    assert.equal((await service.messages(owner.id)).items.length, 1);
    await assert.rejects(service.sync(owner.id), (error: unknown) => error instanceof AppError && error.code === "gmail_sync_rate_limited");
    await assert.rejects(service.messages(other.id), (error: unknown) => error instanceof AppError && error.code === "gmail_not_connected");
    await service.disconnect(owner.id);
    assert.equal(revoked, "private-refresh-token");
    assert.equal((await service.status(owner.id)).connected, false);
    assert.equal((await repository.messages(owner.id)).length, 0);
  } finally {
    await db.delete(users).where(eq(users.id, owner.id));
    await db.delete(users).where(eq(users.id, other.id));
    await pool.end();
  }
});
