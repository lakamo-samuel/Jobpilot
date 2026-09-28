import { Resend } from "resend";
import type { EmailSender } from "./email-sender.js";
export class ResendEmailSender implements EmailSender {
  private readonly client: Resend;
  constructor(apiKey: string, private readonly from: string) { this.client = new Resend(apiKey); }
  async sendAction(to: string, purpose: "verify_email" | "reset_password", url: string, idempotencyKey: string) {
    const verify = purpose === "verify_email";
    const { error } = await this.client.emails.send({
      from: this.from, to,
      subject: verify ? "Verify your Pursio email" : "Reset your Pursio password",
      text: verify ? `Verify your email using this link (expires in 24 hours):\n${url}\n\nIf you did not create this account, ignore this message.` : `Reset your password using this link (expires in 1 hour):\n${url}\n\nIf you did not request this, ignore this message.`,
    }, { idempotencyKey });
    if (error) throw new Error(`Resend email failed: ${error.name}`);
  }
}
