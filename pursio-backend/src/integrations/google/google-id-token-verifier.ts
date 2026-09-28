import { OAuth2Client } from "google-auth-library";
import { z } from "zod";
import { AppError } from "../../shared/errors/app-error.js";
import type { GoogleIdentity, GoogleVerifier } from "./google-verifier.js";

export function isAuthoritativeGoogleEmail(email: string, hostedDomain?: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  return domain === "gmail.com" || (!!hostedDomain && hostedDomain.toLowerCase() === domain);
}

export class GoogleIdTokenVerifier implements GoogleVerifier {
  private readonly client: OAuth2Client;
  constructor(private readonly clientId: string) { this.client = new OAuth2Client(clientId); }
  async verify(credential: string, expectedNonce?: string): Promise<GoogleIdentity> {
    try {
      const ticket = await this.client.verifyIdToken({ idToken: credential, audience: this.clientId });
      const payload = ticket.getPayload();
      const email = z.email().max(254).safeParse(payload?.email?.toLowerCase());
      if (!payload?.sub || !payload.email_verified || !email.success || (expectedNonce && payload.nonce !== expectedNonce)) throw new AppError(401, "invalid_google_credential");
      const authoritativeEmail = isAuthoritativeGoogleEmail(email.data, payload.hd);
      return { subject: payload.sub, email: email.data, displayName: (payload.name?.trim() || email.data.split("@")[0] || "User").slice(0, 100), authoritativeEmail };
    } catch {
      throw new AppError(401, "invalid_google_credential");
    }
  }
}
