import type { Metadata } from 'next'
import { ChangelogHero } from '@/components/landing/sections/changelog/changelog-hero'
import { ChangelogTimeline } from '@/components/landing/sections/changelog/changelog-timeline'
import { CtaSection } from '@/components/landing/sections/home/cta-section'

export const metadata: Metadata = {
    title: 'Changelog — Jokko',
    description:
        'Toutes les nouveautés, améliorations et corrections de Jokko. On expédie vite, on garde tout visible.',
}

export default function ChangelogPage() {
    return (
        <>
            <ChangelogHero />
            <ChangelogTimeline />
            <CtaSection />
        </>
    )
}
