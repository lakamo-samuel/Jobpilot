import { jsonb, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./users.js";

export type ProfileData = {
  headline: string;
  summary: string;
  yearsExperience: number;
  targetRoles: string[];
  skills: string[];
  locations: string[];
  workModes: Array<"remote" | "hybrid" | "onsite">;
  compensationMin?: number;
  compensationCurrency: string;
  links: { github?: string; portfolio?: string; linkedin?: string };
};
export const profiles = pgTable("profiles", {
  userId: uuid("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  data: jsonb("data").$type<ProfileData>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
