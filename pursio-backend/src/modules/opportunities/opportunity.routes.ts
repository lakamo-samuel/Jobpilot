import { Router } from "express";
import type { AppDependencies } from "../../app-dependencies.js";
import { OpportunityExtractionService } from "./opportunity-extraction.service.js";
import { OpportunityController } from "./opportunity.controller.js";
import { OpportunityRepository } from "./opportunity.repository.js";
import { OpportunityService } from "./opportunity.service.js";
export function opportunityRoutes({ db, aiProvider, config }: AppDependencies) {
  const router = Router();
  const controller = new OpportunityController(new OpportunityService(new OpportunityRepository(db)));
  const extraction = new OpportunityExtractionService(db, aiProvider, config);
  router.post("/extract", async (req, res) => res.json(await extraction.extract(req.user!.id, req.body)));
  router.get("/", controller.list);
  router.post("/", controller.create);
  router.get("/:id", controller.get);
  router.patch("/:id", controller.update);
  router.post("/:id/status", controller.setStatus);
  router.delete("/:id", controller.delete);
  return router;
}
