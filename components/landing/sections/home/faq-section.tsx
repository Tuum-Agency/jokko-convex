"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "Combien de numéros WhatsApp Business puis-je connecter ?",
    a: "Illimité sur les plans Business et Pro, 1 numéro sur le plan Starter. Tous les numéros partagent la même inbox et se gèrent de façon centralisée, sans changer d'outil.",
  },
  {
    q: "Est-ce que Jokko utilise l'API officielle Meta ?",
    a: "Oui, Jokko passe exclusivement par la WhatsApp Cloud API officielle. Pas de scraping, pas de contournement : vous restez 100% conformes et vos numéros ne risquent pas d'être bannis.",
  },
  {
    q: "Comment fonctionne l'IA Jo et qu'apprend-elle de nos conversations ?",
    a: "Jo s'appuie sur vos conversations passées, votre catalogue et vos FAQ pour proposer un brouillon de réponse. Vos données ne sortent pas de votre tenant, ne sont jamais utilisées pour entraîner des modèles tiers, et vous pouvez désactiver l'IA par utilisateur ou par conversation.",
  },
  {
    q: "Combien de temps prend la mise en place ?",
    a: "5 à 15 minutes pour un premier numéro. Vous connectez votre compte WhatsApp Business via Meta, vous invitez votre équipe, vous paramétrez vos règles d'assignation. Nos guides vidéo couvrent chaque étape.",
  },
  {
    q: "Puis-je migrer depuis Respond.io, Wati ou HubSpot ?",
    a: "Oui. Nous fournissons un import des contacts et des templates, et notre équipe vous accompagne sur l'assignation historique si besoin. La plupart des migrations se font en moins d'une journée.",
  },
  {
    q: "Où sont stockées nos données ?",
    a: "Hébergement dans l'Union européenne (Frankfurt), chiffrement TLS 1.3 en transit et AES-256 au repos. SOC 2 en cours, RGPD-compliant, DPA disponible sur demande.",
  },
  {
    q: "Que se passe-t-il si je dépasse mes quotas mensuels ?",
    a: "On vous alerte avant. Vous pouvez upgrader en 1 clic ou acheter un pack d'extension. Votre service n'est jamais coupé en cours de mois : on débloque, vous réglez au prochain cycle.",
  },
  {
    q: "Puis-je annuler à tout moment ?",
    a: "Oui, sans frais et sans engagement. Vous gardez l'accès jusqu'à la fin de la période facturée. Vos données sont exportables en CSV/JSON à tout moment.",
  },
];

export function FaqSection() {
  return (
    <section id="faq" className="relative bg-muted/20 py-28 md:py-36">
      <div className="mx-auto max-w-4xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center"
        >
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--accent)]">
            FAQ
          </p>
          <h2 className="mt-4 font-display text-4xl font-bold tracking-tight md:text-5xl">
            Parlons des vraies questions.
          </h2>
          <p className="mt-5 text-lg text-muted-foreground">
            Les objections qu&apos;on entend avant chaque signature. Si la
            vôtre manque,{" "}
            <Link href="/contact" className="text-[var(--accent)] underline underline-offset-4">
              écrivez-nous
            </Link>{" "}
            — réponse sous 2 h ouvrées.
          </p>
        </motion.div>

        <div className="mt-14">
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.45, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
              >
                <AccordionItem
                  value={`item-${i}`}
                  className="overflow-hidden rounded-2xl border border-border/60 bg-card px-5 transition-colors hover:border-[var(--accent)]/30"
                >
                  <AccordionTrigger className="py-5 text-left text-[15px] font-semibold hover:no-underline">
                    {f.q}
                  </AccordionTrigger>
                  <AccordionContent className="pb-5 text-[14px] leading-relaxed text-muted-foreground">
                    {f.a}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
