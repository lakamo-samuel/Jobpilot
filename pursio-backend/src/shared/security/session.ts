import { createHash, randomBytes } from "node:crypto";
import argon2 from "argon2";
import type { Request, Response } from "express";
import type { Config } from "../../config/env.js";

const cookieName = "pursio_session";
export const sessionLifetimeMs = 14 * 86400000;
export const hashToken = (value: string) => createHash("sha256").update(value).digest("hex");
export const newSessionToken = () => randomBytes(32).toString("hex");
export const hashPassword = (password: string) => argon2.hash(password, { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 });
export async function verifyPassword(encoded: string, password: string) {
  try { return await argon2.verify(encoded, password); } catch { return false; }
}
export function tokenFromRequest(req: Request) {
  const item = req.headers.cookie?.split(";").map(v => v.trim()).find(v => v.startsWith(`${cookieName}=`));
  const token = item?.slice(cookieName.length + 1);
  return token && /^[a-f0-9]{64}$/.test(token) ? token : undefined;
}
export function setSessionCookie(res: Response, token: string, config: Config) {
  res.cookie(cookieName, token, { httpOnly: true, secure: config.COOKIE_SECURE === "true", sameSite: "lax", path: "/", maxAge: sessionLifetimeMs });
}
export function clearSession(res: Response, config: Config) {
  res.clearCookie(cookieName, { httpOnly: true, secure: config.COOKIE_SECURE === "true", sameSite: "lax", path: "/" });
}
