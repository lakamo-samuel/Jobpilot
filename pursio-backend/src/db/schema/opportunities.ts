import { index, jsonb, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { users } from "./users.js";

export const opportunityType = pgEnum("opportunity_type", ["JOB", "CLIENT", "INBOUND"]);
export const opportunityStatus = pgEnum("opportunity_status", ["NEW", "QUALIFIED", "SKIPPED", "PREPARED", "PENDING_APPROVAL", "APPLIED", "CONTACTED", "REPLIED", "INTERVIEW", "INTERESTED", "OFFER", "WON", "REJECTED", "LOST", "CLOSED"]);
export type Compensation = { min?: number; max?: number; currency?: string };
export const opportunities = pgTable("opportunities", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: opportunityType("type").notNull(),
  companyName: text("company_name").notNull(),
  companyDomain: text("company_domain"),
  title: text("title").notNull(),
  description: text("description").notNull(),
  location: text("location"),
  workMode: text("work_mode"),
  compensation: jsonb("compensation").$type<Compensation>(),
  deadline: timestamp("deadline", { withTimezone: true }),
  source: text("source").notNull().default("manual"),
  sourceUrl: text("source_url"),
  status: opportunityStatus("status").notNull().default("NEW"),
  discoveredAt: timestamp("discovered_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("opportunities_user_list_idx").on(t.userId, t.updatedAt, t.id),
  index("opportunities_user_status_idx").on(t.userId, t.status, t.type),
  uniqueIndex("opportunities_user_source_url_unique").on(t.userId, t.sourceUrl),
]);
