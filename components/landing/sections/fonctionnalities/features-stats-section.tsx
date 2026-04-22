"use client";

import { CountUp } from "@/components/animations/count-up";
import { motion } from "framer-motion";

const stats = [
    { value: 94, suffix: "%", label: "Taux de résolution moyen" },
    { value: 47, suffix: "s", label: "Temps 1ère réponse" },
    { value: 10, suffix: "×", label: "Plus rapide qu'un mail" },
    { value: 100, suffix: "ms", label: "Latence temps réel" },
];

export function FeaturesStatsSection() {
    return (
        <section className="relative overflow-hidden border-y border-border/60 bg-muted/40 py-20 md:py-24">
            <div className="mx-auto max-w-7xl px-6">
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.6 }}
                    className="mx-auto max-w-2xl text-center"
                >
                    <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--accent)]">
                        Impact mesuré
                    </p>
                    <h2 className="mt-4 font-display text-3xl font-bold tracking-tight md:text-5xl">
                        Des chiffres, pas des promesses.
                    </h2>
                </motion.div>

                <div className="mx-auto mt-14 grid max-w-5xl grid-cols-2 gap-8 md:grid-cols-4">
                    {stats.map((s, i) => (
                        <motion.div
                            key={s.label}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.3 }}
                            transition={{ duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                            className="text-center"
                        >
                            <div className="font-display text-5xl font-bold tracking-tight text-foreground md:text-6xl tabular-nums">
                                <CountUp to={s.value} suffix={s.suffix} />
                            </div>
                            <p className="mt-3 text-sm text-muted-foreground">{s.label}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
