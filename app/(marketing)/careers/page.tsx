import type { Metadata } from 'next'
import { CareersHero } from '@/components/landing/sections/careers/careers-hero'
import { CareersCulture } from '@/components/landing/sections/careers/careers-culture'
import { CareersBenefits } from '@/components/landing/sections/careers/careers-benefits'
import { CareersRoles } from '@/components/landing/sections/careers/careers-roles'
import { CareersProcess } from '@/components/landing/sections/careers/careers-process'
import { CtaSection } from '@/components/landing/sections/home/cta-section'

export const metadata: Metadata = {
    title: 'Carrières — Jokko',
    description:
        'Rejoignez une équipe franco-sénégalaise qui construit la suite WhatsApp Business des équipes B2B. Postes ouverts à Paris, Dakar et en remote.',
}

export default function CareersPage() {
    return (
        <>
            <CareersHero />
            <CareersCulture />
            <CareersBenefits />
            <CareersRoles />
            <CareersProcess />
            <CtaSection />
        </>
    )
}
