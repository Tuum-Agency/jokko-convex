"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowUpRight, Linkedin, Twitter, Quote } from "lucide-react";
import { CountUp } from "@/components/animations/count-up";

type Founder = {
    initials: string;
    name: string;
    role: string;
    location: string;
    gradient: string;
    quote: string;
    bio: string;
    previously: string;
    linkedin: string;
    twitter?: string;
};

type Member = {
    initials: string;
    name: string;
    role: string;
    location: string;
    gradient: string;
    previously: string;
    linkedin: string;
};

const founders: Founder[] = [
    {
        initials: "AD",
        name: "Aliou Diallo",
        role: "CEO & Cofondateur",
        location: "Dakar",
        gradient: "from-violet-500 via-fuchsia-500 to-indigo-500",
        quote:
            "Mes parents vendaient sur WhatsApp avec 3 téléphones posés sur la table. On construit ce qu'ils auraient voulu.",
        bio: "Huit ans à scaler des produits paiement en Afrique de l'Ouest. A fini par créer l'outil qu'il cherchait sans jamais le trouver.",
        previously: "Ex-Wave · Orange Money",
        linkedin: "https://linkedin.com/in/aliou-diallo",
        twitter: "https://twitter.com/aliou",
    },
    {
        initials: "LM",
        name: "Léa Martin",
        role: "CTO & Cofondatrice",
        location: "Paris",
        gradient: "from-rose-500 via-pink-500 to-amber-400",
        quote:
            "Un outil temps réel fiable n'est pas magique — c'est l'accumulation patiente de bonnes décisions d'architecture.",
        bio: "Backend distribué, temps réel, multi-tenant. A fait passer trois produits SaaS du MVP au million d'utilisateurs.",
        previously: "Ex-Algolia · Mirakl",
        linkedin: "https://linkedin.com/in/lea-martin",
    },
];

const members: Member[] = [
    {
        initials: "CF",
        name: "Cheikh Fall",
        role: "Lead Product",
        location: "Dakar",
        gradient: "from-sky-500 to-cyan-400",
        previously: "Ex-Yango · Jumia",
        linkedin: "#",
    },
    {
        initials: "EM",
        name: "Élise Moreau",
        role: "Design Lead",
        location: "Paris",
        gradient: "from-emerald-500 to-teal-400",
        previously: "Ex-Qonto · Swile",
        linkedin: "#",
    },
    {
        initials: "BN",
        name: "Bineta Ndiaye",
        role: "Backend Engineer",
        location: "Dakar",
        gradient: "from-amber-500 to-orange-500",
        previously: "Ex-Expensya",
        linkedin: "#",
    },
    {
        initials: "JB",
        name: "Julien Brun",
        role: "Frontend Engineer",
        location: "Paris",
        gradient: "from-indigo-500 to-blue-500",
        previously: "Ex-Doctolib",
        linkedin: "#",
    },
    {
        initials: "MS",
        name: "Mariama Sow",
        role: "Customer Success",
        location: "Dakar",
        gradient: "from-fuchsia-500 to-purple-500",
        previously: "Ex-Intercom · Zendesk",
        linkedin: "#",
    },
    {
        initials: "TR",
        name: "Thomas Renaud",
        role: "Growth",
        location: "Paris",
        gradient: "from-teal-500 to-emerald-500",
        previously: "Ex-Pennylane",
        linkedin: "#",
    },
];

const teamStats = [
    { value: 14, label: "Humains", hint: "Ingénieurs, design, ops" },
    { value: 2, label: "Bureaux", hint: "Paris + Dakar" },
    { value: 6, label: "Nationalités", hint: "4 langues natives" },
    { value: 1250, label: "Clients servis", hint: "Tous secteurs, tous tailles" },
];

