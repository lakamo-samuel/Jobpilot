import { eq, sql } from "drizzle-orm";
import type { Database } from "../../db/index.js";
import { agentPolicies, auditEvents } from "../../db/schema/index.js";
import type { PolicyData } from "../../db/schema/agent-policies.js";

export class AgentRepository {
  constructor(private readonly db: Database) {}
  async getPolicy(userId: string) {
    const [policy] = await this.db.select().from(agentPolicies).where(eq(agentPolicies.userId, userId));
    return policy;
  }
  async updatePolicy(userId: string, globalMode: "observe" | "prepare" | "auto", data: PolicyData, traceId: string) {
    await this.db.transaction(async tx => {
      await tx.update(agentPolicies).set({ globalMode, data, version: sql`${agentPolicies.version} + 1`, updatedAt: new Date() }).where(eq(agentPolicies.userId, userId));
      await tx.insert(auditEvents).values({ userId, actor: "owner", eventType: "agent.policy_updated", entityType: "agent_policy", traceId, details: { globalMode } });
    });
  }
  async setPaused(userId: string, paused: boolean, traceId: string) {
    await this.db.transaction(async tx => {
      await tx.update(agentPolicies).set({ paused, version: sql`${agentPolicies.version} + 1`, updatedAt: new Date() }).where(eq(agentPolicies.userId, userId));
      await tx.insert(auditEvents).values({ userId, actor: "owner", eventType: paused ? "agent.pause" : "agent.resume", entityType: "agent_policy", traceId });
    });
  }
}
