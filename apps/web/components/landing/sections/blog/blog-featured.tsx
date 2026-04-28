"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, Clock } from "lucide-react";
import Link from "next/link";

export function BlogFeatured() {
    return (
        <section className="relative py-12">
            <div className="mx-auto max-w-7xl px-6">
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    className="group relative"
                >
                    <Link
                        href="/blog/whatsapp-business-guide-2026"
                        className="block overflow-hidden rounded-3xl border border-border/60 bg-card transition-all hover:-translate-y-1 hover:border-[var(--accent)]/40"
                    >
                        <div className="grid md:grid-cols-5">
                            <div className="relative min-h-[280px] overflow-hidden bg-gradient-to-br from-[var(--accent)] to-[var(--accent-hover)] md:col-span-2 md:min-h-[420px]">
                                <div
                                    aria-hidden
                                    className="absolute inset-0 opacity-[0.15]"
                                    style={{
                                        backgroundImage:
                                            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.9) 1px, transparent 0)",
                                        backgroundSize: "24px 24px",
                                    }}
                                />
                                <div
                                    aria-hidden
                                    className="absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-white/10 blur-3xl"
                                />
                                <div className="relative flex h-full flex-col justify-between p-8 text-white">
                                    <span className="inline-flex w-fit items-center rounded-full border border-white/30 bg-white/10 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider backdrop-blur-sm">
                                        À la une
                                    </span>
                                    <div>
                                        <div className="font-display text-5xl font-bold leading-none tracking-tighter opacity-40 md:text-7xl">
                                            2026
                                        </div>
                                        <p className="mt-3 font-mono text-xs uppercase tracking-wider text-white/70">
                                            Le guide de référence
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 md:col-span-3 md:p-12">
                                <div className="flex flex-wrap gap-2">
                                    {["Stratégie", "Benchmark", "Données"].map((t) => (
                                        <span
                                            key={t}
                                            className="rounded-full border border-border/60 bg-background px-2.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground"
                                        >
                                            {t}
                                        </span>
                                    ))}
                                </div>

                                <h2 className="mt-6 font-display text-3xl font-bold tracking-tight md:text-5xl">
                                    WhatsApp Business en 2026 : ce qui a changé en 12 mois
                                </h2>
                                <p className="mt-5 text-base leading-relaxed text-muted-foreground md:text-lg">
                                    Nouveaux formats de templates, IA native, vérification
                                    business étendue, tarifs meta modifiés. Notre analyse
                                    complète de l'écosystème WhatsApp B2B, avec chiffres et
                                    comparaisons vs les canaux traditionnels.
                                </p>

                                <div className="mt-8 flex items-center justify-between border-t border-border/60 pt-6">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-violet-600 text-sm font-bold text-white">
                                            LM
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold">Léa Martin</p>
                                            <p className="text-xs text-muted-foreground">
                                                18 avril 2026
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                                            <Clock className="h-3 w-3" />
                                            12 min
                                        </span>
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background transition-all group-hover:border-[var(--accent)] group-hover:bg-[var(--accent)]">
                                            <ArrowUpRight className="h-4 w-4 transition-colors group-hover:text-white" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Link>
                </motion.div>
            </div>
        </section>
    );
}
