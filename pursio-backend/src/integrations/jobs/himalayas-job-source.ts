import { z } from "zod";
import { createHash } from "node:crypto";
import { convert } from "html-to-text";
import type { DiscoveredJob, JobSearchInput } from "../../modules/jobs/job.schema.js";
import type { JobSource } from "./job-source.js";
import { readJobSourceJson } from "./read-json.js";

const responseSchema = z.object({ jobs: z.array(z.object({
  guid: z.string(), title: z.string(), companyName: z.string(), excerpt: z.string().optional(), description: z.string().optional(),
  applicationLink: z.url(), pubDate: z.union([z.string(), z.number()]).optional(),
  locationRestrictions: z.array(z.string()).optional(),
}).passthrough()).max(100) }).passthrough();
const safeDate = (value: string | number | undefined) => {
  if (value === undefined) return null;
  const date = new Date(typeof value === "number" ? value * 1000 : value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};
const clean = (value: string) => value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

export class HimalayasJobSource implements JobSource {
  readonly name = "himalayas";
  constructor(private readonly request: typeof fetch = fetch) {}
  async search(input: JobSearchInput): Promise<DiscoveredJob[]> {
    const url = new URL("https://himalayas.app/jobs/api/search");
    url.searchParams.set("q", input.keywords);
    url.searchParams.set("country", input.country);
    url.searchParams.set("sort", "recent");
    url.searchParams.set("page", String(input.page));
    const response = await this.request(url, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(10_000) });
    const parsed = responseSchema.parse(await readJobSourceJson(response));
    return parsed.jobs.slice(0, 20).flatMap(job => {
      if (!job.title.trim() || !job.companyName.trim()) return [];
      let listingUrl: string;
      try { const url = new URL(job.guid); if (url.protocol !== "https:" || url.hostname !== "himalayas.app") return []; listingUrl = url.toString(); } catch { return []; }
      return [{ source: this.name, sourceId: createHash("sha256").update(job.guid).digest("hex"), title: clean(job.title).slice(0, 200), companyName: clean(job.companyName).slice(0, 200), description: (convert(job.description ?? "", { wordwrap: false }).replace(/\s+/g, " ").trim() || clean(job.excerpt ?? job.title)).slice(0, 20000), location: `Remote — ${input.country} eligible`, workMode: "remote" as const, sourceUrl: listingUrl, publishedAt: safeDate(job.pubDate), attribution: "Himalayas" }];
    });
  }
}
