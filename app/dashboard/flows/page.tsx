import { Metadata } from 'next'
import { FlowsPageClient } from './client'
import { FeatureGate } from '@/components/billing/feature-gate'

export const metadata: Metadata = {
    title: 'Automatisation | Jokko',
    description: 'Gérez vos flux d\'automatisation',
}

export default function FlowsPage() {
    return (
        <FeatureGate feature="flows">
            <FlowsPageClient />
        </FeatureGate>
    )
}
