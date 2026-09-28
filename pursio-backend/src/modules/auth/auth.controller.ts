import type { Request, Response } from "express";
import type { AuthService } from "./auth.service.js";
import {
  clearSession,
  setSessionCookie,
  tokenFromRequest,
} from "../../shared/security/session.js";
import type { Config } from "../../config/env.js";

export class AuthController {
  constructor(
    private readonly service: AuthService,
    private readonly config: Config,
  ) {}
  private limited = async (req: Request) =>
    this.service.limitAttempt(req.ip ?? "unknown");
  register = async (req: Request, res: Response) => {
    if (!(await this.limited(req))) {
      res.status(429).json({ error: "rate_limited" });
      return;
    }
    await this.service.register(req.body, req.traceId!);
    res
      .status(202)
      .json({
        message:
          "If the address can be registered, a verification email has been sent.",
      });
  };
  resendVerification = async (req: Request, res: Response) => {
    if (!(await this.limited(req))) {
      res.status(429).json({ error: "rate_limited" });
      return;
    }
    await this.service.resendVerification(req.body);
    res
      .status(202)
      .json({ message: "If verification is needed, an email has been sent." });
  };
  requestPasswordReset = async (req: Request, res: Response) => {
    if (!(await this.limited(req))) {
      res.status(429).json({ error: "rate_limited" });
      return;
    }
    await this.service.requestPasswordReset(req.body);
    res
      .status(202)
      .json({ message: "If the account exists, a reset email has been sent." });
  };
  verifyEmail = async (req: Request, res: Response) => {
    if (!(await this.limited(req))) {
      res.status(429).json({ error: "rate_limited" });
      return;
    }
    await this.service.verifyEmail(req.body, req.traceId!);
    res.status(204).end();
  };
  resetPassword = async (req: Request, res: Response) => {
    if (!(await this.limited(req))) {
      res.status(429).json({ error: "rate_limited" });
      return;
    }
    await this.service.resetPassword(req.body, req.traceId!);
    res.status(204).end();
  };
  login = async (req: Request, res: Response) => {
    if (!(await this.limited(req))) {
      res.status(429).json({ error: "rate_limited" });
      return;
    }
    const user = await this.service.login(req.body);
    if (!user) {
      res.status(401).json({ error: "invalid_credentials" });
      return;
    }
    setSessionCookie(
      res,
      await this.service.createSession(user.id),
      this.config,
    );
    res.json({ user });
  };
  me = async (req: Request, res: Response) =>
    res.json({ user: await this.service.currentUser(req.user!.id) });
  logout = async (req: Request, res: Response) => {
    await this.service.revokeSession(tokenFromRequest(req));
    clearSession(res, this.config);
    res.status(204).end();
  };
}
