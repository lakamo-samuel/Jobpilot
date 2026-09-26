import { Router } from "express";
import type { Database } from "../../db/index.js";
import { OpportunityController } from "./opportunity.controller.js";
import { OpportunityRepository } from "./opportunity.repository.js";
import { OpportunityService } from "./opportunity.service.js";
export function opportunityRoutes(db: Database) {
  const router = Router();
  const controller = new OpportunityController(new OpportunityService(new OpportunityRepository(db)));
  router.get("/", controller.list);
  router.post("/", controller.create);
  router.get("/:id", controller.get);
  router.patch("/:id", controller.update);
  router.post("/:id/status", controller.setStatus);
  router.delete("/:id", controller.delete);
  return router;
}
