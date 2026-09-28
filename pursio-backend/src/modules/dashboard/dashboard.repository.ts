import { and, desc, eq, gte, sql } from "drizzle-orm";
import type { Database } from "../../db/index.js";
import { agentPolicies, auditEvents, opportunities } from "../../db/schema/index.js";

export class DashboardRepository {
  constructor(private readonly db: Database) {}

  async get(userId: string, now = new Date()) {
    const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const [policy, statusCounts, discoveredToday, recentOpportunities, recentActivity] = await Promise.all([
      this.db.select({ paused: agentPolicies.paused, mode: agentPolicies.globalMode }).from(agentPolicies).where(eq(agentPolicies.userId, userId)).limit(1),
      this.db.select({ status: opportunities.status, count: sql<number>`count(*)::int` }).from(opportunities).where(eq(opportunities.userId, userId)).groupBy(opportunities.status),
      this.db.select({ count: sql<number>`count(*)::int` }).from(opportunities).where(and(eq(opportunities.userId, userId), gte(opportunities.discoveredAt, todayStart))),
      this.db.select({ id: opportunities.id, type: opportunities.type, companyName: opportunities.companyName, title: opportunities.title, status: opportunities.status, updatedAt: opportunities.updatedAt }).from(opportunities).where(eq(opportunities.userId, userId)).orderBy(desc(opportunities.updatedAt), desc(opportunities.id)).limit(5),
      this.db.select({ id: auditEvents.id, eventType: auditEvents.eventType, entityType: auditEvents.entityType, entityId: auditEvents.entityId, createdAt: auditEvents.createdAt }).from(auditEvents).where(eq(auditEvents.userId, userId)).orderBy(desc(auditEvents.createdAt), desc(auditEvents.id)).limit(10),
    ]);
    return {
      today: { startsAt: todayStart, timezone: "UTC", opportunitiesFound: discoveredToday[0]?.count ?? 0 },
      pipeline: { total: statusCounts.reduce((sum, row) => sum + row.count, 0), byStatus: Object.fromEntries(statusCounts.map(row => [row.status, row.count])) },
      agent: policy[0] ?? { paused: true, mode: "observe" as const },
      recentOpportunities,
      recentActivity,
    };
  }
}
