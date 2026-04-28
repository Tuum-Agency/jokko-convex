"use client";

import { motion } from "framer-motion";
import { SplitText } from "@/components/animations/split-text";
import { Shield, Download } from "lucide-react";

export function DpaHero() {
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

            <div className="relative mx-auto max-w-4xl px-6">
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="flex items-center gap-2"
                >
                    <Shield className="h-4 w-4 text-[var(--accent)]" />
                    <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-[var(--accent)]">
                        Juridique · RGPD · Version 2026.02
                    </p>
                </motion.div>

                <h1 className="mt-6 font-display text-5xl font-bold leading-[1.05] tracking-tight md:text-6xl">
                    <SplitText>Data Processing</SplitText>
                    <br />
                    <span className="bg-gradient-to-br from-[var(--accent)] to-[var(--accent-hover)] bg-clip-text text-transparent">
                        <SplitText delay={0.2}>Agreement.</SplitText>
                    </span>
                </h1>

                <motion.p
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                    className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground"
                >
                    Accord de traitement des données à caractère personnel entre
                    le Client (responsable de traitement) et Jokko SAS
                    (sous-traitant), conforme à l&apos;article 28 du RGPD et au
                    Data Protection Act.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.7 }}
                    className="mt-8 flex flex-wrap items-center gap-3"
                >
                    <a
                        href="/legal/jokko-dpa-2026.pdf"
                        className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-[var(--accent-hover)]"
                    >
                        <Download className="h-4 w-4" />
                        Télécharger le PDF signable
                    </a>
                    <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card px-5 py-2.5 font-mono text-xs text-muted-foreground">
                        Mis à jour le 14 février 2026
                    </span>
                </motion.div>
            </div>
        </section>
    );
}
