"use client";

import React from "react";
import { Mail, RefreshCw, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { cn, formatRelativeTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { Integration } from "@/lib/types";

interface IntegrationCardProps {
  integration: Integration;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onReconnect?: () => void;
}

const providerMeta: Record<
  string,
  { name: string; description: string; icon: React.ElementType }
> = {
  gmail: {
    name: "Gmail",
    description: "Ingest job alerts, recruiter messages, and send applications via your connected account.",
    icon: Mail,
  },
  resume_provider: {
    name: "Resume Provider",
    description: "External CV generation and tailoring service. Produces ATS-optimized resumes.",
    icon: RefreshCw,
  },
};

const statusConfig: Record<
  string,
  { icon: React.ElementType; color: string; label: string }
> = {
  connected: { icon: CheckCircle2, color: "text-[var(--app-secondary)]", label: "Connected" },
  disconnected: { icon: XCircle, color: "text-[var(--app-muted)]", label: "Disconnected" },
  error: { icon: AlertCircle, color: "text-[var(--app-danger)]", label: "Error" },
  syncing: { icon: RefreshCw, color: "text-[var(--app-action)]", label: "Syncing" },
};

export function IntegrationCard({
  integration,
  onConnect,
  onDisconnect,
  onReconnect,
}: IntegrationCardProps) {
  const meta = providerMeta[integration.provider];
  const status = statusConfig[integration.status];
  const StatusIcon = status.icon;
  const ProviderIcon = meta.icon;
  const isConnected = integration.status === "connected" || integration.status === "syncing";

  return (
    <div className="rounded-[10px] border border-[var(--app-line)] bg-[var(--app-surface)] p-5">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] bg-[var(--app-subtle)]">
          <ProviderIcon className="h-5 w-5 text-[var(--app-secondary)]" aria-hidden="true" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3 mb-1">
            <p className="text-[15px] font-[600] leading-[22px] text-[var(--app-ink)]">{meta.name}</p>
            <div className={cn("flex items-center gap-1.5 text-[13px] font-[500]", status.color)}>
              <StatusIcon
                className={cn("h-4 w-4", integration.status === "syncing" && "animate-spin")}
                aria-hidden="true"
              />
              <span>{status.label}</span>
            </div>
          </div>

          <p className="text-[14px] leading-[21px] text-[var(--app-secondary)] mb-3">{meta.description}</p>

          {integration.email && (
            <p className="text-[13px] text-[var(--app-muted)] mb-1">
              Connected as <strong className="text-[var(--app-ink)]">{integration.email}</strong>
            </p>
          )}

          {integration.lastSyncAt && (
            <p className="text-[13px] text-[var(--app-muted)] mb-3">
              Last synced {formatRelativeTime(integration.lastSyncAt)}
            </p>
          )}

          {integration.scopes.length > 0 && (
            <div className="mb-3">
              <p className="text-[12px] font-[500] uppercase tracking-wider text-[var(--app-muted)] mb-1.5">
                Permissions
              </p>
              <div className="flex flex-wrap gap-1">
                {integration.scopes.map((s) => (
                  <span
                    key={s}
                    className="rounded-[6px] border border-[var(--app-line)] bg-[var(--app-subtle)] px-2 py-0.5 text-[12px] text-[var(--app-secondary)]"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            {!isConnected && (
              <Button variant="primary" size="sm" onClick={onConnect}>
                Connect {meta.name}
              </Button>
            )}
            {integration.status === "error" && (
              <Button variant="primary" size="sm" onClick={onReconnect}>
                Reconnect
              </Button>
            )}
            {isConnected && (
              <Button variant="secondary" size="sm" onClick={onDisconnect}>
                Disconnect
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
