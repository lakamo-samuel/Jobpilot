import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import type { Config } from "../../config/env.js";
import type { GmailProvider } from "../../integrations/gmail/gmail-provider.js";
import type { GoogleVerifier } from "../../integrations/google/google-verifier.js";
import { AppError } from "../../shared/errors/app-error.js";
import { GmailRepository } from "./gmail.repository.js";

export class GmailService {
  constructor(private readonly repository: GmailRepository, private readonly provider: GmailProvider | undefined, private readonly verifier: GoogleVerifier | undefined, private readonly config: Config) {}
  private key() {
    if (!this.config.GMAIL_TOKEN_ENCRYPTION_KEY || !this.provider || !this.verifier) throw new AppError(503, "gmail_not_configured");
    return Buffer.from(this.config.GMAIL_TOKEN_ENCRYPTION_KEY, "hex");
  }
  private encrypt(value: string) {
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", this.key(), iv);
    const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
    return [iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), encrypted.toString("base64url")].join(".");
  }
  private decrypt(value: string) {
    try {
      const [iv, tag, encrypted] = value.split(".").map(part => Buffer.from(part, "base64url"));
      const decipher = createDecipheriv("aes-256-gcm", this.key(), iv);
      decipher.setAuthTag(tag);
      return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
    } catch { throw new AppError(503, "gmail_token_unavailable"); }
  }
  authorizationUrl(input: { state: string; nonce: string; codeChallenge: string }) {
    this.key();
    return this.provider!.authorizationUrl(input);
  }
  async connect(userId: string, code: string, verifier: string, nonce: string) {
    this.key();
    const tokens = await this.provider!.exchangeCode(code, verifier);
    const identity = await this.verifier!.verify(tokens.idToken, nonce);
    await this.repository.connect(userId, identity.subject, identity.email, this.encrypt(tokens.refreshToken));
  }
  async status(userId: string) {
    const row = await this.repository.connection(userId);
    return { connected: Boolean(row), email: row?.email ?? null, connectedAt: row?.connectedAt ?? null, lastSyncedAt: row?.lastSyncedAt ?? null };
  }
  async disconnect(userId: string) {
    const row = await this.repository.connection(userId);
    if (!row) return;
    const token = this.decrypt(row.encryptedRefreshToken);
    await this.repository.disconnect(userId);
    if (this.provider) await this.provider.revoke(token);
  }
  async sync(userId: string, automatic = false) {
    const row = await this.repository.connection(userId);
    if (!row) throw new AppError(409, "gmail_not_connected");
    if (!automatic && row.lastSyncedAt && Date.now() - row.lastSyncedAt.getTime() < 5 * 60_000) throw new AppError(429, "gmail_sync_rate_limited");
    this.key();
    const messages = await this.provider!.listRecent(this.decrypt(row.encryptedRefreshToken));
    await this.repository.saveMessages(userId, messages);
    return { matched: messages.length, items: await this.repository.messages(userId) };
  }
  async messages(userId: string) {
    if (!(await this.repository.connection(userId))) throw new AppError(409, "gmail_not_connected");
    return { items: await this.repository.messages(userId) };
  }
}
