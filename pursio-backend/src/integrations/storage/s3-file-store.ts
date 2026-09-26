import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { Config } from "../../config/env.js";
import type { FileStore } from "./file-store.js";

export class S3FileStore implements FileStore {
  private readonly client: S3Client;
  private readonly bucket: string;
  constructor(config: Config) {
    this.bucket = config.S3_BUCKET!;
    this.client = new S3Client({
      region: config.S3_REGION!, endpoint: config.S3_ENDPOINT,
      forcePathStyle: !!config.S3_ENDPOINT,
      credentials: config.S3_ACCESS_KEY_ID && config.S3_SECRET_ACCESS_KEY ? { accessKeyId: config.S3_ACCESS_KEY_ID, secretAccessKey: config.S3_SECRET_ACCESS_KEY } : undefined,
    });
  }
  async put(key: string, body: Buffer, contentType: string) {
    await this.client.send(new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: body, ContentType: contentType }));
  }
  async get(key: string) {
    const result = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
    if (!result.Body) throw new Error("Stored file is unavailable");
    return Buffer.from(await result.Body.transformToByteArray());
  }
  async delete(key: string) { await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key })); }
}
