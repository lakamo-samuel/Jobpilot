import { CodeChallengeMethod, OAuth2Client } from "google-auth-library";
import { AppError } from "../../shared/errors/app-error.js";

export interface GoogleAuthorization {
  authorizationUrl(input: { state: string; nonce: string; codeChallenge: string }): string;
  exchangeCode(code: string, codeVerifier: string): Promise<string>;
}

export class GoogleOAuthAuthorization implements GoogleAuthorization {
  private readonly client: OAuth2Client;
  constructor(clientId: string, clientSecret: string, redirectUri: string) {
    this.client = new OAuth2Client(clientId, clientSecret, redirectUri);
  }
  authorizationUrl({ state, nonce, codeChallenge }: { state: string; nonce: string; codeChallenge: string }) {
    return this.client.generateAuthUrl({ response_type: "code", scope: ["openid", "email", "profile"], access_type: "online", state, nonce, code_challenge: codeChallenge, code_challenge_method: CodeChallengeMethod.S256 });
  }
  async exchangeCode(code: string, codeVerifier: string) {
    try {
      const { tokens } = await this.client.getToken({ code, codeVerifier });
      if (!tokens.id_token) throw new Error("Google did not return an ID token");
      return tokens.id_token;
    } catch {
      throw new AppError(401, "google_authorization_failed");
    }
  }
}
