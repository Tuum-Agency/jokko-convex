"use client";

import { motion } from "framer-motion";
import { Plug } from "lucide-react";

const integrations = [
    { name: "Shopify", initials: "SH", gradient: "from-emerald-400 to-emerald-600" },
    { name: "WooCommerce", initials: "WC", gradient: "from-violet-400 to-violet-600" },
    { name: "Stripe", initials: "ST", gradient: "from-indigo-400 to-indigo-600" },
    { name: "HubSpot", initials: "HS", gradient: "from-orange-400 to-orange-600" },
    { name: "Pipedrive", initials: "PD", gradient: "from-green-400 to-green-600" },
    { name: "Salesforce", initials: "SF", gradient: "from-sky-400 to-sky-600" },
    { name: "Zapier", initials: "ZP", gradient: "from-amber-400 to-amber-600" },
    { name: "Make", initials: "MK", gradient: "from-fuchsia-400 to-fuchsia-600" },
    { name: "Google Sheets", initials: "GS", gradient: "from-teal-400 to-teal-600" },
    { name: "Calendly", initials: "CL", gradient: "from-blue-400 to-blue-600" },
    { name: "Notion", initials: "NO", gradient: "from-slate-400 to-slate-600" },
    { name: "Slack", initials: "SL", gradient: "from-purple-400 to-purple-600" },
];

export function FeaturesIntegrationsSection() {
    return (
        <section className="relative overflow-hidden py-24 md:py-32">
            <div className="mx-auto max-w-7xl px-6">
                <div className="mx-auto max-w-2xl text-center">
                    <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--accent)]">
                        Intégrations natives
                    </p>
                    <h2 className="mt-4 font-display text-3xl font-bold tracking-tight md:text-5xl">
                        Connecté à vos outils préférés.
                    </h2>
                    <p className="mt-5 text-lg text-muted-foreground">
                        Jokko se branche à votre stack en 2 minutes. Pas de script, pas de dev, pas de dette
                        technique.
                    </p>
                </div>

                <div className="mt-14 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                    {integrations.map((it, i) => (
                        <motion.div
                            key={it.name}
                            initial={{ opacity: 0, y: 12 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.1 }}
                            transition={{ duration: 0.4, delay: i * 0.03, ease: [0.22, 1, 0.36, 1] }}
                            className="group flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-4 transition-colors hover:border-[var(--accent)]/40"
                        >
                            <div
                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-[11px] font-bold text-white shadow-sm ${it.gradient}`}
                            >
                                {it.initials}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold">{it.name}</p>
                                <p className="text-[11px] text-muted-foreground">Connexion 2 min</p>
                            </div>
                            <Plug className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-[var(--accent)]" />
                        </motion.div>
                    ))}
                </div>

                <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="mt-10 text-center font-mono text-[11px] uppercase tracking-wider text-muted-foreground"
                >
                    + API GraphQL · Webhooks · Zapier & Make
                </motion.p>
            </div>
        </section>
    );
}
