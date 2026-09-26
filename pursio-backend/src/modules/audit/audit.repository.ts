import { desc, eq } from "drizzle-orm";
import type { Database } from "../../db/index.js";
import { auditEvents } from "../../db/schema/index.js";
export class AuditRepository {
  constructor(private readonly db: Database) {}
  list(userId: string) { return this.db.select().from(auditEvents).where(eq(auditEvents.userId, userId)).orderBy(desc(auditEvents.createdAt)).limit(50); }
}
