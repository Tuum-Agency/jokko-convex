"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type Change = {
    type: "new" | "improved" | "fixed";
    text: string;
};

type Release = {
    version: string;
    date: string;
    title: string;
    summary: string;
    changes: Change[];
};

const releases: Release[] = [
    {
        version: "v2.8.0",
        date: "14 avril 2026",
        title: "Copilot Jo · Mode batch",
        summary:
            "Jo peut maintenant traiter jusqu'à 50 conversations en parallèle pour générer des brouillons. Idéal pour le back-from-weekend Monday morning.",
        changes: [
            { type: "new", text: "Mode batch pour Jo : générer 50 brouillons en parallèle" },
            { type: "new", text: "Raccourci clavier Cmd+Shift+J pour inviter Jo" },
            { type: "improved", text: "Latence de suggestion divisée par 2 (pass moyenne 1.4s)" },
            { type: "improved", text: "Détection d'intention : 94% → 97% de précision" },
            { type: "fixed", text: "Certains brouillons perdaient les emojis au copier-coller" },
        ],
    },
    {
        version: "v2.7.0",
        date: "1 avril 2026",
        title: "CRM · Champs personnalisés",
        summary:
            "Vous pouvez maintenant créer jusqu'à 20 champs personnalisés par contact. Tags dynamiques basés sur des règles. Sync bi-directionnelle avec Shopify.",
        changes: [
            { type: "new", text: "Champs personnalisés contacts (texte, nombre, date, select)" },
            { type: "new", text: "Tags dynamiques avec règles if/then" },
            { type: "new", text: "Sync bi-directionnelle Shopify (produits, commandes, clients)" },
            { type: "improved", text: "Recherche contacts 3× plus rapide sur les gros volumes" },
            { type: "fixed", text: "L'import CSV échouait avec les fichiers > 10 000 lignes" },
        ],
    },
    {
        version: "v2.6.2",
        date: "22 mars 2026",
        title: "Correctifs & performance",
        summary:
            "Une semaine focalisée sur la stabilité. Neuf bugs corrigés, dont trois sur les notifications iOS.",
        changes: [
            { type: "fixed", text: "Notifications push iOS ne réveillaient pas l'app en arrière-plan" },
            { type: "fixed", text: "Compteur de messages non lus erroné après un refresh" },
            { type: "fixed", text: "Upload d'images > 5 MB échouait silencieusement" },
            { type: "improved", text: "Temps de chargement de l'inbox : 1.2s → 650ms" },
        ],
    },
    {
        version: "v2.6.0",
        date: "8 mars 2026",
        title: "Broadcasts · Envois planifiés",
        summary:
            "Planifiez vos campagnes à la minute près, sur plusieurs fuseaux horaires. Segmentation par tag, langue ou historique de commande.",
        changes: [
            { type: "new", text: "Broadcasts planifiés (minute près, 14 fuseaux)" },
            { type: "new", text: "Segmentation avancée : tags + langue + last order" },
            { type: "new", text: "A/B testing sur 2 variantes de template" },
            { type: "improved", text: "Éditeur de template : aperçu live plus rapide" },
        ],
    },
    {
        version: "v2.5.0",
        date: "22 février 2026",
        title: "Flows · React Flow v12",
        summary:
            "Refonte complète du constructeur de flows. Nouveau rendu basé sur React Flow v12. Nœuds interactifs, variables dynamiques, webhooks sortants.",
        changes: [
            { type: "new", text: "Flow builder v2 (React Flow v12)" },
            { type: "new", text: "Nœuds interactifs : boutons, listes, quick replies" },
            { type: "new", text: "Variables dynamiques entre nœuds" },
            { type: "new", text: "Webhooks sortants avec retry configurable" },
            { type: "improved", text: "Édition multi-utilisateur en temps réel" },
        ],
    },
    {
        version: "v2.4.0",
        date: "5 février 2026",
        title: "Équipe · Rôles granulaires",
        summary:
            "Trois nouveaux rôles prédéfinis, et la possibilité de créer les vôtres. Permissions par numéro WhatsApp, par tag, par type d'action.",
        changes: [
            { type: "new", text: "Rôles personnalisés : créez vos propres permissions" },
            { type: "new", text: "Scope par numéro WhatsApp (un agent peut voir 1 WABA sur 5)" },
            { type: "improved", text: "Invitation d'équipe : lien magique 7 jours" },
            { type: "fixed", text: "Logout forcé après changement de mot de passe" },
        ],
    },
];

const typeStyles: Record<Change["type"], { label: string; className: string }> = {
    new: {
        label: "NOUVEAU",
        className:
            "bg-[var(--accent-muted)] text-[var(--accent)] border-[var(--accent)]/20",
    },
    improved: {
        label: "AMÉLIORÉ",
        className: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300",
    },
    fixed: {
        label: "CORRIGÉ",
        className:
            "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300",
    },
};

export function ChangelogTimeline() {
    return (
        <section className="relative py-20 md:py-24">
            <div className="mx-auto max-w-4xl px-6">
                <div className="relative">
                    <div
                        aria-hidden
                        className="absolute left-[11px] top-4 h-[calc(100%-40px)] w-px bg-gradient-to-b from-[var(--accent)]/40 via-border to-transparent md:left-[15px]"
                    />

                    <div className="space-y-16">
                        {releases.map((release, i) => (
                            <motion.article
                                key={release.version}
                                initial={{ opacity: 0, y: 24 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, amount: 0.15 }}
                                transition={{
                                    duration: 0.7,
                                    delay: i * 0.05,
                                    ease: [0.22, 1, 0.36, 1],
                                }}
                                className="relative pl-10 md:pl-14"
                            >
                                <div className="absolute left-0 top-1.5 flex h-6 w-6 md:h-8 md:w-8 items-center justify-center">
                                    <div className="h-3 w-3 rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent-hover)] shadow-[0_0_0_4px_var(--background),0_0_0_5px_var(--accent)/30]" />
                                </div>

                                <div className="flex flex-wrap items-center gap-3 text-sm">
                                    <span className="inline-flex items-center rounded-full bg-foreground px-2.5 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-background">
                                        {release.version}
                                    </span>
                                    <time className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                                        {release.date}
                                    </time>
                                </div>

                                <h2 className="mt-4 font-display text-2xl font-bold tracking-tight md:text-3xl">
                                    {release.title}
                                </h2>
                                <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
                                    {release.summary}
                                </p>

                                <ul className="mt-6 space-y-2.5">
                                    {release.changes.map((c, j) => {
                                        const style = typeStyles[c.type];
                                        return (
                                            <li
                                                key={j}
                                                className="flex items-start gap-3 rounded-xl border border-border/40 bg-card px-4 py-3"
                                            >
                                                <span
                                                    className={cn(
                                                        "inline-flex shrink-0 items-center justify-center rounded-full border px-1.5 py-0.5 font-mono text-[9px] font-bold tracking-wider",
                                                        style.className
                                                    )}
                                                >
                                                    {style.label}
                                                </span>
                                                <p className="text-sm leading-relaxed">{c.text}</p>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </motion.article>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
