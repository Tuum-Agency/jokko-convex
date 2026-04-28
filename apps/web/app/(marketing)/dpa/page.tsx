import type { Metadata } from 'next'
import { DpaHero } from '@/components/landing/sections/dpa/dpa-hero'
import { DpaContent } from '@/components/landing/sections/dpa/dpa-content'
import { DpaContact } from '@/components/landing/sections/dpa/dpa-contact'

export const metadata: Metadata = {
    title: 'Data Processing Agreement (DPA) — Jokko',
    description:
        'Accord de traitement des données à caractère personnel entre le Client (responsable de traitement) et Jokko (sous-traitant), conforme au RGPD.',
}

export default function DpaPage() {
    return (
        <>
            <DpaHero />
            <DpaContent />
            <DpaContact />
        </>
    )
}
