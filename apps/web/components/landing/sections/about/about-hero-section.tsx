"use client";

import { motion } from "framer-motion";
import { SplitText } from "@/components/animations/split-text";

export function AboutHeroSection() {
    return (
        <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28">
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-[0.04]"
                style={{
                    backgroundImage:
                        "radial-gradient(circle at 1px 1px, rgba(var(--foreground-rgb,15,23,42),0.8) 1px, transparent 0)",
                    backgroundSize: "28px 28px",
                }}
            />
            <div
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-0 h-[600px] w-[900px] -translate-x-1/2 opacity-40 blur-[140px]"
                style={{
                    background:
                        "radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)",
                }}
            />

            <div className="relative mx-auto max-w-5xl px-6 text-center">
                <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="font-mono text-[11px] uppercase tracking-[0.25em] text-[var(--accent)]"
                >
                    Notre histoire · Depuis 2024
                </motion.p>

                <h1 className="mt-6 font-display text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl">
                    <SplitText>Construit pour les équipes</SplitText>
                    <br />
                    <span className="bg-gradient-to-br from-[var(--accent)] to-[var(--accent-hover)] bg-clip-text text-transparent">
                        <SplitText delay={0.2}>qui vendent sur WhatsApp.</SplitText>
                    </span>
                </h1>

                <motion.p
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                    className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl"
                >
                    Jokko est né de la frustration de voir des équipes talentueuses
                    jongler avec 5 téléphones et des tableurs Excel pour gérer leurs
                    clients WhatsApp. Nous construisons la plateforme que nous aurions
                    voulu avoir.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.7 }}
                    className="mx-auto mt-12 flex max-w-2xl flex-wrap justify-center gap-8 md:gap-12"
                >
                    {[
                        { value: "2024", label: "Année de lancement" },
                        { value: "2", label: "Pays (FR · SN)" },
                        { value: "14", label: "Personnes dans l'équipe" },
                    ].map((stat) => (
                        <div key={stat.label} className="text-center">
                            <div className="font-display text-3xl font-bold md:text-4xl">
                                {stat.value}
                            </div>
                            <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
                                {stat.label}
                            </div>
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
