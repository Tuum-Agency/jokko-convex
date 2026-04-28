"use client";

import { motion } from "framer-motion";
import { Heart, Target, Zap } from "lucide-react";

const pillars = [
    {
        icon: Target,
        title: "Notre mission",
        description:
            "Faire de WhatsApp un canal professionnel aussi puissant que l'email, sans en perdre la chaleur humaine. Chaque message compte, chaque client mérite une réponse rapide.",
    },
    {
        icon: Heart,
        title: "Ce qui nous anime",
        description:
            "L'obsession du détail. Les équipes que nous servons passent 8 heures par jour dans notre interface. Chaque pixel, chaque animation, chaque raccourci clavier compte.",
    },
    {
        icon: Zap,
        title: "Notre promesse",
        description:
            "Pas de dark patterns, pas de lock-in, pas de upsell agressif. Un prix juste, une API ouverte, un export de données en un clic. Vous pouvez partir quand vous voulez.",
    },
];

export function AboutMissionSection() {
    return (
        <section className="relative border-y border-border/60 bg-muted/30 py-24 md:py-32">
            <div className="mx-auto max-w-7xl px-6">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.7 }}
                    className="mx-auto max-w-3xl text-center"
                >
                    <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-[var(--accent)]">
                        Ce en quoi nous croyons
                    </p>
                    <h2 className="mt-4 font-display text-4xl font-bold tracking-tight md:text-6xl">
                        Trois convictions qui guident chacune de nos décisions.
                    </h2>
                </motion.div>

                <div className="mt-16 grid gap-6 md:grid-cols-3">
                    {pillars.map((p, i) => {
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
                                className="group relative rounded-3xl border border-border/60 bg-card p-8 transition-all hover:-translate-y-1 hover:border-[var(--accent)]/40"
                            >
                                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-muted)] text-[var(--accent)]">
                                    <Icon className="h-6 w-6" />
                                </div>
                                <h3 className="mt-6 font-display text-xl font-bold tracking-tight">
                                    {p.title}
                                </h3>
                                <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
                                    {p.description}
                                </p>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
