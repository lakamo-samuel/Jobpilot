import { z } from "zod";

export const jobSearchSchema = z.object({
  keywords: z.string().trim().min(2).max(100),
  country: z.string().trim().toUpperCase().regex(/^[A-Z]{2}$/, "Use a two-letter country code"),
  region: z.string().trim().max(100).optional(),
  workMode: z.enum(["remote", "hybrid", "onsite"]),
  page: z.number().int().min(1).max(5).default(1),
}).strict();
export type JobSearchInput = z.infer<typeof jobSearchSchema>;

export const saveJobSchema = z.object({ searchId: z.uuid(), sourceId: z.string().min(1).max(200) }).strict();

export const discoveredJobSchema = z.object({
  source: z.enum(["himalayas", "jooble"]),
  sourceId: z.string().min(1).max(200),
  title: z.string().min(1).max(200),
  companyName: z.string().min(1).max(200),
  description: z.string().min(1).max(20000),
  location: z.string().max(200).nullable(),
  workMode: z.enum(["remote", "hybrid", "onsite"]).nullable(),
  sourceUrl: z.url().max(2048),
  publishedAt: z.iso.datetime({ offset: true }).nullable(),
  attribution: z.string().min(1).max(100),
}).strict();
export type DiscoveredJob = z.infer<typeof discoveredJobSchema>;
