"use client";

import { motion } from "framer-motion";
import {
  Inbox,
  UserPlus,
  Sparkles,
  Zap,
  FileText,
  Radio,
  ArrowRight,
} from "lucide-react";
import { MagicCard } from "@/components/landing/ui/magic-card";
import { cn } from "@/lib/utils";

export function BentoSection() {
  return (
    <section className="relative py-28 md:py-36">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--accent)]">
            Tout ce qu&apos;il vous faut
          </p>
          <h2 className="mt-4 font-display text-4xl font-bold tracking-tight md:text-6xl">
            Une plateforme. Tout pour WhatsApp.
          </h2>
          <p className="mt-5 text-lg text-muted-foreground">
            De la première connexion au reporting, Jokko remplace 5 outils.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-4 md:grid-cols-6 md:gap-5 lg:grid-cols-6">
          <BentoCard className="md:col-span-4" hue="violet">
            <InboxFeature />
          </BentoCard>
          <BentoCard className="md:col-span-2">
            <AssignFeature />
          </BentoCard>
          <BentoCard className="md:col-span-2" hue="violet">
            <AiFeature />
          </BentoCard>
          <BentoCard className="md:col-span-2">
            <FlowsFeature />
          </BentoCard>
          <BentoCard className="md:col-span-2">
            <TemplatesFeature />
          </BentoCard>
          <BentoCard className="md:col-span-6" hue="violet">
            <RealtimeFeature />
          </BentoCard>
        </div>
      </div>
    </section>
  );
}

function BentoCard({
  children,
  className,
  hue,
}: {
  children: React.ReactNode;
  className?: string;
  hue?: "violet";
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={cn("relative min-h-[280px]", className)}
    >
      <MagicCard
        className={cn(
          "h-full",
          hue === "violet" && "bg-gradient-to-br from-[var(--accent-muted)] to-card"
        )}
        gradientColor={hue === "violet" ? "var(--accent-glow)" : "var(--accent-glow)"}
      >
        {children}
      </MagicCard>
    </motion.div>
  );
}

function BentoHeader({
  icon: Icon,
  eyebrow,
  title,
  description,
}: {
  icon: typeof Inbox;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col gap-2 p-6 md:p-8">
      <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-background/80 text-[var(--accent)] shadow-sm backdrop-blur">
        <Icon className="h-4 w-4" />
      </div>
      <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {eyebrow}
      </p>
      <h3 className="font-display text-2xl font-bold tracking-tight">{title}</h3>
      <p className="max-w-md text-[14px] leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

function InboxFeature() {
  return (
    <>
      <BentoHeader
        icon={Inbox}
        eyebrow="Inbox unifiée"
        title="Une seule inbox pour tous vos numéros."
        description="Plus besoin de jongler entre 3 téléphones. Toutes vos conversations WhatsApp Business dans une vue centralisée, avec filtres, tags et recherche full-text."
      />
      <div className="relative mt-2 px-8 pb-8">
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="flex flex-1 items-center gap-2 rounded-xl border border-border/60 bg-background/80 px-3 py-2 backdrop-blur"
            >
              <div
                className={cn(
                  "h-6 w-6 rounded-full bg-gradient-to-br text-[9px] font-semibold text-white",
                  ["from-rose-400 to-rose-600", "from-sky-400 to-sky-600", "from-amber-400 to-amber-600"][i],
                  "flex items-center justify-center"
                )}
              >
                {["AD", "MS", "CF"][i]}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[10px] font-semibold">
                  {["Aïssatou", "Moussa", "Coumba"][i]}
                </p>
                <p className="truncate text-[9px] text-muted-foreground">
                  {["Ma commande…", "Merci pour le…", "Changer de taille…"][i]}
                </p>
              </div>
              <div className="flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-[var(--accent)] px-1 text-[8px] font-bold text-white">
                {[2, 1, 3][i]}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function AssignFeature() {
  return (
    <>
      <BentoHeader
        icon={UserPlus}
        eyebrow="Assignation"
        title="Chacun sa conversation."
        description="Règles d'attribution automatiques, round-robin, ou manuel. Les agents voient uniquement ce qui leur est attribué."
      />
      <div className="mt-2 px-8 pb-8">
        <div className="flex -space-x-2">
          {[
            "from-rose-400 to-rose-600",
            "from-sky-400 to-sky-600",
            "from-amber-400 to-amber-600",
            "from-emerald-400 to-emerald-600",
          ].map((g, i) => (
            <div
              key={i}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br ring-2 ring-card text-[10px] font-semibold text-white",
                g
              )}
            >
              {["F", "M", "K", "N"][i]}
            </div>
          ))}
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border/60 bg-background text-[10px] font-semibold ring-2 ring-card">
            +3
          </div>
        </div>
      </div>
    </>
  );
}

function AiFeature() {
  return (
    <>
      <BentoHeader
        icon={Sparkles}
        eyebrow="IA Copilot"
        title="Jo rédige, vous validez."
        description="L'IA comprend le ton de votre marque et l'historique du client. Vous gagnez 10× en vitesse sans perdre en qualité."
      />
      <div className="mt-2 px-8 pb-8">
        <div className="rounded-xl border border-[var(--accent)]/30 bg-background/80 p-3 backdrop-blur">
          <div className="mb-1 flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-[var(--accent)]" />
            <span className="text-[9px] font-semibold uppercase tracking-wider text-[var(--accent)]">
              Suggéré · 92%
            </span>
          </div>
          <p className="text-[11px] leading-relaxed">
            Bonjour Aïssatou 👋 votre commande est partie hier soir…
          </p>
        </div>
      </div>
    </>
  );
}

function FlowsFeature() {
  return (
    <>
      <BentoHeader
        icon={Zap}
        eyebrow="Flows"
        title="Automatisez l'avant-vente."
        description="Qualifiez, redirigez, prenez RDV. Drag & drop visuel."
      />
      <div className="mt-2 flex items-center gap-1.5 px-8 pb-8">
        <FlowNode label="Déclencheur" />
        <ArrowRight className="h-3 w-3 text-muted-foreground" />
        <FlowNode label="Condition" />
        <ArrowRight className="h-3 w-3 text-muted-foreground" />
        <FlowNode label="Action" active />
      </div>
    </>
  );
}

function FlowNode({ label, active }: { label: string; active?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-lg border px-2 py-1 text-[9px] font-semibold",
        active
          ? "border-[var(--accent)] bg-[var(--accent)] text-white"
          : "border-border/60 bg-background/80 text-muted-foreground backdrop-blur"
      )}
    >
      {label}
    </div>
  );
}

