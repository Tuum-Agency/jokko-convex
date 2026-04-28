"use client";

import { motion } from "framer-motion";

const pillars = [
    {
        title: "Autonomie totale",
        description:
            "Chaque personne possède son domaine. Pas de micromanagement, pas de validation à 3 niveaux. Vous proposez, vous décidez, vous livrez.",
    },
    {
        title: "Impact immédiat",
        description:
            "Votre première PR est en production la semaine qui suit votre arrivée. Des milliers d'agents WhatsApp la voient dès le mardi.",
    },
    {
        title: "Équipe ramassée",
        description:
            "Nous resterons petits le plus longtemps possible. Quatorze personnes aujourd'hui, trente dans un an. Vous êtes une voix, pas un numéro.",
    },
    {
        title: "Fuseau partagé",
        description:
            "Paris et Dakar sur le même fuseau. Pas de standups à 3h du matin. Les équipes se croisent toute la journée sur Slack et Loom.",
    },
];

export function CareersCulture() {
    return (
        <section className="relative border-y border-border/60 bg-muted/30 py-24 md:py-32">
            <div className="mx-auto max-w-7xl px-6">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.7 }}
                    className="mx-auto max-w-2xl text-center"
                >
                    <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-[var(--accent)]">
                        La culture
                    </p>
                    <h2 className="mt-4 font-display text-4xl font-bold tracking-tight md:text-6xl">
                        Ce qui rend Jokko différent.
                    </h2>
                </motion.div>

                <div className="mt-16 grid gap-4 md:grid-cols-2">
                    {pillars.map((p, i) => (
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
                            className="rounded-3xl border border-border/60 bg-card p-8 transition-all hover:-translate-y-1 hover:border-[var(--accent)]/40"
                        >
                            <h3 className="font-display text-2xl font-bold tracking-tight">
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
