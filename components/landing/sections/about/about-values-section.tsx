"use client";

import { motion } from "framer-motion";

const values = [
    {
        number: "01",
        title: "Livrer, pas expliquer.",
        description:
            "Un bug pris le matin, déployé l'après-midi. Pas de réunion de priorisation, pas de roadmap figée. Les clients sentent la différence chaque semaine.",
    },
    {
        number: "02",
        title: "Le détail est le produit.",
        description:
            "60 ms d'animation, 3 px d'alignement, un mot de copy. Si ça ne fait pas l'expérience meilleure, on l'enlève. Si ça l'améliore, on le laisse.",
    },
    {
        number: "03",
        title: "Écouter, pas devancer.",
        description:
            "Nos meilleures features viennent de clients qui nous ont demandé quelque chose de précis. On ne construit pas à l'aveugle.",
    },
    {
        number: "04",
        title: "La transparence par défaut.",
        description:
            "Roadmap publique, changelog public, prix publics, incidents publics. Si c'est pertinent pour nos clients, c'est visible.",
    },
    {
        number: "05",
        title: "Personne ne se débat seul.",
        description:
            "Le support n'est pas un département, c'est l'équipe entière. Les ingénieurs répondent aux tickets. Les commerciaux ouvrent la doc.",
    },
    {
        number: "06",
        title: "Local, par conviction.",
        description:
            "Équipe franco-sénégalaise. Des talents basés entre Paris et Dakar. Nous croyons que les meilleurs produits B2B viennent d'équipes mixtes.",
    },
];

export function AboutValuesSection() {
    return (
        <section className="relative overflow-hidden bg-[var(--surface-dark)] py-24 text-[var(--surface-dark-foreground)] md:py-32">
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-[0.05]"
                style={{
                    backgroundImage:
                        "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.9) 1px, transparent 0)",
                    backgroundSize: "28px 28px",
                }}
            />
            <div
                aria-hidden
                className="pointer-events-none absolute -left-40 top-1/2 h-[500px] w-[500px] -translate-y-1/2 rounded-full opacity-30 blur-[140px]"
                style={{
                    background:
                        "radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)",
                }}
            />

            <div className="relative mx-auto max-w-7xl px-6">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.7 }}
                    className="mx-auto max-w-2xl text-center"
                >
                    <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-[var(--accent)]">
                        Les valeurs derrière chaque PR
                    </p>
                    <h2 className="mt-4 font-display text-4xl font-bold tracking-tight text-white md:text-6xl">
                        Six principes, zéro compromis.
                    </h2>
                </motion.div>

                <div className="mt-16 grid gap-0 md:grid-cols-2 lg:grid-cols-3">
                    {values.map((v, i) => (
                        <motion.div
                            key={v.number}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.2 }}
                            transition={{
                                duration: 0.6,
                                delay: i * 0.08,
                                ease: [0.22, 1, 0.36, 1],
                            }}
                            className="group relative border-b border-white/10 p-8 transition-colors last:border-b-0 hover:bg-white/[0.03] md:border-r md:[&:nth-child(2n)]:border-r-0 lg:[&:nth-child(2n)]:border-r lg:[&:nth-child(3n)]:border-r-0"
                        >
                            <span className="font-mono text-xs uppercase tracking-wider text-[var(--accent)]">
                                {v.number}
                            </span>
                            <h3 className="mt-4 font-display text-2xl font-bold tracking-tight text-white">
                                {v.title}
                            </h3>
                            <p className="mt-3 text-[15px] leading-relaxed text-white/70">
                                {v.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