function TemplatesFeature() {
  return (
    <>
      <BentoHeader
        icon={FileText}
        eyebrow="Templates Meta"
        title="Templates approuvés."
        description="Créez, soumettez, utilisez — tout depuis Jokko. Synchro Meta en temps réel."
      />
      <div className="mt-2 flex flex-wrap gap-1.5 px-8 pb-8">
        {["Bienvenue", "Commande", "Livraison", "Promo", "Relance"].map((t) => (
          <div
            key={t}
            className="rounded-full border border-border/60 bg-background/80 px-2 py-0.5 text-[10px] font-medium backdrop-blur"
          >
            {t}
          </div>
        ))}
        <div className="rounded-full border border-emerald-500/30 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
          +23 approuvés
        </div>
      </div>
    </>
  );
}

function RealtimeFeature() {
  return (
    <div className="flex flex-col items-center gap-8 p-8 md:flex-row md:gap-12 md:p-12">
      <div className="flex-1">
        <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-background/80 text-[var(--accent)] shadow-sm backdrop-blur">
          <Radio className="h-4 w-4" />
        </div>
        <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Temps réel
        </p>
        <h3 className="mt-2 font-display text-3xl font-bold tracking-tight md:text-4xl">
          Synchronisation instantanée. Zéro refresh.
        </h3>
        <p className="mt-4 max-w-xl text-[14px] leading-relaxed text-muted-foreground">
          Convex propulse Jokko : chaque message, chaque assignation, chaque
          changement se propage à toute l&apos;équipe en moins de 100ms. Pas de
          polling, pas de doublons.
        </p>
      </div>
      <div className="relative flex flex-1 items-center justify-center">
        <div className="relative h-48 w-48">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute inset-[25%] rounded-full border border-[var(--accent)]/40"
              initial={{ scale: 1, opacity: 0 }}
              animate={{ scale: [1, 1.2, 2.6], opacity: [0, 0.55, 0] }}
              transition={{
                duration: 3.6,
                repeat: Infinity,
                ease: [0.22, 1, 0.36, 1],
                delay: i * 1.2,
                times: [0, 0.25, 1],
              }}
            />
          ))}
          <motion.div
            className="absolute inset-[25%] flex items-center justify-center rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent-hover)] shadow-[0_20px_60px_-10px_var(--accent-glow)]"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: [0.4, 0, 0.2, 1] }}
          >
            <Radio className="h-8 w-8 text-white" />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
