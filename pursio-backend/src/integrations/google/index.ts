import type { Config } from "../../config/env.js";
import type { GoogleVerifier } from "./google-verifier.js";
import { GoogleIdTokenVerifier } from "./google-id-token-verifier.js";
import { GoogleOAuthAuthorization } from "./google-authorization.js";
export function createGoogleVerifier(config: Config): GoogleVerifier | undefined {
  return config.GOOGLE_CLIENT_ID ? new GoogleIdTokenVerifier(config.GOOGLE_CLIENT_ID) : undefined;
}

export function createGoogleAuthorization(config: Config) {
  return config.GOOGLE_CLIENT_ID && config.GOOGLE_CLIENT_SECRET && config.GOOGLE_REDIRECT_URI
    ? new GoogleOAuthAuthorization(config.GOOGLE_CLIENT_ID, config.GOOGLE_CLIENT_SECRET, config.GOOGLE_REDIRECT_URI)
    : undefined;
}
