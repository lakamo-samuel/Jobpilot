import { GoogleGenAI } from "@google/genai";
import { v2 as cloudinary } from "cloudinary";
import type { createRuntimeDependencies } from "../app-dependencies.js";

type Runtime = ReturnType<typeof createRuntimeDependencies>;
type Check = { name: string; run: () => Promise<unknown>; critical: boolean };

async function reachable(url: string) {
  const response = await fetch(url, { method: "GET", signal: AbortSignal.timeout(5000) });
  if (response.status >= 500) throw new Error("upstream_unavailable");
}

export async function checkStartupDependencies({ dependencies, pool, redis }: Runtime) {
  const { config } = dependencies;
  const checks: Check[] = [
    { name: "postgres", critical: true, run: () => pool.query("select 1") },
    { name: "redis", critical: true, run: async () => { await redis.connect(); if (await redis.ping() !== "PONG") throw new Error("unexpected_ping_response"); } },
  ];
  if (config.GEMINI_API_KEY) checks.push({ name: "gemini", critical: false, run: async () => {
    await new GoogleGenAI({ apiKey: config.GEMINI_API_KEY! }).models.get({ model: config.GEMINI_MODEL });
  } });
  if (config.CLOUDINARY_CLOUD_NAME) checks.push({ name: "cloudinary", critical: false, run: () => cloudinary.api.ping() });
  if (config.GOOGLE_CLIENT_ID) checks.push({ name: "google", critical: false, run: async () => {
    const response = await fetch("https://accounts.google.com/.well-known/openid-configuration", { signal: AbortSignal.timeout(5000) });
    if (!response.ok || (await response.json() as { issuer?: string }).issuer !== "https://accounts.google.com") throw new Error("openid_discovery_failed");
  } });
  checks.push({ name: "himalayas_jobs", critical: false, run: async () => {
    const response = await fetch("https://himalayas.app/jobs/api?limit=1", { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(5000) });
    if (!response.ok || !Array.isArray((await response.json() as { jobs?: unknown }).jobs)) throw new Error("job_source_unavailable");
  } });
  if (config.RESEND_API_KEY) checks.push({ name: "resend_network", critical: false, run: () => reachable("https://api.resend.com") });
  const results = await Promise.allSettled(checks.map(check => check.run()));
  let criticalFailure = false;
  results.forEach((result, index) => {
    const check = checks[index];
    const ok = result.status === "fulfilled";
    console.log(JSON.stringify({ level: ok ? "info" : "warn", message: "Startup dependency check", dependency: check.name, status: ok ? "ok" : "unavailable" }));
    if (!ok && check.critical) criticalFailure = true;
  });
  if (criticalFailure) throw new Error("Required dependency unavailable: PostgreSQL or Redis");
}
