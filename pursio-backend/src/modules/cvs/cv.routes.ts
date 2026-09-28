import { Router } from "express";
import multer from "multer";
import type { AppDependencies } from "../../app-dependencies.js";
import { CvController } from "./cv.controller.js";
import { CvRepository } from "./cv.repository.js";
import { CvService } from "./cv.service.js";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024, files: 1, fields: 2, parts: 3, fieldSize: 200, fieldNameSize: 30, headerPairs: 20 } });
export function cvRoutes({ db, fileStore, cvExtractionQueue, config }: AppDependencies) {
  const router = Router();
  const controller = new CvController(new CvService(new CvRepository(db), fileStore, config, cvExtractionQueue));
  router.get("/", controller.list);
  router.post("/", upload.single("file"), controller.upload);
  router.get("/:id", controller.get);
  router.get("/:id/extraction", controller.getExtraction);
  router.post("/:id/extraction/retry", controller.retryExtraction);
  router.post("/:id/versions", upload.single("file"), controller.uploadVersion);
  router.patch("/:id", controller.updateMetadata);
  router.post("/:id/default", controller.setDefault);
  router.get("/:id/download", controller.download);
  router.delete("/:id", controller.delete);
  return router;
}
