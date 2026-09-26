"use client";

import React from "react";
import {
  MessageSquare,
  CheckCircle2,
  Info,
  WifiOff,
  ArrowRight,
} from "lucide-react";
import { cn, formatRelativeTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { AttentionItem } from "@/lib/types";

interface AttentionCardProps {
  item: AttentionItem;
  onAction?: (item: AttentionItem) => void;
}

const urgencyConfig: Record<
  string,
  { icon: React.ElementType; color: string; border: string; label: string }
> = {
  reply_interview: {
    icon: MessageSquare,
    color: "text-[var(--app-secondary)]",
    border: "border-l-green-500",
    label: "Reply / Interview",
  },
  approval_required: {
    icon: CheckCircle2,
    color: "text-[var(--app-action)]",
    border: "border-l-[var(--app-action)]",
    label: "Approval required",
  },
  missing_info: {
    icon: Info,
    color: "text-[var(--app-secondary)]",
    border: "border-l-amber-500",
    label: "Missing information",
  },
  integration_problem: {
    icon: WifiOff,
    color: "text-[var(--app-danger)]",
    border: "border-l-[var(--app-danger)]",
    label: "Integration issue",
  },
};

export function AttentionCard({ item, onAction }: AttentionCardProps) {
  const cfg = urgencyConfig[item.urgency] ?? urgencyConfig.missing_info;
  const Icon = cfg.icon;

  return (
    <div
      className={cn(
        "rounded-[12px] border border-[var(--app-line)] bg-[var(--app-surface)] p-4 border-l-4 shadow-[0_1px_2px_rgba(24,24,27,0.03)] transition-shadow hover:shadow-[0_6px_18px_rgba(24,24,27,0.06)]",
        cfg.border
      )}
      role="article"
      aria-label={item.title}
    >
      <div className="flex items-start gap-3">
        <div className={cn("mt-0.5 shrink-0", cfg.color)}>
          <Icon className="h-4 w-4" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <p className="text-[14px] font-[600] leading-[21px] text-[var(--app-ink)]">{item.title}</p>
            <time
              dateTime={item.createdAt}
              className="shrink-0 text-[12px] leading-[16px] text-[var(--app-muted)]"
            >
              {formatRelativeTime(item.createdAt)}
            </time>
          </div>
          <p className="text-[14px] leading-[21px] text-[var(--app-secondary)] mb-3">{item.description}</p>
          <Button
            variant="brand"
            size="sm"
            onClick={() => onAction?.(item)}
            className="gap-1.5"
          >
            {item.action}
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
