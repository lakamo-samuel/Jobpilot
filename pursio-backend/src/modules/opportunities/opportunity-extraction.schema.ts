import { z } from "zod";
export const extractInputSchema = z.object({ sourceText: z.string().trim().min(50).max(20000) }).strict();
export const extractedOpportunitySchema = z.object({
  type: z.enum(["JOB", "CLIENT", "INBOUND"]),
  companyName: z.string(),
  title: z.string(),
  description: z.string(),
  location: z.string().nullable(),
  sourceUrl: z.string().nullable(),
  unknowns: z.array(z.string()),
}).strict();
