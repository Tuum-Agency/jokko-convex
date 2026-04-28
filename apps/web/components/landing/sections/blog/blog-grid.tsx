"use client";

import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import Link from "next/link";

type Post = {
    slug: string;
    category: string;
    title: string;
    excerpt: string;
    author: { name: string; initials: string; gradient: string };
    date: string;
    readTime: string;
    coverGradient: string;
};

const posts: Post[] = [
    {
        slug: "template-whatsapp-qui-convertit",
        category: "Marketing",
        title: "10 modèles de templates WhatsApp qui convertissent à +35%",
        excerpt:
            "Benchmark sur 450 000 envois : les structures, les call-to-action et les timings qui font réellement bouger le taux de clic.",
        author: {
            name: "Thomas Renaud",
            initials: "TR",
            gradient: "from-teal-400 to-teal-600",
        },
        date: "11 avril 2026",
        readTime: "7 min",
        coverGradient: "from-emerald-500 to-teal-600",
    },
    {
        slug: "ia-copilot-comparaison",
        category: "Produit",
        title: "IA générative dans le support client : ce qui marche vraiment",
        excerpt:
            "Nous avons testé 12 approches d'assistance IA sur 50 000 conversations réelles. Résultats honnêtes, y compris nos échecs.",
        author: {
            name: "Aliou Diallo",
            initials: "AD",
            gradient: "from-violet-400 to-violet-600",
        },
        date: "4 avril 2026",
        readTime: "9 min",
        coverGradient: "from-violet-500 to-fuchsia-600",
    },
    {
        slug: "etude-temps-reponse-b2c",
        category: "Étude",
        title: "Le temps de première réponse idéal sur WhatsApp ? 47 secondes.",
        excerpt:
            "Analyse longitudinale de 2.3M conversations B2C en Afrique de l'Ouest. Au-delà de 2 minutes, la probabilité de conversion chute de 62%.",
        author: {
            name: "Cheikh Fall",
            initials: "CF",
            gradient: "from-sky-400 to-sky-600",
        },
        date: "28 mars 2026",
        readTime: "11 min",
        coverGradient: "from-sky-500 to-indigo-600",
    },
    {
        slug: "routage-round-robin",
        category: "Opérations",
        title: "Round-robin, charge, langue : quel routage pour votre équipe ?",
        excerpt:
            "Trois stratégies de distribution des conversations. Comment choisir selon la taille, la maturité et la typologie de clients.",
        author: {
            name: "Élise Moreau",
            initials: "EM",
            gradient: "from-emerald-400 to-emerald-600",
        },
        date: "21 mars 2026",
        readTime: "6 min",
        coverGradient: "from-amber-500 to-orange-600",
    },
    {
        slug: "rgpd-whatsapp-business",
        category: "Légal",
        title: "RGPD et WhatsApp Business : les 7 obligations que 90% des marques oublient",
        excerpt:
            "Consentement, rétention, transfert hors UE, notification Meta. Notre guide pratique avec checklist téléchargeable.",
        author: {
            name: "Léa Martin",
            initials: "LM",
            gradient: "from-rose-400 to-rose-600",
        },
        date: "14 mars 2026",
        readTime: "13 min",
        coverGradient: "from-rose-500 to-pink-600",
    },
    {
        slug: "shopify-whatsapp-integration",
        category: "Intégrations",
        title: "Shopify × WhatsApp : 5 scénarios d'automatisation qui rapportent",
        excerpt:
            "Abandon de panier, suivi de commande, retours, upsell. Les automations qui transforment votre support en canal de vente.",
        author: {
            name: "Julien Brun",
            initials: "JB",
            gradient: "from-indigo-400 to-indigo-600",
        },
        date: "7 mars 2026",
        readTime: "8 min",
        coverGradient: "from-indigo-500 to-purple-600",
    },
];

const categories = [
    "Tous",
    "Produit",
    "Marketing",
    "Étude",
    "Opérations",
    "Légal",
    "Intégrations",
];

export function BlogGrid() {
    return (
        <section className="relative py-16 md:py-24">
            <div className="mx-auto max-w-7xl px-6">
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.6 }}
                    className="mb-10 flex flex-wrap items-center gap-2"
                >
                    {categories.map((c, i) => (
                        <button
                            key={c}
                            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-all ${
                                i === 0
                                    ? "border-foreground bg-foreground text-background"
                                    : "border-border/60 bg-card text-muted-foreground hover:border-[var(--accent)]/40 hover:text-foreground"
                            }`}
                        >
                            {c}
                        </button>
                    ))}
                </motion.div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {posts.map((post, i) => (
                        <motion.article
                            key={post.slug}
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.1 }}
                            transition={{
                                duration: 0.6,
                                delay: i * 0.05,
                                ease: [0.22, 1, 0.36, 1],
                            }}
                        >
                            <Link
                                href={`/blog/${post.slug}`}
                                className="group block h-full overflow-hidden rounded-3xl border border-border/60 bg-card transition-all hover:-translate-y-1 hover:border-[var(--accent)]/40"
                            >
                                <div
                                    className={`relative h-48 overflow-hidden bg-gradient-to-br ${post.coverGradient}`}
                                >
                                    <div
                                        aria-hidden
                                        className="absolute inset-0 opacity-[0.12]"
                                        style={{
                                            backgroundImage:
                                                "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.9) 1px, transparent 0)",
                                            backgroundSize: "20px 20px",
                                        }}
                                    />
                                    <div
                                        aria-hidden
                                        className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-2xl"
                                    />
                                    <div className="absolute left-5 top-5">
                                        <span className="rounded-full border border-white/30 bg-white/10 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
                                            {post.category}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex h-[calc(100%-12rem)] flex-col p-6">
                                    <h3 className="font-display text-lg font-bold leading-snug tracking-tight transition-colors group-hover:text-[var(--accent)]">
                                        {post.title}
                                    </h3>
                                    <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                                        {post.excerpt}
                                    </p>

                                    <div className="mt-auto flex items-center justify-between pt-6">
                                        <div className="flex items-center gap-2.5">
                                            <div
                                                className={`flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br ${post.author.gradient} text-[10px] font-bold text-white`}
                                            >
                                                {post.author.initials}
                                            </div>
                                            <div className="text-xs">
                                                <p className="font-semibold">{post.author.name}</p>
                                                <p className="text-muted-foreground">{post.date}</p>
                                            </div>
                                        </div>
                                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                            <Clock className="h-3 w-3" />
                                            {post.readTime}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        </motion.article>
                    ))}
                </div>
            </div>
        </section>
    );
}
