export interface EmailSender {
  sendAction(to: string, purpose: "verify_email" | "reset_password", url: string, idempotencyKey: string): Promise<void>;
}
