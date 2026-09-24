"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface HardwareCardProps extends React.HTMLAttributes<HTMLDivElement> {
  refId?: string;
  badge?: string;
  statusText?: string;
  badgeVariant?: "emerald" | "amber" | "rose" | "zinc";
  title?: string;
  label?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}

export function HardwareCard({
  refId,
  badge,
  statusText,
  badgeVariant = "zinc",
  title,
  label,
  action,
  children,
  className,
  ...props
}: HardwareCardProps) {
  const displayTitle = title || label;
  const displayBadge = badge || statusText;
  const badgeStyles = {
    emerald: "text-emerald-400 bg-emerald-950/40 border-emerald-500/30",
    amber: "text-amber-400 bg-amber-950/40 border-amber-500/30",
    rose: "text-rose-400 bg-rose-950/40 border-rose-500/30",
    zinc: "text-zinc-400 bg-zinc-900 border-zinc-700",
  }[badgeVariant];

  return (
    <div
      className={cn(
        "relative rounded-md border border-zinc-800 bg-[#0c0c0e] shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_8px_32px_-4px_rgba(0,0,0,0.8)] transition-all",
        className
      )}
      {...props}
    >
      {/* 4 Corner Crosshairs */}
      <span className="pointer-events-none absolute top-1 left-1 font-mono text-[9px] text-zinc-700 select-none leading-none">
        +
      </span>
      <span className="pointer-events-none absolute top-1 right-1 font-mono text-[9px] text-zinc-700 select-none leading-none">
        +
      </span>
      <span className="pointer-events-none absolute bottom-1 left-1 font-mono text-[9px] text-zinc-700 select-none leading-none">
        +
      </span>
      <span className="pointer-events-none absolute bottom-1 right-1 font-mono text-[9px] text-zinc-700 select-none leading-none">
        +
      </span>

      {/* Header bar if title or refId present */}
      {(displayTitle || refId || displayBadge || action) && (
        <div className="flex items-center justify-between border-b border-zinc-800/80 px-4 py-2.5">
          <div className="flex items-center gap-2">
            {refId && (
              <span className="font-mono text-[10px] tracking-wider text-zinc-500 select-none uppercase">
                {refId}
              </span>
            )}
            {refId && displayTitle && <span className="text-zinc-700 font-mono text-xs">/</span>}
            {displayTitle && (
              <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-zinc-200">
                {displayTitle}
              </h3>
            )}
          </div>

          <div className="flex items-center gap-2">
            {displayBadge && (
              <span
                className={cn(
                  "font-mono text-[10px] px-2 py-0.5 rounded border uppercase tracking-wider",
                  badgeStyles
                )}
              >
                {displayBadge}
              </span>
            )}
            {action}
          </div>
        </div>
      )}

      {/* Content Container */}
      <div className="p-4">{children}</div>
    </div>
  );
}
