import { Router } from "express";
import type { Config } from "../config/env.js";
import type { Database } from "../db/index.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { AuthRepository } from "./auth/auth.repository.js";
import { authRoutes } from "./auth/auth.routes.js";
import { profileRoutes } from "./profile/profile.routes.js";
import { agentRoutes } from "./agent/agent.routes.js";
import { auditRoutes } from "./audit/audit.routes.js";
import { opportunityRoutes } from "./opportunities/opportunity.routes.js";
import { cvRoutes } from "./cvs/cv.routes.js";
import { createFileStore } from "../integrations/storage/index.js";

export function apiRoutes(db: Database, config: Config) {
  const api = Router();
  api.use("/auth", authRoutes(db, config));
  api.use(authenticate(new AuthRepository(db)));
  api.use("/profile", profileRoutes(db));
  api.use("/agent", agentRoutes(db));
  api.use("/activity", auditRoutes(db));
  api.use("/opportunities", opportunityRoutes(db));
  api.use("/cvs", cvRoutes(db, createFileStore(config)));
  return api;
}
