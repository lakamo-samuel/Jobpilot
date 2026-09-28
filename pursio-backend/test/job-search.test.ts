import assert from "node:assert/strict";
import { randomUUID, randomBytes } from "node:crypto";
import { once } from "node:events";
import { test } from "@jest/globals";
import { eq } from "drizzle-orm";
import { createDb } from "../src/db/index.js";
import { sessions, users } from "../src/db/schema/index.js";
import { createApp } from "../src/app.js";
import { hashToken } from "../src/shared/security/session.js";
import { loadConfig } from "../src/config/env.js";
import { HimalayasJobSource } from "../src/integrations/jobs/himalayas-job-source.js";
import { JoobleJobSource } from "../src/integrations/jobs/jooble-job-source.js";
import { readJobSourceJson } from "../src/integrations/jobs/read-json.js";
import type { JobSource } from "../src/integrations/jobs/job-source.js";
import { JobSearchService, type JobSearchCache } from "../src/modules/jobs/job-search.service.js";
import { OpportunityRepository } from "../src/modules/opportunities/opportunity.repository.js";
import { AppError } from "../src/shared/errors/app-error.js";
import type { DiscoveredJob } from "../src/modules/jobs/job.schema.js";

const config = loadConfig({ ...process.env, DATABASE_URL: "postgresql://test:test@localhost:5432/test", REDIS_URL: "redis://localhost:6379", WEB_ORIGIN: "http://localhost:3000", JOOBLE_REGIONS_JSON: '{"NG":{"host":"ng.jooble.org","key":"test-key"}}' });
const input = { keywords: "Backend Engineer", country: "NG", region: "Lagos", workMode: "remote" as const, page: 1 };
const candidate: DiscoveredJob = { source: "himalayas", sourceId: "job-1", title: "Backend Engineer", companyName: "Acme", description: "Build APIs", location: "Nigeria", workMode: "remote", sourceUrl: "https://himalayas.app/jobs/job-1", publishedAt: null, attribution: "Himalayas" };

function memoryCache(): JobSearchCache {
  const entries = new Map<string, string>();
  return { get: async key => entries.get(key) ?? null, setEx: async (key, _seconds, value) => { entries.set(key, value); }, incr: async key => { const next = Number(entries.get(key) ?? 0) + 1; entries.set(key, String(next)); return next; }, expire: async () => {} };
}

test("Himalayas adapter sends country and keywords and normalizes remote jobs", async () => {
  let requested = "";
  const source = new HimalayasJobSource(async url => {
    requested = String(url);
    return new Response(JSON.stringify({ jobs: [{ guid: "https://himalayas.app/jobs/job-1", pubDate: 1790075996, title: "Backend Engineer", companyName: "Acme", excerpt: "Build APIs", description: "<p>Build <strong>secure APIs</strong> with Node.js.</p>", applicationLink: "https://himalayas.app/jobs/job-1", locationRestrictions: ["Nigeria"] }] }), { status: 200 });
  });
  const [job] = await source.search(input);
  assert.match(requested, /country=NG/);
  assert.match(requested, /q=Backend\+Engineer/);
  assert.equal(job.workMode, "remote");
  assert.match(job.description, /Build secure APIs with Node.js/);
  assert.equal(job.sourceUrl, candidate.sourceUrl);
});

test("Jooble hybrid search only includes explicit hybrid listings and never labels onsite unverified jobs", async () => {
  let requestBody = "";
  const source = new JoobleJobSource({ host: "ng.jooble.org", key: "secret" }, async (_url, init) => {
    requestBody = String(init?.body);
    return new Response(JSON.stringify({ jobs: [
      { id: 1, title: "Hybrid Editor", company: "Studio", snippet: "Hybrid schedule", location: "Lagos", link: "https://ng.jooble.org/jdp/1" },
      { id: 2, title: "Editor", company: "Studio", snippet: "Editing videos", location: "Lagos", link: "https://ng.jooble.org/jdp/2" },
    ] }), { status: 200 });
  });
  const hybrid = await source.search({ ...input, workMode: "hybrid" });
  assert.equal(hybrid.length, 1);
  assert.equal(hybrid[0].workMode, "hybrid");
  assert.match(requestBody, /"location":"Lagos"/);
  const onsite = await source.search({ ...input, workMode: "onsite" });
  assert.equal(onsite.length, 1);
  assert.equal(onsite[0].workMode, null);
});

