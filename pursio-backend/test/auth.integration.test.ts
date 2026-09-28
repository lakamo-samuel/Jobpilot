import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "@jest/globals";
import { eq } from "drizzle-orm";
import { loadConfig } from "../src/config/env.js";
import { createDb } from "../src/db/index.js";
import { users } from "../src/db/schema/index.js";
import type { EmailSender } from "../src/integrations/email/email-sender.js";
import { AppError } from "../src/shared/errors/app-error.js";
import { hashToken } from "../src/shared/security/session.js";
import { AuthRepository } from "../src/modules/auth/auth.repository.js";
import { AuthService } from "../src/modules/auth/auth.service.js";

(process.env.TEST_DATABASE_URL ? test : test.skip)("registration requires verification; reset revokes sessions and tokens are single-use", async () => {
  const config = loadConfig({ NODE_ENV: "test", DATABASE_URL: process.env.TEST_DATABASE_URL!, REDIS_URL: "redis://localhost:6381", WEB_ORIGIN: "http://localhost:3000", COOKIE_SECURE: "false" });
  const { db, pool } = createDb(config.DATABASE_URL);
  const sent: { purpose: string; url: string }[] = [];
  const emailSender: EmailSender = { async sendAction(_to, purpose, url) { sent.push({ purpose, url }); } };
  const repository = new AuthRepository(db);
  const service = new AuthService(repository, config, emailSender);
  const email = `auth-${randomUUID()}@example.test`;
  let userId: string | undefined;
  try {
    await service.register({ email, password: "A strong passphrase 123!", displayName: "Test User" }, randomUUID());
    const user = await repository.findByEmail(email);
    assert.ok(user);
    userId = user.id;
    const prematureSession = await service.createSession(user.id);
    assert.equal(await repository.findSession(hashToken(prematureSession)), undefined);
    await assert.rejects(service.login({ email, password: "A strong passphrase 123!" }), (error: unknown) => error instanceof AppError && error.code === "email_not_verified");
    const verifyToken = new URL(sent[0]!.url).searchParams.get("token")!;
    await service.verifyEmail({ token: verifyToken });
    await assert.rejects(service.verifyEmail({ token: verifyToken }), (error: unknown) => error instanceof AppError && error.code === "invalid_or_expired_token");
    assert.ok(await service.login({ email, password: "A strong passphrase 123!" }));
    const session = await service.createSession(user.id);
    assert.ok(await repository.findSession(hashToken(session)));
    await service.requestPasswordReset({ email });
    const resetToken = new URL(sent.at(-1)!.url).searchParams.get("token")!;
    await service.resetPassword({ token: resetToken, password: "A different passphrase 456!" });
    assert.equal(await repository.findSession(hashToken(session)), undefined);
    assert.equal(await service.login({ email, password: "A strong passphrase 123!" }), null);
    assert.ok(await service.login({ email, password: "A different passphrase 456!" }));
    await assert.rejects(service.resetPassword({ token: resetToken, password: "Third passphrase 789!" }), (error: unknown) => error instanceof AppError && error.code === "invalid_or_expired_token");
  } finally {
    if (userId) await db.delete(users).where(eq(users.id, userId));
    await pool.end();
  }
});
