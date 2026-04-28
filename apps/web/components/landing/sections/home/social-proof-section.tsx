"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowUpRight, Quote, Star } from "lucide-react";
import { cn } from "@/lib/utils";

const featured = [
  {
    quote: "Jokko a divisé par 4 notre temps de première réponse. Nos clients remarquent, notre CSAT est passé de 3.8 à 4.7.",
    metric: "-75%",
    metricLabel: "Temps 1ère réponse",
    author: "Fatou Ndiaye",
    role: "Head of CX",
    company: "Sama Mode",
    color: "from-rose-400 to-rose-600",
  },
  {
    quote: "Avant on avait 3 Nokia sur un bureau. Aujourd'hui, 6 agents gèrent tous nos numéros depuis leurs postes. Le chaos a disparu.",
    metric: "6",
    metricLabel: "Agents simultanés",
    author: "Mamadou Bah",
    role: "CEO",
    company: "Teranga Livraison",
    color: "from-sky-400 to-sky-600",
  },
  {
    quote: "L'IA Jo écrit mieux que mes stagiaires. C'est presque vexant. Surtout, elle le fait en wolof et en français.",
    metric: "10×",
    metricLabel: "Productivité agent",
    author: "Awa Sarr",
    role: "Head of Ops",
    company: "Kaïcedra",
    color: "from-violet-400 to-violet-600",
  },
];

const tweets = [
  {
    author: "Ibrahim M.",
    handle: "@ibra_tech",
    text: "Migration de Respond.io vers Jokko terminée en 1 soirée. L'équipe adore. La fin des tabs WhatsApp.",
    color: "from-emerald-400 to-emerald-600",
  },
  {
    author: "Sophie L.",
    handle: "@sophiepicks",
    text: "Le copilot IA de Jokko est le seul qui comprend vraiment mon ton de marque. J'ai testé 6 concurrents.",
    color: "from-amber-400 to-amber-600",
  },
  {
    author: "Kabs Diouf",
    handle: "@kabsdiouf",
    text: "On vient de faire 2.3M F de vente via WhatsApp en une semaine, 100% routées par les flows Jokko. Absurd.",
    color: "from-rose-400 to-rose-600",
  },
  {
    author: "Nadia R.",
    handle: "@nadia_cx",
    text: "L'onboarding a pris 12min. J'étais préparée pour 2h. Mes agents sont en prod depuis hier matin.",
    color: "from-sky-400 to-sky-600",
  },
  {
    author: "Thomas V.",
    handle: "@tvincendon",
    text: "Le plus impressionnant : le real-time. Aucun refresh, aucun lag. Comme si Linear faisait du WhatsApp.",
    color: "from-violet-400 to-violet-600",
  },
  {
    author: "Aminata B.",
    handle: "@aminata_biz",
    text: "J'ai gardé Jokko 2 semaines en essai puis basculé toute ma boutique. Ma TTR moyenne est tombée sous 1min.",
    color: "from-emerald-400 to-emerald-600",
  },
  {
    author: "Xavier D.",
    handle: "@xdlv",
    text: "Les équipes ops m'appellent encore pour me remercier d'avoir migré. Je ne reverrai plus jamais HubSpot.",
    color: "from-amber-400 to-amber-600",
  },
  {
    author: "Lamine F.",
    handle: "@laminedev",
    text: "Le build quality de Jokko est insane. Du React qui ne lag jamais, des mutations optimistes partout.",
    color: "from-sky-400 to-sky-600",
  },
];

export function SocialProofSection() {
  return (
    <section className="relative overflow-hidden py-28 md:py-36">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--accent)]">
            Ils en parlent
          </p>
          <h2 className="mt-4 font-display text-4xl font-bold tracking-tight md:text-6xl">
            140 équipes. Une seule inbox.
          </h2>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {featured.map((t, i) => (
            <FeaturedTestimonial key={i} {...t} index={i} />
          ))}
        </div>

        <div className="relative mt-20 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <TweetColumn tweets={tweets.slice(0, 3)} direction="down" />
          <TweetColumn tweets={tweets.slice(3, 6)} direction="up" />
          <TweetColumn tweets={tweets.slice(6, 8)} direction="down" className="hidden lg:grid" />
        </div>
      </div>
    </section>
  );
}

