import { z } from "zod";
const strings = (maxItems: number, maxLength: number) => z.array(z.string().trim().min(1).max(maxLength)).max(maxItems);
export const policySchema = z.object({
  globalMode: z.enum(["observe", "prepare", "auto"]),
  minMatchScore: z.number().int().min(0).max(100),
  autoSendMinScore: z.number().int().min(0).max(100),
  maxDailyOutreach: z.number().int().min(0).max(100),
  compensationMin: z.number().nonnegative().optional(),
  requireApprovalFor: strings(30, 100),
  exclusions: strings(200, 255),
  quietHoursStart: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  quietHoursEnd: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
}).strict().refine(v => v.autoSendMinScore >= v.minMatchScore, "Auto-send score must be at least the minimum match score");
export const defaultPolicy: z.infer<typeof policySchema> = {
  globalMode: "observe", minMatchScore: 70, autoSendMinScore: 85, maxDailyOutreach: 0,
  requireApprovalFor: ["salary_negotiation", "interview_commitment", "identity_documents", "contracts", "pricing"], exclusions: [],
};
