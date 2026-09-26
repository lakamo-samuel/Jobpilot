import { createHash, randomUUID } from "node:crypto";
import { extname, basename } from "node:path";
import { fileTypeFromBuffer } from "file-type";
import type { FileStore } from "../../integrations/storage/file-store.js";
import { AppError } from "../../shared/errors/app-error.js";
import { CvRepository } from "./cv.repository.js";
import { toCvDto } from "./cv.mapper.js";
import { cvIdSchema, cvInputSchema, cvRenameSchema } from "./cv.schema.js";

type Upload = { buffer: Buffer; originalname: string; size: number };
const maxBytes = 10 * 1024 * 1024;
export class CvService {
  constructor(private readonly repository: CvRepository, private readonly files: FileStore) {}
  async list(userId: string) { return (await this.repository.list(userId)).map(toCvDto); }
  async get(userId: string, id: string) { const row = await this.repository.get(userId, cvIdSchema.parse(id)); return row ? toCvDto(row) : undefined; }
  async upload(userId: string, body: unknown, file: Upload | undefined, traceId: string, replaceId?: string) {
    if (!file || !file.size || file.size > maxBytes) throw new AppError(400, "invalid_file");
    const input = cvInputSchema.parse(body);
    const fileName = basename(file.originalname).replace(/[\x00-\x1f\x7f]/g, "").slice(0, 255);
    const ext = extname(fileName).toLowerCase();
    const detected = await fileTypeFromBuffer(file.buffer);
    const mimeType = detected?.ext === "pdf" && ext === ".pdf" ? "application/pdf" : detected?.ext === "docx" && ext === ".docx" ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document" : null;
    if (!mimeType) throw new AppError(415, "unsupported_cv_type");
    const checksum = createHash("sha256").update(file.buffer).digest("hex");
    if (await this.repository.findChecksum(userId, checksum)) throw new AppError(409, "duplicate_cv");
    const replace = replaceId ? await this.repository.get(userId, cvIdSchema.parse(replaceId)) : undefined;
    if (replaceId && !replace) throw new AppError(404, "cv_not_found");
    const storageKey = `cvs/${userId}/${randomUUID()}${ext}`;
    await this.files.put(storageKey, file.buffer, mimeType);
    try {
      return toCvDto(await this.repository.create(userId, { familyId: replace?.familyId ?? randomUUID(), label: input.label, roleFocus: input.roleFocus, fileName, mimeType, checksum, storageKey, byteSize: file.size }, replace, traceId));
    } catch (error) {
      await this.files.delete(storageKey).catch(() => undefined);
      throw error;
    }
  }
  rename(userId: string, id: string, body: unknown, traceId: string) {
    const { label } = cvRenameSchema.parse(body);
    return this.repository.rename(userId, cvIdSchema.parse(id), label, traceId).then(row => row ? toCvDto(row) : undefined);
  }
  async setDefault(userId: string, id: string, traceId: string) { const row = await this.repository.setDefault(userId, cvIdSchema.parse(id), traceId); return row ? toCvDto(row) : undefined; }
  async download(userId: string, id: string) {
    const row = await this.repository.get(userId, cvIdSchema.parse(id));
    if (!row) throw new AppError(404, "cv_not_found");
    return { fileName: row.fileName, mimeType: row.mimeType, body: await this.files.get(row.storageKey) };
  }
  async delete(userId: string, id: string, traceId: string) {
    const parsedId = cvIdSchema.parse(id);
    const row = await this.repository.getForDelete(userId, parsedId);
    if (!row) throw new AppError(404, "cv_not_found");
    await this.repository.markDeleted(userId, parsedId);
    await this.files.delete(row.storageKey);
    await this.repository.finishDelete(userId, parsedId, traceId);
  }
}
