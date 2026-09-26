import { Router } from "express";
import type { Database } from "../../db/index.js";
import { AuditController } from "./audit.controller.js";
import { AuditRepository } from "./audit.repository.js";
import { AuditService } from "./audit.service.js";
export function auditRoutes(db: Database) {
  const router = Router();
  const controller = new AuditController(new AuditService(new AuditRepository(db)));
  router.get("/", controller.list);
  return router;
}