export function AboutTeamSection() {
    return (
        <section className="relative overflow-hidden py-24 md:py-32">
            <div
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-40 h-[600px] w-[1000px] -translate-x-1/2 opacity-20 blur-[140px]"
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
                    className="mx-auto max-w-3xl text-center"
                >
                    <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-[var(--accent)]">
                        L&apos;équipe · 14 personnes
                    </p>
                    <h2 className="mt-4 font-display text-4xl font-bold tracking-tight md:text-6xl">
                        Les humains derrière Jokko.
                    </h2>
                    <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
                        Pas de growth hackers, pas d&apos;armée de stagiaires. Une
                        équipe petite, senior, basée entre Paris et Dakar — qui
                        code, designe, vend et support elle-même.
                    </p>
                </motion.div>

                <div className="mt-20 grid gap-6 lg:grid-cols-2">
                    {founders.map((f, i) => (
                        <motion.article
                            key={f.name}
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.2 }}
                            transition={{
                                duration: 0.7,
                                delay: i * 0.1,
                                ease: [0.22, 1, 0.36, 1],
                            }}
                            className="group relative overflow-hidden rounded-3xl border border-border/60 bg-card p-8 transition-all hover:-translate-y-1 hover:border-[var(--accent)]/40 md:p-10"
                        >
                            <div
                                aria-hidden
                                className={`pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gradient-to-br ${f.gradient} opacity-20 blur-3xl transition-opacity duration-700 group-hover:opacity-40`}
                            />

                            <div className="absolute right-6 top-6 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground/60">
                                {String(i + 1).padStart(3, "0")} / {String(founders.length).padStart(3, "0")}
                            </div>

                            <div className="relative flex items-start gap-5">
                                <div
                                    className={`relative flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${f.gradient} font-display text-2xl font-bold text-white shadow-[0_16px_40px_-12px_var(--accent-glow)] ring-1 ring-white/20`}
                                >
                                    {f.initials}
                                    <div
                                        aria-hidden
                                        className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/25 via-transparent to-transparent"
                                    />
                                </div>
                                <div className="min-w-0 pt-1">
                                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--accent)]">
                                        {f.role}
                                    </p>
                                    <h3 className="mt-1.5 font-display text-2xl font-bold tracking-tight md:text-3xl">
                                        {f.name}
                                    </h3>
                                    <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                                        · {f.location}
                                    </p>
                                </div>
                            </div>

                            <div className="relative mt-6">
                                <Quote
                                    aria-hidden
                                    className="absolute -left-1 -top-2 h-6 w-6 text-[var(--accent)]/20"
                                />
                                <p className="relative pl-5 font-display text-lg italic leading-relaxed text-foreground md:text-xl">
                                    {f.quote}
                                </p>
                            </div>

                            <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
                                {f.bio}
                            </p>

                            <div className="mt-6 flex items-center justify-between border-t border-border/40 pt-5">
                                <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                                    {f.previously}
                                </span>
                                <div className="flex items-center gap-2">
                                    <a
                                        href={f.linkedin}
                                        target="_blank"
                                        rel="noreferrer"
                                        aria-label={`LinkedIn ${f.name}`}
                                        className="flex h-8 w-8 items-center justify-center rounded-full border border-border/60 bg-background/40 text-muted-foreground transition-all hover:-translate-y-0.5 hover:border-[var(--accent)]/40 hover:text-[var(--accent)]"
                                    >
                                        <Linkedin className="h-3.5 w-3.5" />
                                    </a>
                                    {f.twitter && (
                                        <a
                                            href={f.twitter}
                                            target="_blank"
                                            rel="noreferrer"
                                            aria-label={`Twitter ${f.name}`}
                                            className="flex h-8 w-8 items-center justify-center rounded-full border border-border/60 bg-background/40 text-muted-foreground transition-all hover:-translate-y-0.5 hover:border-[var(--accent)]/40 hover:text-[var(--accent)]"
                                        >
                                            <Twitter className="h-3.5 w-3.5" />
                                        </a>
                                    )}
                                </div>
                            </div>
                        </motion.article>
                    ))}
                </div>

                <div className="mt-10">
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.3 }}
                        transition={{ duration: 0.6 }}
                        className="mb-6 flex items-center justify-between"
                    >
                        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
                            Le reste de l&apos;équipage
                        </p>
                        <div className="hidden h-px flex-1 bg-border/60 md:mx-6 md:block" />
                        <p className="hidden font-mono text-[11px] uppercase tracking-wider text-muted-foreground md:block">
                            12 autres personnes · remote-first
                        </p>
                    </motion.div>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {members.map((m, i) => (
                            <motion.a
                                key={m.name}
                                href={m.linkedin}
                                target={m.linkedin !== "#" ? "_blank" : undefined}
                                rel={m.linkedin !== "#" ? "noreferrer" : undefined}
                                initial={{ opacity: 0, y: 16 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, amount: 0.1 }}
                                transition={{
                                    duration: 0.5,
                                    delay: i * 0.04,
                                    ease: [0.22, 1, 0.36, 1],
                                }}
                                className="group relative block overflow-hidden rounded-2xl border border-border/60 bg-card p-5 transition-all hover:-translate-y-1 hover:border-[var(--accent)]/40"
                            >
                                <div
                                    aria-hidden
                                    className="pointer-events-none absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-[var(--accent-muted)] opacity-0 transition-opacity duration-500 group-hover:opacity-40"
                                />

                                <div className="relative flex items-start justify-between">
                                    <div
                                        className={`relative flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${m.gradient} font-display text-base font-bold text-white shadow-lg ring-1 ring-white/20`}
                                    >
                                        {m.initials}
                                        <div
                                            aria-hidden
                                            className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/25 via-transparent to-transparent"
                                        />
                                    </div>
                                    <div className="translate-x-2 opacity-0 transition-all duration-500 group-hover:translate-x-0 group-hover:opacity-100">
                                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent)] text-white">
                                            <Linkedin className="h-3 w-3" />
                                        </div>
                                    </div>
                                </div>

                                <div className="relative mt-5">
                                    <h4 className="font-display text-base font-semibold tracking-tight">
                                        {m.name}
                                    </h4>
                                    <p className="mt-0.5 text-sm text-muted-foreground">
                                        {m.role}
                                    </p>
                                </div>

                                <div className="relative mt-4 flex items-center justify-between border-t border-border/40 pt-3">
                                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                                        {m.previously}
                                    </span>
                                    <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--accent)]">
                                        {m.location}
                                    </span>
                                </div>
                            </motion.a>
                        ))}

                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.1 }}
                            transition={{
                                duration: 0.5,
                                delay: members.length * 0.04,
                                ease: [0.22, 1, 0.36, 1],
                            }}
                            className="md:col-span-2"
                        >
                            <Link
                                href="/careers"
                                className="group relative flex h-full min-h-[180px] flex-col justify-between overflow-hidden rounded-2xl border border-dashed border-[var(--accent)]/40 bg-gradient-to-br from-[var(--accent-muted)]/30 via-[var(--accent-muted)]/10 to-transparent p-5 transition-all hover:-translate-y-1 hover:border-[var(--accent)]/70"
                            >
                                <div
                                    aria-hidden
                                    className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[var(--accent)]/10 blur-3xl transition-all duration-700 group-hover:bg-[var(--accent)]/20"
                                />

                                <div className="relative">
                                    <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[var(--accent)]">
                                        On recrute
                                    </p>
                                    <h4 className="mt-3 font-display text-2xl font-bold tracking-tight md:text-3xl">
                                        Votre place est peut-être la prochaine.
                                    </h4>
                                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                                        7 postes ouverts · engineering, design,
                                        growth. Process en 10 jours, 3 étapes.
                                    </p>
                                </div>

                                <div className="relative mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--accent)]">
                                    Voir les postes ouverts
                                    <ArrowUpRight className="h-4 w-4 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                                </div>
                            </Link>
                        </motion.div>
                    </div>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.7 }}
                    className="mt-16 grid gap-px overflow-hidden rounded-3xl border border-border/60 bg-border/60 md:grid-cols-4"
                >
                    {teamStats.map((s) => (
                        <div
                            key={s.label}
                            className="bg-card p-6 md:p-8"
                        >
                            <p className="font-display text-4xl font-bold tracking-tight md:text-5xl">
                                <CountUp to={s.value} />
                                {s.value >= 1000 && "+"}
                            </p>
                            <p className="mt-2 font-semibold">{s.label}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                {s.hint}
                            </p>
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
