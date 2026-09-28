import { v2 as cloudinary } from "cloudinary";
import type { Config } from "../../config/env.js";
import type { FileStore } from "./file-store.js";

export class CloudinaryFileStore implements FileStore {
  constructor(config: Config) {
    cloudinary.config({ cloud_name: config.CLOUDINARY_CLOUD_NAME, api_key: config.CLOUDINARY_API_KEY, api_secret: config.CLOUDINARY_API_SECRET, secure: true });
  }
  async put(key: string, body: Buffer, _contentType: string) {
    await new Promise<void>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream({ public_id: key, resource_type: "raw", type: "authenticated", overwrite: false, unique_filename: false, use_filename: false }, (error, result) => {
        if (error || !result) { reject(error ?? new Error("Cloudinary upload failed")); return; }
        if (result.public_id !== key || result.bytes !== body.length) { reject(new Error("Cloudinary upload mismatch")); return; }
        resolve();
      });
      stream.on("error", reject);
      stream.end(body);
    });
  }
  downloadUrl(key: string, expiresAt: number) {
    return cloudinary.utils.private_download_url(key, "", { resource_type: "raw", type: "authenticated", attachment: true, expires_at: expiresAt });
  }
  async get(key: string, maxBytes: number) {
    const response = await fetch(this.downloadUrl(key, Math.floor(Date.now() / 1000) + 60), { signal: AbortSignal.timeout(30_000) });
    if (!response.ok || !response.body) throw new Error("Cloudinary download failed");
    const declaredSize = Number(response.headers.get("content-length"));
    if (declaredSize > maxBytes) throw new Error("Cloudinary file exceeded limit");
    const reader = response.body.getReader();
    const chunks: Buffer[] = [];
    let size = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > maxBytes) throw new Error("Cloudinary file exceeded limit");
        chunks.push(Buffer.from(value));
      }
    } finally { await reader.cancel().catch(() => undefined); }
    return Buffer.concat(chunks, size);
  }
  async delete(key: string) {
    const result = await cloudinary.uploader.destroy(key, { resource_type: "raw", type: "authenticated", invalidate: true });
    if (result.result !== "ok" && result.result !== "not found") throw new Error("Cloudinary deletion failed");
  }
}
