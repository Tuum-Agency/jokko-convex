"use client";

import { motion } from "framer-motion";
import Link from "next/link";

type Method = "GET" | "POST" | "PATCH" | "DELETE";

const endpoints: Array<{
    group: string;
    routes: Array<{ method: Method; path: string; label: string }>;
}> = [
    {
        group: "Messages",
        routes: [
            { method: "POST", path: "/v2/messages", label: "Envoyer un message" },
            {
                method: "GET",
                path: "/v2/messages/:id",
                label: "Récupérer un message",
            },
            {
                method: "POST",
                path: "/v2/messages/:id/reactions",
                label: "Ajouter une réaction",
            },
        ],
    },
    {
        group: "Conversations",
        routes: [
            {
                method: "GET",
                path: "/v2/conversations",
                label: "Lister les conversations",
            },
            {
                method: "PATCH",
                path: "/v2/conversations/:id",
                label: "Mettre à jour (assigner, fermer)",
            },
            {
                method: "POST",
                path: "/v2/conversations/:id/notes",
                label: "Ajouter une note interne",
            },
        ],
    },
    {
        group: "Contacts",
        routes: [
            { method: "GET", path: "/v2/contacts", label: "Lister les contacts" },
            { method: "POST", path: "/v2/contacts", label: "Créer un contact" },
            {
                method: "PATCH",
                path: "/v2/contacts/:id",
                label: "Mettre à jour un contact",
            },
            {
                method: "DELETE",
                path: "/v2/contacts/:id",
                label: "Supprimer (RGPD)",
            },
        ],
    },
    {
        group: "Templates",
        routes: [
            {
                method: "GET",
                path: "/v2/templates",
                label: "Lister les templates approuvés",
            },
            {
                method: "POST",
                path: "/v2/templates",
                label: "Soumettre un template à Meta",
            },
        ],
    },
    {
        group: "Webhooks",
        routes: [
            {
                method: "GET",
                path: "/v2/webhooks",
                label: "Lister les endpoints enregistrés",
            },
            {
                method: "POST",
                path: "/v2/webhooks",
                label: "Créer un endpoint",
            },
            {
                method: "POST",
                path: "/v2/webhooks/:id/retry",
                label: "Rejouer un événement",
            },
        ],
    },
];

const methodColors: Record<Method, string> = {
    GET: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
    POST: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    PATCH: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    DELETE: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
};

export function ApiEndpoints() {
    return (
        <section className="relative py-20 md:py-24">
            <div className="mx-auto max-w-5xl px-6">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.7 }}
                    className="mb-10"
                >
                    <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-[var(--accent)]">
                        Endpoints
                    </p>
                    <h2 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">
                        Tout ce que vous pouvez appeler.
                    </h2>
                </motion.div>

                <div className="space-y-8">
                    {endpoints.map((group, gi) => (
                        <motion.div
                            key={group.group}
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.15 }}
                            transition={{
                                duration: 0.5,
                                delay: gi * 0.05,
                                ease: [0.22, 1, 0.36, 1],
                            }}
                        >
                            <h3 className="mb-3 font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                {group.group}
                            </h3>
                            <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
                                {group.routes.map((route, i) => (
                                    <Link
                                        key={route.path}
                                        href={`/docs/api#${route.path.replace(/[^\w]/g, "-")}`}
                                        className={`group flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-[var(--accent-muted)]/40 ${
                                            i > 0 ? "border-t border-border/40" : ""
                                        }`}
                                    >
                                        <span
                                            className={`inline-block w-16 shrink-0 rounded-md px-2 py-0.5 text-center font-mono text-[10px] font-bold uppercase ${methodColors[route.method]}`}
                                        >
                                            {route.method}
                                        </span>
                                        <code className="font-mono text-sm text-foreground transition-colors group-hover:text-[var(--accent)]">
                                            {route.path}
                                        </code>
                                        <span className="ml-auto hidden truncate text-xs text-muted-foreground md:block">
                                            {route.label}
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
