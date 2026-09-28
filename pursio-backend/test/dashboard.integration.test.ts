import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "@jest/globals";
import { eq } from "drizzle-orm";
import { createDb } from "../src/db/index.js";
import { agentPolicies, auditEvents, opportunities, users } from "../src/db/schema/index.js";
import { DashboardRepository } from "../src/modules/dashboard/dashboard.repository.js";

(process.env.TEST_DATABASE_URL ? test : test.skip)("dashboard counts only the owner's opportunities and bounds recent activity", async () => {
  const { db, pool } = createDb(process.env.TEST_DATABASE_URL!);
  const [owner] = await db.insert(users).values({ email: `dashboard-${randomUUID()}@example.test`, displayName: "Dashboard Owner" }).returning();
  const [other] = await db.insert(users).values({ email: `dashboard-${randomUUID()}@example.test`, displayName: "Other Owner" }).returning();
  try {
    await db.insert(agentPolicies).values({ userId: owner.id, paused: false, globalMode: "prepare", data: { minMatchScore: 70, autoSendMinScore: 90, maxDailyOutreach: 0, requireApprovalFor: [], exclusions: [] } });
    await db.insert(opportunities).values([
      { userId: owner.id, type: "JOB", companyName: "A", title: "Engineer", description: "Role A", status: "NEW" },
      { userId: owner.id, type: "CLIENT", companyName: "B", title: "Project", description: "Role B", status: "QUALIFIED", discoveredAt: new Date("2020-01-01T00:00:00Z") },
      { userId: other.id, type: "JOB", companyName: "Private", title: "Hidden", description: "Other user" },
    ]);
    await db.insert(auditEvents).values({ userId: owner.id, actor: "owner", eventType: "test.event", entityType: "test", traceId: randomUUID() });
    const result = await new DashboardRepository(db).get(owner.id);
    assert.equal(result.pipeline.total, 2);
    assert.deepEqual(result.pipeline.byStatus, { NEW: 1, QUALIFIED: 1 });
    assert.equal(result.today.opportunitiesFound, 1);
    assert.equal(result.today.timezone, "UTC");
    assert.deepEqual(result.agent, { paused: false, mode: "prepare" });
    assert.equal(result.recentOpportunities.length, 2);
    assert.ok(result.recentOpportunities.every(row => row.companyName !== "Private"));
    assert.ok(result.recentActivity.some(row => row.eventType === "test.event"));
  } finally {
    await db.delete(users).where(eq(users.id, owner.id));
    await db.delete(users).where(eq(users.id, other.id));
    await pool.end();
  }
});
