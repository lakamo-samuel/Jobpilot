import { CodeChallengeMethod, OAuth2Client } from "google-auth-library";
import { AppError } from "../../shared/errors/app-error.js";

export type GmailMessage = { id: string; threadId: string; subject: string; sender: string; snippet: string; receivedAt: Date };
export interface GmailProvider {
  authorizationUrl(input: { state: string; nonce: string; codeChallenge: string }): string;
  exchangeCode(code: string, verifier: string): Promise<{ idToken: string; refreshToken: string }>;
  listRecent(refreshToken: string): Promise<GmailMessage[]>;
  revoke(refreshToken: string): Promise<void>;
}

const candidate = /\b(job|jobs|hiring|application|interview|recruiter|vacancy|career|position|opportunity|role)\b/i;
const headers = (items: { name?: string; value?: string }[] = [], name: string) => items.find(item => item.name?.toLowerCase() === name)?.value?.slice(0, 300) ?? "";

export class GoogleGmailProvider implements GmailProvider {
  constructor(private readonly clientId: string, private readonly clientSecret: string, private readonly redirectUri: string) {}
  private client(refreshToken?: string) {
    const client = new OAuth2Client(this.clientId, this.clientSecret, this.redirectUri);
    if (refreshToken) client.setCredentials({ refresh_token: refreshToken });
    return client;
  }
  authorizationUrl(input: { state: string; nonce: string; codeChallenge: string }) {
    return this.client().generateAuthUrl({ response_type: "code", scope: ["openid", "email", "https://www.googleapis.com/auth/gmail.readonly"], access_type: "offline", prompt: "consent", state: input.state, nonce: input.nonce, code_challenge: input.codeChallenge, code_challenge_method: CodeChallengeMethod.S256 });
  }
  async exchangeCode(code: string, verifier: string) {
    try {
      const { tokens } = await this.client().getToken({ code, codeVerifier: verifier });
      if (!tokens.id_token || !tokens.refresh_token) throw new Error("Missing Google credentials");
      return { idToken: tokens.id_token, refreshToken: tokens.refresh_token };
    } catch { throw new AppError(401, "gmail_authorization_failed"); }
  }
  private async get(accessToken: string, path: string): Promise<any> {
    try {
      const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/${path}`, { headers: { Authorization: `Bearer ${accessToken}` }, signal: AbortSignal.timeout(10000) });
      if (!response.ok) throw new Error(`Gmail API ${response.status}`);
      return await response.json();
    } catch { throw new AppError(502, "gmail_unavailable"); }
  }
  async listRecent(refreshToken: string): Promise<GmailMessage[]> {
    let accessToken: string;
    try {
      const response = await this.client(refreshToken).getAccessToken();
      if (!response.token) throw new Error("Missing access token");
      accessToken = response.token;
    } catch { throw new AppError(502, "gmail_unavailable"); }
    const query = new URLSearchParams({ maxResults: "50", labelIds: "INBOX", q: "newer_than:30d" });
    const page = await this.get(accessToken, `messages?${query}`) as { messages?: { id: string }[] };
    const ids = (page.messages ?? []).slice(0, 50).filter(item => /^[a-zA-Z0-9_-]{1,100}$/.test(item.id));
    const messages: GmailMessage[] = [];
    for (let offset = 0; offset < ids.length; offset += 5) {
      const batch = await Promise.all(ids.slice(offset, offset + 5).map(item => this.get(accessToken, `messages/${item.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From`) as Promise<{ id?: string; threadId?: string; snippet?: string; internalDate?: string; payload?: { headers?: { name?: string; value?: string }[] } }>));
      for (const message of batch) {
        const subject = headers(message.payload?.headers, "subject");
        const snippet = (message.snippet ?? "").slice(0, 500);
        if (!candidate.test(subject) && !candidate.test(snippet)) continue;
        const receivedAt = new Date(Number(message.internalDate));
        if (!message.id || !message.threadId || !Number.isFinite(receivedAt.getTime())) continue;
        messages.push({ id: message.id, threadId: message.threadId, subject, sender: headers(message.payload?.headers, "from"), snippet, receivedAt });
      }
    }
    return messages;
  }
  async revoke(refreshToken: string) {
    try { await this.client().revokeToken(refreshToken); } catch { /* Local token deletion still disconnects Pursio. */ }
  }
}
