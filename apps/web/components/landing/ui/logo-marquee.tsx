"use client";

import { cn } from "@/lib/utils";

interface LogoMarqueeProps {
  logos: { name: string; svg?: React.ReactNode }[];
  speed?: "slow" | "normal" | "fast";
  className?: string;
}

export function LogoMarquee({ logos, speed = "slow", className }: LogoMarqueeProps) {
  const duration = speed === "slow" ? "60s" : speed === "normal" ? "40s" : "25s";

  return (
    <div
      className={cn(
        "group relative flex w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]",
        className
      )}
    >
      {[0, 1].map((i) => (
        <div
          key={i}
          className="flex shrink-0 items-center gap-16 pr-16"
          style={{
            animation: `marquee ${duration} linear infinite`,
            animationPlayState: "running",
          }}
          aria-hidden={i === 1}
        >
          {logos.map((logo, idx) => (
            <LogoPlaceholder key={`${i}-${idx}`} name={logo.name}>
              {logo.svg}
            </LogoPlaceholder>
          ))}
        </div>
      ))}
    </div>
  );
}

function LogoPlaceholder({ name, children }: { name: string; children?: React.ReactNode }) {
  if (children) {
    return (
      <div className="flex h-8 items-center text-muted-foreground/60 transition-colors hover:text-foreground">
        {children}
      </div>
    );
  }
  return (
    <div className="flex h-8 items-center whitespace-nowrap font-display text-2xl font-semibold tracking-tight text-muted-foreground/50 transition-colors hover:text-foreground">
      {name}
    </div>
  );
}
