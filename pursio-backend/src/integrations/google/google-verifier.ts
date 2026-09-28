export interface GoogleIdentity {
  subject: string;
  email: string;
  displayName: string;
  authoritativeEmail: boolean;
}

export interface GoogleVerifier {
  verify(credential: string, expectedNonce?: string): Promise<GoogleIdentity>;
}
