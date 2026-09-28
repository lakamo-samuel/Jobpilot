import { z } from "zod";
export const cvIdSchema = z.uuid();
export const cvInputSchema = z.object({ label: z.string().trim().min(1).max(100), roleFocus: z.string().trim().max(160).optional() }).strict();
export const cvEditSchema = z.object({ label: z.string().trim().min(1).max(100).optional(), roleFocus: z.string().trim().max(160).optional() }).strict().refine(value => value.label !== undefined || value.roleFocus !== undefined, { message: "Provide label or roleFocus" });
