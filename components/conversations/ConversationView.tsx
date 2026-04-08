/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║        components/conversations/ConversationView.tsx          ║
 * ╠═══════════════════════════════════════════════════════════════╣
 * ║                                                               ║
 * ║     ┌─────────────────────────────────────────────────────┐   ║
 * ║     │  [←] John Doe          Online         [📞] [⋮] [ℹ️] │   ║
 * ║     ├─────────────────────────────────────────────────────┤   ║
 * ║     │                                                     │   ║
 * ║     │   ┌───────────────┐                                 │   ║
 * ║     │   │ Hello!        │                                 │   ║
 * ║     │   └───────────────┘                                 │   ║
 * ║     │                        ┌───────────────┐            │   ║
 * ║     │                        │ Hi there!     │            │   ║
 * ║     │                        └───────────────┘            │   ║
 * ║     │                                                     │   ║
 * ║     ├─────────────────────────────────────────────────────┤   ║
 * ║     │  [😊] [📎] [Type a message...               ] [➤]   │   ║
 * ║     └─────────────────────────────────────────────────────┘   ║
 * ║                                                               ║
 * ╠═══════════════════════════════════════════════════════════════╣
 * ║ DESCRIPTION:                                                  ║
 * ║   Vue de conversation avec header, messages et input.         ║
 * ╚═══════════════════════════════════════════════════════════════╝
 */

'use client'

