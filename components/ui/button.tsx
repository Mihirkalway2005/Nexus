"use client";

import React from "react"
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { playHardwareClick } from "@/lib/audio-feedback"

const buttonVariants = cva(
  "group/button relative inline-flex shrink-0 items-center justify-center rounded-md border text-xs font-mono font-semibold tracking-wider uppercase whitespace-nowrap transition-all duration-100 outline-none select-none focus-visible:ring-1 focus-visible:ring-zinc-400 active:translate-y-[1px] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "border-white/80 bg-zinc-100 text-zinc-950 hover:bg-white hover:border-white shadow-[0_1px_0_0_rgba(255,255,255,0.4)_inset,0_2px_6px_rgba(0,0,0,0.6)]",
        outline:
          "border-zinc-800 bg-[#111114] text-zinc-200 hover:bg-zinc-800 hover:border-zinc-700 hover:text-white shadow-[0_1px_0_0_rgba(255,255,255,0.06)_inset,0_2px_4px_rgba(0,0,0,0.5)]",
        secondary:
          "border-zinc-700 bg-zinc-800 text-zinc-100 hover:bg-zinc-700 hover:border-zinc-600 shadow-[0_1px_0_0_rgba(255,255,255,0.08)_inset]",
        ghost:
          "border-transparent text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-100 active:translate-y-0",
        destructive:
          "border-rose-900/60 bg-rose-950/40 text-rose-300 hover:bg-rose-900/60 hover:border-rose-700 shadow-[0_1px_0_0_rgba(244,63,94,0.2)_inset]",
        link: "border-transparent text-zinc-300 underline-offset-4 hover:underline active:translate-y-0",
      },
      size: {
        default: "h-8 px-3 gap-1.5",
        xs: "h-6 px-2 text-[10px] gap-1",
        sm: "h-7 px-2.5 text-[11px] gap-1",
        lg: "h-10 px-5 text-xs gap-2",
        icon: "size-8 p-0",
        "icon-xs": "size-6 p-0",
        "icon-sm": "size-7 p-0",
        "icon-lg": "size-9 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends ButtonPrimitive.Props,
    VariantProps<typeof buttonVariants> {
  indicator?: "emerald" | "amber" | "rose" | "zinc";
  indicatorPulse?: boolean;
}

function Button({
  className,
  variant = "default",
  size = "default",
  indicator,
  indicatorPulse = false,
  onClick,
  children,
  ...props
}: ButtonProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    playHardwareClick();
    if (onClick) (onClick as (event: React.MouseEvent<HTMLButtonElement>) => void)(e);
  };

  const indicatorColors = {
    emerald: "bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.9)]",
    amber: "bg-amber-400 shadow-[0_0_5px_rgba(251,191,36,0.9)]",
    rose: "bg-rose-400 shadow-[0_0_5px_rgba(251,113,133,0.9)]",
    zinc: "bg-zinc-400 shadow-[0_0_5px_rgba(161,161,170,0.6)]",
  };

  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      onClick={handleClick}
      {...props}
    >
      {indicator && (
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full mr-1 shrink-0",
            indicatorColors[indicator],
            indicatorPulse && "animate-pulse"
          )}
        />
      )}
      {children}
    </ButtonPrimitive>
  )
}

export { Button, buttonVariants }
