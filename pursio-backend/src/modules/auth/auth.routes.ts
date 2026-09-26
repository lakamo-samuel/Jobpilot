import { Router } from "express";
import type { Config } from "../../config/env.js";
import type { Database } from "../../db/index.js";
import { authenticate } from "../../middleware/auth.middleware.js";
import { AuthController } from "./auth.controller.js";
import { AuthRepository } from "./auth.repository.js";
import { AuthService } from "./auth.service.js";
export function authRoutes(db: Database, config: Config) {
  const router = Router();
  const repository = new AuthRepository(db);
  const controller = new AuthController(new AuthService(repository, config), config);
  router.post("/register", controller.register);
  router.post("/login", controller.login);
  router.use(authenticate(repository));
  router.get("/me", controller.me);
  router.post("/logout", controller.logout);
  return router;
}
