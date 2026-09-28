import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { Request, Response } from "express";
import type { Config } from "../../config/env.js";
import { AuthRepository } from "../auth/auth.repository.js";
import { hashToken, tokenFromRequest } from "../../shared/security/session.js";
import { GmailService } from "./gmail.service.js";
import { AppError } from "../../shared/errors/app-error.js";

type Flow = { state: string; nonce: string; verifier: string; userId: string; sessionHash: string; expiresAt: number };
const cookieName = "pursio_gmail_flow";
const path = "/api/integrations/gmail";
const lifetime = 10 * 60_000;
const random = () => randomBytes(32).toString("base64url");
const equal = (a: string, b: string) => { const x = Buffer.from(a); const y = Buffer.from(b); return x.length === y.length && timingSafeEqual(x, y); };

export class GmailController {
  constructor(private readonly service: GmailService, private readonly auth: AuthRepository, private readonly config: Config) {}
  private signature(payload: string) {
    return createHmac("sha256", this.config.GOOGLE_CLIENT_SECRET!).update(`pursio-gmail-flow:${payload}`).digest("base64url");
  }
  private cookieOptions() {
    return { httpOnly: true, secure: this.config.COOKIE_SECURE === "true", sameSite: "lax" as const, path, maxAge: lifetime };
  }
  private readFlow(req: Request): Flow | undefined {
    const raw = req.headers.cookie?.split(";").map(value => value.trim()).find(value => value.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1);
    if (!raw || raw.length > 2048 || !this.config.GOOGLE_CLIENT_SECRET) return undefined;
    const [payload, signature, extra] = raw.split(".");
    if (!payload || !signature || extra || !equal(signature, this.signature(payload))) return undefined;
    try {
      const flow = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Flow;
      if (!flow || typeof flow.state !== "string" || typeof flow.nonce !== "string" || typeof flow.verifier !== "string" || typeof flow.userId !== "string" || typeof flow.sessionHash !== "string" || typeof flow.expiresAt !== "number" || flow.expiresAt < Date.now()) return undefined;
      return flow;
    } catch { return undefined; }
  }
  start = (req: Request, res: Response) => {
    const session = tokenFromRequest(req);
    if (!session) throw new AppError(401, "unauthorized");
    const flow: Flow = { state: random(), nonce: random(), verifier: random(), userId: req.user!.id, sessionHash: hashToken(session), expiresAt: Date.now() + lifetime };
    const payload = Buffer.from(JSON.stringify(flow)).toString("base64url");
    const challenge = createHash("sha256").update(flow.verifier).digest("base64url");
    const url = this.service.authorizationUrl({ state: flow.state, nonce: flow.nonce, codeChallenge: challenge });
    res.cookie(cookieName, `${payload}.${this.signature(payload)}`, this.cookieOptions());
    res.setHeader("Cache-Control", "no-store");
    res.redirect(302, url);
  };
  callback = async (req: Request, res: Response) => {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Referrer-Policy", "no-referrer");
    const flow = this.readFlow(req);
    res.clearCookie(cookieName, this.cookieOptions());
    const finish = (query: string) => res.redirect(303, `${this.config.WEB_ORIGIN}/settings/integrations/gmail${query}`);
    const session = tokenFromRequest(req);
    if (!flow || !session || !equal(flow.sessionHash, hashToken(session)) || typeof req.query.state !== "string" || !equal(flow.state, req.query.state) || typeof req.query.code !== "string" || !/^[\w./~-]{1,2048}$/.test(req.query.code) || req.query.error) { finish("?error=gmail_connection_failed"); return; }
    try {
      const user = await this.auth.findSession(hashToken(session));
      if (!user || user.id !== flow.userId) { finish("?error=session_expired"); return; }
      await this.service.connect(user.id, req.query.code, flow.verifier, flow.nonce);
      finish("?connected=1");
    } catch (error) {
      finish(error instanceof AppError && error.code === "gmail_account_in_use" ? "?error=gmail_account_in_use" : "?error=gmail_connection_failed");
    }
  };
  status = async (req: Request, res: Response) => res.json(await this.service.status(req.user!.id));
  messages = async (req: Request, res: Response) => res.json(await this.service.messages(req.user!.id));
  sync = async (req: Request, res: Response) => res.json(await this.service.sync(req.user!.id));
  disconnect = async (req: Request, res: Response) => { await this.service.disconnect(req.user!.id); res.status(204).send(); };
}
