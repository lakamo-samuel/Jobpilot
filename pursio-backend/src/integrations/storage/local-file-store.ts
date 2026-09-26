import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join, resolve, sep } from "node:path";
import type { FileStore } from "./file-store.js";

export class LocalFileStore implements FileStore {
  private readonly root: string;
  constructor(root: string) { this.root = resolve(root); }
  private path(key: string) {
    const path = resolve(join(this.root, key));
    if (!path.startsWith(this.root + sep)) throw new Error("Invalid storage key");
    return path;
  }
  async put(key: string, body: Buffer) {
    const path = this.path(key);
    await mkdir(resolve(path, ".."), { recursive: true, mode: 0o700 });
    await writeFile(path, body, { flag: "wx", mode: 0o600 });
  }
  get(key: string) { return readFile(this.path(key)); }
  async delete(key: string) { await rm(this.path(key), { force: true }); }
}
