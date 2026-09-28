import assert from "node:assert/strict";
import { test } from "@jest/globals";
import { GoogleOAuthAuthorization } from "../src/integrations/google/google-authorization.js";

test("Google authorization URL requests only identity scopes and binds redirect, state, nonce, and PKCE", () => {
  const redirect = "https://api.pursio.example/api/auth/google/callback";
  const provider = new GoogleOAuthAuthorization("client-id", "client-secret", redirect);
  const url = new URL(provider.authorizationUrl({ state: "state-value", nonce: "nonce-value", codeChallenge: "challenge-value" }));
  assert.equal(url.origin, "https://accounts.google.com");
  assert.equal(url.searchParams.get("redirect_uri"), redirect);
  assert.equal(url.searchParams.get("response_type"), "code");
  assert.equal(url.searchParams.get("state"), "state-value");
  assert.equal(url.searchParams.get("nonce"), "nonce-value");
  assert.equal(url.searchParams.get("code_challenge"), "challenge-value");
  assert.equal(url.searchParams.get("code_challenge_method"), "S256");
  assert.deepEqual(new Set(url.searchParams.get("scope")?.split(" ")), new Set(["openid", "email", "profile"]));
});
