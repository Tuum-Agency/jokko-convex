"use client";

import { motion } from "framer-motion";
import {
    Rocket,
    KeyRound,
    MessageSquare,
    Webhook,
    Package,
    Shield,
    Zap,
    FileJson,
} from "lucide-react";
import Link from "next/link";

const categories = [
    {
        icon: Rocket,
        title: "Démarrage rapide",
        description:
            "Créez une clé API, envoyez votre premier message en moins de 10 minutes.",
        items: ["Installation", "Authentification", "Hello world", "Environnements"],
        href: "/docs/quickstart",
    },
    {
        icon: KeyRound,
        title: "Authentification",
        description:
            "API keys, OAuth 2.0, scopes, rotation, bonnes pratiques de sécurité.",
        items: ["API keys", "OAuth flow", "Scopes", "Rotation"],
        href: "/docs/auth",
    },
    {
        icon: MessageSquare,
        title: "Conversations & messages",
        description:
            "Envoyer du texte, des médias, des templates, des interactives. Statuts de livraison.",
        items: ["Send message", "Templates", "Media", "Delivery status"],
        href: "/docs/messages",
    },
    {
        icon: Webhook,
        title: "Webhooks",
        description:
            "Recevez les événements temps réel : messages entrants, statuts, optins.",
        items: ["Inscription", "Signature HMAC", "Retries", "Payload"],
        href: "/docs/webhooks",
    },
    {
        icon: Package,
        title: "SDK officiels",
        description:
            "Libraries maintenues pour Node.js, Python, Go, PHP. TypeScript-first.",
        items: ["Node.js", "Python", "Go", "PHP"],
        href: "/docs/sdk",
    },
    {
        icon: FileJson,
        title: "Référence API",
        description:
            "Tous les endpoints, paramètres, codes d'erreur, limites de débit.",
        items: ["Endpoints", "Erreurs", "Rate limits", "Versioning"],
        href: "/docs/api",
    },
    {
        icon: Zap,
        title: "Flows & automatisations",
        description:
            "Construisez des conversations automatisées via API ou le builder visuel.",
        items: ["Déclencheurs", "Conditions", "Actions", "Debug"],
        href: "/docs/flows",
    },
    {
        icon: Shield,
        title: "Sécurité & conformité",
        description:
            "RGPD, chiffrement, journaux d'audit, DPA, résidence des données.",
        items: ["Chiffrement", "RGPD", "Audit log", "SOC 2"],
        href: "/docs/security",
    },
];

export function DocsCategories() {
    return (
        <section className="relative border-y border-border/60 bg-muted/30 py-20 md:py-24">
            <div className="mx-auto max-w-7xl px-6">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.7 }}
                    className="mb-12"
                >
                    <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-[var(--accent)]">
                        Sections
                    </p>
                    <h2 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">
                        Plongez là où vous êtes bloqué.
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
                                    className="group flex h-full flex-col rounded-2xl border border-border/60 bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-[var(--accent)]/40"
                                >
                                    <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--accent-muted)] text-[var(--accent)]">
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <h3 className="mt-4 font-semibold transition-colors group-hover:text-[var(--accent)]">
                                        {cat.title}
                                    </h3>
                                    <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                                        {cat.description}
                                    </p>
                                    <ul className="mt-4 space-y-1.5 border-t border-border/40 pt-4">
                                        {cat.items.map((item) => (
                                            <li
                                                key={item}
                                                className="font-mono text-[11px] text-muted-foreground transition-colors group-hover:text-foreground"
                                            >
                                                → {item}
                                            </li>
                                        ))}
                                    </ul>
                                </Link>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
