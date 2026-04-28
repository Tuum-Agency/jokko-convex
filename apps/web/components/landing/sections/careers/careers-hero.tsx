"use client";

import { motion } from "framer-motion";
import { SplitText } from "@/components/animations/split-text";
import { ShimmerButton } from "@/components/landing/ui/shimmer-button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function CareersHero() {
    return (
        <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28">
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
                className="pointer-events-none absolute -left-20 top-20 h-[500px] w-[500px] rounded-full opacity-30 blur-[140px]"
                style={{
                    background:
                        "radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)",
                }}
            />

            <div className="relative mx-auto max-w-5xl px-6">
                <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="font-mono text-[11px] uppercase tracking-[0.25em] text-[var(--accent)]"
                >
                    Rejoignez-nous · 7 postes ouverts
                </motion.p>

                <h1 className="mt-6 font-display text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl">
                    <SplitText>Construisez quelque chose</SplitText>
                    <br />
                    <span className="bg-gradient-to-br from-[var(--accent)] to-[var(--accent-hover)] bg-clip-text text-transparent">
                        <SplitText delay={0.2}>qui compte vraiment.</SplitText>
                    </span>
                </h1>

                <motion.p
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                    className="mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl"
                >
                    Nous sommes une équipe de 14 personnes entre Paris et Dakar, en
                    hypercroissance, bien financée. Nous cherchons des profils rares
                    qui veulent façonner un produit utilisé tous les jours par des
                    milliers d'équipes.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.7 }}
                    className="mt-10 flex flex-wrap gap-3"
                >
                    <ShimmerButton asChild size="lg" variant="primary">
                        <Link href="#postes-ouverts">
                            Voir les postes
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </ShimmerButton>
                    <ShimmerButton asChild size="lg" variant="ghost">
                        <Link href="mailto:careers@jokko.co">Candidature spontanée</Link>
                    </ShimmerButton>
                </motion.div>
            </div>
        </section>
    );
}
