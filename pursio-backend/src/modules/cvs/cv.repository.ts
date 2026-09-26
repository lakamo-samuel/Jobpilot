import { and, desc, eq, isNull, ne, sql } from "drizzle-orm";
import type { Database } from "../../db/index.js";
import { auditEvents, cvs, users } from "../../db/schema/index.js";

type NewCv = typeof cvs.$inferInsert;
export class CvRepository {
  constructor(private readonly db: Database) {}
  list(userId: string) {
    return this.db.select().from(cvs).where(and(eq(cvs.userId, userId), isNull(cvs.deletedAt))).orderBy(desc(cvs.createdAt));
  }
  async get(userId: string, id: string) {
    const [row] = await this.db.select().from(cvs).where(and(eq(cvs.userId, userId), eq(cvs.id, id), isNull(cvs.deletedAt))).limit(1);
    return row;
  }
  async getForDelete(userId: string, id: string) {
    const [row] = await this.db.select().from(cvs).where(and(eq(cvs.userId, userId), eq(cvs.id, id))).limit(1);
    return row;
  }
  async findChecksum(userId: string, checksum: string) {
    const [row] = await this.db.select({ id: cvs.id }).from(cvs).where(and(eq(cvs.userId, userId), eq(cvs.checksum, checksum))).limit(1);
    return row;
  }
  async create(userId: string, data: Omit<NewCv, "userId" | "isDefault" | "version" | "createdAt" | "status">, replace: typeof cvs.$inferSelect | undefined, traceId: string) {
    return this.db.transaction(async tx => {
      await tx.select({ id: users.id }).from(users).where(eq(users.id, userId)).for("update");
      const [existing] = await tx.select({ id: cvs.id }).from(cvs).where(and(eq(cvs.userId, userId), isNull(cvs.deletedAt))).limit(1);
      let version = 1;
      if (replace) {
        const rows = await tx.select({ version: cvs.version }).from(cvs).where(eq(cvs.familyId, replace.familyId)).orderBy(desc(cvs.version)).limit(1);
        version = (rows[0]?.version ?? 0) + 1;
      }
      if (replace?.isDefault) await tx.update(cvs).set({ isDefault: false }).where(and(eq(cvs.userId, userId), eq(cvs.isDefault, true)));
      const [row] = await tx.insert(cvs).values({ ...data, userId, version, isDefault: replace ? replace.isDefault : !existing }).returning();
      await tx.insert(auditEvents).values({ userId, actor: "owner", eventType: replace ? "cv.version_uploaded" : "cv.uploaded", entityType: "cv", entityId: row.id, traceId, details: { version } });
      return row;
    });
  }
  async rename(userId: string, id: string, label: string, traceId: string) {
    return this.db.transaction(async tx => {
      const [row] = await tx.update(cvs).set({ label }).where(and(eq(cvs.userId, userId), eq(cvs.id, id), isNull(cvs.deletedAt))).returning();
      if (row) await tx.insert(auditEvents).values({ userId, actor: "owner", eventType: "cv.renamed", entityType: "cv", entityId: id, traceId });
      return row;
    });
  }
  async setDefault(userId: string, id: string, traceId: string) {
    return this.db.transaction(async tx => {
      await tx.select({ id: users.id }).from(users).where(eq(users.id, userId)).for("update");
      const [exists] = await tx.select({ id: cvs.id }).from(cvs).where(and(eq(cvs.userId, userId), eq(cvs.id, id), isNull(cvs.deletedAt))).limit(1);
      if (!exists) return undefined;
      await tx.update(cvs).set({ isDefault: false }).where(and(eq(cvs.userId, userId), eq(cvs.isDefault, true)));
      const [row] = await tx.update(cvs).set({ isDefault: true }).where(eq(cvs.id, id)).returning();
      await tx.insert(auditEvents).values({ userId, actor: "owner", eventType: "cv.default_changed", entityType: "cv", entityId: id, traceId });
      return row;
    });
  }
  async markDeleted(userId: string, id: string) {
    const [row] = await this.db.update(cvs).set({ deletedAt: new Date() }).where(and(eq(cvs.userId, userId), eq(cvs.id, id))).returning();
    return row;
  }
  async finishDelete(userId: string, id: string, traceId: string) {
    await this.db.transaction(async tx => {
      await tx.select({ id: users.id }).from(users).where(eq(users.id, userId)).for("update");
      const [removed] = await tx.delete(cvs).where(and(eq(cvs.userId, userId), eq(cvs.id, id))).returning({ isDefault: cvs.isDefault });
      if (!removed) return;
      if (removed.isDefault) {
        const [next] = await tx.select({ id: cvs.id }).from(cvs).where(and(eq(cvs.userId, userId), isNull(cvs.deletedAt))).orderBy(desc(cvs.createdAt)).limit(1);
        if (next) await tx.update(cvs).set({ isDefault: true }).where(eq(cvs.id, next.id));
      }
      await tx.insert(auditEvents).values({ userId, actor: "owner", eventType: "cv.deleted", entityType: "cv", entityId: id, traceId });
    });
  }
}
