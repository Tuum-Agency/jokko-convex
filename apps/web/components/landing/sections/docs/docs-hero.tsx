"use client";

import { motion } from "framer-motion";
import { SplitText } from "@/components/animations/split-text";
import { Search, Book, Code2, Webhook } from "lucide-react";
import Link from "next/link";

const quickLinks = [
    { icon: Book, label: "Démarrage rapide", href: "/docs/quickstart" },
    { icon: Code2, label: "Référence API", href: "/docs/api" },
    { icon: Webhook, label: "Webhooks", href: "/docs/webhooks" },
];

export function DocsHero() {
    return (
        <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-24">
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-[0.04]"
                style={{
                    backgroundImage:
                        "radial-gradient(circle at 1px 1px, rgba(15,23,42,0.8) 1px, transparent 0)",
                    backgroundSize: "28px 28px",
                }}
            />
            <div
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[900px] -translate-x-1/2 opacity-30 blur-[140px]"
                style={{
                    background:
                        "radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)",
                }}
            />

            <div className="relative mx-auto max-w-4xl px-6 text-center">
                <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="font-mono text-[11px] uppercase tracking-[0.25em] text-[var(--accent)]"
                >
                    Docs · API v2.4 · SDK officiels
                </motion.p>

                <h1 className="mt-6 font-display text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl">
                    <SplitText>Construisez sur Jokko</SplitText>
                    <br />
                    <span className="bg-gradient-to-br from-[var(--accent)] to-[var(--accent-hover)] bg-clip-text text-transparent">
                        <SplitText delay={0.2}>sans friction.</SplitText>
                    </span>
                </h1>

                <motion.p
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                    className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground"
                >
                    Référence API exhaustive, SDK TypeScript et Python, webhooks
                    signés, exemples copier-coller. Pensé pour livrer en production
                    en moins d&apos;un après-midi.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.7 }}
                    className="mx-auto mt-10 max-w-xl"
                >
                    <div className="group flex items-center gap-3 rounded-full border border-border/60 bg-card p-1 pr-4 shadow-sm transition-all focus-within:border-[var(--accent)]/60 focus-within:shadow-md">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted">
                            <Search className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <input
                            type="text"
                            placeholder="Rechercher dans la documentation…"
                            className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
                        />
                        <kbd className="hidden rounded-md border border-border/60 bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground md:inline">
                            ⌘K
                        </kbd>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.9 }}
                    className="mt-8 flex flex-wrap items-center justify-center gap-2"
                >
                    {quickLinks.map((link) => {
                        const Icon = link.icon;
                        return (
                            <Link
                                key={link.label}
                                href={link.href}
                                className="group inline-flex items-center gap-2 rounded-full border border-border/60 bg-card px-4 py-2 text-sm transition-all hover:border-[var(--accent)]/40 hover:bg-[var(--accent-muted)]/40"
                            >
                                <Icon className="h-3.5 w-3.5 text-[var(--accent)]" />
                                <span className="font-medium">{link.label}</span>
                            </Link>
                        );
                    })}
                </motion.div>
            </div>
        </section>
    );
}
