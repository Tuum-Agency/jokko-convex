"use client";

import { CountUp } from "@/components/animations/count-up";
import { cn } from "@/lib/utils";

interface BigNumberProps {
  value: number;
  label: string;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  className?: string;
  accent?: boolean;
}

export function BigNumber({
  value,
  label,
  suffix,
  prefix,
  decimals = 0,
  className,
  accent = false,
}: BigNumberProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div
        className={cn(
          "font-display text-5xl font-bold tracking-tight tabular-nums md:text-6xl lg:text-7xl",
          accent
            ? "bg-gradient-to-br from-[var(--accent)] to-[var(--accent-hover)] bg-clip-text text-transparent"
            : "text-foreground"
        )}
      >
        <CountUp to={value} suffix={suffix} prefix={prefix} decimals={decimals} />
      </div>
      <p className="text-sm uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}
