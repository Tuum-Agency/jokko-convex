"use client";

import { motion } from "framer-motion";
import { CountUp } from "@/components/animations/count-up";

const metrics = [
    {
        value: 1200,
        suffix: "+",
        label: "Entreprises clientes",
        hint: "En France, Afrique de l'Ouest, Maghreb",
    },
    {
        value: 42,
        suffix: "M",
        label: "Messages routés",
        hint: "Sur les 12 derniers mois",
    },
    {
        value: 98.7,
        suffix: " %",
        decimals: 1,
        label: "CSAT clients",
        hint: "Moyenne 2025",
    },
    {
        value: 2024,
        label: "Fondée en",
        hint: "Paris · Dakar",
    },
    {
        value: 14,
        label: "Employés",
        hint: "Remote-first, 6 pays",
    },
    {
        value: 3.5,
        suffix: " M€",
        decimals: 1,
        label: "Pre-seed",
        hint: "Bouclé mars 2026",
    },
];

export function PressMetrics() {
    return (
        <section className="relative border-y border-border/60 bg-muted/30 py-20 md:py-24">
            <div className="mx-auto max-w-7xl px-6">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.7 }}
                    className="mb-12"
                >
                    <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-[var(--accent)]">
                        Chiffres clés
                    </p>
                    <h2 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">
                        Jokko en un coup d&apos;œil.
                    </h2>
                </motion.div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {metrics.map((m, i) => (
                        <motion.div
                            key={m.label}
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.2 }}
                            transition={{
                                duration: 0.6,
                                delay: i * 0.06,
                                ease: [0.22, 1, 0.36, 1],
                            }}
                            className="rounded-2xl border border-border/60 bg-card p-6"
                        >
                            <div className="font-display text-5xl font-bold tracking-tight md:text-6xl">
                                <CountUp
                                    to={m.value}
                                    decimals={m.decimals ?? 0}
                                    suffix={m.suffix ?? ""}
                                />
                            </div>
                            <p className="mt-3 font-semibold">{m.label}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                {m.hint}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
