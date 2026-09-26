"use client";

import React from "react";
import { FileText, Star, Clock, MoreVertical } from "lucide-react";
import { cn, formatRelativeTime, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { CV } from "@/lib/types";

interface CVCardProps {
  cv: CV;
  onSetDefault?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function CVCard({ cv, onSetDefault, onDelete }: CVCardProps) {
  return (
    <div
      className={cn(
        "rounded-[10px] border bg-[var(--app-surface)] p-4",
        cv.isDefault ? "border-[var(--app-action)] ring-1 ring-[var(--app-action)]/20" : "border-[var(--app-line)]"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] bg-[var(--app-subtle)]">
          <FileText className="h-5 w-5 text-[var(--app-action)]" aria-hidden="true" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-[14px] font-[600] leading-[21px] text-[var(--app-ink)] truncate">{cv.label}</p>
            {cv.isDefault && (
              <Badge variant="brand" className="flex items-center gap-0.5">
                <Star className="h-2.5 w-2.5" />
                Default
              </Badge>
            )}
            {cv.status === "parsing" && (
              <Badge variant="info">Parsing…</Badge>
            )}
            {cv.status === "error" && (
              <Badge variant="danger">Parse error</Badge>
            )}
          </div>
          <p className="text-[13px] leading-[18px] text-[var(--app-muted)] truncate">{cv.fileName}</p>
          <p className="text-[12px] leading-[16px] text-[var(--app-muted)] mt-0.5">
            v{cv.version} · Uploaded {formatDate(cv.uploadedAt)}
          </p>

          <p className="mt-2 text-[13px] leading-[18px] text-[var(--app-secondary)]">{cv.roleFocus}</p>

          <div className="mt-2 flex flex-wrap gap-1">
            {cv.skills.slice(0, 5).map((s) => (
              <span
                key={s}
                className="rounded-[6px] border border-[var(--app-line)] bg-[var(--app-subtle)] px-1.5 py-0.5 text-[12px] text-[var(--app-secondary)]"
              >
                {s}
              </span>
            ))}
            {cv.skills.length > 5 && (
              <span className="text-[12px] text-[var(--app-muted)] self-center">+{cv.skills.length - 5}</span>
            )}
          </div>

          <div className="mt-3 flex items-center gap-4 text-[12px] text-[var(--app-muted)]">
            <span>Used {cv.usageCount}×</span>
            {cv.lastUsed && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Last used {formatRelativeTime(cv.lastUsed)}
              </span>
            )}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="CV options">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {!cv.isDefault && (
              <DropdownMenuItem onClick={() => onSetDefault?.(cv.id)}>
                <Star className="h-4 w-4" />
                Set as default
              </DropdownMenuItem>
            )}
            <DropdownMenuItem>Edit label</DropdownMenuItem>
            <DropdownMenuItem>Upload new version</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem danger onClick={() => onDelete?.(cv.id)}>
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