import { useEffect, useRef, useCallback, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { formatDistanceToNow, format, isToday, isYesterday, isSameDay } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
    ArrowLeft,
    Phone,
    MoreVertical,
    Info,
    Archive,
    Ban,
    Trash2,
    CheckCircle,
    Unlock,
    Clock,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { MessageBubble } from './MessageBubble'
import { MessageInput } from './MessageInput'
import { ForwardMessageModal } from './ForwardMessageModal'
import { AssignmentBadge } from './AssignmentBadge'
import { AssignmentDropdown } from './AssignmentDropdown'
import { ButtonGroup } from '@/components/ui/button-group'
// import { CallButton } from '@/components/calls/call-button' // Fonctionnalite d'appel audio desactivee temporairement
import { useMessages, type Message } from '@/hooks/useMessages'
import { useConversations } from '@/hooks/useConversations'
import { useTypingIndicator } from '@/hooks/useRealtime'
import { cn } from '@/lib/utils'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'
// import { postApi } from '@/lib/api-utils'

// ============================================
// TYPES
// ============================================

interface ConversationViewProps {
    conversationId: string
    onBack?: () => void
    onToggleInfo?: () => void
    showInfoButton?: boolean
}

interface ConversationDetails {
    id: string
    contact: {
        id: string
        name: string | null
        phone: string
        avatarUrl: string | null
        lastContactedAt: string | null
        isBlocked?: boolean
    }
    status: string
    windowExpiresAt: string | null
    assignedTo: {
        id: string
        name: string | null
        email: string
        avatar: string | null
    } | null
    assignedAt: string | null
}

// ============================================
// DATE SEPARATOR
// ============================================

function DateSeparator({ date }: { date: Date }) {
    let label: string

    if (isToday(date)) {
        label = "Aujourd'hui"
    } else if (isYesterday(date)) {
        label = 'Hier'
    } else {
        label = format(date, 'd MMMM yyyy', { locale: fr })
    }

    return (
        <div className="flex items-center justify-center my-4">
            <span className="px-3 py-1 text-xs font-medium text-gray-500 bg-gray-100 rounded-full">
                {label}
            </span>
        </div>
    )
}

// ============================================
// HELPERS
// ============================================

function getWindowStatus(expiresAt?: string | null): { color: 'green' | 'orange' | 'red'; label: string } | null {
    if (!expiresAt) return null
    const remaining = new Date(expiresAt).getTime() - Date.now()
    if (remaining <= 0) return { color: 'red', label: 'Fenêtre expirée' }
    const hours = Math.floor(remaining / 3_600_000)
    const minutes = Math.floor((remaining % 3_600_000) / 60_000)
    const timeLabel = hours > 0 ? `${hours}h${minutes.toString().padStart(2, '0')} restantes` : `${minutes}min restantes`
    if (remaining < 4 * 3_600_000) return { color: 'orange', label: timeLabel }
    return { color: 'green', label: timeLabel }
}

// ============================================
// CONVERSATION HEADER
// ============================================

function ConversationHeader({
    conversation,
    currentMember,
    onBack,
    onToggleInfo,
    showInfoButton,
    onAssignmentChange,
}: {
    conversation: ConversationDetails
    currentMember: { id: string; role: 'owner' | 'admin' | 'agent' } | null
    onBack?: () => void
    onToggleInfo?: () => void
    showInfoButton?: boolean
    onAssignmentChange?: () => void
}) {
    const router = useRouter()
    const {
        archiveConversation,
        resolveConversation,
        reopenResolvedConversation,
        blockContact,
        isResolving,
    } = useConversations()

    const { contact, assignedTo } = conversation
    const windowStatus = getWindowStatus(conversation.windowExpiresAt)
    const initials = contact.name
        ? contact.name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
        : contact.phone.slice(-2)

    const lastSeen = contact.lastContactedAt
        ? formatDistanceToNow(new Date(contact.lastContactedAt), { addSuffix: true, locale: fr })
        : null

    const { isTyping, typingUsers } = useTypingIndicator(conversation.id)

    const [showBlockConfirm, setShowBlockConfirm] = useState(false)

    const handleResolve = async () => {
        await resolveConversation(conversation.id)
        router.push('/dashboard/conversations')
    }

    const handleBlockClick = () => {
        if (contact.isBlocked) {
            blockContact(contact.id)
        } else {
            setShowBlockConfirm(true)
        }
    }

    const confirmBlock = async () => {
        await blockContact(contact.id)
        setShowBlockConfirm(false)
    }

    return (
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white">
            {/* Back button (mobile) */}
            {onBack && (
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onBack}
                    className="shrink-0 md:hidden"
                >
                    <ArrowLeft className="h-5 w-5" />
                </Button>
            )}

            {/* Avatar */}
            <Avatar className="h-10 w-10 shrink-0">
                {contact.avatarUrl && (
                    <AvatarImage src={contact.avatarUrl} alt={contact.name || ''} />
                )}
                <AvatarFallback className="bg-gradient-to-br from-[#14532d] to-[#059669] text-white font-semibold">
                    {initials}
                </AvatarFallback>
            </Avatar>

            {/* Contact Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <h2 className="font-semibold text-gray-900 truncate">
                        {contact.name || contact.phone}
                    </h2>
                    {/* Assignment badge */}
                    <AssignmentBadge
                        assignedTo={assignedTo}
                        assignedAt={conversation.assignedAt}
                        size="sm"
                    />
                    {/* 24h Window indicator */}
                    {windowStatus && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <span className={cn(
                                    'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium',
                                    windowStatus.color === 'green' && 'bg-green-50 text-green-700',
                                    windowStatus.color === 'orange' && 'bg-orange-50 text-orange-700',
                                    windowStatus.color === 'red' && 'bg-red-50 text-red-700',
                                )}>
                                    <Clock className="h-3 w-3" />
                                    {windowStatus.label}
                                </span>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className="text-xs">Fenêtre de messagerie WhatsApp 24h</p>
                            </TooltipContent>
                        </Tooltip>
                    )}
                </div>
                <p className="text-xs text-gray-500 truncate h-4">
                    {isTyping ? (
                        <span className="text-green-600 font-medium animate-pulse">
                            {typingUsers.length > 0 ? `${typingUsers[0]} ecrit...` : 'En train d\'ecrire...'}
                        </span>
                    ) : (
                        contact.name ? contact.phone : lastSeen || 'WhatsApp'
                    )}
                </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
                {/* Button Group for Assignment and Call */}
                {currentMember && (
                    <ButtonGroup>
                        <AssignmentDropdown
                            conversationId={conversation.id}
                            currentAssignee={assignedTo}
                            currentUserMemberId={currentMember.id}
                            currentUserRole={currentMember.role}
                            onAssignmentChange={onAssignmentChange}
                        />

                        {/* Appel audio - Bientot disponible */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-1.5 text-gray-500 border-gray-200 bg-gray-50/50 cursor-not-allowed hover:bg-gray-50/50 hover:text-gray-500"
                                >
                                    <Phone className="h-4 w-4" />
                                    <span className="hidden sm:inline">Bientot</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Les appels audio seront bientot disponibles</p>
                            </TooltipContent>
                        </Tooltip>
                    </ButtonGroup>
                )}

                {/* Info toggle */}
                {showInfoButton && onToggleInfo && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onToggleInfo}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <Info className="h-5 w-5" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Infos contact</TooltipContent>
                    </Tooltip>
                )}

                {/* More options */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700">
                            <MoreVertical className="h-5 w-5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        {conversation.status === 'OPEN' ? (
                            <DropdownMenuItem
                                onClick={handleResolve}
                                disabled={isResolving}
                            >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                {isResolving ? 'Resolution...' : 'Marquer comme resolu'}
                            </DropdownMenuItem>
                        ) : (
                            <DropdownMenuItem
                                onClick={() => reopenResolvedConversation(conversation.id)}
                                disabled={isResolving}
                            >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                {isResolving ? 'Reouverture...' : 'Rouvrir'}
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => archiveConversation(conversation.id)}>
                            <Archive className="mr-2 h-4 w-4" />
                            Archiver
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={handleBlockClick}
                            className={contact.isBlocked ? "" : "text-red-600"}
                        >
                            {contact.isBlocked ? (
                                <>
                                    <Unlock className="mr-2 h-4 w-4" />
                                    Debloquer
                                </>
                            ) : (
                                <>
                                    <Ban className="mr-2 h-4 w-4" />
                                    Bloquer
                                </>
                            )}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <AlertDialog open={showBlockConfirm} onOpenChange={setShowBlockConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Bloquer ce contact ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Ce contact ne pourra plus interagir avec votre assistant virtuel ni envoyer de messages.
                            Cette action est réversible.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <ButtonGroup className="justify-center sm:justify-end w-full sm:w-auto">
                            <AlertDialogCancel className="mt-0">Annuler</AlertDialogCancel>
                            <AlertDialogAction onClick={confirmBlock} className="bg-red-600 hover:bg-red-700">
                                Bloquer
                            </AlertDialogAction>
                        </ButtonGroup>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

// ============================================
// MESSAGES LIST
// ============================================

function MessagesList({
    messages,
    onLoadMore,
    hasMore,
    isLoadingMore,
    onResend,
    onReply,
    onForward,
}: {
    messages: Message[]
    onLoadMore: () => void
    hasMore: boolean
    isLoadingMore: boolean
    onResend: (messageId: string) => Promise<void>
    onReply: (message: Message) => void
    onForward: (message: Message) => void
}) {
    const scrollRef = useRef<HTMLDivElement>(null)
    const bottomRef = useRef<HTMLDivElement>(null)

    // Scroll to bottom on new messages
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages.length])

    // Group messages by date
    const groupedMessages: { date: Date; messages: Message[] }[] = []
    let currentGroup: { date: Date; messages: Message[] } | null = null

    messages.forEach((message) => {
        const messageDate = new Date(message.timestamp)
        if (!currentGroup || !isSameDay(currentGroup.date, messageDate)) {
            currentGroup = { date: messageDate, messages: [] }
            groupedMessages.push(currentGroup)
        }
        currentGroup.messages.push(message)
    })

    return (
        <ScrollArea
            ref={scrollRef}
            className="h-full px-4 bg-[#efeae2]"
            style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4cfc6' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
        >
            {/* Load more button */}
            {hasMore && (
                <div className="flex justify-center py-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onLoadMore}
                        disabled={isLoadingMore}
                        className="rounded-full bg-white/80"
                    >
                        {isLoadingMore ? 'Chargement...' : 'Charger plus'}
                    </Button>
                </div>
            )}

            {/* Messages grouped by date */}
            {groupedMessages.map((group, groupIndex) => (
                <div key={groupIndex}>
                    <DateSeparator date={group.date} />
                    {group.messages.map((message, messageIndex) => {
                        const prevMessage = group.messages[messageIndex - 1]
                        const isGrouped =
                            prevMessage &&
                            prevMessage.direction === message.direction &&
                            new Date(message.timestamp).getTime() -
                            new Date(prevMessage.timestamp).getTime() <
                            60000 // 1 minute

                        return (
                            <MessageBubble
                                key={message.id}
                                message={message}
                                isGrouped={isGrouped}
                                onResend={onResend}
                                onReply={onReply}
                                onForward={onForward}
                            />
                        )
                    })}
                </div>
            ))}

            {/* Scroll anchor */}
            <div ref={bottomRef} className="h-4" />
        </ScrollArea>
    )
}

