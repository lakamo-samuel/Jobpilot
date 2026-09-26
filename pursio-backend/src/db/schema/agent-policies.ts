import { boolean, integer, jsonb, pgEnum, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./users.js";
export const mode = pgEnum("agent_mode", ["observe", "prepare", "auto"]);
export type PolicyData = {
  minMatchScore: number;
  autoSendMinScore: number;
  maxDailyOutreach: number;
  compensationMin?: number;
  requireApprovalFor: string[];
  exclusions: string[];
  quietHoursStart?: string;
  quietHoursEnd?: string;
};
export const agentPolicies = pgTable("agent_policies", {
  userId: uuid("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  version: integer("version").notNull().default(1),
  globalMode: mode("global_mode").notNull().default("observe"),
  paused: boolean("paused").notNull().default(true),
  data: jsonb("data").$type<PolicyData>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
