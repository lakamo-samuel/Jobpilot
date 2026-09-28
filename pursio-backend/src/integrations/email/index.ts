import type { Config } from "../../config/env.js";
import type { EmailSender } from "./email-sender.js";
import { ResendEmailSender } from "./resend-email-sender.js";
export function createEmailSender(config: Config): EmailSender | undefined {
  return config.RESEND_API_KEY && config.AUTH_EMAIL_FROM ? new ResendEmailSender(config.RESEND_API_KEY, config.AUTH_EMAIL_FROM) : undefined;
}
