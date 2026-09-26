import { z } from "zod";

export const opportunityIdSchema = z.uuid();
const compensation = z.object({
  min: z.number().nonnegative().optional(), max: z.number().nonnegative().optional(), currency: z.string().regex(/^[A-Z]{3}$/).optional(),
}).strict().refine(v => v.min === undefined || v.max === undefined || v.max >= v.min, "Maximum compensation must be at least minimum");
export const opportunityInputSchema = z.object({
  type: z.enum(["JOB", "CLIENT", "INBOUND"]),
  companyName: z.string().trim().min(1).max(200),
  companyDomain: z.string().trim().max(255).optional(),
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(20000),
  location: z.string().trim().max(200).optional(),
  workMode: z.enum(["remote", "hybrid", "onsite"]).optional(),
  compensation: compensation.optional(),
  deadline: z.iso.datetime({ offset: true }).optional(),
  sourceUrl: z.url().max(2048).refine(v => /^https?:\/\//i.test(v), "Only HTTP(S) links are allowed").optional(),
}).strict();
export const opportunityUpdateSchema = opportunityInputSchema.partial().refine(v => Object.keys(v).length > 0, "At least one field is required");
export const manualStatusSchema = z.object({ status: z.enum(["NEW", "QUALIFIED", "SKIPPED", "APPLIED", "CONTACTED", "INTERVIEW", "INTERESTED", "OFFER", "WON", "REJECTED", "LOST", "CLOSED"]) }).strict();
export const opportunityListSchema = z.object({
  type: z.enum(["JOB", "CLIENT", "INBOUND"]).optional(),
  status: z.enum(["NEW", "QUALIFIED", "SKIPPED", "PREPARED", "PENDING_APPROVAL", "APPLIED", "CONTACTED", "REPLIED", "INTERVIEW", "INTERESTED", "OFFER", "WON", "REJECTED", "LOST", "CLOSED"]).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
  offset: z.coerce.number().int().min(0).max(10000).default(0),
}).strict();
