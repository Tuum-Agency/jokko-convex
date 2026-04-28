import type { Metadata } from 'next'
import { AboutHeroSection } from '@/components/landing/sections/about/about-hero-section'
import { AboutMissionSection } from '@/components/landing/sections/about/about-mission-section'
import { AboutTimelineSection } from '@/components/landing/sections/about/about-timeline-section'
import { AboutValuesSection } from '@/components/landing/sections/about/about-values-section'
import { AboutTeamSection } from '@/components/landing/sections/about/about-team-section'
import { AboutLocationsSection } from '@/components/landing/sections/about/about-locations-section'
import { CtaSection } from '@/components/landing/sections/home/cta-section'

export const metadata: Metadata = {
    title: 'À propos — Jokko',
    description:
        'Jokko est construit par une équipe obsédée par l\'efficacité des équipes qui vendent sur WhatsApp. Notre histoire, notre mission, nos valeurs.',
    openGraph: {
        title: 'À propos de Jokko',
        description:
            'Une équipe franco-sénégalaise qui construit la suite WhatsApp Business que nous rêvions d\'avoir.',
    },
}

export default function AboutPage() {
    return (
        <>
            <AboutHeroSection />
            <AboutMissionSection />
            <AboutTimelineSection />
            <AboutValuesSection />
            <AboutTeamSection />
            <AboutLocationsSection />
            <CtaSection />
        </>
    )
}
