import type { Config } from "../../config/env.js";
import type { FileStore } from "./file-store.js";
import { LocalFileStore } from "./local-file-store.js";
import { S3FileStore } from "./s3-file-store.js";
export function createFileStore(config: Config): FileStore {
  return config.STORAGE_DRIVER === "s3" ? new S3FileStore(config) : new LocalFileStore(config.LOCAL_STORAGE_DIR);
}
