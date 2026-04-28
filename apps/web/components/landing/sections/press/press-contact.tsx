"use client";

import { motion } from "framer-motion";
import { Mail, Phone, MapPin } from "lucide-react";

export function PressContact() {
    return (
        <section className="relative py-20 md:py-24">
            <div className="mx-auto max-w-4xl px-6">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.7 }}
                    className="overflow-hidden rounded-3xl border border-border/60 bg-card p-10 text-center md:p-16"
                >
                    <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-[var(--accent)]">
                        Contact presse
                    </p>
                    <h2 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">
                        Une question ? Une interview ?
                    </h2>
                    <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
                        Réponse sous 24 h ouvrées. Pour toute demande
                        d&apos;information, témoignage client, données de marché ou
                        rendez-vous avec un fondateur.
                    </p>

                    <div className="mt-10 grid gap-4 md:grid-cols-3">
                        <a
                            href="mailto:press@jokko.com"
                            className="group flex flex-col items-center gap-2 rounded-2xl border border-border/60 bg-background/40 p-5 transition-all hover:-translate-y-0.5 hover:border-[var(--accent)]/40"
                        >
                            <Mail className="h-5 w-5 text-[var(--accent)]" />
                            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                                E-mail
                            </span>
                            <span className="text-sm font-semibold transition-colors group-hover:text-[var(--accent)]">
                                press@jokko.com
                            </span>
                        </a>
                        <a
                            href="tel:+33175850000"
                            className="group flex flex-col items-center gap-2 rounded-2xl border border-border/60 bg-background/40 p-5 transition-all hover:-translate-y-0.5 hover:border-[var(--accent)]/40"
                        >
                            <Phone className="h-5 w-5 text-[var(--accent)]" />
                            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                                Téléphone
                            </span>
                            <span className="text-sm font-semibold transition-colors group-hover:text-[var(--accent)]">
                                +33 1 75 85 00 00
                            </span>
                        </a>
                        <div className="flex flex-col items-center gap-2 rounded-2xl border border-border/60 bg-background/40 p-5">
                            <MapPin className="h-5 w-5 text-[var(--accent)]" />
                            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                                Bureaux
                            </span>
                            <span className="text-sm font-semibold">Paris · Dakar</span>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
