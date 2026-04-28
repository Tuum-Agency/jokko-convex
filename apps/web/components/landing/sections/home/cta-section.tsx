"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { ShimmerButton } from "@/components/landing/ui/shimmer-button";
import { SplitText } from "@/components/animations/split-text";

export function CtaSection() {
  return (
    <section className="relative overflow-hidden bg-[var(--surface-dark)] py-32 text-white md:py-40">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.9) 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, var(--accent-glow) 0%, transparent 55%)",
          opacity: 0.6,
        }}
      />

      <div className="relative mx-auto max-w-5xl px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-white/70 backdrop-blur"
        >
          <Sparkles className="h-3 w-3 text-[var(--accent)]" />
          Prêt à unifier vos WhatsApp ?
        </motion.div>

        <h2 className="mt-8 font-display text-[clamp(3rem,9vw,8rem)] font-bold leading-[0.95] tracking-[-0.03em] text-white">
          <SplitText as="span" className="block">
            Démarrez en
          </SplitText>
          <SplitText
            as="span"
            delay={0.2}
            className="block bg-gradient-to-br from-white via-white to-[var(--accent)] bg-clip-text text-transparent"
          >
            2 minutes.
          </SplitText>
        </h2>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mx-auto mt-8 max-w-xl text-lg leading-relaxed text-white/70"
        >
          Connectez votre premier numéro WhatsApp Business. Invitez votre équipe. Envoyez
          votre premier message assisté par IA. Sans carte bancaire.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.75 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-3"
        >
          <ShimmerButton asChild size="lg" variant="light">
            <Link href="/auth/sign-up">
              Démarrer gratuitement
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </ShimmerButton>
          <ShimmerButton
            asChild
            size="lg"
            variant="ghost"
            className="border-white/20 bg-white/5 text-white hover:border-white/40 hover:bg-white/10"
          >
            <Link href="/contact">Parler à un humain</Link>
          </ShimmerButton>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="mt-6 text-xs uppercase tracking-wider text-white/40"
        >
          Sans carte · RGPD · Hébergement UE · Support FR/EN
        </motion.p>
      </div>
    </section>
  );
}
