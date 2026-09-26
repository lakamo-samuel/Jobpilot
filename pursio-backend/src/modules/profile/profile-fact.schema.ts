import { z } from "zod";
export const profileFactInputSchema = z.object({
  type: z.enum(["experience", "education", "skill", "achievement", "certification", "portfolio"]),
  value: z.string().trim().min(1).max(2000),
}).strict();
export const factIdSchema = z.uuid();
