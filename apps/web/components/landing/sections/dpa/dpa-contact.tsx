"use client";

import { motion } from "framer-motion";
import { Mail, ShieldCheck, FileCheck2 } from "lucide-react";

const actions = [
    {
        icon: Mail,
        title: "Signer le DPA",
        description:
            "Renvoyez-nous le PDF signé par un représentant légal de votre société.",
        cta: "privacy@jokko.com",
        href: "mailto:privacy@jokko.com",
    },
    {
        icon: ShieldCheck,
        title: "Contacter notre DPO",
        description:
            "Délégué à la protection des données indépendant, joignable à tout moment.",
        cta: "dpo@jokko.com",
        href: "mailto:dpo@jokko.com",
    },
    {
        icon: FileCheck2,
        title: "Voir nos certifications",
        description:
            "ISO 27001, SOC 2, RGPD : les documents d'audit sont accessibles sur demande.",
        cta: "Centre de confiance",
        href: "/trust",
    },
];

export function DpaContact() {
    return (
        <section className="relative border-t border-border/60 bg-muted/30 py-20 md:py-24">
            <div className="mx-auto max-w-5xl px-6">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.7 }}
                    className="mb-10"
                >
                    <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-[var(--accent)]">
                        Besoin d&apos;aller plus loin ?
                    </p>
                    <h2 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">
                        Ressources conformité.
                    </h2>
                </motion.div>

                <div className="grid gap-4 md:grid-cols-3">
                    {actions.map((a, i) => {
                        const Icon = a.icon;
                        return (
                            <motion.a
                                key={a.title}
                                href={a.href}
                                initial={{ opacity: 0, y: 16 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, amount: 0.2 }}
                                transition={{
                                    duration: 0.5,
                                    delay: i * 0.08,
                                    ease: [0.22, 1, 0.36, 1],
                                }}
                                className="group flex h-full flex-col rounded-2xl border border-border/60 bg-card p-6 transition-all hover:-translate-y-1 hover:border-[var(--accent)]/40"
                            >
                                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--accent-muted)] text-[var(--accent)]">
                                    <Icon className="h-5 w-5" />
                                </div>
                                <h3 className="mt-5 font-semibold">{a.title}</h3>
                                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted-foreground">
                                    {a.description}
                                </p>
                                <span className="mt-4 inline-flex items-center gap-1.5 border-t border-border/40 pt-4 font-mono text-xs font-semibold text-[var(--accent)]">
                                    {a.cta} →
                                </span>
                            </motion.a>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
