import type { cvs } from "../../db/schema/cvs.js";
type CvRow = typeof cvs.$inferSelect;
export function toCvDto(row: CvRow) {
  return {
    id: row.id, familyId: row.familyId, label: row.label, fileName: row.fileName,
    version: row.version, isDefault: row.isDefault, roleFocus: row.roleFocus,
    byteSize: row.byteSize, mimeType: row.mimeType, uploadedAt: row.createdAt, status: row.status,
  };
}
