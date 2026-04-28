"use client";

import { motion } from "framer-motion";
import { ThumbsUp, Zap, Clock, Telescope } from "lucide-react";
import { cn } from "@/lib/utils";

type Item = {
    title: string;
    description: string;
    tag: string;
    votes: number;
    eta?: string;
};

type Column = {
    key: string;
    icon: typeof Zap;
    label: string;
    caption: string;
    accentClass: string;
    items: Item[];
};

const columns: Column[] = [
    {
        key: "now",
        icon: Zap,
        label: "En cours",
        caption: "Ce que nous codons cette semaine",
        accentClass: "bg-[var(--accent-muted)] text-[var(--accent)] border-[var(--accent)]/20",
        items: [
            {
                title: "Inbox unifiée · vue Kanban",
                description:
                    "Un affichage kanban optionnel pour suivre les conversations par étape de traitement.",
                tag: "INBOX",
                votes: 184,
                eta: "Avril 2026",
            },
            {
                title: "Jo · fine-tuning par organisation",
                description:
                    "Jo apprend le ton de votre marque à partir de vos 500 derniers messages.",
                tag: "IA",
                votes: 312,
                eta: "Avril 2026",
            },
            {
                title: "API Webhooks v2",
                description:
                    "Webhooks signés, retry automatique, dashboard de monitoring en temps réel.",
                tag: "API",
                votes: 97,
                eta: "Mai 2026",
            },
        ],
    },
    {
        key: "next",
        icon: Clock,
        label: "Prochainement",
        caption: "Q2 & Q3 2026",
        accentClass: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300",
        items: [
            {
                title: "App mobile iOS & Android",
                description:
                    "React Native. Notifications push, brouillons offline, synchronisation complète.",
                tag: "MOBILE",
                votes: 428,
                eta: "Mai 2026",
            },
            {
                title: "Automatisations · nœud IA",
                description:
                    "Un nœud IA dans le flow builder pour classifier ou générer une réponse au fil.",
                tag: "FLOWS",
                votes: 256,
                eta: "Juin 2026",
            },
            {
                title: "Intégration HubSpot",
                description:
                    "Création automatique de deals, sync bi-directionnelle des propriétés de contact.",
                tag: "INTÉGRATIONS",
                votes: 189,
                eta: "Juin 2026",
            },
            {
                title: "Analytics · cohortes",
                description:
                    "Analyser la rétention, le LTV et les funnels par cohorte d'acquisition.",
                tag: "ANALYTICS",
                votes: 143,
                eta: "Juillet 2026",
            },
        ],
    },
    {
        key: "later",
        icon: Telescope,
        label: "Exploré",
        caption: "Idées à valider avec vous",
        accentClass:
            "bg-muted text-muted-foreground border-border",
        items: [
            {
                title: "Marketplace d'automatisations",
                description:
                    "Publier et partager des flows entre utilisateurs. Templates certifiés par l'équipe Jokko.",
                tag: "COMMUNAUTÉ",
                votes: 87,
            },
            {
                title: "Jo · voice mode",
                description:
                    "Transcription + génération de brouillons pour les notes vocales WhatsApp.",
                tag: "IA",
                votes: 221,
            },
            {
                title: "Multi-tenants (agences)",
                description:
                    "Gérer plusieurs workspaces clients sous un compte maître. Facturation consolidée.",
                tag: "AGENCES",
                votes: 156,
            },
            {
                title: "Plugin Chrome · Gmail",
                description:
                    "Passer d'un email Gmail à WhatsApp en un clic, avec historique partagé.",
                tag: "INTÉGRATIONS",
                votes: 64,
            },
        ],
    },
];

export function RoadmapBoard() {
    return (
        <section className="relative py-12 md:py-16">
            <div className="mx-auto max-w-7xl px-6">
                <div className="grid gap-6 md:grid-cols-3">
                    {columns.map((col, colIdx) => {
                        const Icon = col.icon;
                        return (
                            <motion.div
                                key={col.key}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, amount: 0.1 }}
                                transition={{
                                    duration: 0.6,
                                    delay: colIdx * 0.1,
                                    ease: [0.22, 1, 0.36, 1],
                                }}
                                className="flex flex-col gap-3"
                            >
                                <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className={cn(
                                                "inline-flex h-8 w-8 items-center justify-center rounded-lg border",
                                                col.accentClass
                                            )}
                                        >
                                            <Icon className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <h2 className="font-display text-lg font-bold tracking-tight">
                                                {col.label}
                                            </h2>
                                            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                                                {col.caption} · {col.items.length}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {col.items.map((item, i) => (
                                        <motion.div
                                            key={item.title}
                                            initial={{ opacity: 0, y: 12 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true, amount: 0.1 }}
                                            transition={{
                                                duration: 0.5,
                                                delay: colIdx * 0.1 + i * 0.05,
                                                ease: [0.22, 1, 0.36, 1],
                                            }}
                                            className="group cursor-pointer rounded-2xl border border-border/60 bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-[var(--accent)]/40"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <span className="rounded-full border border-border/60 bg-background px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                                                    {item.tag}
                                                </span>
                                                {item.eta && (
                                                    <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--accent)]">
                                                        {item.eta}
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="mt-3 font-display text-base font-bold leading-snug tracking-tight transition-colors group-hover:text-[var(--accent)]">
                                                {item.title}
                                            </h3>
                                            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                                                {item.description}
                                            </p>
                                            <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-3">
                                                <button className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:bg-[var(--accent-muted)] hover:text-[var(--accent)]">
                                                    <ThumbsUp className="h-3 w-3" />
                                                    {item.votes}
                                                </button>
                                                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                                    Voter
                                                </span>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
