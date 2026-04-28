import type { Metadata } from 'next'
import { DocsHero } from '@/components/landing/sections/docs/docs-hero'
import { DocsCategories } from '@/components/landing/sections/docs/docs-categories'
import { DocsPopular } from '@/components/landing/sections/docs/docs-popular'
import { DocsCodeSample } from '@/components/landing/sections/docs/docs-code-sample'
import { CtaSection } from '@/components/landing/sections/home/cta-section'

export const metadata: Metadata = {
    title: 'Documentation — Jokko',
    description:
        'Documentation technique, guides d\'intégration, référence API, webhooks, SDK. Tout ce qu\'il faut pour construire sur Jokko.',
}

export default function DocsPage() {
    return (
        <>
            <DocsHero />
            <DocsCategories />
            <DocsCodeSample />
            <DocsPopular />
            <CtaSection />
        </>
    )
}
