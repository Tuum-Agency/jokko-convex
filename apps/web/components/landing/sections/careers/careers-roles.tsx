"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, MapPin, Briefcase } from "lucide-react";
import Link from "next/link";

type Role = {
    title: string;
    team: string;
    location: string;
    type: string;
    salary: string;
};

const roles: Role[] = [
    {
        title: "Senior Product Engineer",
        team: "Engineering",
        location: "Paris / Remote EU",
        type: "CDI · Full-time",
        salary: "70-90k€ + BSPCE",
    },
    {
        title: "Senior Backend Engineer (Convex)",
        team: "Engineering",
        location: "Dakar / Remote AO",
        type: "CDI · Full-time",
        salary: "45-65k€ + BSPCE",
    },
    {
        title: "Design Engineer",
        team: "Design",
        location: "Paris / Remote EU",
        type: "CDI · Full-time",
        salary: "65-85k€ + BSPCE",
    },
    {
        title: "Account Executive",
        team: "Sales",
        location: "Paris",
        type: "CDI · Full-time",
        salary: "55-75k€ base + variable",
    },
    {
        title: "Customer Success Manager",
        team: "Customer",
        location: "Dakar",
        type: "CDI · Full-time",
        salary: "35-50k€ + BSPCE",
    },
    {
        title: "Technical Writer (Docs)",
        team: "Content",
        location: "Remote worldwide",
        type: "CDI · Full-time",
        salary: "50-70k€ + BSPCE",
    },
    {
        title: "Growth Marketer",
        team: "Growth",
        location: "Paris / Dakar",
        type: "CDI · Full-time",
        salary: "50-70k€ + BSPCE",
    },
];

export function CareersRoles() {
    return (
        <section
            id="postes-ouverts"
            className="relative overflow-hidden border-y border-border/60 bg-muted/30 py-24 md:py-32"
        >
            <div className="mx-auto max-w-5xl px-6">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.7 }}
                    className="mx-auto max-w-2xl text-center"
                >
                    <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-[var(--accent)]">
                        {roles.length} postes ouverts
                    </p>
                    <h2 className="mt-4 font-display text-4xl font-bold tracking-tight md:text-6xl">
                        Cherchez votre prochain défi.
                    </h2>
                </motion.div>

                <div className="mt-16 overflow-hidden rounded-3xl border border-border/60 bg-card">
                    {roles.map((r, i) => (
                        <motion.div
                            key={r.title}
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.1 }}
                            transition={{
                                duration: 0.5,
                                delay: i * 0.05,
                                ease: [0.22, 1, 0.36, 1],
                            }}
                            className="group relative border-b border-border/60 last:border-b-0"
                        >
                            <Link
                                href={`mailto:careers@jokko.co?subject=Candidature · ${r.title}`}
                                className="flex items-center gap-4 p-6 transition-colors hover:bg-[var(--accent-muted)]/40"
                            >
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h3 className="font-display text-lg font-semibold tracking-tight transition-colors group-hover:text-[var(--accent)]">
                                            {r.title}
                                        </h3>
                                        <span className="rounded-full bg-[var(--accent-muted)] px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider text-[var(--accent)]">
                                            {r.team}
                                        </span>
                                    </div>
                                    <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-muted-foreground">
                                        <span className="inline-flex items-center gap-1.5">
                                            <MapPin className="h-3.5 w-3.5" />
                                            {r.location}
                                        </span>
                                        <span className="inline-flex items-center gap-1.5">
                                            <Briefcase className="h-3.5 w-3.5" />
                                            {r.type}
                                        </span>
                                        <span className="font-mono text-xs">{r.salary}</span>
                                    </div>
                                </div>
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-background transition-all group-hover:border-[var(--accent)] group-hover:bg-[var(--accent)]">
                                    <ArrowUpRight className="h-4 w-4 transition-colors group-hover:text-white" />
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>

                <p className="mt-8 text-center text-sm text-muted-foreground">
                    Vous ne voyez pas votre profil ?
                    <Link
                        href="mailto:careers@jokko.co"
                        className="ml-1 font-medium text-[var(--accent)] underline-offset-4 hover:underline"
                    >
                        Envoyez-nous une candidature spontanée
                    </Link>
                </p>
            </div>
        </section>
    );
}