// ============================================
// CONVERSATION VIEW
// ============================================

export function ConversationView({
    conversationId,
    onBack,
    onToggleInfo,
    showInfoButton,
}: ConversationViewProps) {
    // Reply state
    const [replyToMessage, setReplyToMessage] = useState<Message | null>(null)

    // Forward state
    const [forwardMessage, setForwardMessage] = useState<Message | null>(null)
    const [showForwardModal, setShowForwardModal] = useState(false)

    // Get current member from conversations hook
    const { currentMember } = useConversations()

    // Reset states when changing conversation
    useEffect(() => {
        setReplyToMessage(null)
        setForwardMessage(null)
        setShowForwardModal(false)
    }, [conversationId])

    // Handle forward
    const handleForward = useCallback((message: Message) => {
        setForwardMessage(message)
        setShowForwardModal(true)
    }, [])

    const sendMutation = useMutation(api.messages.send)
    // Forward message to another conversation
    const forwardToConversation = useCallback(async (targetConversationId: string, message: Message) => {
        const media = message.media?.[0]
        await sendMutation({
            conversationId: targetConversationId as Id<"conversations">,
            content: message.content || undefined,
            type: message.type,
            mediaStorageId: media?.storageId as Id<"_storage"> | undefined,
            mediaType: media?.mimeType,
            fileName: media?.fileName,
            fileSize: media?.fileSize,
            isForwarded: true,
        })
    }, [sendMutation])

    // Handle assignment change - not needed with Convex (real-time!)
    const handleAssignmentChange = useCallback(() => {
        // With Convex, the query is reactive and will auto-update
    }, [])

    // Fetch conversation details with Convex (real-time!)
    const conversationData = useQuery(
        api.conversations.getById,
        conversationId ? { id: conversationId as Id<"conversations"> } : "skip"
    )

    // Transform Convex data to match expected format
    const conversation: ConversationDetails | null = useMemo(() => {
        if (!conversationData) return null

        return {
            id: conversationData._id,
            contact: {
                id: conversationData.contact?._id || '',
                name: conversationData.contact?.name || null,
                phone: conversationData.contact?.waId || conversationData.contact?.phoneNumber || '',
                avatarUrl: conversationData.contact?.profilePicture || null,
                lastContactedAt: conversationData.contact?.lastContactedAt
                    ? new Date(conversationData.contact.lastContactedAt).toISOString()
                    : null,
                isBlocked: conversationData.contact?.isBlocked,
            },
            status: conversationData.status || 'OPEN',
            windowExpiresAt: conversationData.windowExpiresAt
                ? new Date(conversationData.windowExpiresAt).toISOString()
                : null,
            assignedTo: conversationData.assignedTo ? {
                id: conversationData.assignedTo._id,
                name: conversationData.assignedTo.user?.name || null,
                email: conversationData.assignedTo.user?.email || '',
                avatar: conversationData.assignedTo.user?.image || null,
            } : null,
            assignedAt: conversationData.assignedAt
                ? new Date(conversationData.assignedAt).toISOString()
                : null,
        }
    }, [conversationData])

    const isLoadingConversation = conversationData === undefined

    // Fetch messages with Convex real-time
    const {
        messages,
        isLoading: isLoadingMessages,
        hasNextPage,
        loadMore,
        isFetchingNextPage,
        resendMessage,
    } = useMessages({
        conversationId,
        organizationId: currentMember?.organizationId,
    })

    // Mark as read when viewing
    const { markAsRead } = useConversations()
    useEffect(() => {
        if (conversationId) {
            markAsRead(conversationId)
        }
    }, [conversationId, markAsRead])

    // Loading state
    if (isLoadingConversation || isLoadingMessages) {
        return (
            <div className="flex flex-col h-full">
                {/* Header skeleton */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white">
                    <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse" />
                    <div className="flex-1 space-y-2">
                        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                        <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
                    </div>
                </div>
                {/* Messages skeleton */}
                <div className="flex-1 bg-[#e5ddd5] p-4 space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div
                            key={i}
                            className={cn(
                                'flex',
                                i % 2 === 0 ? 'justify-start' : 'justify-end'
                            )}
                        >
                            <div
                                className={cn(
                                    'h-12 w-48 rounded-2xl animate-pulse',
                                    i % 2 === 0 ? 'bg-white' : 'bg-green-100'
                                )}
                            />
                        </div>
                    ))}
                </div>
                {/* Input skeleton */}
                <div className="border-t border-gray-100 bg-white p-4">
                    <div className="h-11 rounded-2xl bg-gray-100 animate-pulse" />
                </div>
            </div>
        )
    }

    if (!conversation) {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">Conversation non trouvee</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Header */}
            <ConversationHeader
                conversation={conversation}
                currentMember={currentMember}
                onBack={onBack}
                onToggleInfo={onToggleInfo}
                showInfoButton={showInfoButton}
                onAssignmentChange={handleAssignmentChange}
            />

            {/* Blocked Banner */}
            {conversation.contact?.isBlocked && (
                <div className="bg-red-50 px-4 py-2 border-b border-red-100 flex items-center justify-center animate-in slide-in-from-top-2">
                    <div className="flex items-center gap-2 text-red-600">
                        <Ban className="h-4 w-4" />
                        <span className="text-sm font-medium">
                            Ce contact est bloqué. Vous ne pouvez pas recevoir de messages ou y répondre.
                        </span>
                    </div>
                </div>
            )}

            {/* Messages */}
            <div className="flex-1 min-h-0 overflow-hidden">
                <MessagesList
                    messages={messages}
                    onLoadMore={loadMore}
                    hasMore={!!hasNextPage}
                    isLoadingMore={isFetchingNextPage}
                    onResend={resendMessage}
                    onReply={setReplyToMessage}
                    onForward={handleForward}
                />
            </div>

            {/* Input */}
            <MessageInput
                conversationId={conversationId}
                replyTo={replyToMessage}
                onCancelReply={() => setReplyToMessage(null)}
                disabled={!!conversation.contact?.isBlocked}
            />

            {/* Forward Modal */}
            <ForwardMessageModal
                open={showForwardModal}
                onOpenChange={setShowForwardModal}
                message={forwardMessage}
                currentConversationId={conversationId}
                onForward={forwardToConversation}
            />
        </div>
    )
}
