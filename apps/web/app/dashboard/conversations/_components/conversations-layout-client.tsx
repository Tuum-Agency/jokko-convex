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
import { Skeleton } from '@/components/ui/skeleton'
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
            <div className="flex h-full -m-4 lg:-m-6 gap-0">
                {/* Contact List Skeleton */}
                <div className="hidden md:flex w-80 md:w-96 lg:w-[420px] flex-col border-r border-gray-200/80 bg-white p-4 gap-4">
                    <div className="space-y-3">
                        <Skeleton className="h-10 w-full" />
                        <div className="flex gap-2">
                            <Skeleton className="h-8 w-20 rounded-full" />
                            <Skeleton className="h-8 w-20 rounded-full" />
                        </div>
                    </div>
                    <div className="space-y-4 mt-2">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex gap-3">
                                <Skeleton className="h-12 w-12 rounded-full shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-3 w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                {/* Chat View Skeleton */}
                <div className="flex-1 flex flex-col bg-gray-50/50">
                    <div className="h-16 border-b border-gray-200/80 bg-white flex items-center px-6">
                        <Skeleton className="h-5 w-40" />
                    </div>
                    <div className="flex-1 p-6 space-y-6">
                        <div className="flex justify-start">
                            <Skeleton className="h-20 w-60" />
                        </div>
                        <div className="flex justify-end">
                            <Skeleton className="h-12 w-48" />
                        </div>
                        <div className="flex justify-start">
                            <Skeleton className="h-16 w-56" />
                        </div>
                    </div>
                </div>
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
