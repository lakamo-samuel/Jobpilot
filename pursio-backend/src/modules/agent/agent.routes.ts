import { Router } from "express";
import type { Database } from "../../db/index.js";
import { AgentController } from "./agent.controller.js";
import { AgentRepository } from "./agent.repository.js";
import { AgentService } from "./agent.service.js";
export function agentRoutes(db: Database) {
  const router = Router();
  const controller = new AgentController(new AgentService(new AgentRepository(db)));
  router.get("/policy", controller.getPolicy);
  router.put("/policy", controller.updatePolicy);
  router.post("/pause", controller.pause);
  router.post("/resume", controller.resume);
  return router;
}
