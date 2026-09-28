import { Router } from "express";
import type { AppDependencies } from "../../app-dependencies.js";
import { authenticate } from "../../middleware/auth.middleware.js";
import { AuthRepository } from "../auth/auth.repository.js";
import { GmailRepository } from "./gmail.repository.js";
import { GmailService } from "./gmail.service.js";
import { GmailController } from "./gmail.controller.js";

export function gmailRoutes(dependencies: AppDependencies) {
  const router = Router();
  const auth = new AuthRepository(dependencies.db);
  const service = new GmailService(new GmailRepository(dependencies.db), dependencies.gmailProvider, dependencies.googleVerifier, dependencies.config);
  const controller = new GmailController(service, auth, dependencies.config);
  router.get("/callback", controller.callback);
  router.use(authenticate(auth));
  router.get("/start", controller.start);
  router.get("/status", controller.status);
  router.get("/messages", controller.messages);
  router.post("/sync", controller.sync);
  router.delete("/connection", controller.disconnect);
  return router;
}
