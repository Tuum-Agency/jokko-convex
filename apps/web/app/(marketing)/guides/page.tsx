import type { Metadata } from 'next'
import { GuidesHero } from '@/components/landing/sections/guides/guides-hero'
import { GuidesCategories } from '@/components/landing/sections/guides/guides-categories'
import { GuidesPopular } from '@/components/landing/sections/guides/guides-popular'
import { GuidesLearningPaths } from '@/components/landing/sections/guides/guides-learning-paths'
import { CtaSection } from '@/components/landing/sections/home/cta-section'

export const metadata: Metadata = {
    title: 'Guides — Jokko',
    description:
        'Tutoriels pratiques, playbooks, parcours d\'apprentissage. Tout ce qu\'il faut pour tirer le meilleur de Jokko en moins d\'une heure.',
}

export default function GuidesPage() {
    return (
        <>
            <GuidesHero />
            <GuidesLearningPaths />
            <GuidesCategories />
            <GuidesPopular />
            <CtaSection />
        </>
    )
}
