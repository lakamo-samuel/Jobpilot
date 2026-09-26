import { timingSafeEqual, createHash } from "node:crypto";
import type { Config } from "../../config/env.js";
import { hashPassword, hashToken, newSessionToken, sessionLifetimeMs, verifyPassword } from "../../shared/security/session.js";
import { defaultPolicy } from "../agent/agent.schema.js";
import { defaultProfile } from "../profile/profile.schema.js";
import { AuthRepository } from "./auth.repository.js";
import { loginSchema, registerSchema } from "./auth.schema.js";

export class AuthService {
  constructor(private readonly repository: AuthRepository, private readonly config: Config) {}
  async limitAttempt(ip: string) {
    const key = createHash("sha256").update(`auth:${ip}`).digest("hex");
    return (await this.repository.countAttempt(key, new Date())) <= 10;
  }
  async register(body: unknown, traceId: string) {
    const input = registerSchema.parse(body);
    const presented = Buffer.from(input.registrationKey);
    const expected = Buffer.from(this.config.REGISTRATION_KEY);
    if (presented.length !== expected.length || !timingSafeEqual(presented, expected)) return null;
    const { globalMode, ...data } = defaultPolicy;
    return this.repository.register({ email: input.email, passwordHash: await hashPassword(input.password), displayName: input.displayName, timezone: input.timezone }, defaultProfile, { globalMode, data }, traceId);
  }
  async login(body: unknown) {
    const input = loginSchema.parse(body);
    const user = await this.repository.findByEmail(input.email);
    const valid = user && (!user.lockedUntil || user.lockedUntil < new Date()) && await verifyPassword(user.passwordHash, input.password);
    if (!valid) {
      if (user) await this.repository.recordFailedLogin(user.id, user.failedLogins >= 4, user.lockedUntil);
      return null;
    }
    await this.repository.resetFailedLogins(user.id);
    return { id: user.id, email: user.email, displayName: user.displayName };
  }
  currentUser(userId: string) { return this.repository.findById(userId); }
  async createSession(userId: string) {
    const token = newSessionToken();
    await this.repository.createSession(hashToken(token), userId, new Date(Date.now() + sessionLifetimeMs));
    return token;
  }
  async revokeSession(token: string | undefined) {
    if (token) await this.repository.revokeSession(hashToken(token));
  }
}
