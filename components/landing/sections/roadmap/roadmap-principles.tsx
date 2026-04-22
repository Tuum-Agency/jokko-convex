"use client";

import { motion } from "framer-motion";

const principles = [
    {
        title: "Nous livrons chaque semaine.",
        description:
            "Pas de cycles trimestriels. Une release toutes les 7 jours, feature ou patch. Le changelog public garde tout visible.",
    },
    {
        title: "Vous votez, nous priorisons.",
        description:
            "Les items avec le plus de votes remontent naturellement. Les retours terrain pèsent plus que nos intuitions.",
    },
    {
        title: "Pas de vaporware.",
        description:
            "Une idée dans la colonne « Exploré » est une idée. Rien n'est promis tant qu'elle n'est pas passée en « En cours ».",
    },
    {
        title: "Les dates peuvent bouger.",
        description:
            "On indique des ETA honnêtes. Si la réalité est différente, on met à jour publiquement avec l'explication.",
    },
];

export function RoadmapPrinciples() {
    return (
        <section className="relative border-y border-border/60 bg-muted/30 py-24 md:py-32">
            <div className="mx-auto max-w-5xl px-6">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.7 }}
                    className="mx-auto max-w-2xl text-center"
                >
                    <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-[var(--accent)]">
                        Comment on priorise
                    </p>
                    <h2 className="mt-4 font-display text-4xl font-bold tracking-tight md:text-5xl">
                        Quatre règles, une méthode.
                    </h2>
                </motion.div>

                <div className="mt-12 grid gap-6 md:grid-cols-2">
                    {principles.map((p, i) => (
                        <motion.div
                            key={p.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.2 }}
                            transition={{
                                duration: 0.6,
                                delay: i * 0.08,
                                ease: [0.22, 1, 0.36, 1],
                            }}
                            className="rounded-3xl border border-border/60 bg-card p-8"
                        >
                            <h3 className="font-display text-xl font-bold tracking-tight">
                                {p.title}
                            </h3>
                            <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
                                {p.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
