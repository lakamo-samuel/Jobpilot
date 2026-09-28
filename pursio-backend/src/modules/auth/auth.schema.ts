import { z } from "zod";
export const registerSchema = z.object({
  email: z.email().max(254).transform(v => v.toLowerCase()),
  password: z.string().min(12).max(128),
  displayName: z.string().trim().min(1).max(100),
  timezone: z.string().trim().min(1).max(64).default("UTC"),
}).strict();
export const loginSchema = registerSchema.pick({ email: true, password: true });
export const emailSchema = z.object({ email: z.email().max(254).transform(v => v.toLowerCase()) }).strict();
export const tokenSchema = z.object({ token: z.string().regex(/^[a-f0-9]{64}$/) }).strict();
export const resetPasswordSchema = tokenSchema.extend({ password: z.string().min(12).max(128) });
