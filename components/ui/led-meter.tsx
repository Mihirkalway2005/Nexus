"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface LedMeterProps {
  value: number; // 0 to 100
  totalSegments?: number;
  segments?: number;
  mode?: "standard" | "attendance" | "budget" | "mono";
  className?: string;
  showTicks?: boolean;
  label?: string;
  showValue?: boolean;
}

export function LedMeter({
  value,
  totalSegments,
  segments,
  mode = "standard",
  className,
  label,
  showValue = false,
}: LedMeterProps) {
  const count = segments || totalSegments || 12;
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  const activeCount = Math.round((clamped / 100) * count);

  return (
    <div className={cn("flex flex-col gap-1 select-none", className)}>
      {label && (
        <div className="flex items-center justify-between text-[9px] font-mono text-zinc-500 uppercase tracking-wider">
          <span>{label}</span>
          {showValue && <span className="text-zinc-300 font-bold">{clamped}%</span>}
        </div>
      )}
      <div className="flex items-center gap-[3px] py-0.5">
        {Array.from({ length: count }).map((_, i) => {
          const isActive = i < activeCount;
          const segmentRatio = (i + 1) / count;

        let activeColor = "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]";
        let inactiveColor = "bg-zinc-800/80";

        if (mode === "attendance") {
          // In attendance, low is bad (red), medium is warning (amber), high is good (emerald)
          if (segmentRatio <= 0.6) {
            activeColor = "bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.8)]";
          } else if (segmentRatio <= 0.75) {
            activeColor = "bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]";
          } else {
            activeColor = "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]";
          }
        } else if (mode === "budget") {
          // In budget, low is fine (emerald), 75%+ is warning (amber), 90%+ is critical (red)
          if (segmentRatio <= 0.65) {
            activeColor = "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]";
          } else if (segmentRatio <= 0.85) {
            activeColor = "bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]";
          } else {
            activeColor = "bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.8)]";
          }
        } else if (mode === "mono") {
          activeColor = "bg-zinc-200 shadow-[0_0_6px_rgba(255,255,255,0.7)]";
          inactiveColor = "bg-zinc-800/60";
        }

        return (
          <div
            key={i}
            className={cn(
              "h-2.5 flex-1 rounded-[1.5px] transition-all duration-300",
              isActive ? activeColor : inactiveColor
            )}
          />
        );
      })}
      </div>
    </div>
  );
}
