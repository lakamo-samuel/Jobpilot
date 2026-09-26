import type { Request, Response, NextFunction } from "express";
import { AuthRepository } from "../modules/auth/auth.repository.js";
import { hashToken, tokenFromRequest } from "../shared/security/session.js";

declare global { namespace Express { interface Request { user?: { id: string; email: string }; traceId?: string } } }
export function authenticate(repository: AuthRepository) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const token = tokenFromRequest(req);
    if (!token) { res.status(401).json({ error: "unauthorized" }); return; }
    const user = await repository.findSession(hashToken(token));
    if (!user) { res.status(401).json({ error: "unauthorized" }); return; }
    req.user = user;
    next();
  };
}
