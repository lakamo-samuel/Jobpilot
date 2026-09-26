import { and, eq } from "drizzle-orm";
import type { Database } from "../../db/index.js";
import { auditEvents, profileFacts, profiles } from "../../db/schema/index.js";
import type { ProfileData } from "../../db/schema/profiles.js";

export class ProfileRepository {
  constructor(private readonly db: Database) {}
  async get(userId: string) {
    const [profile] = await this.db.select().from(profiles).where(eq(profiles.userId, userId));
    const facts = await this.db.select({ id: profileFacts.id, type: profileFacts.type, value: profileFacts.value, verified: profileFacts.verified, evidenceSource: profileFacts.evidenceSource }).from(profileFacts).where(eq(profileFacts.userId, userId));
    return { ...profile.data, facts };
  }
  async addFact(userId: string, type: string, value: string, traceId: string) {
    return this.db.transaction(async tx => {
      const [row] = await tx.insert(profileFacts).values({ userId, type, value, verified: false, evidenceSource: "Self-reported" }).returning();
      await tx.insert(auditEvents).values({ userId, actor: "owner", eventType: "profile.fact_added", entityType: "profile_fact", entityId: row.id, traceId });
      return row;
    });
  }
  async deleteFact(userId: string, id: string, traceId: string) {
    return this.db.transaction(async tx => {
      const [row] = await tx.delete(profileFacts).where(and(eq(profileFacts.userId, userId), eq(profileFacts.id, id))).returning({ id: profileFacts.id });
      if (row) await tx.insert(auditEvents).values({ userId, actor: "owner", eventType: "profile.fact_deleted", entityType: "profile_fact", entityId: id, traceId });
      return !!row;
    });
  }
  async update(userId: string, data: ProfileData, traceId: string) {
    await this.db.transaction(async tx => {
      await tx.update(profiles).set({ data, updatedAt: new Date() }).where(eq(profiles.userId, userId));
      await tx.insert(auditEvents).values({ userId, actor: "owner", eventType: "profile.updated", entityType: "profile", traceId });
    });
  }
}
