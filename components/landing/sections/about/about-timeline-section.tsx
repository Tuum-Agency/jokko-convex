"use client";

import { motion } from "framer-motion";

const milestones = [
    {
        date: "Mars 2024",
        title: "La première ligne de code",
        description:
            "Deux cofondateurs, un MacBook, une question : pourquoi aucun outil WhatsApp n'est conçu pour les équipes ?",
    },
    {
        date: "Septembre 2024",
        title: "Premier client payant",
        description:
            "Une agence marketing dakaroise nous confie ses 3 numéros WhatsApp. 1 400 conversations/mois, zéro perdu.",
    },
    {
        date: "Janvier 2025",
        title: "Lancement public",
        description:
            "Disponibilité générale. 50 équipes en bêta nous ont aidés à tailler le produit avant le lancement.",
    },
    {
        date: "Juin 2025",
        title: "100 équipes actives",
        description:
            "De Dakar à Casablanca, Paris et Abidjan. Une communauté qui façonne le produit au jour le jour.",
    },
    {
        date: "Décembre 2025",
        title: "Copilot IA intégré",
        description:
            "Jo débarque : brouillons automatiques, résumés de fils, détection d'intentions. 10× plus rapide, même ton.",
    },
    {
        date: "Avril 2026",
        title: "La suite complète",
        description:
            "Flows, CRM, campagnes, analytics temps réel. La plateforme que nous voulions. Et on ne s'arrête pas là.",
    },
];

export function AboutTimelineSection() {
    return (
        <section className="relative py-24 md:py-32">
            <div className="mx-auto max-w-5xl px-6">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.7 }}
                    className="mx-auto max-w-2xl text-center"
                >
                    <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-[var(--accent)]">
                        Deux ans de construction
                    </p>
                    <h2 className="mt-4 font-display text-4xl font-bold tracking-tight md:text-6xl">
                        Le chemin, pas la destination.
                    </h2>
                </motion.div>

                <div className="relative mt-16">
                    <div
                        aria-hidden
                        className="absolute left-5 top-0 h-full w-px bg-gradient-to-b from-[var(--accent)]/50 via-border to-transparent md:left-1/2 md:-translate-x-1/2"
                    />

                    <div className="space-y-12">
                        {milestones.map((m, i) => (
                            <motion.div
                                key={m.title}
                                initial={{ opacity: 0, y: 24 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, amount: 0.3 }}
                                transition={{
                                    duration: 0.6,
                                    delay: i * 0.05,
                                    ease: [0.22, 1, 0.36, 1],
                                }}
                                className={`relative flex gap-6 md:gap-0 ${
                                    i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                                }`}
                            >
                                <div className="flex-shrink-0 pl-0 md:w-1/2 md:px-8">
                                    <div
                                        className={`${
                                            i % 2 === 0 ? "md:text-right" : "md:text-left"
                                        }`}
                                    >
                                        <div className="ml-12 md:ml-0">
                                            <p className="font-mono text-xs uppercase tracking-wider text-[var(--accent)]">
                                                {m.date}
                                            </p>
                                            <h3 className="mt-2 font-display text-xl font-bold tracking-tight md:text-2xl">
                                                {m.title}
                                            </h3>
                                            <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
                                                {m.description}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="absolute left-0 top-1 flex h-10 w-10 items-center justify-center md:left-1/2 md:-translate-x-1/2">
                                    <div className="h-10 w-10 rounded-full border-2 border-[var(--accent)] bg-background p-1">
                                        <div className="h-full w-full rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent-hover)]" />
                                    </div>
                                </div>

                                <div className="hidden md:block md:w-1/2" />
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
