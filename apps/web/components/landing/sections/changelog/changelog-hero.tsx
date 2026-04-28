"use client";

import { motion } from "framer-motion";
import { SplitText } from "@/components/animations/split-text";
import { Rss } from "lucide-react";

export function ChangelogHero() {
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

            <div className="relative mx-auto max-w-5xl px-6 text-center">
                <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="font-mono text-[11px] uppercase tracking-[0.25em] text-[var(--accent)]"
                >
                    Journal des versions · Mis à jour hebdomadaire
                </motion.p>

                <h1 className="mt-6 font-display text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl">
                    <SplitText>Tout ce qu'on livre,</SplitText>
                    <br />
                    <span className="bg-gradient-to-br from-[var(--accent)] to-[var(--accent-hover)] bg-clip-text text-transparent">
                        <SplitText delay={0.2}>expliqué clairement.</SplitText>
                    </span>
                </h1>

                <motion.p
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                    className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl"
                >
                    Chaque semaine, on déploie. Chaque semaine, on documente.
                    Nouveautés, améliorations, corrections : tout est ici, dans
                    l'ordre chronologique.
                </motion.p>

                <motion.a
                    href="/rss/changelog.xml"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.7 }}
                    className="mt-8 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-[var(--accent)]/40 hover:text-[var(--accent)]"
                >
                    <Rss className="h-3.5 w-3.5" />
                    S'abonner au flux RSS
                </motion.a>
            </div>
        </section>
    );
}
