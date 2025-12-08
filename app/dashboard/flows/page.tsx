import { Metadata } from 'next'
import { FlowsPageClient } from './client'

export const metadata: Metadata = {
    title: 'Automatisation | Jokko',
    description: 'Gérez vos flux d\'automatisation',
}

export default function FlowsPage() {
    return <FlowsPageClient />
}
