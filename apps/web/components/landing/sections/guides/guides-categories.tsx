"use client";

import { motion } from "framer-motion";
import {
    MessageCircle,
    Zap,
    Users,
    Megaphone,
    Bot,
    Contact,
    BarChart3,
    Plug,
} from "lucide-react";
import Link from "next/link";

const categories = [
    {
        icon: MessageCircle,
        title: "Conversations",
        count: 12,
        description: "Inbox, filtres, assignation, templates",
        href: "/guides/conversations",
    },
    {
        icon: Zap,
        title: "Automatisations",
        count: 9,
        description: "Flow builder, conditions, webhooks",
        href: "/guides/flows",
    },
    {
        icon: Bot,
        title: "IA & Jo",
        count: 7,
        description: "Brouillons, résumés, détection d'intention",
        href: "/guides/ai",
    },
    {
        icon: Megaphone,
        title: "Campagnes",
        count: 8,
        description: "Broadcasts, segmentation, A/B tests",
        href: "/guides/broadcasts",
    },
    {
        icon: Contact,
        title: "CRM & Contacts",
        count: 10,
        description: "Tags, segments, import, champs custom",
        href: "/guides/crm",
    },
    {
        icon: Users,
        title: "Équipes & rôles",
        count: 6,
        description: "Permissions, invitations, audit log",
        href: "/guides/teams",
    },
    {
        icon: BarChart3,
        title: "Analytics",
        count: 5,
        description: "Dashboards, exports, alertes",
        href: "/guides/analytics",
    },
    {
        icon: Plug,
        title: "Intégrations",
        count: 14,
        description: "Shopify, HubSpot, Zapier, API",
        href: "/guides/integrations",
    },
];

export function GuidesCategories() {
    return (
        <section className="relative border-y border-border/60 bg-muted/30 py-20 md:py-24">
            <div className="mx-auto max-w-7xl px-6">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.7 }}
                    className="mb-10"
                >
                    <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-[var(--accent)]">
                        Par thématique
                    </p>
                    <h2 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">
                        Parcourez par sujet.
                    </h2>
                </motion.div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {categories.map((cat, i) => {
                        const Icon = cat.icon;
                        return (
                            <motion.div
                                key={cat.title}
                                initial={{ opacity: 0, y: 16 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, amount: 0.15 }}
                                transition={{
                                    duration: 0.5,
                                    delay: i * 0.04,
                                    ease: [0.22, 1, 0.36, 1],
                                }}
                            >
                                <Link
                                    href={cat.href}
                                    className="group flex h-full items-start gap-4 rounded-2xl border border-border/60 bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-[var(--accent)]/40"
                                >
                                    <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-muted)] text-[var(--accent)]">
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-baseline justify-between gap-2">
                                            <h3 className="font-semibold transition-colors group-hover:text-[var(--accent)]">
                                                {cat.title}
                                            </h3>
                                            <span className="font-mono text-[10px] text-muted-foreground">
                                                {cat.count}
                                            </span>
                                        </div>
                                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                                            {cat.description}
                                        </p>
                                    </div>
                                </Link>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
