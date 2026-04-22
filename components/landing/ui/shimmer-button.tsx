"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

interface ShimmerButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?: "primary" | "ghost" | "light";
  size?: "default" | "lg";
}

export const ShimmerButton = React.forwardRef<HTMLButtonElement, ShimmerButtonProps>(
  (
    { className, children, asChild = false, variant = "primary", size = "default", ...props },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";
    const withShimmer = variant === "primary" || variant === "light";
    return (
      <Comp
        ref={ref}
        className={cn(
          "group relative inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full font-medium transition-transform duration-300 will-change-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98]",
          size === "default" ? "h-11 px-5 text-sm" : "h-13 px-7 text-base",
          variant === "primary" &&
            "bg-foreground text-background shadow-[0_8px_32px_-8px_rgba(0,0,0,0.35)] hover:-translate-y-0.5",
          variant === "light" &&
            "bg-white text-[var(--surface-dark)] shadow-[0_8px_32px_-8px_rgba(255,255,255,0.25)] hover:-translate-y-0.5",
          variant === "ghost" &&
            "border border-border bg-background/60 text-foreground backdrop-blur-sm hover:border-foreground/20 hover:bg-background",
          withShimmer &&
            "shimmer-surface overflow-hidden",
          className
        )}
        {...props}
      >
        {children}
      </Comp>
    );
  }
);
ShimmerButton.displayName = "ShimmerButton";
