import { and, desc, eq } from "drizzle-orm";
import type { Database } from "../../db/index.js";
import { auditEvents, opportunities } from "../../db/schema/index.js";

type NewOpportunity = typeof opportunities.$inferInsert;
export class OpportunityRepository {
  constructor(private readonly db: Database) {}
  list(userId: string, filter: { type?: NewOpportunity["type"]; status?: NewOpportunity["status"]; limit: number; offset: number }) {
    return this.db.select().from(opportunities).where(and(eq(opportunities.userId, userId), filter.type ? eq(opportunities.type, filter.type) : undefined, filter.status ? eq(opportunities.status, filter.status) : undefined)).orderBy(desc(opportunities.updatedAt), desc(opportunities.id)).limit(filter.limit).offset(filter.offset);
  }
  async get(userId: string, id: string) {
    const [row] = await this.db.select().from(opportunities).where(and(eq(opportunities.userId, userId), eq(opportunities.id, id))).limit(1);
    return row;
  }
  async create(userId: string, input: Omit<NewOpportunity, "id" | "userId" | "source" | "status" | "discoveredAt" | "updatedAt">, traceId: string) {
    return this.db.transaction(async tx => {
      const [row] = await tx.insert(opportunities).values({ userId, ...input, source: "manual" }).onConflictDoNothing().returning();
      if (row) await tx.insert(auditEvents).values({ userId, actor: "owner", eventType: "opportunity.created", entityType: "opportunity", entityId: row.id, traceId });
      return row;
    });
  }
  async update(userId: string, id: string, changes: Partial<NewOpportunity>, traceId: string) {
    return this.db.transaction(async tx => {
      const [row] = await tx.update(opportunities).set({ ...changes, updatedAt: new Date() }).where(and(eq(opportunities.userId, userId), eq(opportunities.id, id), eq(opportunities.source, "manual"))).returning();
      if (row) await tx.insert(auditEvents).values({ userId, actor: "owner", eventType: "opportunity.updated", entityType: "opportunity", entityId: id, traceId, details: { fields: Object.keys(changes) } });
      return row;
    });
  }
  async delete(userId: string, id: string, traceId: string) {
    return this.db.transaction(async tx => {
      const [row] = await tx.delete(opportunities).where(and(eq(opportunities.userId, userId), eq(opportunities.id, id), eq(opportunities.source, "manual"))).returning({ id: opportunities.id });
      if (row) await tx.insert(auditEvents).values({ userId, actor: "owner", eventType: "opportunity.deleted", entityType: "opportunity", entityId: id, traceId });
      return !!row;
    });
  }
}
