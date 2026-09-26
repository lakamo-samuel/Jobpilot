"use client";
import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowUpRight, MessageSquare, Copy, Check, Search } from "lucide-react";
import { mockConversations } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { cn, formatRelativeTime } from "@/lib/utils";
import { useStoredState } from "@/lib/workspace-state";
import { useWorkspace } from "@/components/shell/WorkspaceProvider";
const mockMessages: Record<string, Array<{ from: string; body: string; at: string; direction: "in" | "out" }>> = {
  "conv-001": [
    {
      from: "You",
      body: "Hi Sarah, I'm excited about the Senior Frontend Engineer role at Stripe. I've been building design systems and complex React applications for 5 years, and I'd love to bring that experience to Stripe's dashboard team.",
      at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      direction: "out",
    },
    {
      from: "Sarah Chen · Stripe",
      body: "Hi, I'm Sarah from Stripe's recruiting team. We reviewed your application and would love to schedule a technical screen. Are you available this week?",
      at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      direction: "in",
    },
  ],
  "conv-002": [
    {
      from: "You",
      body: "Hi, I'm applying for the Software Engineer role at Linear. My background in React and TypeScript would be a great fit for your product-focused team.",
      at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      direction: "out",
    },
    {
      from: "Linear Recruiting",
      body: "Thanks for applying! What's your earliest available start date, and do you have a preference for interview timing?",
      at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      direction: "in",
    },
  ],
  "conv-003": [
    {
      from: "You",
      body: "Applying for the Staff Frontend Engineer, Copilot role — excited about developer tooling at this scale.",
      at: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
      direction: "out",
    },
    {
      from: "GitHub Careers",
      body: "Thank you for your application. We'll be reviewing submissions over the next two weeks.",
      at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      direction: "in",
    },
  ],
};

const mockDraftReplies: Record<string, string> = {
  "conv-001":
    "Hi Sarah, thanks for reaching out! I'm available this week — Thursday or Friday afternoon work best for me. Looking forward to connecting.",
  "conv-002":
    "Hi, thanks for the follow-up! My earliest start date is 2 weeks from an offer. I'm flexible on interview timing and can accommodate most slots.",
};

