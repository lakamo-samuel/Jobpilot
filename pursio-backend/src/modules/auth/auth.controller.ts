import type { Request, Response } from "express";
import type { AuthService } from "./auth.service.js";
import { clearSession, setSessionCookie, tokenFromRequest } from "../../shared/security/session.js";
import type { Config } from "../../config/env.js";

export class AuthController {
  constructor(private readonly service: AuthService, private readonly config: Config) {}
  register = async (req: Request, res: Response) => {
    if (!(await this.service.limitAttempt(req.ip ?? "unknown"))) { res.status(429).json({ error: "rate_limited" }); return; }
    const user = await this.service.register(req.body, req.traceId!);
    if (user === null) { res.status(403).json({ error: "registration_unavailable" }); return; }
    if (!user) { res.status(409).json({ error: "email_unavailable" }); return; }
    setSessionCookie(res, await this.service.createSession(user.id), this.config);
    res.status(201).json({ user });
  };
  login = async (req: Request, res: Response) => {
    if (!(await this.service.limitAttempt(req.ip ?? "unknown"))) { res.status(429).json({ error: "rate_limited" }); return; }
    const user = await this.service.login(req.body);
    if (!user) { res.status(401).json({ error: "invalid_credentials" }); return; }
    setSessionCookie(res, await this.service.createSession(user.id), this.config);
    res.json({ user });
  };
  me = async (req: Request, res: Response) => res.json({ user: await this.service.currentUser(req.user!.id) });
  logout = async (req: Request, res: Response) => { await this.service.revokeSession(tokenFromRequest(req)); clearSession(res, this.config); res.status(204).end(); };
}
