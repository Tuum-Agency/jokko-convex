import type { Metadata } from 'next'
import { FeaturesOverviewSection } from '@/components/landing/sections/fonctionnalities/features-overview-section'
import { CtaSection } from '@/components/landing/sections/home/cta-section'

export const metadata: Metadata = {
    title: 'Fonctionnalités & Outils - Jokko',
    description: 'Explorez nos outils puissants : Boîte de réception partagée, Chatbots IA, Campagnes Marketing WhatsApp en masse, et CRM intégré.',
    openGraph: {
        title: 'Fonctionnalités Jokko - Tout pour réussir sur WhatsApp',
        description: 'Transformez vos conversations en ventes grâce à notre suite complète d\'outils WhatsApp Business.',
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
