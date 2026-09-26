import { z } from "zod";
export const registerSchema = z.object({
  email: z.email().max(254).transform(v => v.toLowerCase()),
  password: z.string().min(12).max(128),
  displayName: z.string().trim().min(1).max(100),
  timezone: z.string().trim().min(1).max(64).default("UTC"),
  registrationKey: z.string().min(32),
}).strict();
export const loginSchema = registerSchema.pick({ email: true, password: true });
