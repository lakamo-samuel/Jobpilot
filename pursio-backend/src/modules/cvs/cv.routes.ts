import { Router } from "express";
import multer from "multer";
import type { Database } from "../../db/index.js";
import type { FileStore } from "../../integrations/storage/file-store.js";
import { CvController } from "./cv.controller.js";
import { CvRepository } from "./cv.repository.js";
import { CvService } from "./cv.service.js";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024, files: 1, fields: 2, parts: 3, fieldSize: 200, fieldNameSize: 30, headerPairs: 20 } });
export function cvRoutes(db: Database, files: FileStore) {
  const router = Router();
  const controller = new CvController(new CvService(new CvRepository(db), files));
  router.get("/", controller.list);
  router.post("/", upload.single("file"), controller.upload);
  router.get("/:id", controller.get);
  router.post("/:id/versions", upload.single("file"), controller.uploadVersion);
  router.patch("/:id", controller.rename);
  router.post("/:id/default", controller.setDefault);
  router.get("/:id/download", controller.download);
  router.delete("/:id", controller.delete);
  return router;
}
