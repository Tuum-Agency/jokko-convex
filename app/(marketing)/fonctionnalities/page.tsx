import type { Metadata } from 'next'
import { FeaturesOverviewSection } from '@/components/landing/sections/fonctionnalities/features-overview-section'

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
            {/* Simple title section */}
            <section className="pt-32 pb-16">
                <div className="max-w-6xl mx-auto px-4 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                        Nos fonctionnalités
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Découvrez les outils puissants qui transformeront votre gestion WhatsApp Business.
                    </p>
                </div>
            </section>

            <FeaturesOverviewSection />
        </>
    )
}
