"use client";

import { motion } from "framer-motion";
import { KeyRound, Shield, Clock } from "lucide-react";

const features = [
    {
        icon: KeyRound,
        title: "Bearer tokens",
        description:
            "Deux formats : live (jkk_live_…) et test (jkk_test_…). Transmis via header Authorization.",
    },
    {
        icon: Shield,
        title: "Scopes granulaires",
        description:
            "Limitez chaque clé aux endpoints strictement nécessaires. 14 scopes disponibles.",
    },
    {
        icon: Clock,
        title: "Rotation planifiée",
        description:
            "Alertes e-mail 30 jours avant expiration. Rotation zero-downtime via double clé.",
    },
];

export function ApiAuthentication() {
    return (
        <section className="relative border-y border-border/60 bg-muted/30 py-20 md:py-24">
            <div className="mx-auto max-w-7xl px-6">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.7 }}
                    className="mb-12"
                >
                    <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-[var(--accent)]">
                        Authentification
                    </p>
                    <h2 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">
                        Sécurisé par défaut.
                    </h2>
                </motion.div>

                <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.2 }}
                        transition={{ duration: 0.6 }}
                        className="overflow-hidden rounded-2xl border border-border/60 bg-[var(--surface-dark)] shadow-2xl"
                    >
                        <div className="border-b border-white/10 bg-white/[0.02] px-5 py-3">
                            <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--surface-dark-muted-foreground)]">
                                Request
                            </p>
                        </div>
                        <pre className="overflow-x-auto p-6 text-sm leading-relaxed">
                            <code className="font-mono text-white/90">
                                <span className="text-[var(--accent)]">GET</span>{" "}
                                /v2/conversations HTTP/1.1{"\n"}
                                <span className="text-sky-400">Host:</span>{" "}
                                api.jokko.com{"\n"}
                                <span className="text-sky-400">Authorization:</span>{" "}
                                Bearer jkk_live_••••••••••{"\n"}
                                <span className="text-sky-400">
                                    Jokko-Version:
                                </span>{" "}
                                2026-03-15{"\n"}
                                <span className="text-sky-400">
                                    Content-Type:
                                </span>{" "}
                                application/json
                            </code>
                        </pre>
                    </motion.div>

                    <div className="space-y-4">
                        {features.map((f, i) => {
                            const Icon = f.icon;
                            return (
                                <motion.div
                                    key={f.title}
                                    initial={{ opacity: 0, y: 12 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, amount: 0.2 }}
                                    transition={{
                                        duration: 0.5,
                                        delay: i * 0.08,
                                        ease: [0.22, 1, 0.36, 1],
                                    }}
                                    className="flex items-start gap-4 rounded-2xl border border-border/60 bg-card p-5"
                                >
                                    <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-muted)] text-[var(--accent)]">
                                        <Icon className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">{f.title}</h3>
                                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                                            {f.description}
                                        </p>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
}
