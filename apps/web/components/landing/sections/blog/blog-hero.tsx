"use client";

import { motion } from "framer-motion";
import { SplitText } from "@/components/animations/split-text";

export function BlogHero() {
    return (
        <section className="relative overflow-hidden pt-32 pb-12 md:pt-40 md:pb-16">
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-[0.04]"
                style={{
                    backgroundImage:
                        "radial-gradient(circle at 1px 1px, rgba(15,23,42,0.8) 1px, transparent 0)",
                    backgroundSize: "28px 28px",
                }}
            />

            <div className="relative mx-auto max-w-5xl px-6">
                <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="font-mono text-[11px] uppercase tracking-[0.25em] text-[var(--accent)]"
                >
                    Le blog Jokko · Un article par semaine
                </motion.p>

                <h1 className="mt-6 font-display text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl">
                    <SplitText>Des idées qui sentent</SplitText>
                    <br />
                    <span className="bg-gradient-to-br from-[var(--accent)] to-[var(--accent-hover)] bg-clip-text text-transparent">
                        <SplitText delay={0.2}>le terrain.</SplitText>
                    </span>
                </h1>

                <motion.p
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                    className="mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl"
                >
                    Études chiffrées, retours de clients, tutoriels pratiques. Pas de
                    fluff IA, pas de SEO cheap. Juste ce qui vous fera vendre et
                    supporter mieux sur WhatsApp.
                </motion.p>
            </div>
        </section>
    );
}
