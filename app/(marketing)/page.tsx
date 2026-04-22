import type { Metadata } from "next";
import {
  HeroSection,
  LogoTickerSection,
  NarrativeSection,
  BentoSection,
  BeforeAfterSection,
  AiSection,
  SocialProofSection,
  CaseStudyRow,
  PricingSection,
  FaqSection,
  CtaSection,
} from "@/components/landing/sections/home";

export const metadata: Metadata = {
  title: "Jokko — L'inbox WhatsApp partagée pour les équipes",
  description:
    "Centralisez vos numéros WhatsApp Business, assignez les conversations, laissez l'IA rédiger le premier brouillon. 140 équipes nous font confiance.",
  alternates: { canonical: "https://www.jokko.co" },
};

export default function Home() {
  return (
    <>
      <HeroSection />
      <LogoTickerSection />
      <NarrativeSection />
      <BentoSection />
      <BeforeAfterSection />
      <AiSection />
      <SocialProofSection />
      <CaseStudyRow />
      <PricingSection />
      <FaqSection />
      <CtaSection />
    </>
  );
}
