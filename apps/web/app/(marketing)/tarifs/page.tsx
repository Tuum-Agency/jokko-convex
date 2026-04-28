import type { Metadata } from 'next'
import { CtaSection, PricingSection, FaqSection } from '@/components/landing/sections/home'
import { PricingComparisonTable } from '@/components/landing/sections/home/pricing-comparison-table'

export const metadata: Metadata = {
    title: 'Tarifs et Plans - Jokko | WhatsApp Business CRM',
    description: 'Des tarifs transparents adaptés à votre croissance. Commencez gratuitement avec notre offre Starter. Service client illimité et automatisation marketing incluse.',
    openGraph: {
        title: 'Tarifs Jokko - Choisissez le plan idéal pour votre entreprise',
        description: 'Boostez votre ROI avec nos solutions de marketing conversationnel sur WhatsApp.',
    },
}

export default function TarifsPage() {
    return (
        <>
            {/* Simple title section */}
            <section className="pt-32 pb-16">
                <div className="max-w-6xl mx-auto px-4 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                        Une tarification saine et rentable
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Service client illimité pour tous. Options marketing flexibles pour garantir votre retour sur investissement.
                    </p>
                </div>
            </section>

            {/* Pricing Plans */}
            <PricingSection />

            {/* Comparison Table */}
            <PricingComparisonTable />

            {/* FAQ */}
            <FaqSection />

            {/* CTA */}
            <CtaSection />
        </>
    )
}