(process.env.TEST_DATABASE_URL ? test : test.skip)("search results are owner-bound; saving is idempotent and preserves pipeline status", async () => {
  const { db, pool } = createDb(process.env.TEST_DATABASE_URL!);
  const [owner, stranger] = await db.insert(users).values([
    { email: `jobs-${randomUUID()}@example.test`, passwordHash: "test", displayName: "Owner" },
    { email: `jobs-${randomUUID()}@example.test`, passwordHash: "test", displayName: "Stranger" },
  ]).returning({ id: users.id });
  const repository = new OpportunityRepository(db);
  let calls = 0;
  const source: JobSource = { name: "himalayas", search: async () => { calls++; return [candidate]; } };
  const service = new JobSearchService(config, memoryCache(), () => source, repository);
  try {
    const result = await service.search(owner.id, input);
    assert.equal(result.items.length, 1);
    await service.search(owner.id, input);
    assert.equal(calls, 1);
    await assert.rejects(service.save(stranger.id, { searchId: result.searchId, sourceId: "job-1" }, randomUUID()), (error: unknown) => error instanceof AppError && error.code === "job_search_expired");
    const saved = await service.save(owner.id, { searchId: result.searchId, sourceId: "job-1" }, randomUUID());
    assert.equal(saved.created, true);
    assert.equal(saved.opportunity?.source, "himalayas");
    assert.equal(await repository.setStatus(stranger.id, saved.opportunity!.id, "APPLIED", randomUUID()), undefined);
    assert.equal((await repository.setStatus(owner.id, saved.opportunity!.id, "APPLIED", randomUUID()))?.status, "APPLIED");
    const second = await service.save(owner.id, { searchId: result.searchId, sourceId: "job-1" }, randomUUID());
    assert.equal(second.created, false);
    assert.equal(second.opportunity?.id, saved.opportunity?.id);
    assert.equal(second.opportunity?.status, "APPLIED");
  } finally {
    await db.delete(users).where(eq(users.id, owner.id));
    await db.delete(users).where(eq(users.id, stranger.id));
    await pool.end();
  }
});

test("job source responses are bounded and reject upstream errors", async () => {
  await assert.rejects(readJobSourceJson(new Response("x".repeat(101), { status: 200 }), 100), /too_large/);
  await assert.rejects(readJobSourceJson(new Response("{}", { status: 503 })), /unavailable/);
});

(process.env.TEST_DATABASE_URL ? test : test.skip)("HTTP job search enforces login, origin, input, and configured coverage", async () => {
  const localConfig = loadConfig({ DATABASE_URL: process.env.TEST_DATABASE_URL!, REDIS_URL: "redis://localhost:6381", WEB_ORIGIN: "http://localhost:3000", NODE_ENV: "test" });
  const { db, pool } = createDb(localConfig.DATABASE_URL);
  const [owner] = await db.insert(users).values({ email: `jobs-http-${randomUUID()}@example.test`, passwordHash: "test", displayName: "Owner", emailVerifiedAt: new Date() }).returning({ id: users.id });
  const token = randomBytes(32).toString("hex");
  await db.insert(sessions).values({ tokenHash: hashToken(token), userId: owner.id, expiresAt: new Date(Date.now() + 60_000) });
  const server = createApp({ db, config: localConfig, redis: { ping: async () => "PONG" } }).listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const base = `http://127.0.0.1:${address.port}`;
  try {
    assert.equal((await fetch(`${base}/api/jobs/sources`)).status, 401);
    const sources = await fetch(`${base}/api/jobs/sources`, { headers: { Cookie: `pursio_session=${token}` } });
    assert.equal(sources.status, 200);
    assert.equal(JSON.stringify(await sources.json()), JSON.stringify({ remote: "himalayas", regionalCountries: [] }));
    const post = (origin: string, body: object) => fetch(`${base}/api/jobs/search`, { method: "POST", headers: { "Content-Type": "application/json", Origin: origin, Cookie: `pursio_session=${token}` }, body: JSON.stringify(body) });
    assert.equal((await post("http://wrong.example", input)).status, 403);
    assert.equal((await post(localConfig.WEB_ORIGIN, { ...input, country: "invalid" })).status, 400);
    const unavailable = await post(localConfig.WEB_ORIGIN, { ...input, workMode: "hybrid" });
    assert.equal(unavailable.status, 422);
    assert.equal((await unavailable.json() as { error: string }).error, "job_region_not_configured");
  } finally {
    await db.delete(users).where(eq(users.id, owner.id));
    server.close();
    await once(server, "close");
    await pool.end();
  }
});
