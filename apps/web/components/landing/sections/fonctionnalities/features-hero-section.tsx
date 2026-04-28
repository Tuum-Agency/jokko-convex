"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { ShimmerButton } from "@/components/landing/ui/shimmer-button";
import { SplitText } from "@/components/animations/split-text";

export function FeaturesHeroSection() {
    return (
        <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28">
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-[0.04]"
                style={{
                    backgroundImage:
                        "radial-gradient(circle at 1px 1px, rgba(20,20,26,0.9) 1px, transparent 0)",
                    backgroundSize: "28px 28px",
                }}
            />
            <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-[600px]"
                style={{
                    background:
                        "radial-gradient(ellipse at 50% 0%, var(--accent-glow) 0%, transparent 55%)",
                    opacity: 0.5,
                }}
            />

            <div className="relative mx-auto max-w-4xl px-6 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground backdrop-blur"
                >
                    <Sparkles className="h-3 w-3 text-[var(--accent)]" />
                    Produit · 2026
                </motion.div>

                <h1 className="mt-8 font-display text-[clamp(2.5rem,7vw,5.5rem)] font-bold leading-[1.02] tracking-[-0.03em]">
                    <SplitText as="span" className="block">
                        Tout ce qu&apos;il vous faut
                    </SplitText>
                    <SplitText
                        as="span"
                        delay={0.2}
                        className="block bg-gradient-to-br from-foreground via-foreground to-[var(--accent)] bg-clip-text text-transparent"
                    >
                        pour WhatsApp pro.
                    </SplitText>
                </h1>

                <motion.p
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                    className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl"
                >
                    Inbox partagée, copilot IA, campagnes marketing, CRM, automatisations, analytics. Une
                    plateforme pensée pour les équipes qui vendent et supportent sur WhatsApp.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.7 }}
                    className="mt-10 flex flex-wrap items-center justify-center gap-3"
                >
                    <ShimmerButton asChild size="lg" variant="primary">
                        <Link href="/auth/sign-up" className="group">
                            Démarrer gratuitement
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        </Link>
                    </ShimmerButton>
                    <ShimmerButton asChild size="lg" variant="ghost">
                        <Link href="/tarifs">Voir les tarifs</Link>
                    </ShimmerButton>
                </motion.div>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.9 }}
                    className="mt-6 font-mono text-[11px] uppercase tracking-wider text-muted-foreground"
                >
                    Sans carte · RGPD · Hébergement UE · Support FR/EN
                </motion.p>
            </div>
        </section>
    );
}