function FeaturedTestimonial({
  quote,
  metric,
  metricLabel,
  author,
  role,
  company,
  color,
  index,
}: (typeof featured)[number] & { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.7, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="relative flex flex-col rounded-2xl border border-border/60 bg-card p-8 shadow-sm"
    >
      <Quote className="h-5 w-5 text-[var(--accent)]" />
      <p className="mt-5 flex-1 text-[15px] leading-relaxed text-foreground">
        &laquo; {quote} &raquo;
      </p>

      <div className="my-6 flex items-baseline gap-3 border-t border-border/50 pt-6">
        <span className="font-display text-4xl font-bold tracking-tight text-[var(--accent)]">
          {metric}
        </span>
        <span className="text-xs text-muted-foreground">{metricLabel}</span>
      </div>

      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br text-xs font-semibold text-white",
            color
          )}
        >
          {author
            .split(" ")
            .map((n) => n[0])
            .join("")}
        </div>
        <div>
          <p className="text-sm font-semibold">{author}</p>
          <p className="text-xs text-muted-foreground">
            {role} · {company}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-0.5 text-amber-500">
          {[0, 1, 2, 3, 4].map((i) => (
            <Star key={i} className="h-3 w-3 fill-current" />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

type Tweet = {
  author: string;
  handle: string;
  text: string;
  color: string;
};

function TweetColumn({
  tweets,
  direction,
  className,
}: {
  tweets: Tweet[];
  direction: "up" | "down";
  className?: string;
}) {
  const duration = direction === "up" ? "40s" : "45s";
  return (
    <div
      className={cn(
        "relative h-[500px] overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_15%,black_85%,transparent)]",
        className
      )}
    >
      <div
        className="flex flex-col gap-4"
        style={{
          animation: `${direction === "up" ? "marquee-vertical" : "marquee-vertical-reverse"} ${duration} linear infinite`,
        }}
      >
        {[...tweets, ...tweets].map((t, i) => (
          <TweetCard key={i} {...t} />
        ))}
      </div>
    </div>
  );
}

function TweetCard({
  author,
  handle,
  text,
  color,
}: {
  author: string;
  handle: string;
  text: string;
  color: string;
}) {
  return (
    <div className="shrink-0 rounded-2xl border border-border/60 bg-card p-4">
      <div className="flex items-center gap-2">
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br text-[10px] font-semibold text-white",
            color
          )}
        >
          {author
            .split(" ")
            .map((n) => n[0])
            .join("")}
        </div>
        <div className="flex-1">
          <p className="text-xs font-semibold">{author}</p>
          <p className="text-[10px] text-muted-foreground">{handle}</p>
        </div>
      </div>
      <p className="mt-3 text-[13px] leading-relaxed">{text}</p>
    </div>
  );
}

export function CaseStudyRow() {
  return (
    <div className="mx-auto mt-20 grid max-w-7xl gap-6 px-6 md:grid-cols-3">
      {[
        { company: "Sama Mode", slug: "e-commerce", metric: "CSAT 4.8/5" },
        { company: "Teranga Livraison", slug: "service-client", metric: "TTR -82%" },
        { company: "Kaïcedra", slug: "agences", metric: "12 clients gérés" },
      ].map((cs) => (
        <Link
          key={cs.slug}
          href={`/solutions/${cs.slug}`}
          className="group flex items-center justify-between rounded-2xl border border-border/60 bg-card p-6 transition-all hover:-translate-y-0.5 hover:border-[var(--accent)]/40 hover:shadow-lg"
        >
          <div>
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Étude de cas
            </p>
            <p className="mt-1 font-display text-xl font-bold">{cs.company}</p>
            <p className="text-sm text-[var(--accent)]">{cs.metric}</p>
          </div>
          <ArrowUpRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </Link>
      ))}
    </div>
  );
}
