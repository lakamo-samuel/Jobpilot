import { date, integer, pgTable, primaryKey, uuid } from "drizzle-orm/pg-core";
import { users } from "./users.js";
export const aiDailyUsage = pgTable("ai_daily_usage", {
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  day: date("day").notNull(),
  requests: integer("requests").notNull().default(0),
}, t => [primaryKey({ columns: [t.userId, t.day] })]);
