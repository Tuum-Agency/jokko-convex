"use client";

import { motion } from "framer-motion";

const steps = [
    {
        number: "01",
        duration: "30 min",
        title: "Appel découverte",
        description:
            "Un échange informel avec Léa ou Aliou pour comprendre votre parcours et vos envies.",
    },
    {
        number: "02",
        duration: "1 h",
        title: "Entretien technique",
        description:
            "Un exercice pratique ou une discussion approfondie avec le lead de l'équipe concernée.",
    },
    {
        number: "03",
        duration: "2 h",
        title: "Jour d'essai",
        description:
            "Vous travaillez sur un sujet réel, rémunéré. Vous voyez la vraie équipe, le vrai code, le vrai produit.",
    },
    {
        number: "04",
        duration: "24 h",
        title: "Offre",
        description:
            "Décision sous 48h. Si c'est oui, on cale votre date de démarrage et on vous envoie l'offre.",
    },
];

export function CareersProcess() {
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
                        Le process
                    </p>
                    <h2 className="mt-4 font-display text-4xl font-bold tracking-tight md:text-6xl">
                        Rapide, transparent, rémunéré.
                    </h2>
                    <p className="mt-5 text-lg text-muted-foreground">
                        De la candidature à l'offre : 10 jours max. On respecte votre
                        temps et on paye les jours d'essai.
                    </p>
                </motion.div>

                <div className="mt-16 grid gap-4 md:grid-cols-4">
                    {steps.map((s, i) => (
                        <motion.div
                            key={s.number}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.2 }}
                            transition={{
                                duration: 0.6,
                                delay: i * 0.1,
                                ease: [0.22, 1, 0.36, 1],
                            }}
                            className="relative rounded-3xl border border-border/60 bg-card p-6 transition-all hover:-translate-y-1 hover:border-[var(--accent)]/40"
                        >
                            <div className="flex items-baseline justify-between">
                                <span className="font-display text-5xl font-bold tracking-tight text-[var(--accent)]">
                                    {s.number}
                                </span>
                                <span className="rounded-full bg-[var(--accent-muted)] px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--accent)]">
                                    {s.duration}
                                </span>
                            </div>
                            <h3 className="mt-6 font-display text-lg font-bold tracking-tight">
                                {s.title}
                            </h3>
                            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                                {s.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
