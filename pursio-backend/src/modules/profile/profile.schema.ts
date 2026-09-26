import { z } from "zod";
const strings = (maxItems: number, maxLength: number) => z.array(z.string().trim().min(1).max(maxLength)).max(maxItems);
export const profileSchema = z.object({
  headline: z.string().trim().max(160),
  summary: z.string().trim().max(5000),
  yearsExperience: z.number().int().min(0).max(80),
  targetRoles: strings(30, 100),
  skills: strings(100, 100),
  locations: strings(30, 100),
  workModes: z.array(z.enum(["remote", "hybrid", "onsite"])).max(3),
  compensationMin: z.number().nonnegative().optional(),
  compensationCurrency: z.string().regex(/^[A-Z]{3}$/),
  links: z.object({ github: z.url().optional(), portfolio: z.url().optional(), linkedin: z.url().optional() }).strict(),
}).strict();
export const defaultProfile: z.infer<typeof profileSchema> = {
  headline: "", summary: "", yearsExperience: 0, targetRoles: [], skills: [], locations: [], workModes: [], compensationCurrency: "USD", links: {},
};
