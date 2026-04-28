"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, TrendingUp } from "lucide-react";
import Link from "next/link";

const popular = [
    {
        title: "Connecter un numéro WhatsApp Business en 3 minutes",
        category: "Prise en main",
        views: "12.4k",
        readTime: "3 min",
    },
    {
        title: "Créer son premier flow d'accueil automatisé",
        category: "Automatisations",
        views: "8.9k",
        readTime: "7 min",
    },
    {
        title: "Importer 10 000 contacts depuis un CSV",
        category: "CRM",
        views: "7.2k",
        readTime: "4 min",
    },
    {
        title: "Configurer l'assignation automatique par langue",
        category: "Équipes",
        views: "6.8k",
        readTime: "5 min",
    },
    {
        title: "Lancer sa première campagne broadcast",
        category: "Campagnes",
        views: "6.1k",
        readTime: "6 min",
    },
    {
        title: "Intégrer Shopify en bi-directionnel",
        category: "Intégrations",
        views: "5.4k",
        readTime: "8 min",
    },
    {
        title: "Activer Jo et paramétrer le ton de marque",
        category: "IA",
        views: "4.9k",
        readTime: "5 min",
    },
    {
        title: "Créer un dashboard analytics personnalisé",
        category: "Analytics",
        views: "3.8k",
        readTime: "6 min",
    },
];

export function GuidesPopular() {
    return (
        <section className="relative py-20 md:py-24">
            <div className="mx-auto max-w-5xl px-6">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.7 }}
                    className="mb-10 flex items-center gap-3"
                >
                    <TrendingUp className="h-5 w-5 text-[var(--accent)]" />
                    <div>
                        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-[var(--accent)]">
                            Les plus consultés
                        </p>
                        <h2 className="mt-1 font-display text-3xl font-bold tracking-tight md:text-4xl">
                            Ce que les autres lisent.
                        </h2>
                    </div>
                </motion.div>

                <div className="overflow-hidden rounded-3xl border border-border/60 bg-card">
                    {popular.map((item, i) => (
                        <motion.div
                            key={item.title}
                            initial={{ opacity: 0, y: 8 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.1 }}
                            transition={{
                                duration: 0.4,
                                delay: i * 0.03,
                                ease: [0.22, 1, 0.36, 1],
                            }}
                            className="border-b border-border/60 last:border-b-0"
                        >
                            <Link
                                href={`/guides/${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                                className="group flex items-center gap-4 p-5 transition-colors hover:bg-[var(--accent-muted)]/40"
                            >
                                <span className="w-6 text-center font-mono text-sm font-semibold text-muted-foreground">
                                    {String(i + 1).padStart(2, "0")}
                                </span>
                                <div className="min-w-0 flex-1">
                                    <h3 className="truncate font-semibold transition-colors group-hover:text-[var(--accent)]">
                                        {item.title}
                                    </h3>
                                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                                        <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider">
                                            {item.category}
                                        </span>
                                        <span>{item.readTime}</span>
                                        <span>· {item.views} vues</span>
                                    </div>
                                </div>
                                <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-all group-hover:text-[var(--accent)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
