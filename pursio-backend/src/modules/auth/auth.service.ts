import { createHash } from "node:crypto";
import type { Config } from "../../config/env.js";
import type { GoogleVerifier } from "../../integrations/google/google-verifier.js";
import type { EmailSender } from "../../integrations/email/email-sender.js";
import { AppError } from "../../shared/errors/app-error.js";
import { hashPassword, hashToken, newSessionToken, sessionLifetimeMs, verifyPassword } from "../../shared/security/session.js";
import { defaultPolicy } from "../agent/agent.schema.js";
import { defaultProfile } from "../profile/profile.schema.js";
import { AuthRepository } from "./auth.repository.js";
import { emailSchema, loginSchema, registerSchema, resetPasswordSchema, tokenSchema } from "./auth.schema.js";

export class AuthService {
  constructor(private readonly repository: AuthRepository, private readonly config: Config, private readonly email: EmailSender | undefined, private readonly google: GoogleVerifier | undefined = undefined) {}
  private sender(): EmailSender { if (!this.email) throw new AppError(503, "email_not_configured"); return this.email; }
  async limitAttempt(ip: string) {
    const key = createHash("sha256").update(`auth:${ip}`).digest("hex");
    return (await this.repository.countAttempt(key, new Date())) <= 10;
  }
  private async limitEmail(purpose: string, email: string) {
    const key = createHash("sha256").update(`${purpose}:${email}`).digest("hex");
    if ((await this.repository.countAttempt(key, new Date(), 60 * 60000)) > 3) throw new AppError(429, "rate_limited");
  }
  private async sendToken(user: { id: string; email: string }, purpose: "verify_email" | "reset_password", sender: EmailSender) {
    const token = newSessionToken();
    const tokenHash = hashToken(token);
    await this.repository.issueToken(user.id, purpose, tokenHash, new Date(Date.now() + (purpose === "verify_email" ? 24 * 60 : 60) * 60000));
    const path = purpose === "verify_email" ? "/auth/verify-email" : "/auth/reset-password";
    const url = `${this.config.WEB_ORIGIN}${path}?token=${token}`;
    await sender.sendAction(user.email, purpose, url, `${purpose}-${tokenHash}`);
  }
  async register(body: unknown, traceId: string) {
    const input = registerSchema.parse(body);
    const sender = this.sender();
    await this.limitEmail("register", input.email);
    const { globalMode, ...data } = defaultPolicy;
    const user = await this.repository.register({ email: input.email, passwordHash: await hashPassword(input.password), displayName: input.displayName, timezone: input.timezone }, defaultProfile, { globalMode, data }, traceId);
    if (user) await this.sendToken(user, "verify_email", sender);
  }
  async resendVerification(body: unknown) {
    const { email } = emailSchema.parse(body);
    const sender = this.sender();
    await this.limitEmail("verify", email);
    const user = await this.repository.findByEmail(email);
    if (user && !user.emailVerifiedAt) await this.sendToken(user, "verify_email", sender);
  }
  async requestPasswordReset(body: unknown) {
    const { email } = emailSchema.parse(body);
    const sender = this.sender();
    await this.limitEmail("reset", email);
    const user = await this.repository.findByEmail(email);
    if (user?.emailVerifiedAt) await this.sendToken(user, "reset_password", sender);
  }
  async verifyEmail(body: unknown, traceId?: string) {
    const { token } = tokenSchema.parse(body);
    if (!(await this.repository.consumeToken(hashToken(token), "verify_email", undefined, traceId))) throw new AppError(400, "invalid_or_expired_token");
  }
  async resetPassword(body: unknown, traceId?: string) {
    const { token, password } = resetPasswordSchema.parse(body);
    if (!(await this.repository.consumeToken(hashToken(token), "reset_password", await hashPassword(password), traceId))) throw new AppError(400, "invalid_or_expired_token");
  }
  async googleSignIn(credential: string, traceId: string, expectedNonce: string) {
    if (!this.google) throw new AppError(503, "google_auth_not_configured");
    const identity = await this.google.verify(credential, expectedNonce);
    const { globalMode, ...data } = defaultPolicy;
    return this.repository.findOrCreateGoogleUser(identity, defaultProfile, { globalMode, data }, traceId);
  }
  async linkGoogle(userId: string, credential: string, traceId: string, expectedNonce: string) {
    if (!this.google) throw new AppError(503, "google_auth_not_configured");
    const identity = await this.google.verify(credential, expectedNonce);
    await this.repository.linkGoogleUser(userId, identity, traceId);
  }
  async login(body: unknown) {
    const input = loginSchema.parse(body);
    const user = await this.repository.findByEmail(input.email);
    const valid = user?.passwordHash && (!user.lockedUntil || user.lockedUntil < new Date()) && await verifyPassword(user.passwordHash, input.password);
    if (!valid) {
      if (user) await this.repository.recordFailedLogin(user.id, user.failedLogins >= 4, user.lockedUntil);
      return null;
    }
    if (!user.emailVerifiedAt) throw new AppError(403, "email_not_verified");
    await this.repository.resetFailedLogins(user.id);
    return { id: user.id, email: user.email, displayName: user.displayName };
  }
  currentUser(userId: string) { return this.repository.findById(userId); }
  sessionUser(token: string | undefined) { return token ? this.repository.findSession(hashToken(token)) : undefined; }
  async createSession(userId: string) {
    const token = newSessionToken();
    await this.repository.createSession(hashToken(token), userId, new Date(Date.now() + sessionLifetimeMs));
    return token;
  }
  async revokeSession(token: string | undefined) { if (token) await this.repository.revokeSession(hashToken(token)); }
}
