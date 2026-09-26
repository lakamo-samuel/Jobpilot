import React from "react";
import {
  Search,
  Star,
  Send,
  MessageSquare,
  SkipForward,
  RefreshCw,
  Check,
  FileText,
} from "lucide-react";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { AuditEvent } from "@/lib/types";

interface ActivityEventProps {
  event: AuditEvent;
  showDate?: boolean;
}

const eventConfig: Record<
  string,
  { icon: React.ElementType; color: string; label: (e: AuditEvent) => string }
> = {
  "opportunity.discovered": {
    icon: Search,
    color: "bg-[var(--app-subtle)] text-[var(--app-secondary)]",
    label: (e) => `Found opportunity via ${(e.details.source as string) ?? "source"}`,
  },
  "opportunity.scored": {
    icon: Star,
    color: "bg-[var(--app-subtle)] text-[var(--app-secondary)]",
    label: (e) => `Scored opportunity — ${e.details.score}/100`,
  },
  "opportunity.skipped": {
    icon: SkipForward,
    color: "bg-[var(--app-subtle)] text-[var(--app-secondary)]",
    label: (e) => `Skipped — ${(e.details.reason as string) ?? "below threshold"}`,
  },
  "application.prepared": {
    icon: FileText,
    color: "bg-[var(--app-subtle)] text-[var(--app-secondary)]",
    label: (e) => `Application prepared using ${(e.details.cv as string) ?? "CV"}`,
  },
  "application.sent": {
    icon: Send,
    color: "bg-[var(--app-subtle)] text-[var(--app-secondary)]",
    label: () => `Application sent via email`,
  },
  "reply.detected": {
    icon: MessageSquare,
    color: "bg-[var(--app-subtle)] text-[var(--app-secondary)]",
    label: (e) => `Reply detected from ${(e.details.company as string) ?? "company"} — ${e.details.intent}`,
  },
  "gmail.synced": {
    icon: RefreshCw,
    color: "bg-[var(--app-subtle)] text-[var(--app-secondary)]",
    label: (e) =>
      `Gmail synced — ${e.details.messagesProcessed} messages, ${e.details.newOpportunities} new`,
  },
  default: {
    icon: Check,
    color: "bg-[var(--app-subtle)] text-[var(--app-muted)]",
    label: (e) => e.eventType.replace(/\./g, " → "),
  },
};

export function ActivityEvent({ event }: ActivityEventProps) {
  const cfg = eventConfig[event.eventType] ?? eventConfig.default;
  const Icon = cfg.icon;

  return (
    <div className="flex gap-3 py-2.5">
      <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full", cfg.color)}>
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] leading-[21px] text-[var(--app-ink)]">
          {cfg.label(event)}
        </p>

      </div>
      <time
        dateTime={event.createdAt}
        className="shrink-0 text-[12px] leading-[21px] text-[var(--app-muted)]"
      >
        {formatRelativeTime(event.createdAt)}
      </time>
    </div>
  );
}
