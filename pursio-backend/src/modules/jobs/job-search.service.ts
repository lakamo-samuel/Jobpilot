import { createHash, randomUUID } from "node:crypto";
import type { JobSource } from "../../integrations/jobs/job-source.js";
import type { Config } from "../../config/env.js";
import { AppError } from "../../shared/errors/app-error.js";
import { OpportunityRepository } from "../opportunities/opportunity.repository.js";
import { discoveredJobSchema, jobSearchSchema, saveJobSchema, type DiscoveredJob, type JobSearchInput } from "./job.schema.js";

export interface JobSearchCache {
  get(key: string): Promise<string | null>;
  setEx(key: string, seconds: number, value: string): Promise<unknown>;
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<unknown>;
}
export type SourceFactory = (input: JobSearchInput) => JobSource | undefined;
const hash = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");

export class JobSearchService {
  constructor(private readonly config: Config, private readonly cache: JobSearchCache | undefined, private readonly sourceFor: SourceFactory, private readonly opportunities: OpportunityRepository) {}
  sources() { return { remote: "himalayas", regionalCountries: Object.keys(this.config.joobleRegions).sort() }; }
  private store(): JobSearchCache { if (!this.cache) throw new AppError(503, "job_search_unavailable"); return this.cache; }
  async search(userId: string, body: unknown) {
    const input = jobSearchSchema.parse(body);
    const source = this.sourceFor(input);
    if (!source) throw new AppError(422, "job_region_not_configured");
    const cache = this.store();
    const rateKey = `job-search:rate:${userId}:${Math.floor(Date.now() / 3600_000)}`;
    const count = await cache.incr(rateKey);
    await cache.expire(rateKey, 3600);
    if (count > 30) throw new AppError(429, "job_search_rate_limited");
    const queryKey = `job-search:query:${hash({ input, source: source.name })}`;
    const cached = await cache.get(queryKey);
    let items: DiscoveredJob[];
    if (cached) items = discoveredJobSchema.array().parse(JSON.parse(cached));
    else {
      try { items = (await source.search(input)).map(item => discoveredJobSchema.parse(item)); }
      catch { throw new AppError(502, "job_source_unavailable"); }
      await cache.setEx(queryKey, 600, JSON.stringify(items));
    }
    const searchId = randomUUID();
    await cache.setEx(`job-search:selection:${userId}:${searchId}`, 1800, JSON.stringify(items));
    return { searchId, source: source.name, attribution: source.name === "himalayas" ? "Jobs by Himalayas" : "Jobs by Jooble", items };
  }
  async save(userId: string, body: unknown, traceId: string) {
    const { searchId, sourceId } = saveJobSchema.parse(body);
    const cached = await this.store().get(`job-search:selection:${userId}:${searchId}`);
    if (!cached) throw new AppError(410, "job_search_expired");
    const job = discoveredJobSchema.array().parse(JSON.parse(cached)).find(item => item.sourceId === sourceId);
    if (!job) throw new AppError(404, "job_not_in_search");
    return this.opportunities.saveDiscovered(userId, job, traceId);
  }
}
