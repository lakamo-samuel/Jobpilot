"use client";

import React, { useState } from "react";
import { mockAuditEvents } from "@/lib/mock-data";
import { ActivityEvent } from "@/components/domain/ActivityEvent";
import { cn } from "@/lib/utils";
import type { AuditEvent } from "@/lib/types";

const eventTypeFilters = [
  { value: "ALL", label: "All" },
  { value: "opportunity", label: "Opportunities" },
  { value: "application", label: "Applications" },
  { value: "reply", label: "Replies" },
  { value: "gmail", label: "Gmail" },
];

function groupByDay(events: AuditEvent[]): Array<{ label: string; events: AuditEvent[] }> {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const groups: Record<string, AuditEvent[]> = {};

  for (const event of events) {
    const d = new Date(event.createdAt);
    let key: string;
    if (d.toDateString() === today.toDateString()) key = "Today";
    else if (d.toDateString() === yesterday.toDateString()) key = "Yesterday";
    else
      key = d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });

    if (!groups[key]) groups[key] = [];
    groups[key].push(event);
  }

  return Object.entries(groups).map(([label, events]) => ({ label, events }));
}

export default function ActivityPage() {
  const [filter, setFilter] = useState("ALL");

  const filtered =
    filter === "ALL"
      ? mockAuditEvents
      : mockAuditEvents.filter((e) => e.eventType.startsWith(filter));

  const grouped = groupByDay(filtered);

  return (
    <div className="workspace-page !max-w-[980px]">
      <div className="mb-6">
        <h1 className="text-[24px] font-[600] leading-[32px] text-[var(--app-ink)]">Activity</h1>
        <p className="text-[14px] leading-[21px] text-[var(--app-muted)]">
          A sample history of discoveries, decisions, and conversations.
        </p>
      </div>

      {/* Filters */}
      <div className="mb-5 flex items-center gap-1 flex-wrap">
        {eventTypeFilters.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            aria-pressed={filter === f.value}
            className={cn(
              "rounded-[6px] px-3 py-1.5 text-[13px] font-[500] transition-colors",
              filter === f.value
                ? "bg-[var(--app-subtle)] text-[var(--app-action)]"
                : "text-[var(--app-muted)] hover:bg-[var(--app-subtle)] hover:text-[var(--app-ink)]"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-[10px] border border-[var(--app-line)] bg-[var(--app-surface)] p-8 text-center">
          <p className="text-[14px] text-[var(--app-muted)]">No activity matches this filter.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {grouped.map((group) => (
            <section key={group.label} aria-labelledby={`group-${group.label}`}>
              <h2
                id={`group-${group.label}`}
                className="mb-2 text-[12px] font-[500] uppercase tracking-wider text-[var(--app-muted)]"
              >
                {group.label}
              </h2>
              <div className="rounded-[10px] border border-[var(--app-line)] bg-[var(--app-surface)] divide-y divide-[var(--app-line)]">
                {group.events.map((event) => (
                  <div key={event.id} className="px-4">
                    <ActivityEvent event={event} />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
