"use client";

import { motion } from "framer-motion";
import {
    MessageCircle,
    Bot,
    BarChart3,
    Zap,
    CheckCircle,
    type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type DeepDive = {
    eyebrow: string;
    icon: LucideIcon;
    title: string;
    description: string;
    bullets: string[];
    visual: () => React.JSX.Element;
    reverse?: boolean;
    dark?: boolean;
};

const deepDives: DeepDive[] = [
    {
        eyebrow: "Inbox partagée",
        icon: MessageCircle,
        title: "Multi-numéros, multi-équipes, zéro chaos.",
        description:
            "Centralisez tous vos numéros WhatsApp Business, assignez selon vos règles, et donnez à chaque agent la vue dont il a besoin — ni plus, ni moins.",
        bullets: [
            "Jusqu'à 50 numéros dans une seule interface",
            "Assignation automatique round-robin, par langue ou par charge",
            "Notes internes, tags, champs custom, sous-statuts",
            "Permissions fines par rôle (owner/admin/agent)",
        ],
        visual: InboxDeepVisual,
    },
    {
        eyebrow: "Copilot IA",
        icon: Bot,
        title: "Jo rédige. Vous validez. Vous envoyez.",
        description:
            "Jo lit chaque thread, comprend votre marque et propose un brouillon en 2 secondes. Gain moyen de 10× en vitesse sans sacrifier la qualité ni la personnalisation.",
        bullets: [
            "Brouillons contextualisés avec l'historique du client",
            "Respect du ton de marque défini lors de l'onboarding",
            "Résumé automatique des threads de +20 messages",
            "Détection d'intention : commande, réclamation, lead",
        ],
        visual: AIDeepVisual,
        reverse: true,
        dark: true,
    },
    {
        eyebrow: "Automatisations",
        icon: Zap,
        title: "Flows visuels. Déclenchement natif.",
        description:
            "Construisez vos parcours client en drag & drop : qualification de lead, prise de RDV, relance panier, enquête de satisfaction. Sans code, sans bug, sans limite.",
        bullets: [
            "Éditeur visuel drag & drop (React Flow)",
            "Conditions, délais, branches, boucles",
            "Intégrations natives : Shopify, WooCommerce, Stripe, Calendly",
            "Tests A/B intégrés, stats de conversion par nœud",
        ],
        visual: FlowsDeepVisual,
    },
    {
        eyebrow: "Analytics",
        icon: BarChart3,
        title: "Pilotez vos métriques en temps réel.",
        description:
            "Dashboards personnalisables, alertes sur seuils, exports CSV et API GraphQL. Convex propulse chaque KPI en moins de 100ms.",
        bullets: [
            "Temps de première réponse, taux de résolution, CSAT",
            "Volume par numéro, par équipe, par campagne",
            "Alertes Slack sur seuils et anomalies",
            "Export CSV, API GraphQL, webhooks",
        ],
        visual: AnalyticsDeepVisual,
        reverse: true,
        dark: true,
    },
];

export function FeaturesDeepDiveSection() {
    return (
        <>
            {deepDives.map((dive, i) => (
                <DeepDiveBlock key={i} {...dive} />
            ))}
        </>
    );
}

function DeepDiveBlock({ eyebrow, icon: Icon, title, description, bullets, visual: Visual, reverse, dark }: DeepDive) {
    return (
        <section
            className={cn(
                "relative overflow-hidden py-24 md:py-32",
                dark && "bg-[var(--surface-dark)] text-white"
            )}
        >
            {dark && (
                <>
                    <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0 opacity-[0.04]"
                        style={{
                            backgroundImage:
                                "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.9) 1px, transparent 0)",
                            backgroundSize: "28px 28px",
                        }}
                    />
                    <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0"
                        style={{
                            background:
                                "radial-gradient(ellipse at 70% 50%, var(--accent-glow) 0%, transparent 55%)",
                            opacity: 0.4,
                        }}
                    />
                </>
            )}

            <div className="relative mx-auto max-w-7xl px-6">
                <div
                    className={cn(
                        "grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-20",
                        reverse && "lg:[&>*:first-child]:order-2"
                    )}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.3 }}
                        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                    >
                        <div className="flex items-center gap-3">
                            <div
                                className={cn(
                                    "inline-flex h-10 w-10 items-center justify-center rounded-xl",
                                    dark ? "bg-white/10 text-white" : "bg-[var(--accent-muted)] text-[var(--accent)]"
                                )}
                            >
                                <Icon className="h-5 w-5" />
                            </div>
                            <p
                                className={cn(
                                    "font-mono text-[11px] uppercase tracking-[0.2em]",
                                    dark ? "text-white/60" : "text-[var(--accent)]"
                                )}
                            >
                                {eyebrow}
                            </p>
                        </div>
                        <h3
                            className={cn(
                                "mt-5 font-display text-3xl font-bold tracking-tight md:text-5xl",
                                dark ? "text-white" : "text-foreground"
                            )}
                        >
                            {title}
                        </h3>
                        <p
                            className={cn(
                                "mt-5 max-w-xl text-lg leading-relaxed",
                                dark ? "text-white/70" : "text-muted-foreground"
                            )}
                        >
                            {description}
                        </p>
                        <ul className="mt-8 space-y-3">
                            {bullets.map((b) => (
                                <li key={b} className="flex items-start gap-3">
                                    <CheckCircle
                                        className={cn(
                                            "mt-0.5 h-4 w-4 shrink-0",
                                            dark ? "text-[var(--accent)]" : "text-[var(--accent)]"
                                        )}
                                    />
                                    <span
                                        className={cn(
                                            "text-[15px]",
                                            dark ? "text-white/85" : "text-foreground"
                                        )}
                                    >
                                        {b}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.3 }}
                        transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                    >
                        <Visual />
                    </motion.div>
                </div>
            </div>
        </section>
    );
}

