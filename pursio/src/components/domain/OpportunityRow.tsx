"use client";

import React from "react";
import { MapPin, AlertCircle } from "lucide-react";
import { cn, formatRelativeTime, opportunityStatusColor, truncate } from "@/lib/utils";
import { MatchScore } from "./MatchScore";
import type { Opportunity } from "@/lib/types";

interface OpportunityRowProps {
  opportunity: Opportunity;
  isSelected?: boolean;
  onClick?: () => void;
}

const typeLabel: Record<string, string> = {
  JOB: "Job",
  CLIENT: "Client",
  INBOUND: "Inbound",
};

const statusLabel: Record<string, string> = {
  NEW: "New",
  QUALIFIED: "Qualified",
  SKIPPED: "Skipped",
  PREPARED: "Prepared",
  PENDING_APPROVAL: "Pending approval",
  APPLIED: "Applied",
  CONTACTED: "Contacted",
  REPLIED: "Replied",
  INTERVIEW: "Interview",
  INTERESTED: "Interested",
  OFFER: "Offer",
  WON: "Won",
  REJECTED: "Rejected",
  LOST: "Lost",
  CLOSED: "Closed",
};

export function OpportunityRow({ opportunity, isSelected, onClick }: OpportunityRowProps) {
  const { companyName, title, type, source, status, match, updatedAt, location, workMode, requiresAttention } = opportunity;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group w-full text-left px-4 py-3.5 border-b border-[var(--app-line)] transition-colors",
        "hover:bg-[var(--app-canvas)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[var(--app-action)]",
        isSelected
          ? "bg-[var(--app-subtle)] border-l-2 border-l-[var(--app-action)]"
          : "bg-[var(--app-surface)]",
        requiresAttention && !isSelected && "bg-[var(--app-subtle)]"
      )}
      aria-current={isSelected ? "true" : undefined}
    >
      <div className="flex items-center gap-3">
        {/* Company initial */}
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-[var(--app-subtle)] text-[14px] font-[600] text-[var(--app-secondary)]"
          aria-hidden="true"
        >
          {companyName[0].toUpperCase()}
        </div>

        {/* Main content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[14px] font-[600] leading-[21px] text-[var(--app-ink)] truncate">
              {companyName}
            </span>
            {requiresAttention && (
              <AlertCircle
                className="h-3.5 w-3.5 shrink-0 text-[var(--app-secondary)]"
                aria-label="Needs attention"
              />
            )}
          </div>
          <p className="text-[13px] leading-[18px] text-[var(--app-secondary)] truncate">
            {truncate(title, 60)}
          </p>
          <div className="mt-1 flex items-center gap-2 flex-wrap">
            <span className="text-[12px] text-[var(--app-muted)]">{typeLabel[type]}</span>
            <span className="text-[var(--app-line-strong)]" aria-hidden="true">·</span>
            <span className="text-[12px] text-[var(--app-muted)]">{source}</span>
            {location && (
              <>
                <span className="text-[var(--app-line-strong)]" aria-hidden="true">·</span>
                <span className="flex items-center gap-0.5 text-[12px] text-[var(--app-muted)]">
                  <MapPin className="h-3 w-3" aria-hidden="true" />
                  {workMode === "remote" ? "Remote" : location}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Right side */}
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          {match && (
            <MatchScore match={match} size="compact" showExplanation={false} />
          )}
          <span
            className={cn(
              "inline-flex rounded-[6px] border px-1.5 py-0.5 text-[12px] font-[500] leading-[16px]",
              opportunityStatusColor(status)
            )}
          >
            {statusLabel[status] ?? status}
          </span>
          <span className="text-[12px] leading-[16px] text-[var(--app-muted)]">
            {formatRelativeTime(updatedAt)}
          </span>
        </div>
      </div>
    </button>
  );
}
