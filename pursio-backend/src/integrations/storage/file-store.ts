export interface FileStore {
  put(key: string, body: Buffer, contentType: string): Promise<void>;
  downloadUrl(key: string, expiresAt: number): string;
  get(key: string, maxBytes: number): Promise<Buffer>;
  delete(key: string): Promise<void>;
}
