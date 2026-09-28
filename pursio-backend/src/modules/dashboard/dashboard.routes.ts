import { Router } from "express";
import type { Database } from "../../db/index.js";
import { DashboardController } from "./dashboard.controller.js";
import { DashboardRepository } from "./dashboard.repository.js";
import { DashboardService } from "./dashboard.service.js";

export function dashboardRoutes(db: Database) {
  const router = Router();
  const controller = new DashboardController(new DashboardService(new DashboardRepository(db)));
  router.get("/", controller.get);
  return router;
}
