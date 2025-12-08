/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║           conversations-layout-client.tsx                     ║
 * ╠═══════════════════════════════════════════════════════════════╣
 * ║ DESCRIPTION:                                                  ║
 * ║   Client component pour le layout des conversations.          ║
 * ║   Gere l'etat et les subscriptions temps reel.                ║
 * ║                                                               ║
 * ║   NOTE: Utilise des marges negatives pour echapper au        ║
 * ║   padding du layout parent et remplir tout l'espace.          ║
 * ╚═══════════════════════════════════════════════════════════════╝
 */

'use client'

import { TooltipProvider } from '@/components/ui/tooltip'
import { ConversationLayout } from '@/components/conversations'
import { useCurrentOrg } from '@/hooks/use-current-org'
import { Loader2 } from 'lucide-react'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface ConversationsLayoutClientProps {
    children: React.ReactNode
}

export function ConversationsLayoutClient({
    children,
}: ConversationsLayoutClientProps) {
    const { currentOrg, isLoading } = useCurrentOrg()
    const router = useRouter()

    useEffect(() => {
        if (!isLoading && !currentOrg) {
            router.push('/onboarding')
        }
    }, [isLoading, currentOrg, router])

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        )
    }

    if (!currentOrg) return null

    return (
        <TooltipProvider delayDuration={0}>
            {/* Negative margins to escape parent padding (p-4 lg:p-6) */}
            {/* Height compensates for the padding we're escaping */}
            <div className="-m-4 lg:-m-6 h-[calc(100vh-4rem)]">
                <ConversationLayout
                    organizationId={currentOrg._id}
                    basePath="/dashboard/conversations"
                />
            </div>
        </TooltipProvider>
    )
}
