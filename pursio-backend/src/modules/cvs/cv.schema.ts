import { z } from "zod";
export const cvIdSchema = z.uuid();
export const cvInputSchema = z.object({ label: z.string().trim().min(1).max(100), roleFocus: z.string().trim().max(160).default("") }).strict();
export const cvRenameSchema = z.object({ label: z.string().trim().min(1).max(100) }).strict();
