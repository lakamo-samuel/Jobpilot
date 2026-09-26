import { and, eq, gt, sql } from "drizzle-orm";
import type { Database } from "../../db/index.js";
import { agentPolicies, auditEvents, authAttempts, profiles, sessions, users } from "../../db/schema/index.js";
import type { ProfileData } from "../../db/schema/profiles.js";
import type { PolicyData } from "../../db/schema/agent-policies.js";

export class AuthRepository {
  constructor(private readonly db: Database) {}
  async countAttempt(key: string, now: Date) {
    const cutoff = new Date(now.getTime() - 15 * 60000);
    const [row] = await this.db.insert(authAttempts).values({ key, count: 1, windowStart: now }).onConflictDoUpdate({
      target: authAttempts.key,
      set: {
        count: sql`case when ${authAttempts.windowStart} < ${cutoff} then 1 else ${authAttempts.count} + 1 end`,
        windowStart: sql`case when ${authAttempts.windowStart} < ${cutoff} then ${now} else ${authAttempts.windowStart} end`,
      },
    }).returning({ count: authAttempts.count });
    return row.count;
  }
  async register(input: { email: string; passwordHash: string; displayName: string; timezone: string }, profile: ProfileData, policy: { globalMode: "observe" | "prepare" | "auto"; data: PolicyData }, traceId: string) {
    return this.db.transaction(async tx => {
      const [user] = await tx.insert(users).values(input).onConflictDoNothing().returning({ id: users.id, email: users.email, displayName: users.displayName });
      if (!user) return undefined;
      await tx.insert(profiles).values({ userId: user.id, data: profile });
      await tx.insert(agentPolicies).values({ userId: user.id, ...policy });
      await tx.insert(auditEvents).values({ userId: user.id, actor: "owner", eventType: "account.created", entityType: "user", entityId: user.id, traceId });
      return user;
    });
  }
  async findByEmail(email: string) {
    const [user] = await this.db.select().from(users).where(eq(users.email, email)).limit(1);
    return user;
  }
  async recordFailedLogin(userId: string, lock: boolean, previousLock: Date | null) {
    await this.db.update(users).set({ failedLogins: sql`${users.failedLogins} + 1`, lockedUntil: lock ? new Date(Date.now() + 15 * 60000) : previousLock }).where(eq(users.id, userId));
  }
  async resetFailedLogins(userId: string) {
    await this.db.update(users).set({ failedLogins: 0, lockedUntil: null }).where(eq(users.id, userId));
  }
  async findById(userId: string) {
    const [user] = await this.db.select({ id: users.id, email: users.email, displayName: users.displayName, timezone: users.timezone }).from(users).where(eq(users.id, userId));
    return user;
  }
  async createSession(tokenHash: string, userId: string, expiresAt: Date) {
    await this.db.insert(sessions).values({ tokenHash, userId, expiresAt });
  }
  async revokeSession(tokenHash: string) { await this.db.delete(sessions).where(eq(sessions.tokenHash, tokenHash)); }
  async findSession(tokenHash: string) {
    const [row] = await this.db.select({ id: users.id, email: users.email }).from(sessions).innerJoin(users, eq(users.id, sessions.userId)).where(and(eq(sessions.tokenHash, tokenHash), gt(sessions.expiresAt, new Date()))).limit(1);
    return row;
  }
}
