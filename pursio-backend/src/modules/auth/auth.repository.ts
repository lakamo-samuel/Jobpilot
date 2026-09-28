import { and, eq, gt, isNotNull, sql } from "drizzle-orm";
import type { Database } from "../../db/index.js";
import {
  agentPolicies,
  auditEvents,
  authAttempts,
  authTokens,
  googleIdentities,
  profiles,
  sessions,
  users,
} from "../../db/schema/index.js";
import type { ProfileData } from "../../db/schema/profiles.js";
import type { GoogleIdentity } from "../../integrations/google/google-verifier.js";
import { AppError } from "../../shared/errors/app-error.js";
import type { PolicyData } from "../../db/schema/agent-policies.js";

export class AuthRepository {
  constructor(private readonly db: Database) {}
  async countAttempt(key: string, now: Date, windowMs = 15 * 60000) {
    const cutoff = new Date(now.getTime() - windowMs);
    const [row] = await this.db
      .insert(authAttempts)
      .values({ key, count: 1, windowStart: now })
      .onConflictDoUpdate({
        target: authAttempts.key,
        set: {
          count: sql`case when ${authAttempts.windowStart} < ${cutoff} then 1 else ${authAttempts.count} + 1 end`,
          windowStart: sql`case when ${authAttempts.windowStart} < ${cutoff} then ${now} else ${authAttempts.windowStart} end`,
        },
      })
      .returning({ count: authAttempts.count });
    return row.count;
  }
  async register(
    input: {
      email: string;
      passwordHash: string;
      displayName: string;
      timezone: string;
    },
    profile: ProfileData,
    policy: { globalMode: "observe" | "prepare" | "auto"; data: PolicyData },
    traceId: string,
  ) {
    return this.db.transaction(async (tx) => {
      const [user] = await tx
        .insert(users)
        .values(input)
        .onConflictDoNothing()
        .returning({
          id: users.id,
          email: users.email,
          displayName: users.displayName,
        });
      if (!user) return undefined;
      await tx.insert(profiles).values({ userId: user.id, data: profile });
      await tx.insert(agentPolicies).values({ userId: user.id, ...policy });
      await tx.insert(auditEvents).values({
        userId: user.id,
        actor: "owner",
        eventType: "account.created",
        entityType: "user",
        entityId: user.id,
        traceId,
      });
      return user;
    });
  }
  async issueToken(
    userId: string,
    purpose: "verify_email" | "reset_password",
    tokenHash: string,
    expiresAt: Date,
  ) {
    await this.db.transaction(async (tx) => {
      await tx
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, userId))
        .for("update");
      await tx
        .insert(authTokens)
        .values({ userId, purpose, tokenHash, expiresAt });
    });
  }
  async consumeToken(
    tokenHash: string,
    purpose: "verify_email" | "reset_password",
    passwordHash?: string,
    traceId?: string,
  ) {
    return this.db.transaction(async (tx) => {
      const [token] = await tx
        .select()
        .from(authTokens)
        .where(
          and(
            eq(authTokens.tokenHash, tokenHash),
            eq(authTokens.purpose, purpose),
            gt(authTokens.expiresAt, new Date()),
          ),
        )
        .for("update")
        .limit(1);
      if (!token) return false;
      if (purpose === "verify_email")
        await tx
          .update(users)
          .set({ emailVerifiedAt: new Date() })
          .where(eq(users.id, token.userId));
      else {
        if (!passwordHash) throw new Error("Password hash required");
        await tx
          .update(users)
          .set({ passwordHash, failedLogins: 0, lockedUntil: null })
          .where(eq(users.id, token.userId));
        await tx.delete(sessions).where(eq(sessions.userId, token.userId));
      }
      await tx
        .delete(authTokens)
        .where(
          and(
            eq(authTokens.userId, token.userId),
            eq(authTokens.purpose, purpose),
          ),
        );
      if (traceId)
        await tx.insert(auditEvents).values({
          userId: token.userId,
          actor: "owner",
          eventType:
            purpose === "verify_email"
              ? "account.email_verified"
              : "account.password_reset",
          entityType: "user",
          entityId: token.userId,
          traceId,
        });
      return true;
    });
  }
  async findOrCreateGoogleUser(
    identity: GoogleIdentity,
    profile: ProfileData,
    policy: { globalMode: "observe" | "prepare" | "auto"; data: PolicyData },
    traceId: string,
  ) {
    const [linked] = await this.db
      .select({
        id: users.id,
        email: users.email,
        displayName: users.displayName,
      })
      .from(googleIdentities)
      .innerJoin(users, eq(users.id, googleIdentities.userId))
      .where(eq(googleIdentities.subject, identity.subject))
      .limit(1);
    if (linked) return linked;
    return this.db.transaction(async (tx) => {
      const [existing] = await tx
        .select({
          id: users.id,
          email: users.email,
          displayName: users.displayName,
          emailVerifiedAt: users.emailVerifiedAt,
        })
        .from(users)
        .where(eq(users.email, identity.email))
        .for("update")
        .limit(1);
      if (existing) {
        if (!identity.authoritativeEmail || !existing.emailVerifiedAt)
          throw new AppError(409, "account_link_required");
        const [link] = await tx
          .insert(googleIdentities)
          .values({
            subject: identity.subject,
            userId: existing.id,
            emailAtLink: identity.email,
          })
          .onConflictDoNothing()
          .returning({ subject: googleIdentities.subject });
        if (!link) throw new AppError(409, "google_account_already_linked");
        await tx.insert(auditEvents).values({
          userId: existing.id,
          actor: "owner",
          eventType: "account.google_linked_automatically",
          entityType: "user",
          entityId: existing.id,
          traceId,
        });
        return {
          id: existing.id,
          email: existing.email,
          displayName: existing.displayName,
        };
      }
      const [user] = await tx
        .insert(users)
        .values({
          email: identity.email,
          passwordHash: null,
          displayName: identity.displayName,
          emailVerifiedAt: new Date(),
        })
        .onConflictDoNothing()
        .returning({
          id: users.id,
          email: users.email,
          displayName: users.displayName,
        });
      if (!user) throw new AppError(409, "account_link_required");
      const [link] = await tx
        .insert(googleIdentities)
        .values({
          subject: identity.subject,
          userId: user.id,
          emailAtLink: identity.email,
        })
        .onConflictDoNothing()
        .returning({ subject: googleIdentities.subject });
      if (!link) throw new AppError(409, "google_account_already_linked");
      await tx.insert(profiles).values({ userId: user.id, data: profile });
      await tx.insert(agentPolicies).values({ userId: user.id, ...policy });
      await tx.insert(auditEvents).values({
        userId: user.id,
        actor: "owner",
        eventType: "account.created_with_google",
        entityType: "user",
        entityId: user.id,
        traceId,
      });
      return user;
    });
  }
  async linkGoogleUser(
    userId: string,
    identity: GoogleIdentity,
    traceId: string,
  ) {
    await this.db.transaction(async (tx) => {
      const [user] = await tx
        .select({ id: users.id, email: users.email })
        .from(users)
        .where(eq(users.id, userId))
        .for("update")
        .limit(1);
      if (!user || user.email !== identity.email)
        throw new AppError(409, "google_email_mismatch");
      const [existing] = await tx
        .select()
        .from(googleIdentities)
        .where(eq(googleIdentities.userId, userId))
        .limit(1);
      if (existing) {
        if (existing.subject === identity.subject) return;
        throw new AppError(409, "google_account_already_linked");
      }
      const [link] = await tx
        .insert(googleIdentities)
        .values({
          subject: identity.subject,
          userId,
          emailAtLink: identity.email,
        })
        .onConflictDoNothing()
        .returning({ subject: googleIdentities.subject });
      if (!link) throw new AppError(409, "google_account_already_linked");
      await tx.insert(auditEvents).values({
        userId,
        actor: "owner",
        eventType: "account.google_linked",
        entityType: "user",
        entityId: userId,
        traceId,
      });
    });
  }
  async findByEmail(email: string) {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    return user;
  }
  async recordFailedLogin(
    userId: string,
    lock: boolean,
    previousLock: Date | null,
  ) {
    await this.db
      .update(users)
      .set({
        failedLogins: sql`${users.failedLogins} + 1`,
        lockedUntil: lock ? new Date(Date.now() + 15 * 60000) : previousLock,
      })
      .where(eq(users.id, userId));
  }
  async resetFailedLogins(userId: string) {
    await this.db
      .update(users)
      .set({ failedLogins: 0, lockedUntil: null })
      .where(eq(users.id, userId));
  }
  async findById(userId: string) {
    const [user] = await this.db
      .select({
        id: users.id,
        email: users.email,
        displayName: users.displayName,
        timezone: users.timezone,
      })
      .from(users)
      .where(eq(users.id, userId));
    return user;
  }
  async createSession(tokenHash: string, userId: string, expiresAt: Date) {
    await this.db.insert(sessions).values({ tokenHash, userId, expiresAt });
  }
  async revokeSession(tokenHash: string) {
    await this.db.delete(sessions).where(eq(sessions.tokenHash, tokenHash));
  }
  async findSession(tokenHash: string) {
    const [row] = await this.db
      .select({ id: users.id, email: users.email })
      .from(sessions)
      .innerJoin(users, eq(users.id, sessions.userId))
      .where(
        and(
          eq(sessions.tokenHash, tokenHash),
          gt(sessions.expiresAt, new Date()),
          isNotNull(users.emailVerifiedAt),
        ),
      )
      .limit(1);
    return row;
  }
}
