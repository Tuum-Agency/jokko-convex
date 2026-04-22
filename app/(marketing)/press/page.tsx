import type { Metadata } from 'next'
import { PressHero } from '@/components/landing/sections/press/press-hero'
import { PressMetrics } from '@/components/landing/sections/press/press-metrics'
import { PressReleases } from '@/components/landing/sections/press/press-releases'
import { PressMediaKit } from '@/components/landing/sections/press/press-media-kit'
import { PressContact } from '@/components/landing/sections/press/press-contact'

export const metadata: Metadata = {
    title: 'Presse — Jokko',
    description:
        'Kit presse Jokko : communiqués, logos, captures produit, chiffres clés, contacts médias. Tout ce qu\'il faut pour parler de nous.',
}

export default function PressPage() {
    return (
        <>
            <PressHero />
            <PressMetrics />
            <PressReleases />
            <PressMediaKit />
            <PressContact />
        </>
    )
}