const emptyDecisions: Record<string, string> = {};
function Inbox() {
  const router = useRouter(); const params = useSearchParams(); const { notify } = useWorkspace();
  const [query, setQuery] = useState("");
  const [drafts, setDrafts] = useStoredState("reply-drafts", mockDraftReplies);
  const [decisions, setDecisions] = useStoredState("decisions", emptyDecisions);
  const selected = mockConversations.find(c => c.id === params.get("id"));
  const conversations = mockConversations.filter(c => `${c.companyName} ${c.role}`.toLowerCase().includes(query.toLowerCase()));
  const messages = selected ? mockMessages[selected.id] ?? [] : [];
  const draft = selected ? drafts[selected.id] ?? "" : "";
  return <div className="flex h-full min-h-0">
    <section aria-label="Conversations" className={cn("min-w-0 flex-col border-[var(--app-line)] md:w-[310px] md:shrink-0 md:border-r xl:w-[340px]", selected ? "hidden md:flex" : "flex w-full")}>
      <div className="border-b border-[var(--app-line)] p-5 sm:p-6"><p className="eyebrow mb-2">Keep the conversation going</p><h1 className="page-heading">Inbox</h1><label className="mt-5 flex items-center gap-2 rounded-lg border border-[var(--app-line)] bg-[var(--app-surface)] px-3"><Search size={15} className="shrink-0 text-[var(--app-muted)]" /><input className="h-10 min-w-0 w-full bg-transparent text-sm outline-none" aria-label="Search conversations" placeholder="Search conversations" value={query} onChange={e => setQuery(e.target.value)} /></label></div>
      <div className="flex-1 overflow-y-auto">{conversations.map(c => <button key={c.id} onClick={() => router.push(`/dashboard/inbox?id=${c.id}`, { scroll: false })} aria-current={selected?.id === c.id ? "true" : undefined} className={cn("flex w-full gap-3 border-b border-[var(--app-line)] px-5 py-5 text-left hover:bg-[var(--app-subtle)]", selected?.id === c.id && "bg-[var(--app-subtle)]")}><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--app-line-strong)] text-sm">{c.companyName[0]}</span><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><h2 className="text-sm font-medium">{c.companyName}</h2>{c.needsAttention && !decisions[c.id] && <span className="h-1.5 w-1.5 rounded-full bg-[var(--app-accent)]" aria-label="Needs review" />}</div><p className="mt-1 truncate text-xs text-[var(--app-secondary)]">{c.role}</p><p className="mt-2 line-clamp-2 text-xs leading-5 text-[var(--app-muted)]">{c.lastMessage}</p><p className="mt-3 text-[11px] text-[var(--app-muted)]">{decisions[c.id] ? "Reviewed" : c.intent === "interview" ? "Interview invitation" : c.intent === "question" ? "Question for you" : "Update"} · {formatRelativeTime(c.lastMessageAt)}</p></div></button>)}{!conversations.length && <p className="p-6 text-sm text-[var(--app-muted)]">No conversations match your search.</p>}</div>
    </section>
    {selected ? <section aria-label="Conversation thread" className="flex min-w-0 flex-1 flex-col">
      <div className="flex shrink-0 items-start gap-3 border-b border-[var(--app-line)] p-4 sm:p-5"><Button variant="ghost" size="icon" aria-label="Back to conversations" onClick={() => router.push("/dashboard/inbox")} className="md:hidden"><ArrowLeft size={18} /></Button><div className="min-w-0 flex-1"><h2 className="text-sm font-semibold leading-6">{selected.role}</h2><p className="text-xs text-[var(--app-muted)]">{selected.companyName} · Sample conversation</p></div><Link href={`/dashboard/opportunities?id=${selected.opportunityId}`} aria-label="View linked opportunity" className="flex min-h-10 items-center gap-1 rounded-lg px-2 text-xs hover:bg-[var(--app-subtle)]"><span className="hidden lg:inline">Opportunity</span><ArrowUpRight size={17} /></Link></div>
      <div className="min-h-0 flex-1 space-y-8 overflow-y-auto p-5 sm:p-8">{messages.map((m, i) => <article key={i} className={cn("max-w-[640px]", m.direction === "out" && "ml-auto")}><div className="mb-2 flex flex-wrap items-center gap-2 text-xs"><span className="font-medium">{m.from}</span><span className="text-[var(--app-muted)]">{formatRelativeTime(m.at)}</span></div><div className={cn("rounded-xl border border-[var(--app-line)] px-4 py-4 text-sm leading-6", m.direction === "out" ? "bg-[var(--app-subtle)]" : "bg-[var(--app-surface)]")}>{m.body}</div></article>)}</div>
      <div className="max-h-[50%] shrink-0 overflow-y-auto border-t border-[var(--app-line)] bg-[var(--app-surface)] p-4 sm:px-6"><label htmlFor="reply-draft" className="mb-2 flex items-center justify-between text-xs font-medium">Your reply<span className="font-normal text-[var(--app-muted)]">Saved in this browser</span></label><textarea id="reply-draft" className="workspace-field resize-y" rows={3} value={draft} placeholder="Write a reply…" onChange={e => { if (!setDrafts(p => ({ ...p, [selected.id]: e.target.value }))) notify("Could not save this draft. Browser storage may be full."); }} /><div className="mt-3 flex flex-wrap items-center justify-between gap-3"><p className="max-w-[230px] text-[11px] leading-4 text-[var(--app-muted)]">Preview only. Copy your draft to send it from your email app.</p><div className="flex gap-2"><Button variant="secondary" size="sm" disabled={!draft.trim()} onClick={async () => { try { await navigator.clipboard.writeText(draft); notify("Draft copied. Nothing has been sent."); } catch { notify("Clipboard access is unavailable. Select the draft text and copy it manually."); } }}><Copy size={14} />Copy</Button><Button size="sm" disabled={!!decisions[selected.id]} onClick={() => { if (setDecisions(p => ({ ...p, [selected.id]: "reviewed" }))) notify("Conversation marked as reviewed. No reply was sent."); else notify("Could not save the review status."); }}><Check size={14} />{decisions[selected.id] ? "Reviewed" : "Mark reviewed"}</Button></div></div></div>
    </section> : <div className="hidden flex-1 items-center justify-center p-8 text-center md:flex"><div><MessageSquare size={28} strokeWidth={1.2} className="mx-auto mb-4 text-[var(--app-muted)]" /><h2 className="text-lg font-medium">Room for your next conversation.</h2><p className="mt-2 text-sm text-[var(--app-muted)]">Choose a thread to read, review, and prepare your reply.</p></div></div>}
  </div>;
}
export default function InboxPage() { return <Suspense fallback={<p className="p-6 text-sm">Loading conversations…</p>}><Inbox /></Suspense>; }
