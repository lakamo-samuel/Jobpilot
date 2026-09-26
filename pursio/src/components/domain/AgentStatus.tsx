"use client";

import React from "react";
import { Activity, AlertTriangle, Pause, Play, WifiOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { AgentStatus as AgentStatusType } from "@/lib/types";

interface AgentStatusProps {
  status: AgentStatusType;
  lastSyncAt?: string;
  queueDepth?: number;
  collapsed?: boolean;
  onPause?: () => void;
  onResume?: () => void;
}

const statusConfig: Record<
  AgentStatusType,
  { label: string; icon: React.ElementType; color: string; pulse?: boolean }
> = {
  running: {
    label: "Running",
    icon: Activity,
    color: "text-[var(--app-accent)]",
    pulse: true,
  },
  processing: {
    label: "Processing",
    icon: Loader2,
    color: "text-[var(--app-action)]",
    pulse: true,
  },
  paused: {
    label: "Paused",
    icon: Pause,
    color: "text-[var(--app-muted)]",
  },
  attention: {
    label: "Attention",
    icon: AlertTriangle,
    color: "text-[var(--app-warning)]",
  },
  error: {
    label: "Error",
    icon: WifiOff,
    color: "text-[var(--app-danger)]",
  },
  offline: {
    label: "Offline",
    icon: WifiOff,
    color: "text-[var(--app-muted)]",
  },
};

function formatLastSync(isoStr?: string): string {
  if (!isoStr) return "Never";
  const diff = Date.now() - new Date(isoStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(diff / 3_600_000);
  return `${hours}h ago`;
}

export function AgentStatus({
  status,
  lastSyncAt,
  queueDepth,
  collapsed = false,
  onPause,
  onResume,
}: AgentStatusProps) {
  const cfg = statusConfig[status];
  const Icon = cfg.icon;
  const isPaused = status === "paused";

  if (collapsed) {
    return (
      <div className="flex justify-center px-2 py-3">
        <div className={cn("relative", cfg.color)}>
          <Icon
            className={cn("h-5 w-5", cfg.pulse && status === "processing" && "animate-spin")}
            aria-label={`Agent ${cfg.label}`}
          />
          {cfg.pulse && status === "running" && (
            <span className="absolute -right-0.5 -top-0.5 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--app-subtle)] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--app-subtle)]" />
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[10px] border border-[var(--app-line)] bg-[var(--app-canvas)] p-3 shadow-[0_1px_2px_rgba(24,24,27,0.03)]">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className={cn("relative shrink-0", cfg.color)}>
            <Icon
              className={cn(
                "h-4 w-4",
                status === "processing" && "animate-spin"
              )}
              aria-hidden="true"
            />
            {status === "running" && (
              <span className="absolute -right-0.5 -top-0.5 flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--app-subtle)] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--app-subtle)]" />
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p className={cn("text-[13px] font-[600] leading-[18px]", cfg.color)}>
              {cfg.label}
            </p>
            <p className="text-[12px] leading-[16px] text-[var(--app-muted)]">
              Synced {formatLastSync(lastSyncAt)}
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={isPaused ? onResume : onPause}
          aria-label={isPaused ? "Resume Pursio" : "Pause Pursio"}
          title={isPaused ? "Resume Pursio" : "Pause Pursio"}
          className="shrink-0"
        >
          {isPaused ? (
            <Play className="h-3.5 w-3.5" />
          ) : (
            <Pause className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>

      {queueDepth !== undefined && queueDepth > 0 && (
        <p className="mt-1.5 text-[12px] leading-[16px] text-[var(--app-muted)]">
          {queueDepth} item{queueDepth !== 1 ? "s" : ""} in queue
        </p>
      )}
    </div>
  );
}
