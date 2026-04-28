import type { Metadata } from 'next'
import { RoadmapHero } from '@/components/landing/sections/roadmap/roadmap-hero'
import { RoadmapBoard } from '@/components/landing/sections/roadmap/roadmap-board'
import { RoadmapPrinciples } from '@/components/landing/sections/roadmap/roadmap-principles'
import { CtaSection } from '@/components/landing/sections/home/cta-section'

export const metadata: Metadata = {
    title: 'Feuille de route — Jokko',
    description:
        'Ce que nous construisons, ce qui arrive, ce que nous explorons. Roadmap publique mise à jour chaque lundi.',
}

export default function RoadmapPage() {
    return (
        <>
            <RoadmapHero />
            <RoadmapBoard />
            <RoadmapPrinciples />
            <CtaSection />
        </>
    )
}
