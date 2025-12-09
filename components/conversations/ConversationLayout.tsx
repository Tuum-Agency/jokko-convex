/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║      components/conversations/ConversationLayout.tsx          ║
 * ╠═══════════════════════════════════════════════════════════════╣
 * ║                                                               ║
 * ║     ┌──────────────────────────────────────────────────────┐  ║
 * ║     │                     INBOX                            │  ║
 * ║     ├──────────────┬───────────────────────────────────────┤  ║
 * ║     │              │                                       │  ║
 * ║     │   CONTACT    │         CONVERSATION VIEW             │  ║
 * ║     │    LIST      │                                       │  ║
 * ║     │              │   ┌─────────────────────────────────┐ │  ║
 * ║     │  [Search]    │   │        MESSAGES                 │ │  ║
 * ║     │              │   └─────────────────────────────────┘ │  ║
 * ║     │  ● Contact 1 │   ┌─────────────────────────────────┐ │  ║
 * ║     │  ○ Contact 2 │   │ Type a message...           📎 │ │  ║
 * ║     │              │   └─────────────────────────────────┘ │  ║
 * ║     └──────────────┴───────────────────────────────────────┘  ║
 * ║                                                               ║
 * ╠═══════════════════════════════════════════════════════════════╣
 * ║ DESCRIPTION:                                                  ║
 * ║   Layout responsive pour l'inbox de conversations.            ║
 * ║   Desktop: 3 colonnes (list + chat + info).                   ║
 * ║   Mobile: vue liste ou conversation.                          ║
 * ╚═══════════════════════════════════════════════════════════════╝
 */

'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { ContactList } from './ContactList'
import { ConversationView } from './ConversationView'
import { ContactInfo } from './ContactInfo'
import { EmptyState } from './EmptyState'
import { useRealtime } from '@/hooks/useRealtime'
import { cn } from '@/lib/utils'

// ============================================
// TYPES
// ============================================

interface ConversationLayoutProps {
    organizationId: string
    basePath?: string
}

// ============================================
// COMPONENT
// ============================================

export function ConversationLayout({
    organizationId,
    basePath = '/dashboard/conversations',
}: ConversationLayoutProps) {
    const params = useParams()
    const router = useRouter()
    const conversationId = params?.conversationId as string | undefined

    const isMobile = useMediaQuery('(max-width: 768px)')
    const isTablet = useMediaQuery('(max-width: 1024px)')
    const [showList, setShowList] = useState(true)
    const [showInfo, setShowInfo] = useState(false)

    // Sur mobile, gerer la vue
    useEffect(() => {
        if (isMobile && conversationId) {
            setShowList(false)
        }
    }, [isMobile, conversationId])

    // Subscribe aux events temps reel
    useRealtime(organizationId)

    // Handler selection conversation
    const handleSelectConversation = (id: string) => {
        router.push(`${basePath}/${id}`)
        if (isMobile) setShowList(false)
    }

    // Handler retour (mobile)
    const handleBack = () => {
        router.push(basePath)
        setShowList(true)
        setShowInfo(false)
    }

    // Toggle info panel
    const toggleInfo = () => {
        setShowInfo(!showInfo)
    }

    return (
        <div className="flex h-full overflow-hidden bg-gray-50/50">
            {/* Contact List */}
            <AnimatePresence mode="wait">
                {(!isMobile || showList) && (
                    <motion.aside
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        className={cn(
                            'flex flex-col border-r border-gray-200/80 bg-white relative z-0 overflow-hidden',
                            isMobile ? 'w-full' : 'w-80 md:w-96 lg:w-[420px] shrink-0'
                        )}
                    >
                        <ContactList
                            selectedId={conversationId}
                            onSelect={handleSelectConversation}
                        />
                    </motion.aside>
                )}
            </AnimatePresence>

            {/* Conversation View */}
            <AnimatePresence mode="wait">
                {(!isMobile || !showList) && (
                    <motion.main
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className={cn(
                            'flex-1 flex flex-col min-w-0 relative z-10 overflow-hidden',
                            !conversationId && 'items-center justify-center'
                        )}
                    >
                        {conversationId ? (
                            <ConversationView
                                conversationId={conversationId}
                                onBack={isMobile ? handleBack : undefined}
                                onToggleInfo={toggleInfo}
                                showInfoButton={!isTablet}
                            />
                        ) : (
                            <EmptyState />
                        )}
                    </motion.main>
                )}
            </AnimatePresence>

            {/* Contact Info Panel */}
            <AnimatePresence>
                {showInfo && conversationId && !isTablet && (
                    <motion.aside
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.2 }}
                        className="w-80 shrink-0 border-l border-gray-200/80 bg-white overflow-hidden h-full flex flex-col"
                    >
                        <ContactInfo
                            conversationId={conversationId}
                            onClose={() => setShowInfo(false)}
                        />
                    </motion.aside>
                )}
            </AnimatePresence>
        </div>
    )
}
