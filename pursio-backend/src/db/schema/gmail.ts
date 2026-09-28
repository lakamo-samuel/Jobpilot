import { pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { users } from "./users.js";

export const gmailConnections = pgTable("gmail_connections", {
  userId: uuid("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  googleSubject: text("google_subject").notNull(),
  email: text("email").notNull(),
  encryptedRefreshToken: text("encrypted_refresh_token").notNull(),
  connectedAt: timestamp("connected_at", { withTimezone: true }).notNull().defaultNow(),
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
  lastSyncAttemptAt: timestamp("last_sync_attempt_at", { withTimezone: true }),
}, table => [uniqueIndex("gmail_connections_google_subject_unique").on(table.googleSubject)]);

export const gmailMessages = pgTable("gmail_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  messageId: text("message_id").notNull(),
  threadId: text("thread_id").notNull(),
  subject: text("subject").notNull(),
  sender: text("sender").notNull(),
  snippet: text("snippet").notNull(),
  receivedAt: timestamp("received_at", { withTimezone: true }).notNull(),
  discoveredAt: timestamp("discovered_at", { withTimezone: true }).notNull().defaultNow(),
}, table => [uniqueIndex("gmail_messages_user_message_unique").on(table.userId, table.messageId)]);
