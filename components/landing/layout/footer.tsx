"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Check, Shield, Twitter, Linkedin, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const columns = [
  {
    title: "Produit",
    links: [
      { name: "Fonctionnalités", href: "/fonctionnalites" },
      { name: "Tarifs", href: "/tarifs" },
      { name: "Changelog", href: "/changelog" },
      { name: "Feuille de route", href: "/roadmap" },
      { name: "Statut", href: "https://status.jokko.co" },
    ],
  },
  {
    title: "Solutions",
    links: [
      { name: "Service client", href: "/solutions/service-client" },
      { name: "E-commerce", href: "/solutions/e-commerce" },
      { name: "Agences", href: "/solutions/agences" },
      { name: "TPE & PME", href: "/solutions/tpe-pme" },
    ],
  },
  {
    title: "Ressources",
    links: [
      { name: "Blog", href: "/blog" },
      { name: "Guides", href: "/guides" },
      { name: "Documentation", href: "/docs" },
      { name: "API", href: "/docs/api" },
    ],
  },
  {
    title: "Entreprise",
    links: [
      { name: "À propos", href: "/about" },
      { name: "Contact", href: "/contact" },
      { name: "Carrières", href: "/careers" },
      { name: "Presse", href: "/press" },
    ],
  },
  {
    title: "Légal",
    links: [
      { name: "Confidentialité", href: "/privacy" },
      { name: "Conditions", href: "/terms" },
      { name: "Mentions légales", href: "/legal" },
      { name: "DPA", href: "/dpa" },
    ],
  },
];

const socialLinks = [
  { name: "Twitter", href: "https://twitter.com/jokko_co", icon: Twitter },
  { name: "LinkedIn", href: "https://linkedin.com/company/jokko", icon: Linkedin },
  { name: "GitHub", href: "https://github.com/jokko", icon: Github },
];

export function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubscribed(true);
    setTimeout(() => {
      setSubscribed(false);
      setEmail("");
    }, 3000);
  };

  return (
    <footer className="relative overflow-hidden bg-[var(--surface-dark)] text-[var(--surface-dark-foreground)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.9) 1px, transparent 0)",
          backgroundSize: "28px 28px",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full opacity-40 blur-[140px]"
        style={{ background: "radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)" }}
      />

      <div className="relative mx-auto w-full max-w-7xl px-6 pt-20 pb-10 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-hover)] text-sm font-bold text-white shadow-[0_8px_24px_-6px_var(--accent-glow)]">
                J
                <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-[var(--whatsapp)] ring-2 ring-[var(--surface-dark)]" />
              </span>
              <span className="font-display text-xl font-semibold tracking-tight text-white">
                Jokko
              </span>
            </Link>
            <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-[var(--surface-dark-muted-foreground)]">
              L&apos;inbox WhatsApp partagée pour les équipes. Centralisez vos numéros
              Business, assignez les conversations, laissez l&apos;IA rédiger le premier brouillon.
            </p>

            <form onSubmit={handleSubmit} className="mt-8">
              <label htmlFor="newsletter-email" className="mb-2 block text-xs font-medium uppercase tracking-wider text-white/60">
                Newsletter produit
              </label>
              <div className="flex gap-2">
                <Input
                  id="newsletter-email"
                  type="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={subscribed}
                  className="h-11 flex-1 rounded-full border-white/10 bg-white/5 text-white placeholder:text-white/40 focus-visible:border-[var(--accent)] focus-visible:ring-[var(--accent-ring)]"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={subscribed}
                  className={cn(
                    "h-11 shrink-0 rounded-full px-5 font-medium transition-all",
                    subscribed
                      ? "bg-emerald-500 text-white hover:bg-emerald-500"
                      : "bg-white text-[var(--surface-dark)] hover:bg-white/90"
                  )}
                >
                  {subscribed ? (
                    <>
                      <Check className="h-4 w-4" />
                      Inscrit
                    </>
                  ) : (
                    <>
                      S&apos;abonner
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
              <p className="mt-2 text-xs text-white/40">
                Une fois par mois. Pas de spam, désinscription en 1 clic.
              </p>
            </form>

            <div className="mt-8 flex items-center gap-3">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={social.name}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition-all hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/10 hover:text-white"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 md:grid-cols-5 lg:col-span-8 lg:grid-cols-5">
            {columns.map((col) => (
              <div key={col.title}>
                <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-white">
                  {col.title}
                </h3>
                <ul className="space-y-3">
                  {col.links.map((link) => (
                    <li key={link.name}>
                      <Link
                        href={link.href}
                        className="text-[14px] text-[var(--surface-dark-muted-foreground)] transition-colors hover:text-white"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 flex flex-wrap items-center gap-3 border-t border-white/10 pt-8">
          <TrustBadge icon={Shield} label="RGPD conforme" />
          <TrustBadge icon={Shield} label="Hébergement UE" />
          <TrustBadge icon={Shield} label="SOC 2 · en cours" />
          <TrustBadge icon={Shield} label="Chiffrement TLS 1.3" />
          <div className="ml-auto flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-medium text-white/80">
              API officielle WhatsApp Business
            </span>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-6 md:flex-row md:items-center">
          <p className="text-sm text-white/50">
            © {new Date().getFullYear()} Jokko. Tous droits réservés.
          </p>
          <div className="flex items-center gap-4 text-xs text-white/40">
            <span>Fabriqué avec soin entre Paris &amp; Dakar</span>
            <span aria-hidden>·</span>
            <LanguageSwitch />
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-none mt-16 select-none"
          aria-hidden
        >
          <div
            className="font-display text-[18vw] font-bold leading-none tracking-tighter text-transparent"
            style={{
              WebkitTextStroke: "1px rgba(255,255,255,0.08)",
              backgroundImage:
                "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, transparent 60%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
            }}
          >
            JOKKO
          </div>
        </motion.div>
      </div>
    </footer>
  );
}

function TrustBadge({ icon: Icon, label }: { icon: typeof Shield; label: string }) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/70">
      <Icon className="h-3 w-3" />
      {label}
    </div>
  );
}

function LanguageSwitch() {
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-0.5">
      <button className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-white">
        FR
      </button>
      <button className="rounded-full px-2.5 py-1 text-xs font-medium text-white/50 hover:text-white/80">
        EN
      </button>
    </div>
  );
}
