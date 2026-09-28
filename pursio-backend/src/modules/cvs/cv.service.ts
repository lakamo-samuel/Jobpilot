import { createHash, randomUUID } from "node:crypto";
import { extname, basename } from "node:path";
import { fileTypeFromBuffer } from "file-type";
import type { FileStore } from "../../integrations/storage/file-store.js";
import type { Config } from "../../config/env.js";
import { AppError } from "../../shared/errors/app-error.js";
import { CvRepository } from "./cv.repository.js";
import { toCvDto } from "./cv.mapper.js";
import type { CvExtractionQueue } from "../../queues/cv-extraction.queue.js";
import { cvIdSchema, cvInputSchema, cvEditSchema } from "./cv.schema.js";

type Upload = { buffer: Buffer; originalname: string; size: number };
const maxBytes = 10 * 1024 * 1024;
export class CvService {
  constructor(private readonly repository: CvRepository, private readonly files: FileStore | undefined, private readonly config: Config, private readonly queue?: CvExtractionQueue) {}
  private fileStore(): FileStore { if (!this.files) throw new AppError(503, "cloudinary_not_configured"); return this.files; }
  private async enqueue(cvId: string) {
    try { await this.queue?.enqueue(cvId); } catch { console.error(JSON.stringify({ level: "warn", message: "CV extraction enqueue failed", cvId })); }
  }
  async list(userId: string) { return (await this.repository.list(userId)).map(toCvDto); }
  async get(userId: string, id: string) { const row = await this.repository.get(userId, cvIdSchema.parse(id)); return row ? toCvDto(row) : undefined; }
  async getExtraction(userId: string, id: string) {
    const row = await this.repository.get(userId, cvIdSchema.parse(id));
    if (!row) throw new AppError(404, "cv_not_found");
    return { status: row.status, text: row.extractedText, profile: row.extractedProfile, error: row.extractionError };
  }
  async retryExtraction(userId: string, id: string, traceId: string) {
    const parsedId = cvIdSchema.parse(id);
    const row = await this.repository.retryExtraction(userId, parsedId, traceId);
    if (!row) {
      if (!(await this.repository.get(userId, parsedId))) throw new AppError(404, "cv_not_found");
      throw new AppError(409, "cv_extraction_not_failed");
    }
    await this.enqueue(row.id);
    return toCvDto(row);
  }
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
    const files = this.fileStore();
    const reservationId = await this.repository.reserve(userId, file.size, !replace, this.config.CV_MAX_FILES, this.config.CV_MAX_STORAGE_BYTES);
    const storageKey = `cvs/${userId}/${randomUUID()}${ext}`;
    let uploaded = false;
    try {
      await files.put(storageKey, file.buffer, mimeType);
      uploaded = true;
      const row = await this.repository.create(userId, { familyId: replace?.familyId ?? randomUUID(), label: input.label, roleFocus: input.roleFocus ?? replace?.roleFocus ?? "", fileName, mimeType, checksum, storageKey, byteSize: file.size }, replace, traceId, reservationId);
      await this.enqueue(row.id);
      return toCvDto(row);
    } catch (error) {
      if (uploaded) await files.delete(storageKey).catch(() => undefined);
      throw error;
    } finally {
      await this.repository.release(reservationId);
    }
  }
  updateMetadata(userId: string, id: string, body: unknown, traceId: string) {
    const changes = cvEditSchema.parse(body);
    return this.repository.updateMetadata(userId, cvIdSchema.parse(id), changes, traceId).then(row => row ? toCvDto(row) : undefined);
  }
  async setDefault(userId: string, id: string, traceId: string) { const row = await this.repository.setDefault(userId, cvIdSchema.parse(id), traceId); return row ? toCvDto(row) : undefined; }
  async download(userId: string, id: string) {
    const row = await this.repository.get(userId, cvIdSchema.parse(id));
    if (!row) throw new AppError(404, "cv_not_found");
    return { url: this.fileStore().downloadUrl(row.storageKey, Math.floor(Date.now() / 1000) + 60) };
  }
  async delete(userId: string, id: string, traceId: string) {
    const parsedId = cvIdSchema.parse(id);
    const row = await this.repository.getForDelete(userId, parsedId);
    if (!row) throw new AppError(404, "cv_not_found");
    await this.repository.markDeleted(userId, parsedId);
    await this.fileStore().delete(row.storageKey);
    await this.repository.finishDelete(userId, parsedId, traceId);
  }
}
