import type { Metadata } from 'next'
import { FeaturesOverviewSection } from '@/components/landing/sections/fonctionnalities/features-overview-section'
import { CtaSection } from '@/components/landing/sections/home/cta-section'

export const metadata: Metadata = {
    title: 'Fonctionnalités',
    description: 'Découvrez toutes les fonctionnalités de Jokko : messagerie centralisée, automatisation IA, gestion multi-agents, analytics et plus encore.',
    openGraph: {
        title: 'Fonctionnalités - Jokko',
        description: 'Les outils puissants qui transformeront votre gestion WhatsApp Business.',
    },
}

export default function FeaturesPage() {
    return (
        <>


            <FeaturesOverviewSection />
            <CtaSection />
        </>
    )
}