function InboxDeepVisual() {
    return (
        <div className="relative aspect-[5/4] w-full overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-muted/40 to-card shadow-2xl">
            <div className="absolute inset-4 grid grid-rows-[auto_1fr] gap-3">
                <div className="flex items-center justify-between rounded-xl border border-border/60 bg-background p-3">
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                            3 numéros · 7 agents
                        </span>
                    </div>
                    <span className="rounded-full bg-[var(--accent-muted)] px-2 py-0.5 font-mono text-[10px] font-semibold text-[var(--accent)]">
                        42 conversations
                    </span>
                </div>

                <div className="grid grid-cols-[1fr_1.3fr] gap-2">
                    <div className="flex flex-col gap-1.5 rounded-xl border border-border/60 bg-background p-2">
                        {[0, 1, 2, 3, 4].map((i) => (
                            <div
                                key={i}
                                className={cn(
                                    "flex items-center gap-2 rounded-lg p-1.5",
                                    i === 0 ? "bg-[var(--accent-muted)]" : ""
                                )}
                            >
                                <div className="h-5 w-5 rounded-full bg-muted" />
                                <div className="flex-1 space-y-1">
                                    <div className="h-1 w-2/3 rounded bg-muted" />
                                    <div className="h-1 w-full rounded bg-muted/60" />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex flex-col gap-1.5 rounded-xl border border-border/60 bg-background p-2">
                        <div className="self-start rounded-xl rounded-bl-sm bg-muted px-2 py-1 text-[9px]">
                            Bonjour, ma commande ?
                        </div>
                        <div className="self-end rounded-xl rounded-br-sm bg-[var(--accent)] px-2 py-1 text-[9px] text-white">
                            Je regarde ça…
                        </div>
                        <div className="self-start rounded-xl rounded-bl-sm bg-muted px-2 py-1 text-[9px]">
                            Merci 🙏
                        </div>
                        <div className="mt-auto rounded-lg border border-border/40 bg-muted/40 px-2 py-1 text-[9px] text-muted-foreground">
                            Répondre…
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function AIDeepVisual() {
    return (
        <div className="relative aspect-[5/4] w-full overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.03] to-white/[0.01] p-6 shadow-2xl backdrop-blur-sm">
            <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-[var(--accent)]">
                    <Bot className="h-3.5 w-3.5 text-white" />
                </div>
                <div>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-white/50">
                        Jokko IA — Jo
                    </p>
                    <p className="text-[10px] font-semibold text-white">Brouillon · 0.3s</p>
                </div>
            </div>

            <div className="mt-5 space-y-3">
                <div className="self-start rounded-2xl rounded-bl-sm bg-white/10 px-3 py-2 text-[11px] text-white/90 max-w-[80%]">
                    Bonjour, j&apos;ai passé ma commande hier soir mais je n&apos;ai rien reçu.
                </div>

                <div className="rounded-2xl border border-[var(--accent)]/40 bg-[var(--accent)]/10 p-3 backdrop-blur-sm">
                    <div className="mb-1.5 flex items-center gap-1.5">
                        <div className="h-1 w-1 animate-pulse rounded-full bg-[var(--accent)]" />
                        <span className="font-mono text-[9px] uppercase tracking-wider text-[var(--accent)]">
                            Brouillon · Confiance 94%
                        </span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-white">
                        Bonjour Aïssatou 👋 votre commande <span className="font-semibold">#4821</span> a
                        été expédiée hier soir. Délai moyen 2-3 jours. Suivi :{" "}
                        <span className="underline underline-offset-2">AB123456</span>
                    </p>
                    <div className="mt-2 flex gap-1.5">
                        <button className="rounded-md bg-[var(--accent)] px-2 py-1 text-[9px] font-semibold text-white">
                            Envoyer
                        </button>
                        <button className="rounded-md border border-white/20 bg-white/5 px-2 py-1 text-[9px] font-semibold text-white/80">
                            Modifier
                        </button>
                        <button className="rounded-md border border-white/10 px-2 py-1 text-[9px] font-semibold text-white/60">
                            Autre version
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function FlowsDeepVisual() {
    const nodes = [
        { x: 10, y: 20, label: "Déclencheur", color: "emerald" },
        { x: 45, y: 20, label: "Condition", color: "violet" },
        { x: 80, y: 10, label: "Action A", color: "amber" },
        { x: 80, y: 35, label: "Action B", color: "amber" },
    ];
    return (
        <div className="relative aspect-[5/4] w-full overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-muted/30 to-card p-6 shadow-2xl">
            <svg viewBox="0 0 100 60" className="h-full w-full">
                <line x1="22" y1="24" x2="45" y2="24" stroke="var(--accent)" strokeWidth="0.4" strokeDasharray="1 1" opacity="0.5" />
                <line x1="57" y1="24" x2="80" y2="14" stroke="var(--accent)" strokeWidth="0.4" strokeDasharray="1 1" opacity="0.5" />
                <line x1="57" y1="24" x2="80" y2="39" stroke="var(--accent)" strokeWidth="0.4" strokeDasharray="1 1" opacity="0.5" />
                {nodes.map((n, i) => (
                    <g key={i}>
                        <rect
                            x={n.x}
                            y={n.y}
                            width="12"
                            height="8"
                            rx="1.2"
                            fill="white"
                            stroke="var(--border)"
                            strokeWidth="0.2"
                        />
                        <circle cx={n.x + 1.2} cy={n.y + 1.2} r="0.6" fill={`var(--${n.color === "emerald" ? "whatsapp" : n.color === "violet" ? "accent" : "accent-hover"})`} />
                        <text x={n.x + 6} y={n.y + 5} fontSize="1.5" textAnchor="middle" fontWeight="600" fill="currentColor">
                            {n.label}
                        </text>
                    </g>
                ))}
            </svg>
        </div>
    );
}

function AnalyticsDeepVisual() {
    const bars = [
        { h: 35, day: "L" },
        { h: 50, day: "M" },
        { h: 42, day: "M" },
        { h: 68, day: "J" },
        { h: 55, day: "V" },
        { h: 78, day: "S" },
        { h: 65, day: "D" },
        { h: 88, day: "L" },
        { h: 72, day: "M" },
        { h: 95, day: "M" },
        { h: 82, day: "J" },
        { h: 100, day: "V" },
    ];
    const maxIdx = bars.reduce((best, b, i, arr) => (b.h > arr[best].h ? i : best), 0);

    return (
        <div className="relative flex aspect-[5/4] w-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.03] to-white/[0.01] p-6 shadow-2xl">
            <div className="grid shrink-0 grid-cols-2 gap-3">
                {[
                    { label: "Temps 1ère réponse", value: "47s", trend: "-82%" },
                    { label: "Taux résolution", value: "94%", trend: "+31%" },
                    { label: "CSAT WhatsApp", value: "4.9/5", trend: "+0.8" },
                    { label: "Revenu WhatsApp", value: "+12M F", trend: "+48%" },
                ].map((m) => (
                    <div
                        key={m.label}
                        className="rounded-xl border border-white/10 bg-white/[0.03] p-3 backdrop-blur-sm"
                    >
                        <p className="font-mono text-[9px] uppercase tracking-wider text-white/50">
                            {m.label}
                        </p>
                        <p className="mt-1.5 font-display text-2xl font-bold text-white">{m.value}</p>
                        <p className="mt-0.5 text-[10px] font-semibold text-emerald-400">{m.trend}</p>
                    </div>
                ))}
            </div>

            <div className="mt-4 flex flex-1 flex-col rounded-xl border border-white/10 bg-white/[0.02] p-3 backdrop-blur-sm">
                <div className="flex shrink-0 items-start justify-between">
                    <div>
                        <p className="font-mono text-[9px] uppercase tracking-wider text-white/50">
                            Conversations · 14 derniers jours
                        </p>
                        <p className="mt-0.5 flex items-baseline gap-1.5 font-display text-base font-bold text-white">
                            3 842
                            <span className="font-mono text-[10px] font-semibold text-emerald-400">
                                +24 %
                            </span>
                        </p>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                        <span className="font-mono text-[9px] uppercase tracking-wider text-white/70">
                            Volume
                        </span>
                    </div>
                </div>

                <div className="relative mt-3 flex flex-1 flex-col">
                    <div aria-hidden className="absolute inset-x-0 top-0 h-full">
                        {[0, 1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="absolute inset-x-0 border-t border-dashed border-white/[0.06]"
                                style={{ top: `${i * 33.33}%` }}
                            />
                        ))}
                    </div>

                    <div className="relative flex flex-1 items-end gap-1.5">
                        {bars.map((b, i) => {
                            const isMax = i === maxIdx;
                            return (
                                <div
                                    key={i}
                                    className="group relative flex flex-1 flex-col items-center justify-end"
                                    style={{ height: "100%" }}
                                >
                                    <div
                                        className={`w-full rounded-t-md transition-all ${
                                            isMax
                                                ? "bg-gradient-to-t from-[var(--accent)] via-[var(--accent)] to-white/80 shadow-[0_0_16px_-2px_var(--accent-glow)]"
                                                : "bg-gradient-to-t from-[var(--accent)]/70 to-[var(--accent)]/20"
                                        }`}
                                        style={{ height: `${b.h}%` }}
                                    />
                                    {isMax && (
                                        <div className="absolute -top-1 left-1/2 -translate-x-1/2">
                                            <div className="rounded-md bg-white px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase tracking-wider text-[var(--surface-dark)] shadow-md">
                                                Pic
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-2 flex shrink-0 gap-1.5">
                        {bars.map((b, i) => (
                            <span
                                key={i}
                                className="flex-1 text-center font-mono text-[8px] uppercase text-white/40"
                            >
                                {b.day}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
