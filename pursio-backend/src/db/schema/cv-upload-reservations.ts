import { bigint, boolean, index, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./users.js";

export const cvUploadReservations = pgTable("cv_upload_reservations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  byteSize: bigint("byte_size", { mode: "number" }).notNull(),
  isNewFamily: boolean("is_new_family").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
}, t => [index("cv_upload_reservations_user_expires_idx").on(t.userId, t.expiresAt)]);
