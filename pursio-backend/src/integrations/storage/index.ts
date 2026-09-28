import type { Config } from "../../config/env.js";
import type { FileStore } from "./file-store.js";
import { CloudinaryFileStore } from "./cloudinary-file-store.js";
export function createFileStore(config: Config): FileStore | undefined {
  return config.CLOUDINARY_CLOUD_NAME && config.CLOUDINARY_API_KEY && config.CLOUDINARY_API_SECRET ? new CloudinaryFileStore(config) : undefined;
}
