"use client";

import { motion } from "framer-motion";
import { Gauge } from "lucide-react";

const tiers = [
    {
        plan: "Starter",
        rps: "10",
        burst: "30",
        daily: "10 000",
    },
    {
        plan: "Growth",
        rps: "50",
        burst: "150",
        daily: "100 000",
    },
    {
        plan: "Scale",
        rps: "200",
        burst: "600",
        daily: "1 000 000",
    },
    {
        plan: "Enterprise",
        rps: "Custom",
        burst: "Custom",
        daily: "Illimité",
    },
];

export function ApiRateLimits() {
    return (
        <section className="relative border-y border-border/60 bg-muted/30 py-20 md:py-24">
            <div className="mx-auto max-w-5xl px-6">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.7 }}
                    className="mb-10 flex items-center gap-3"
                >
                    <Gauge className="h-5 w-5 text-[var(--accent)]" />
                    <div>
                        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-[var(--accent)]">
                            Rate limits
                        </p>
                        <h2 className="mt-1 font-display text-3xl font-bold tracking-tight md:text-4xl">
                            Des limites claires, des headers explicites.
                        </h2>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.6 }}
                    className="overflow-hidden rounded-2xl border border-border/60 bg-card"
                >
                    <div className="grid grid-cols-4 gap-0 border-b border-border/60 bg-muted/40">
                        <div className="p-4 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                            Plan
                        </div>
                        <div className="p-4 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                            Req / sec
                        </div>
                        <div className="p-4 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                            Burst
                        </div>
                        <div className="p-4 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                            Messages / jour
                        </div>
                    </div>
                    {tiers.map((tier, i) => (
                        <div
                            key={tier.plan}
                            className={`grid grid-cols-4 ${i > 0 ? "border-t border-border/40" : ""}`}
                        >
                            <div className="p-4 font-semibold">{tier.plan}</div>
                            <div className="p-4 font-mono text-sm">{tier.rps}</div>
                            <div className="p-4 font-mono text-sm">{tier.burst}</div>
                            <div className="p-4 font-mono text-sm">{tier.daily}</div>
                        </div>
                    ))}
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="mt-6 overflow-hidden rounded-2xl border border-border/60 bg-[var(--surface-dark)] shadow-2xl"
                >
                    <div className="border-b border-white/10 bg-white/[0.02] px-5 py-3">
                        <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--surface-dark-muted-foreground)]">
                            Response headers
                        </p>
                    </div>
                    <pre className="overflow-x-auto p-6 text-sm leading-relaxed">
                        <code className="font-mono text-white/90">
                            <span className="text-sky-400">X-RateLimit-Limit:</span>{" "}
                            50{"\n"}
                            <span className="text-sky-400">X-RateLimit-Remaining:</span>{" "}
                            47{"\n"}
                            <span className="text-sky-400">X-RateLimit-Reset:</span>{" "}
                            1745265000{"\n"}
                            <span className="text-sky-400">Retry-After:</span> 2
                        </code>
                    </pre>
                </motion.div>
            </div>
        </section>
    );
}
