"use client";

import { motion } from "framer-motion";
import {
    Plane,
    Laptop,
    HeartPulse,
    GraduationCap,
    Coffee,
    Clock,
    Shield,
    Gift,
} from "lucide-react";

const benefits = [
    {
        icon: Plane,
        title: "Remote-friendly",
        description:
            "Travaillez depuis où vous voulez. Retrouvailles trimestrielles à Paris ou Dakar.",
    },
    {
        icon: Laptop,
        title: "Setup premium",
        description:
            "MacBook Pro, écran 4K, chaise ergonomique. On n'économise pas sur les outils.",
    },
    {
        icon: HeartPulse,
        title: "Mutuelle généreuse",
        description:
            "Couverture santé à 100%, y compris pour la famille. Hors de question de transiger.",
    },
    {
        icon: GraduationCap,
        title: "Budget formation",
        description:
            "2 500€ par an pour livres, conférences, formations. Continuez à apprendre.",
    },
    {
        icon: Coffee,
        title: "Off-sites",
        description:
            "Deux fois par an, l'équipe entière se retrouve. Maroc, Portugal, Casamance.",
    },
    {
        icon: Clock,
        title: "Congés illimités",
        description:
            "Minimum 5 semaines recommandées. Prenez le temps dont vous avez besoin.",
    },
    {
        icon: Shield,
        title: "Equity",
        description:
            "Chaque membre de l'équipe reçoit des BSPCE. On construit ensemble, on gagne ensemble.",
    },
    {
        icon: Gift,
        title: "Parentalité",
        description:
            "4 mois de congé parental pour chacun des deux parents, quelle que soit la situation.",
    },
];

export function CareersBenefits() {
    return (
        <section className="relative py-24 md:py-32">
            <div className="mx-auto max-w-7xl px-6">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.7 }}
                    className="mx-auto max-w-2xl text-center"
                >
                    <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-[var(--accent)]">
                        Les avantages
                    </p>
                    <h2 className="mt-4 font-display text-4xl font-bold tracking-tight md:text-6xl">
                        Ce qui vient avec le poste.
                    </h2>
                </motion.div>

                <div className="mt-16 grid grid-cols-2 gap-4 md:grid-cols-4">
                    {benefits.map((b, i) => {
                        const Icon = b.icon;
                        return (
                            <motion.div
                                key={b.title}
                                initial={{ opacity: 0, y: 16 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, amount: 0.2 }}
                                transition={{
                                    duration: 0.5,
                                    delay: i * 0.05,
                                    ease: [0.22, 1, 0.36, 1],
                                }}
                                className="rounded-2xl border border-border/60 bg-card p-5 transition-all hover:-translate-y-1 hover:border-[var(--accent)]/40"
                            >
                                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-muted)] text-[var(--accent)]">
                                    <Icon className="h-5 w-5" />
                                </div>
                                <h3 className="mt-4 font-semibold">{b.title}</h3>
                                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                                    {b.description}
                                </p>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
