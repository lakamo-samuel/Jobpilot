import { test } from "@jest/globals";
import assert from "node:assert/strict";
import { isAuthoritativeGoogleEmail } from "../src/integrations/google/google-id-token-verifier.js";

test("only Gmail or matching Google Workspace domains permit automatic account linking", () => {
  assert.equal(isAuthoritativeGoogleEmail("user@gmail.com"), true);
  assert.equal(isAuthoritativeGoogleEmail("user@example.com", "example.com"), true);
  assert.equal(isAuthoritativeGoogleEmail("user@example.com"), false);
  assert.equal(isAuthoritativeGoogleEmail("user@example.com", "other.com"), false);
});
