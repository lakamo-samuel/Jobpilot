import { Router } from "express";
import type { AppDependencies } from "../../app-dependencies.js";
import { authenticate } from "../../middleware/auth.middleware.js";
import { AuthController } from "./auth.controller.js";
import { AuthRepository } from "./auth.repository.js";
import { AuthService } from "./auth.service.js";
import { GoogleRedirectController } from "./google-redirect.controller.js";
export function authRoutes({ db, config, emailSender, googleVerifier, googleAuthorization }: AppDependencies) {
  const router = Router();
  const repository = new AuthRepository(db);
  const service = new AuthService(repository, config, emailSender, googleVerifier);
  const controller = new AuthController(service, config);
  const google = new GoogleRedirectController(service, googleAuthorization, config);
  router.post("/register", controller.register);
  router.post("/login", controller.login);
  router.get("/google/start", google.startSignIn);
  router.get("/google/callback", google.callback);
  router.post("/verify-email", controller.verifyEmail);
  router.post("/resend-verification", controller.resendVerification);
  router.post("/forgot-password", controller.requestPasswordReset);
  router.post("/reset-password", controller.resetPassword);
  router.use(authenticate(repository));
  router.get("/me", controller.me);
  router.get("/google/link/start", google.startLink);
  router.post("/logout", controller.logout);
  return router;
}
