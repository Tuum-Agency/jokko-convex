import type { Metadata } from 'next'
import { FeaturesHeroSection } from '@/components/landing/sections/fonctionnalities/features-hero-section'
import { FeaturesOverviewSection } from '@/components/landing/sections/fonctionnalities/features-overview-section'
import { FeaturesStatsSection } from '@/components/landing/sections/fonctionnalities/features-stats-section'
import { FeaturesDeepDiveSection } from '@/components/landing/sections/fonctionnalities/features-deep-dive-section'
import { FeaturesIntegrationsSection } from '@/components/landing/sections/fonctionnalities/features-integrations-section'
import { SocialProofSection } from '@/components/landing/sections/home/social-proof-section'
import { CtaSection } from '@/components/landing/sections/home/cta-section'

export const metadata: Metadata = {
    title: 'Produit — Jokko',
    description:
        'Inbox partagée, copilot IA, campagnes marketing, CRM, automatisations, analytics. Une plateforme complète pour les équipes qui vendent et supportent sur WhatsApp Business.',
    openGraph: {
        title: 'Produit Jokko — La suite WhatsApp Business pour équipes',
        description:
            'Tout pour centraliser, automatiser et mesurer vos conversations WhatsApp professionnelles.',
    },
}

export default function FeaturesPage() {
    return (
        <>
            <FeaturesHeroSection />
            <FeaturesOverviewSection />
            <FeaturesStatsSection />
            <FeaturesDeepDiveSection />
            <FeaturesIntegrationsSection />
            <SocialProofSection />
            <CtaSection />
        </>
    )
}
