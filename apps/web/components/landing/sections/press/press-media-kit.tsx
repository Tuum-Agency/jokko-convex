"use client";

import { motion } from "framer-motion";
import { Download, Image as ImageIcon, Palette, Type, Briefcase } from "lucide-react";

const assets = [
    {
        icon: Briefcase,
        title: "Logo pack",
        description:
            "SVG, PNG. Versions horizontale, compacte, monochrome. Fond clair et sombre.",
        size: "2.1 MB",
        format: "ZIP",
    },
    {
        icon: Palette,
        title: "Guide de marque",
        description:
            "Palette OKLCH, typographie Geist, espacements, règles d'utilisation du logo.",
        size: "4.8 MB",
        format: "PDF",
    },
    {
        icon: ImageIcon,
        title: "Captures produit",
        description:
            "12 screenshots haute résolution : inbox, flow builder, campagnes, analytics.",
        size: "28 MB",
        format: "ZIP",
    },
    {
        icon: Type,
        title: "Portraits fondateurs",
        description:
            "Photos HD de l'équipe dirigeante, libres de droits pour usage éditorial.",
        size: "14 MB",
        format: "ZIP",
    },
];

export function PressMediaKit() {
    return (
        <section className="relative border-y border-border/60 bg-[var(--surface-dark)] py-20 text-[var(--surface-dark-foreground)] md:py-24">
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-[0.06]"
                style={{
                    backgroundImage:
                        "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.8) 1px, transparent 0)",
                    backgroundSize: "28px 28px",
                }}
            />
            <div className="relative mx-auto max-w-7xl px-6">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.7 }}
                    className="mb-12 flex items-end justify-between gap-4"
                >
                    <div>
                        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-[var(--accent)]">
                            Media kit
                        </p>
                        <h2 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">
                            Téléchargez tout.
                        </h2>
                    </div>
                    <a
                        href="/press/kit-jokko-2026.zip"
                        className="hidden items-center gap-2 rounded-full bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur transition-all hover:bg-white/15 md:inline-flex"
                    >
                        <Download className="h-4 w-4" />
                        Kit complet (45 MB)
                    </a>
                </motion.div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {assets.map((asset, i) => {
                        const Icon = asset.icon;
                        return (
                            <motion.a
                                key={asset.title}
                                href={`/press/${asset.title.toLowerCase().replace(/\s+/g, "-")}.zip`}
                                initial={{ opacity: 0, y: 16 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, amount: 0.15 }}
                                transition={{
                                    duration: 0.5,
                                    delay: i * 0.06,
                                    ease: [0.22, 1, 0.36, 1],
                                }}
                                className="group flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur transition-all hover:-translate-y-1 hover:bg-white/[0.08]"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--accent-muted)] text-[var(--accent)]">
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <Download className="h-4 w-4 text-[var(--surface-dark-muted-foreground)] transition-all group-hover:text-white group-hover:-translate-y-0.5" />
                                </div>
                                <h3 className="mt-5 font-semibold text-white">
                                    {asset.title}
                                </h3>
                                <p className="mt-1.5 flex-1 text-xs leading-relaxed text-[var(--surface-dark-muted-foreground)]">
                                    {asset.description}
                                </p>
                                <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 font-mono text-[10px] uppercase tracking-wider text-[var(--surface-dark-muted-foreground)]">
                                    <span>{asset.format}</span>
                                    <span>{asset.size}</span>
                                </div>
                            </motion.a>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
