"use client";

import { LogoMarquee } from "@/components/landing/ui/logo-marquee";

const logos = [
  { name: "Acme" },
  { name: "Lumen" },
  { name: "Orbit" },
  { name: "Noria" },
  { name: "Quanta" },
  { name: "Vertex" },
  { name: "Polar" },
  { name: "Kairos" },
  { name: "Teranga" },
  { name: "Baobab" },
  { name: "Ndakaru" },
  { name: "Sahel.co" },
];

export function LogoTickerSection() {
  return (
    <section className="border-y border-border/50 bg-muted/20 py-12">
      <div className="mx-auto max-w-7xl px-6">
        <p className="mb-8 text-center font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          Ils ont unifié leurs WhatsApp avec Jokko
        </p>
        <LogoMarquee logos={logos} speed="slow" />
      </div>
    </section>
  );
}
