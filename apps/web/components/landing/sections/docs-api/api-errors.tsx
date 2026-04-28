"use client";

import { motion } from "framer-motion";
import { AlertCircle } from "lucide-react";

const errors = [
    {
        code: 400,
        name: "invalid_request",
        description: "Paramètres manquants ou mal formés. Voir le champ errors[] pour le détail.",
    },
    {
        code: 401,
        name: "unauthorized",
        description: "Clé API invalide, expirée ou révoquée.",
    },
    {
        code: 403,
        name: "insufficient_scope",
        description: "La clé n'a pas le scope requis pour cet endpoint.",
    },
    {
        code: 404,
        name: "not_found",
        description: "La ressource n'existe pas ou a été supprimée.",
    },
    {
        code: 409,
        name: "conflict",
        description: "État concurrent détecté (ex. message déjà envoyé).",
    },
    {
        code: 422,
        name: "validation_failed",
        description: "Validation métier échouée. Voir errors[].field pour la cause.",
    },
    {
        code: 429,
        name: "rate_limited",
        description: "Débit dépassé. Respectez le header Retry-After.",
    },
    {
        code: 500,
        name: "internal_error",
        description: "Erreur serveur. Un incident ouvert est visible sur status.jokko.com.",
    },
];

export function ApiErrors() {
    return (
        <section className="relative py-20 md:py-24">
            <div className="mx-auto max-w-5xl px-6">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.7 }}
                    className="mb-10 flex items-center gap-3"
                >
                    <AlertCircle className="h-5 w-5 text-[var(--accent)]" />
                    <div>
                        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-[var(--accent)]">
                            Codes d&apos;erreur
                        </p>
                        <h2 className="mt-1 font-display text-3xl font-bold tracking-tight md:text-4xl">
                            Erreurs lisibles, actionnables.
                        </h2>
                    </div>
                </motion.div>

                <div className="grid gap-3 md:grid-cols-2">
                    {errors.map((err, i) => (
                        <motion.div
                            key={err.code}
                            initial={{ opacity: 0, y: 8 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.1 }}
                            transition={{
                                duration: 0.4,
                                delay: i * 0.03,
                                ease: [0.22, 1, 0.36, 1],
                            }}
                            className="flex items-start gap-4 rounded-xl border border-border/60 bg-card p-4"
                        >
                            <span className="inline-flex h-10 w-12 shrink-0 items-center justify-center rounded-md bg-rose-500/10 font-mono text-sm font-bold text-rose-600 dark:text-rose-400">
                                {err.code}
                            </span>
                            <div className="min-w-0">
                                <code className="font-mono text-sm font-semibold">
                                    {err.name}
                                </code>
                                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                                    {err.description}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
