"use client";

import { motion } from "framer-motion";
import { ArrowRight, Rocket, Gauge, Trophy } from "lucide-react";
import Link from "next/link";

const paths = [
    {
        icon: Rocket,
        level: "Débutant",
        duration: "45 min",
        title: "Prise en main",
        description:
            "Connectez votre premier numéro, invitez votre équipe, envoyez votre premier message. L'essentiel pour démarrer.",
        lessons: 6,
        gradient: "from-emerald-500 to-teal-600",
    },
    {
        icon: Gauge,
        level: "Intermédiaire",
        duration: "1 h 30",
        title: "Optimiser son inbox",
        description:
            "Règles d'assignation, templates avancés, intégration CRM, KPI d'équipe. Passez du basique à l'efficace.",
        lessons: 9,
        gradient: "from-[var(--accent)] to-[var(--accent-hover)]",
    },
    {
        icon: Trophy,
        level: "Avancé",
        duration: "2 h 15",
        title: "Maîtriser l'automatisation",
        description:
            "Flows complexes, webhooks, Jo fine-tuning, A/B testing de broadcasts. Le niveau des équipes qui scalent.",
        lessons: 12,
        gradient: "from-amber-500 to-orange-600",
    },
];

export function GuidesLearningPaths() {
    return (
        <section className="relative py-12 md:py-16">
            <div className="mx-auto max-w-7xl px-6">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.7 }}
                    className="mb-10 flex items-end justify-between"
                >
                    <div>
                        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-[var(--accent)]">
                            Parcours
                        </p>
                        <h2 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">
                            Apprenez par étapes.
                        </h2>
                    </div>
                </motion.div>

                <div className="grid gap-4 md:grid-cols-3">
                    {paths.map((p, i) => {
                        const Icon = p.icon;
                        return (
                            <motion.div
                                key={p.title}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, amount: 0.2 }}
                                transition={{
                                    duration: 0.6,
                                    delay: i * 0.1,
                                    ease: [0.22, 1, 0.36, 1],
                                }}
                            >
                                <Link
                                    href={`/guides/${p.title.toLowerCase().replace(/\s+/g, "-")}`}
                                    className="group relative block h-full overflow-hidden rounded-3xl border border-border/60 bg-card p-6 transition-all hover:-translate-y-1 hover:border-[var(--accent)]/40"
                                >
                                    <div
                                        className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${p.gradient} text-white shadow-lg`}
                                    >
                                        <Icon className="h-6 w-6" />
                                    </div>

                                    <div className="mt-6 flex items-center gap-2">
                                        <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                            {p.level}
                                        </span>
                                        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                                            · {p.duration}
                                        </span>
                                    </div>

                                    <h3 className="mt-3 font-display text-xl font-bold tracking-tight">
                                        {p.title}
                                    </h3>
                                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                                        {p.description}
                                    </p>

                                    <div className="mt-6 flex items-center justify-between border-t border-border/40 pt-4">
                                        <span className="text-xs font-semibold text-muted-foreground">
                                            {p.lessons} leçons
                                        </span>
                                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent)]">
                                            Démarrer
                                            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                                        </span>
                                    </div>
                                </Link>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
