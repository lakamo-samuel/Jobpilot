import { desc, eq, isNull, lt, or } from "drizzle-orm";
import type { Database } from "../../db/index.js";
import { gmailConnections, gmailMessages } from "../../db/schema/index.js";
import type { GmailMessage } from "../../integrations/gmail/gmail-provider.js";
import { AppError } from "../../shared/errors/app-error.js";

export class GmailRepository {
  constructor(private readonly db: Database) {}
  async connection(userId: string) {
    const [row] = await this.db.select().from(gmailConnections).where(eq(gmailConnections.userId, userId)).limit(1);
    return row;
  }
  async connect(userId: string, subject: string, email: string, encryptedRefreshToken: string) {
    try {
      await this.db.insert(gmailConnections).values({ userId, googleSubject: subject, email, encryptedRefreshToken }).onConflictDoUpdate({ target: gmailConnections.userId, set: { googleSubject: subject, email, encryptedRefreshToken, connectedAt: new Date(), lastSyncedAt: null, lastSyncAttemptAt: null } });
      await this.db.delete(gmailMessages).where(eq(gmailMessages.userId, userId));
    } catch (error) {
      if (typeof error === "object" && error && "code" in error && error.code === "23505") throw new AppError(409, "gmail_account_in_use");
      throw error;
    }
  }
  async disconnect(userId: string) {
    await this.db.delete(gmailConnections).where(eq(gmailConnections.userId, userId));
    await this.db.delete(gmailMessages).where(eq(gmailMessages.userId, userId));
  }
  async saveMessages(userId: string, messages: GmailMessage[]) {
    for (const message of messages) {
      await this.db.insert(gmailMessages).values({ userId, messageId: message.id, threadId: message.threadId, subject: message.subject, sender: message.sender, snippet: message.snippet, receivedAt: message.receivedAt }).onConflictDoNothing({ target: [gmailMessages.userId, gmailMessages.messageId] });
    }
    await this.db.update(gmailConnections).set({ lastSyncedAt: new Date() }).where(eq(gmailConnections.userId, userId));
  }
  async claimDueSyncs(limit = 5) {
    const cutoff = new Date(Date.now() - 15 * 60_000);
    return this.db.transaction(async tx => {
      const rows = await tx.select({ userId: gmailConnections.userId }).from(gmailConnections)
        .where(or(isNull(gmailConnections.lastSyncAttemptAt), lt(gmailConnections.lastSyncAttemptAt, cutoff)))
        .orderBy(gmailConnections.lastSyncAttemptAt).limit(limit).for("update", { skipLocked: true });
      if (rows.length) await tx.update(gmailConnections).set({ lastSyncAttemptAt: new Date() }).where(or(...rows.map(row => eq(gmailConnections.userId, row.userId))));
      return rows.map(row => row.userId);
    });
  }
  async messages(userId: string) {
    return this.db.select({ id: gmailMessages.id, threadId: gmailMessages.threadId, subject: gmailMessages.subject, sender: gmailMessages.sender, snippet: gmailMessages.snippet, receivedAt: gmailMessages.receivedAt }).from(gmailMessages).where(eq(gmailMessages.userId, userId)).orderBy(desc(gmailMessages.receivedAt)).limit(100);
  }
}
