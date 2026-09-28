import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { Request, Response } from "express";
import type { Config } from "../../config/env.js";
import type { GoogleAuthorization } from "../../integrations/google/google-authorization.js";
import { AppError } from "../../shared/errors/app-error.js";
import { setSessionCookie, tokenFromRequest } from "../../shared/security/session.js";
import type { AuthService } from "./auth.service.js";

type Flow = { state: string; nonce: string; codeVerifier: string; mode: "sign_in" | "link"; expiresAt: number };
const cookieName = "pursio_google_flow";
const cookiePath = "/api/auth/google";
const flowLifetimeMs = 10 * 60_000;
const token = () => randomBytes(32).toString("base64url");
const equal = (left: string, right: string) => {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
};

export class GoogleRedirectController {
  constructor(private readonly auth: AuthService, private readonly provider: GoogleAuthorization | undefined, private readonly config: Config) {}
  private requireProvider() {
    if (!this.provider || !this.config.GOOGLE_CLIENT_SECRET) throw new AppError(503, "google_auth_not_configured");
    return this.provider;
  }
  private signature(payload: string) {
    return createHmac("sha256", this.config.GOOGLE_CLIENT_SECRET!).update(`pursio-google-flow:${payload}`).digest("base64url");
  }
  private cookieOptions() {
    return { httpOnly: true, secure: this.config.COOKIE_SECURE === "true", sameSite: "lax" as const, path: cookiePath, maxAge: flowLifetimeMs };
  }
  private readFlow(req: Request): Flow | undefined {
    const raw = req.headers.cookie?.split(";").map(part => part.trim()).find(part => part.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1);
    if (!raw || raw.length > 2048 || !this.config.GOOGLE_CLIENT_SECRET) return undefined;
    const [payload, signature, extra] = raw.split(".");
    if (!payload || !signature || extra || !equal(signature, this.signature(payload))) return undefined;
    try {
      const flow = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Flow;
      if (!flow || typeof flow.state !== "string" || typeof flow.nonce !== "string" || typeof flow.codeVerifier !== "string" || (flow.mode !== "sign_in" && flow.mode !== "link") || typeof flow.expiresAt !== "number" || flow.expiresAt < Date.now()) return undefined;
      return flow;
    } catch { return undefined; }
  }
  private start(req: Request, res: Response, mode: Flow["mode"]) {
    const provider = this.requireProvider();
    const flow: Flow = { state: token(), nonce: token(), codeVerifier: token(), mode, expiresAt: Date.now() + flowLifetimeMs };
    const payload = Buffer.from(JSON.stringify(flow)).toString("base64url");
    res.cookie(cookieName, `${payload}.${this.signature(payload)}`, this.cookieOptions());
    res.setHeader("Cache-Control", "no-store");
    const codeChallenge = createHash("sha256").update(flow.codeVerifier).digest("base64url");
    res.redirect(302, provider.authorizationUrl({ state: flow.state, nonce: flow.nonce, codeChallenge }));
  }
  startSignIn = async (req: Request, res: Response) => {
    if (!(await this.auth.limitAttempt(req.ip ?? "unknown"))) throw new AppError(429, "rate_limited");
    this.start(req, res, "sign_in");
  };
  startLink = async (req: Request, res: Response) => this.start(req, res, "link");
  callback = async (req: Request, res: Response) => {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Referrer-Policy", "no-referrer");
    const flow = this.readFlow(req);
    res.clearCookie(cookieName, this.cookieOptions());
    const finish = (query: string) => res.redirect(303, `${this.config.WEB_ORIGIN}/auth/google/callback${query}`);
    if (!flow || typeof req.query.state !== "string" || !equal(flow.state, req.query.state) || typeof req.query.code !== "string" || !/^[\w./~-]{1,2048}$/.test(req.query.code) || req.query.error) { finish("?error=google_sign_in_failed"); return; }
    try {
      const credential = await this.requireProvider().exchangeCode(req.query.code, flow.codeVerifier);
      if (flow.mode === "link") {
        const user = await this.auth.sessionUser(tokenFromRequest(req));
        if (!user) { finish("?error=session_expired"); return; }
        await this.auth.linkGoogle(user.id, credential, req.traceId!, flow.nonce);
        finish("?linked=1");
        return;
      }
      const user = await this.auth.googleSignIn(credential, req.traceId!, flow.nonce);
      setSessionCookie(res, await this.auth.createSession(user.id), this.config);
      finish("");
    } catch (error) {
      finish(error instanceof AppError && error.code === "account_link_required" ? "?error=account_link_required" : "?error=google_sign_in_failed");
    }
  };
}
