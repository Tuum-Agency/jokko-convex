"use client";

import { motion } from "framer-motion";
import { BigNumber } from "@/components/landing/ui/big-number";
import { cn } from "@/lib/utils";
import { X, Check } from "lucide-react";

export function BeforeAfterSection() {
  return (
    <section className="relative overflow-hidden bg-[var(--surface-dark)] py-28 text-[var(--surface-dark-foreground)] md:py-36">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.9) 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 left-1/2 h-[500px] w-[900px] -translate-x-1/2 opacity-30 blur-[140px]"
        style={{ background: "radial-gradient(ellipse, var(--accent-glow) 0%, transparent 60%)" }}
      />

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--accent)]">
            Avant / Après
          </p>
          <h2 className="mt-4 font-display text-4xl font-bold tracking-tight text-white md:text-6xl">
            De 3 téléphones au chaos à 1 inbox calme.
          </h2>
          <p className="mt-5 text-lg text-[var(--surface-dark-muted-foreground)]">
            Ce que change Jokko pour une équipe de 5 agents qui gère 3 numéros WhatsApp.
          </p>
        </div>

        <div className="mt-20 grid gap-8 lg:grid-cols-2 lg:gap-12">
          <Panel variant="before" />
          <Panel variant="after" />
        </div>

        <div className="mt-16 grid grid-cols-2 gap-8 border-t border-white/10 pt-12 md:grid-cols-4">
          <DarkBigNumber value={82} suffix="%" label="Temps économisé" />
          <DarkBigNumber value={10} suffix="×" label="Plus de volume traité" accent />
          <DarkBigNumber value={47} suffix="s" label="Temps 1ère réponse" />
          <DarkBigNumber value={94} suffix="%" label="Taux de résolution" />
        </div>
      </div>
    </section>
  );
}

function Panel({ variant }: { variant: "before" | "after" }) {
  const isBefore = variant === "before";
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "relative overflow-hidden rounded-3xl border p-8 md:p-10",
        isBefore
          ? "border-white/10 bg-white/[0.03]"
          : "border-[var(--accent)]/30 bg-gradient-to-br from-[var(--accent-muted)]/20 to-white/[0.02]"
      )}
    >
      <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em]">
        <span
          className={cn(
            "flex h-5 w-5 items-center justify-center rounded-full",
            isBefore ? "bg-rose-500/20 text-rose-300" : "bg-emerald-500/20 text-emerald-300"
          )}
        >
          {isBefore ? <X className="h-3 w-3" /> : <Check className="h-3 w-3" />}
        </span>
        <span className={isBefore ? "text-rose-300" : "text-emerald-300"}>
          {isBefore ? "Sans Jokko" : "Avec Jokko"}
        </span>
      </div>
      <h3 className="mt-4 font-display text-2xl font-bold text-white md:text-3xl">
        {isBefore ? "3 téléphones, 5 tabs, 0 visibilité." : "1 inbox. Toute votre équipe. Tout le contexte."}
      </h3>

      <ul className="mt-8 space-y-3">
        {(isBefore ? beforeItems : afterItems).map((item, i) => (
          <li
            key={i}
            className={cn(
              "flex items-start gap-3 rounded-xl border px-4 py-3 text-sm",
              isBefore
                ? "border-white/5 bg-white/[0.02] text-white/70"
                : "border-[var(--accent)]/20 bg-white/[0.02] text-white/90"
            )}
          >
            <span
              className={cn(
                "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full",
                isBefore ? "bg-rose-500/20 text-rose-400" : "bg-emerald-500/20 text-emerald-400"
              )}
            >
              {isBefore ? <X className="h-2.5 w-2.5" /> : <Check className="h-2.5 w-2.5" />}
            </span>
            {item}
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

function DarkBigNumber({
  value,
  label,
  suffix,
  accent,
}: {
  value: number;
  label: string;
  suffix?: string;
  accent?: boolean;
}) {
  return (
    <div className="text-white">
      <BigNumber
        value={value}
        label={label}
        suffix={suffix}
        accent={accent}
        className="[&>p]:text-white/50"
      />
    </div>
  );
}

const beforeItems = [
  "Un téléphone par numéro, chacun avec son mot de passe",
  "Les agents se marchent dessus et répondent 2 fois",
  "Aucune trace des conversations passées",
  "Pas de métriques : qui a répondu ? en combien de temps ?",
  "Les nouveaux agents mettent des semaines à être opérationnels",
];

const afterItems = [
  "Tous les numéros dans une seule inbox unifiée",
  "Assignation automatique : chacun sa zone",
  "Historique, tags, CRM embarqué sur chaque contact",
  "Reporting natif : TTR, résolution, CSAT, revenu",
  "Onboarding agent en 30 min grâce à l'IA copilot",
];
