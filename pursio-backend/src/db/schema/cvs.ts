import { boolean, index, integer, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid, bigint } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users.js";

export const cvStatus = pgEnum("cv_status", ["ready", "parsing", "error"]);
export const cvs = pgTable("cvs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  familyId: uuid("family_id").notNull(),
  label: text("label").notNull(),
  fileName: text("file_name").notNull(),
  storageKey: text("storage_key").notNull(),
  mimeType: text("mime_type").notNull(),
  checksum: text("checksum").notNull(),
  byteSize: bigint("byte_size", { mode: "number" }).notNull(),
  version: integer("version").notNull(),
  isDefault: boolean("is_default").notNull().default(false),
  roleFocus: text("role_focus").notNull().default(""),
  status: cvStatus("status").notNull().default("ready"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
}, (t) => [
  index("cvs_user_created_idx").on(t.userId, t.createdAt),
  uniqueIndex("cvs_user_checksum_unique").on(t.userId, t.checksum),
  uniqueIndex("cvs_family_version_unique").on(t.familyId, t.version),
  uniqueIndex("cvs_storage_key_unique").on(t.storageKey),
  uniqueIndex("cvs_one_default_per_user").on(t.userId).where(sql`${t.isDefault} = true`),
]);
