"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, Newspaper } from "lucide-react";
import Link from "next/link";

const releases = [
    {
        date: "12 mars 2026",
        title: "Jokko lève 3,5 M€ pour unifier WhatsApp Business en Afrique francophone",
        excerpt:
            "Tour mené par Partech Africa, avec la participation d'Orange Ventures et de business angels du secteur de la fintech.",
        href: "/press/seed-announcement",
    },
    {
        date: "04 février 2026",
        title: "Jokko obtient la certification ISO 27001",
        excerpt:
            "La plateforme renforce son engagement sécurité avec l'obtention de la norme internationale ISO 27001, audit réalisé par Bureau Veritas.",
        href: "/press/iso-27001",
    },
    {
        date: "22 janvier 2026",
        title: "Lancement de Jo, le copilote IA pour équipes support",
        excerpt:
            "Un assistant IA natif WhatsApp capable de rédiger, résumer et qualifier les conversations en français, wolof et anglais.",
        href: "/press/ai-copilot-launch",
    },
    {
        date: "18 novembre 2025",
        title: "Jokko dépasse les 1 000 clients actifs",
        excerpt:
            "En 18 mois, la plateforme a conquis plus de 1 000 entreprises utilisatrices, du commerçant indépendant au groupe coté.",
        href: "/press/1000-clients",
    },
    {
        date: "15 septembre 2025",
        title: "Ouverture du bureau de Dakar",
        excerpt:
            "Inauguration d'un hub ouest-africain à Dakar pour accompagner la croissance régionale et recruter les talents locaux.",
        href: "/press/dakar-office",
    },
];

export function PressReleases() {
    return (
        <section className="relative py-20 md:py-24">
            <div className="mx-auto max-w-5xl px-6">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.7 }}
                    className="mb-12 flex items-center gap-3"
                >
                    <Newspaper className="h-5 w-5 text-[var(--accent)]" />
                    <div>
                        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-[var(--accent)]">
                            Communiqués
                        </p>
                        <h2 className="mt-1 font-display text-3xl font-bold tracking-tight md:text-4xl">
                            Nos dernières annonces.
                        </h2>
                    </div>
                </motion.div>

                <div className="space-y-3">
                    {releases.map((r, i) => (
                        <motion.div
                            key={r.title}
                            initial={{ opacity: 0, y: 12 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.15 }}
                            transition={{
                                duration: 0.5,
                                delay: i * 0.05,
                                ease: [0.22, 1, 0.36, 1],
                            }}
                        >
                            <Link
                                href={r.href}
                                className="group grid items-start gap-4 rounded-2xl border border-border/60 bg-card p-6 transition-all hover:-translate-y-0.5 hover:border-[var(--accent)]/40 md:grid-cols-[150px_1fr_auto]"
                            >
                                <span className="font-mono text-xs text-muted-foreground">
                                    {r.date}
                                </span>
                                <div className="min-w-0">
                                    <h3 className="font-display text-xl font-bold tracking-tight transition-colors group-hover:text-[var(--accent)]">
                                        {r.title}
                                    </h3>
                                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                                        {r.excerpt}
                                    </p>
                                </div>
                                <ArrowUpRight className="h-5 w-5 shrink-0 text-muted-foreground transition-all group-hover:text-[var(--accent)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
