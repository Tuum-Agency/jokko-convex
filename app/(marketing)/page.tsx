import { Metadata } from 'next';
import {
    HeroSection,
    FeatureSection,
    PricingSection,
    FaqSection,
    CtaSection,
} from '@/components/landing/sections/home'

export const metadata: Metadata = {
    title: "Jokko - Le CRM #1 pour WhatsApp Business en Afrique",
    description: "Multipliez vos ventes par 3 avec notre plateforme de marketing WhatsApp. Automatisation, chatbots, et gestion client simplifiée pour les entreprises en croissance.",
    alternates: {
        canonical: 'https://www.jokko.co',
    },
};

export default function Home() {
    return (
        <>
            <HeroSection />
            <FeatureSection />
            <PricingSection />
            <FaqSection />
            <CtaSection />
        </>
    )
}
