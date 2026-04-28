import type { Metadata } from 'next'
import { ApiHero } from '@/components/landing/sections/docs-api/api-hero'
import { ApiAuthentication } from '@/components/landing/sections/docs-api/api-authentication'
import { ApiEndpoints } from '@/components/landing/sections/docs-api/api-endpoints'
import { ApiRateLimits } from '@/components/landing/sections/docs-api/api-rate-limits'
import { ApiErrors } from '@/components/landing/sections/docs-api/api-errors'
import { CtaSection } from '@/components/landing/sections/home/cta-section'

export const metadata: Metadata = {
    title: 'Référence API — Jokko',
    description:
        'Référence complète de l\'API Jokko v2 : authentification, endpoints, webhooks, codes d\'erreur, limites de débit. OpenAPI 3.1.',
}

export default function ApiPage() {
    return (
        <>
            <ApiHero />
            <ApiAuthentication />
            <ApiEndpoints />
            <ApiRateLimits />
            <ApiErrors />
            <CtaSection />
        </>
    )
}
