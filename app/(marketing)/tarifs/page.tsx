import type { Metadata } from 'next'
import { CtaSection, PricingSection, FaqSection } from '@/components/landing/sections/home'

export const metadata: Metadata = {
    title: 'Tarifs',
    description: 'Découvrez nos plans tarifaires flexibles pour Jokko. Essai gratuit de 14 jours, sans engagement. Choisissez le plan adapté à votre entreprise.',
    openGraph: {
        title: 'Tarifs - Jokko',
        description: 'Plans tarifaires flexibles pour votre messagerie WhatsApp Business. Essai gratuit de 14 jours.',
    },
}

export default function TarifsPage() {
    return (
        <>
            {/* Simple title section */}
            <section className="pt-32 pb-16">
                <div className="max-w-6xl mx-auto px-4 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                        Nos tarifs
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Choisissez le plan qui correspond à vos besoins. Essai gratuit de 14 jours, sans engagement.
                    </p>
                </div>
            </section>

            {/* Pricing Plans */}
            <PricingSection />

            {/* FAQ */}
            <FaqSection />

            {/* CTA */}
            <CtaSection />
        </>
    )
}
