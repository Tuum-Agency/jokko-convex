"use client";

import { motion } from "framer-motion";
import { SplitText } from "@/components/animations/split-text";
import Link from "next/link";
import { ArrowRight, Download } from "lucide-react";

export function ApiHero() {
    return (
        <section className="relative overflow-hidden pt-32 pb-16 md:pt-40 md:pb-20">
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

            <div className="relative mx-auto max-w-5xl px-6">
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="flex items-center gap-2"
                >
                    <Link
                        href="/docs"
                        className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground transition-colors hover:text-[var(--accent)]"
                    >
                        Docs
                    </Link>
                    <span className="font-mono text-[11px] text-muted-foreground">/</span>
                    <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-[var(--accent)]">
                        Référence API
                    </span>
                </motion.div>

                <h1 className="mt-6 font-display text-5xl font-bold leading-[1.05] tracking-tight md:text-6xl">
                    <SplitText>API v2 · OpenAPI 3.1</SplitText>
                </h1>

                <motion.p
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground"
                >
                    REST sur HTTPS, retours JSON, tokens Bearer. Versionnée via
                    header, rétrocompatible 18 mois. Specs OpenAPI générées
                    automatiquement à chaque release.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                    className="mt-8 flex flex-wrap items-center gap-3"
                >
                    <Link
                        href="/docs/quickstart"
                        className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-[var(--accent-hover)]"
                    >
                        Démarrer en 5 min
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                    <a
                        href="/openapi.json"
                        className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card px-5 py-2.5 text-sm font-semibold transition-all hover:-translate-y-0.5 hover:border-[var(--accent)]/40"
                    >
                        <Download className="h-4 w-4" />
                        Spec OpenAPI
                    </a>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.8 }}
                    className="mt-10 overflow-hidden rounded-2xl border border-border/60 bg-card"
                >
                    <div className="grid divide-y divide-border/60 md:grid-cols-4 md:divide-x md:divide-y-0">
                        <div className="p-5">
                            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                                Base URL
                            </p>
                            <p className="mt-1.5 font-mono text-sm">
                                api.jokko.com/v2
                            </p>
                        </div>
                        <div className="p-5">
                            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                                Version
                            </p>
                            <p className="mt-1.5 font-mono text-sm">
                                2026-03-15
                            </p>
                        </div>
                        <div className="p-5">
                            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                                Uptime 90j
                            </p>
                            <p className="mt-1.5 font-mono text-sm">
                                <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />{" "}
                                99.98 %
                            </p>
                        </div>
                        <div className="p-5">
                            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                                Latence p99
                            </p>
                            <p className="mt-1.5 font-mono text-sm">142 ms</p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
