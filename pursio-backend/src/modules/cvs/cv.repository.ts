import { and, desc, eq, gt, isNull, lt, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import type { ExtractedCvProfile } from "./cv-extraction.schema.js";
import type { Database } from "../../db/index.js";
import { auditEvents, cvs, cvUploadReservations, users } from "../../db/schema/index.js";
import { AppError } from "../../shared/errors/app-error.js";

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
  async reserve(userId: string, byteSize: number, isNewFamily: boolean, maxFiles: number, maxBytes: number) {
    return this.db.transaction(async tx => {
      await tx.select({ id: users.id }).from(users).where(eq(users.id, userId)).for("update");
      const now = new Date();
      await tx.delete(cvUploadReservations).where(and(eq(cvUploadReservations.userId, userId), lt(cvUploadReservations.expiresAt, now)));
      const [stored] = await tx.select({ count: sql<number>`count(distinct ${cvs.familyId})::int`, bytes: sql<number>`coalesce(sum(${cvs.byteSize}), 0)::bigint` }).from(cvs).where(eq(cvs.userId, userId));
      const [pending] = await tx.select({ count: sql<number>`coalesce(sum(case when ${cvUploadReservations.isNewFamily} then 1 else 0 end), 0)::int`, bytes: sql<number>`coalesce(sum(${cvUploadReservations.byteSize}), 0)::bigint` }).from(cvUploadReservations).where(eq(cvUploadReservations.userId, userId));
      if ((isNewFamily && Number(stored.count) + Number(pending.count) >= maxFiles) || Number(stored.bytes) + Number(pending.bytes) + byteSize > maxBytes) throw new AppError(413, "cv_quota_exceeded");
      const [reservation] = await tx.insert(cvUploadReservations).values({ userId, byteSize, isNewFamily, expiresAt: new Date(Date.now() + 15 * 60_000) }).returning({ id: cvUploadReservations.id });
      return reservation.id;
    });
  }
  async release(id: string) { await this.db.delete(cvUploadReservations).where(eq(cvUploadReservations.id, id)); }
  async create(userId: string, data: Omit<NewCv, "userId" | "isDefault" | "version" | "createdAt" | "status">, replace: typeof cvs.$inferSelect | undefined, traceId: string, reservationId: string) {
    return this.db.transaction(async tx => {
      await tx.select({ id: users.id }).from(users).where(eq(users.id, userId)).for("update");
      const [reserved] = await tx.delete(cvUploadReservations).where(and(eq(cvUploadReservations.id, reservationId), eq(cvUploadReservations.userId, userId), gt(cvUploadReservations.expiresAt, new Date()))).returning({ id: cvUploadReservations.id });
      if (!reserved) throw new AppError(409, "cv_upload_expired");
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
  async updateMetadata(userId: string, id: string, changes: { label?: string; roleFocus?: string }, traceId: string) {
    return this.db.transaction(async tx => {
      const [row] = await tx.update(cvs).set(changes).where(and(eq(cvs.userId, userId), eq(cvs.id, id), isNull(cvs.deletedAt))).returning();
      if (row) await tx.insert(auditEvents).values({ userId, actor: "owner", eventType: "cv.metadata_updated", entityType: "cv", entityId: id, traceId });
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
  listPendingExtraction(limit = 500) {
    return this.db.select({ id: cvs.id }).from(cvs).where(and(eq(cvs.status, "parsing"), isNull(cvs.deletedAt))).orderBy(cvs.createdAt).limit(limit);
  }
  async getForExtraction(id: string) {
    const [row] = await this.db.select().from(cvs).where(and(eq(cvs.id, id), eq(cvs.status, "parsing"), isNull(cvs.deletedAt))).limit(1);
    return row;
  }
  async completeExtraction(id: string, text: string, profile: ExtractedCvProfile) {
    await this.db.transaction(async tx => {
      const [row] = await tx.update(cvs).set({ status: "ready", extractedText: text, extractedProfile: profile, extractionError: null }).where(and(eq(cvs.id, id), eq(cvs.status, "parsing"), isNull(cvs.deletedAt))).returning({ userId: cvs.userId });
      if (row) await tx.insert(auditEvents).values({ userId: row.userId, actor: "agent", eventType: "cv.extracted", entityType: "cv", entityId: id, traceId: randomUUID() });
    });
  }
  async failExtraction(id: string, code: string) {
    await this.db.transaction(async tx => {
      const [row] = await tx.update(cvs).set({ status: "error", extractionError: code }).where(and(eq(cvs.id, id), eq(cvs.status, "parsing"), isNull(cvs.deletedAt))).returning({ userId: cvs.userId });
      if (row) await tx.insert(auditEvents).values({ userId: row.userId, actor: "agent", eventType: "cv.extraction_failed", entityType: "cv", entityId: id, traceId: randomUUID(), details: { code } });
    });
  }
  async retryExtraction(userId: string, id: string, traceId: string) {
    return this.db.transaction(async tx => {
      const [row] = await tx.update(cvs).set({ status: "parsing", extractionError: null }).where(and(eq(cvs.userId, userId), eq(cvs.id, id), eq(cvs.status, "error"), isNull(cvs.deletedAt))).returning();
      if (row) await tx.insert(auditEvents).values({ userId, actor: "owner", eventType: "cv.extraction_retried", entityType: "cv", entityId: id, traceId });
      return row;
    });
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
