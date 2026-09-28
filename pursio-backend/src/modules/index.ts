import { Router } from "express";
import type { AppDependencies } from "../app-dependencies.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { AuthRepository } from "./auth/auth.repository.js";
import { authRoutes } from "./auth/auth.routes.js";
import { profileRoutes } from "./profile/profile.routes.js";
import { agentRoutes } from "./agent/agent.routes.js";
import { auditRoutes } from "./audit/audit.routes.js";
import { opportunityRoutes } from "./opportunities/opportunity.routes.js";
import { cvRoutes } from "./cvs/cv.routes.js";
import { jobRoutes } from "./jobs/job.routes.js";
import { gmailRoutes } from "./gmail/gmail.routes.js";
import { dashboardRoutes } from "./dashboard/dashboard.routes.js";

export function apiRoutes(dependencies: AppDependencies) {
  const { db } = dependencies;
  const api = Router();
  api.use("/auth", authRoutes(dependencies));
  api.use("/integrations/gmail", gmailRoutes(dependencies));
  api.use(authenticate(new AuthRepository(db)));
  api.use("/dashboard", dashboardRoutes(db));
  api.use("/profile", profileRoutes(db));
  api.use("/agent", agentRoutes(db));
  api.use("/activity", auditRoutes(db));
  api.use("/opportunities", opportunityRoutes(dependencies));
  api.use("/jobs", jobRoutes(dependencies));
  api.use("/cvs", cvRoutes(dependencies));
  return api;
}
