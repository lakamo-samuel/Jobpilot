import { z } from "zod";
import { convert } from "html-to-text";
import type { DiscoveredJob, JobSearchInput } from "../../modules/jobs/job.schema.js";
import type { JobSource } from "./job-source.js";
import { readJobSourceJson } from "./read-json.js";

export type JoobleRegion = { host: string; key: string };
const responseSchema = z.object({ jobs: z.array(z.object({
  id: z.union([z.string(), z.number()]), title: z.string(), company: z.string().optional(),
  snippet: z.string().optional(), location: z.string().optional(), link: z.url(), updated: z.string().optional(),
}).passthrough()).max(100) }).passthrough();
const clean = (value: string) => value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
const safeDate = (value: string | undefined) => value && !Number.isNaN(Date.parse(value)) ? new Date(value).toISOString() : null;

export class JoobleJobSource implements JobSource {
  readonly name = "jooble";
  constructor(private readonly region: JoobleRegion, private readonly request: typeof fetch = fetch) {}
  async search(input: JobSearchInput): Promise<DiscoveredJob[]> {
    const url = `https://${this.region.host}/api/${encodeURIComponent(this.region.key)}`;
    const response = await this.request(url, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ keywords: `${input.keywords} ${input.workMode === "hybrid" ? "hybrid" : ""}`.trim(), location: input.region || input.country, page: input.page, ResultOnPage: 20, companysearch: false }), signal: AbortSignal.timeout(10_000) });
    const parsed = responseSchema.parse(await readJobSourceJson(response));
    return parsed.jobs.slice(0, 20).flatMap(job => {
      const evidence = `${job.title} ${job.snippet ?? ""}`;
      if (input.workMode === "hybrid" && !/\bhybrid\b/i.test(evidence)) return [];
      if (input.workMode === "onsite" && /\b(remote|hybrid|work from home|wfh)\b/i.test(evidence)) return [];
      if (!/^https:\/\//.test(job.link) || !job.title.trim()) return [];
      return [{ source: this.name, sourceId: String(job.id).slice(0, 200), title: clean(job.title).slice(0, 200), companyName: clean(job.company ?? "Company not specified").slice(0, 200), description: (convert(job.snippet ?? "", { wordwrap: false }).replace(/\s+/g, " ").trim() || clean(job.title)).slice(0, 20000), location: clean(job.location ?? input.region ?? input.country).slice(0, 200), workMode: input.workMode === "hybrid" ? "hybrid" as const : null, sourceUrl: job.link, publishedAt: safeDate(job.updated), attribution: "Jooble" }];
    });
  }
}
