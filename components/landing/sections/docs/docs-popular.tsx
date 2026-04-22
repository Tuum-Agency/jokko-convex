"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, Sparkles } from "lucide-react";
import Link from "next/link";

const articles = [
    {
        title: "Authentifier vos requêtes avec Bearer tokens",
        category: "Auth",
        href: "/docs/auth/bearer",
    },
    {
        title: "Signer et vérifier un webhook en Node.js",
        category: "Webhooks",
        href: "/docs/webhooks/signature",
    },
    {
        title: "Envoyer un template approuvé par Meta",
        category: "Messages",
        href: "/docs/messages/templates",
    },
    {
        title: "Gérer les limites de débit (rate limits)",
        category: "API",
        href: "/docs/api/rate-limits",
    },
    {
        title: "Uploader un média et l'attacher à un message",
        category: "Messages",
        href: "/docs/messages/media",
    },
    {
        title: "Parcourir la pagination d'une collection",
        category: "API",
        href: "/docs/api/pagination",
    },
];

export function DocsPopular() {
    return (
        <section className="relative border-t border-border/60 bg-muted/30 py-20 md:py-24">
            <div className="mx-auto max-w-5xl px-6">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.7 }}
                    className="mb-10 flex items-center gap-3"
                >
                    <Sparkles className="h-5 w-5 text-[var(--accent)]" />
                    <div>
                        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-[var(--accent)]">
                            Articles populaires
                        </p>
                        <h2 className="mt-1 font-display text-3xl font-bold tracking-tight md:text-4xl">
                            Ce que cherchent les devs.
                        </h2>
                    </div>
                </motion.div>

                <div className="grid gap-3 md:grid-cols-2">
                    {articles.map((article, i) => (
                        <motion.div
                            key={article.title}
                            initial={{ opacity: 0, y: 8 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.2 }}
                            transition={{
                                duration: 0.4,
                                delay: i * 0.05,
                                ease: [0.22, 1, 0.36, 1],
                            }}
                        >
                            <Link
                                href={article.href}
                                className="group flex items-center gap-4 rounded-2xl border border-border/60 bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-[var(--accent)]/40"
                            >
                                <div className="min-w-0 flex-1">
                                    <span className="inline-block rounded-full bg-[var(--accent-muted)] px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-[var(--accent)]">
                                        {article.category}
                                    </span>
                                    <h3 className="mt-2 font-semibold transition-colors group-hover:text-[var(--accent)]">
                                        {article.title}
                                    </h3>
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
