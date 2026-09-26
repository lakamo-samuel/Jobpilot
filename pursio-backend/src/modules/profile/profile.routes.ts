import { Router } from "express";
import type { Database } from "../../db/index.js";
import { ProfileController } from "./profile.controller.js";
import { ProfileRepository } from "./profile.repository.js";
import { ProfileService } from "./profile.service.js";
export function profileRoutes(db: Database) {
  const router = Router();
  const controller = new ProfileController(new ProfileService(new ProfileRepository(db)));
  router.get("/", controller.get);
  router.put("/", controller.update);
  router.post("/facts", controller.addFact);
  router.delete("/facts/:id", controller.deleteFact);
  return router;
}
