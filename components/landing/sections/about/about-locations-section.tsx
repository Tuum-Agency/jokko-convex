"use client";

import { motion } from "framer-motion";
import { MapPin } from "lucide-react";

const locations = [
    {
        city: "Paris",
        country: "France",
        address: "12 rue du Faubourg Saint-Honoré, 75008",
        team: "Engineering · Design · Growth",
        coords: "48.87° N, 2.31° E",
    },
    {
        city: "Dakar",
        country: "Sénégal",
        address: "Route de Ngor, Almadies",
        team: "Product · Backend · Support",
        coords: "14.71° N, 17.46° O",
    },
];

export function AboutLocationsSection() {
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
                        Deux bureaux, un fuseau
                    </p>
                    <h2 className="mt-4 font-display text-4xl font-bold tracking-tight md:text-6xl">
                        Entre Paris et Dakar.
                    </h2>
                </motion.div>

                <div className="mt-16 grid gap-6 md:grid-cols-2">
                    {locations.map((loc, i) => (
                        <motion.div
                            key={loc.city}
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.2 }}
                            transition={{
                                duration: 0.7,
                                delay: i * 0.15,
                                ease: [0.22, 1, 0.36, 1],
                            }}
                            className="group relative overflow-hidden rounded-3xl border border-border/60 bg-card p-8 transition-all hover:-translate-y-1 hover:border-[var(--accent)]/40"
                        >
                            <div
                                aria-hidden
                                className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-10 blur-3xl transition-opacity group-hover:opacity-20"
                                style={{
                                    background:
                                        "radial-gradient(circle, var(--accent) 0%, transparent 70%)",
                                }}
                            />
                            <div className="relative flex items-start justify-between">
                                <div>
                                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-muted)] text-[var(--accent)]">
                                        <MapPin className="h-6 w-6" />
                                    </div>
                                    <h3 className="mt-6 font-display text-4xl font-bold tracking-tight">
                                        {loc.city}
                                    </h3>
                                    <p className="text-sm uppercase tracking-wider text-muted-foreground">
                                        {loc.country}
                                    </p>
                                </div>
                                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                                    {loc.coords}
                                </span>
                            </div>

                            <div className="mt-8 space-y-2 border-t border-border/60 pt-6">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                        Adresse
                                    </p>
                                    <p className="mt-1 text-sm">{loc.address}</p>
                                </div>
                                <div className="pt-3">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                        Équipes sur place
                                    </p>
                                    <p className="mt-1 text-sm">{loc.team}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
