/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║          components/conversations/ContactList.tsx             ║
 * ╠═══════════════════════════════════════════════════════════════╣
 * ║                                                               ║
 * ║     ┌─────────────────────────────────────────────────────┐   ║
 * ║     │  🔍 Search contacts...                              │   ║
 * ║     ├─────────────────────────────────────────────────────┤   ║
 * ║     │  [All] [Unread] [Open] [Archived]                   │   ║
 * ║     ├─────────────────────────────────────────────────────┤   ║
 * ║     │  👤 John Doe                           2m ago       │   ║
 * ║     │     Hey, how are you doing?               ●         │   ║
 * ║     ├─────────────────────────────────────────────────────┤   ║
 * ║     │  👤 Jane Smith                         1h ago       │   ║
 * ║     │     Thanks for the info!                            │   ║
 * ║     └─────────────────────────────────────────────────────┘   ║
 * ║                                                               ║
 * ╠═══════════════════════════════════════════════════════════════╣
 * ║ DESCRIPTION:                                                  ║
 * ║   Liste des conversations avec recherche et filtres.          ║
 * ║   Affiche l'apercu du dernier message et le compteur unread.  ║
 * ╚═══════════════════════════════════════════════════════════════╝
 */

'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, UserX, Archive, Inbox, Mail, MessageSquare, Users } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useConversations, type ConversationFilter, type ConversationSummary } from '@/hooks/useConversations'
import { AssignmentBadge } from './AssignmentBadge'
import { cn } from '@/lib/utils'

// ============================================
// TYPES
// ============================================

interface ContactListProps {
    selectedId?: string
    onSelect: (conversationId: string) => void
}

// ============================================
// FILTER TABS
// ============================================

const filterTabs: { value: ConversationFilter; label: string; icon: React.ElementType }[] = [
    { value: 'all', label: 'Tous', icon: Inbox },
    { value: 'unread', label: 'Non lus', icon: Mail },
    { value: 'unassigned', label: 'Non assignees', icon: UserX },
    { value: 'archived', label: 'Archives', icon: Archive },
]

// ============================================
// SECTION HEADER
// ============================================

function SectionHeader({
    title,
    count,
    icon: Icon,
    color,
}: {
    title: string
    count: number
    icon: React.ElementType
    color: 'green' | 'orange' | 'gray'
}) {
    const colorClasses = {
        green: 'bg-green-50 text-green-700 border-green-200',
        orange: 'bg-orange-50 text-orange-700 border-orange-200',
        gray: 'bg-gray-50 text-gray-600 border-gray-200',
    }

    return (
        <div className={cn(
            'sticky top-0 z-10 px-4 py-2 border-b flex items-center gap-2',
            colorClasses[color]
        )}>
            <Icon className="h-4 w-4" />
            <span className="text-xs font-medium">{title}</span>
            <Badge
                variant="outline"
                className={cn(
                    'ml-auto text-[10px] px-1.5 py-0 h-4',
                    color === 'green' && 'bg-green-100 text-green-700 border-green-300',
                    color === 'orange' && 'bg-orange-100 text-orange-700 border-orange-300',
                    color === 'gray' && 'bg-gray-100 text-gray-600 border-gray-300'
                )}
            >
                {count}
            </Badge>
        </div>
    )
}

// ============================================
// CONTACT LIST ITEM
// ============================================

function ContactListItem({
    conversation,
    isSelected,
    onClick,
}: {
    conversation: ConversationSummary
    isSelected: boolean
    onClick: () => void
}) {
    const { contact, lastMessageText, lastMessageAt, unreadCount, lastMessageType, assignedTo } = conversation

    // Get initials for avatar fallback
    const initials = contact.name
        ? contact.name
            .split(' ')
            .map((n: string) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
        : contact.phone.slice(-2)

    // Format time
    const timeAgo = lastMessageAt
        ? formatDistanceToNow(new Date(lastMessageAt), { addSuffix: false, locale: fr })
        : ''

    // Get message preview
    const messagePreview = useMemo(() => {
        if (!lastMessageText) {
            if (lastMessageType === 'IMAGE') return '📷 Photo'
            if (lastMessageType === 'VIDEO') return '🎥 Video'
            if (lastMessageType === 'AUDIO') return '🎵 Audio'
            if (lastMessageType === 'DOCUMENT') return '📄 Document'
            if (lastMessageType === 'LOCATION') return '📍 Position'
            if (lastMessageType === 'STICKER') return '🎭 Sticker'
            return 'Nouveau message'
        }
        return lastMessageText.length > 40
            ? lastMessageText.slice(0, 40) + '...'
            : lastMessageText
    }, [lastMessageText, lastMessageType])

    return (
        <motion.button
            layout
            onClick={onClick}
            className={cn(
                'w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-200',
                'hover:bg-gray-50 focus:outline-none focus:bg-gray-50',
                isSelected && 'bg-green-50 hover:bg-green-50 border-l-4 border-green-500'
            )}
            whileTap={{ scale: 0.98 }}
        >
            {/* Avatar */}
            <div className="relative shrink-0">
                <Avatar className="h-12 w-12">
                    {contact.avatarUrl && (
                        <AvatarImage src={contact.avatarUrl} alt={contact.name || ''} />
                    )}
                    <AvatarFallback className="bg-linear-to-br from-green-400 to-green-600 text-white font-medium">
                        {initials}
                    </AvatarFallback>
                </Avatar>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                        <h3 className={cn(
                            'font-medium truncate',
                            unreadCount > 0 ? 'text-gray-900' : 'text-gray-700'
                        )}>
                            {contact.name || contact.phone}
                        </h3>
                        {/* Assignment badge - show assigned agent or "Non assignee" */}
                        {assignedTo ? (
                            <AssignmentBadge
                                assignedTo={assignedTo}
                                size="sm"
                                showAvatar={false}
                            />
                        ) : (
                            <Badge
                                variant="outline"
                                className="text-[10px] px-1.5 py-0 h-4 bg-orange-50 text-orange-600 border-orange-200"
                            >
                                Non assignee
                            </Badge>
                        )}
                    </div>
                    <span className={cn(
                        'text-xs shrink-0',
                        unreadCount > 0 ? 'text-green-600 font-medium' : 'text-gray-400'
                    )}>
                        {timeAgo}
                    </span>
                </div>
                <div className="flex items-center justify-between gap-2 mt-0.5">
                    <p className={cn(
                        'text-sm truncate',
                        unreadCount > 0 ? 'text-gray-700 font-medium' : 'text-gray-500'
                    )}>
                        {messagePreview}
                    </p>
                    {unreadCount > 0 && (
                        <Badge className="h-5 min-w-[20px] rounded-full bg-green-500 text-white text-xs px-1.5 shrink-0">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </Badge>
                    )}
                </div>
            </div>
        </motion.button>
    )
}

// ============================================
// CONTACT LIST
// ============================================

export function ContactList({ selectedId, onSelect }: ContactListProps) {
    const [searchQuery, setSearchQuery] = useState('')

    const {
        conversations,
        filter,
        setFilter,
        isLoading,
        unreadCount: totalUnread,
    } = useConversations()

    // Filter conversations by search query
    const filteredConversations = useMemo(() => {
        if (!searchQuery.trim()) return conversations
        const query = searchQuery.toLowerCase()
        return conversations.filter(
            (conv: ConversationSummary) =>
                conv.contact.name?.toLowerCase().includes(query) ||
                conv.contact.phone.includes(query) ||
                conv.lastMessageText?.toLowerCase().includes(query)
        )
    }, [conversations, searchQuery])

    // Group conversations by category for "all" filter
    const groupedConversations = useMemo(() => {
        if (filter !== 'all') return null

        const unread: ConversationSummary[] = []
        const unassigned: ConversationSummary[] = []
        const others: ConversationSummary[] = []

        for (const conv of filteredConversations) {
            if (conv.unreadCount > 0) {
                unread.push(conv)
            } else if (!conv.assignedTo) {
                unassigned.push(conv)
            } else {
                others.push(conv)
            }
        }

        return { unread, unassigned, others }
    }, [filteredConversations, filter])

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">Conversations</h2>
                    {totalUnread > 0 && (
                        <Badge className="bg-green-500 text-white">
                            {totalUnread} non lu{totalUnread > 1 ? 's' : ''}
                        </Badge>
                    )}
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                        placeholder="Rechercher..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-10 pl-9"
                    />
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="px-4 py-2 border-b border-gray-100">
                <ButtonGroup className="w-full">
                    {filterTabs.map((tab) => {
                        const Icon = tab.icon
                        const isActive = filter === tab.value
                        return (
                            <Button
                                key={tab.value}
                                variant={isActive ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setFilter(tab.value)}
                                className={cn(
                                    'flex-1 gap-1.5 text-xs',
                                    isActive && 'bg-green-500 hover:bg-green-600 border-green-500'
                                )}
                            >
                                <Icon className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">{tab.label}</span>
                            </Button>
                        )
                    })}
                </ButtonGroup>
            </div>

            {/* Conversations List */}
            <ScrollArea className="flex-1">
                {isLoading ? (
                    // Loading skeleton
                    <div className="p-4 space-y-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-3 animate-pulse">
                                <div className="h-12 w-12 rounded-full bg-gray-200" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 w-24 bg-gray-200 rounded" />
                                    <div className="h-3 w-40 bg-gray-100 rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredConversations.length === 0 ? (
                    // Empty state
                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                        <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                            <MessageSquare className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-sm font-medium text-gray-900 mb-1">
                            Aucune conversation
                        </h3>
                        <p className="text-sm text-gray-500">
                            {searchQuery
                                ? 'Aucun resultat pour cette recherche'
                                : 'Les nouvelles conversations apparaitront ici'}
                        </p>
                    </div>
                ) : filter === 'all' && groupedConversations ? (
                    // Grouped view with category separators
                    <div>
                        {/* Non lus (Unread) */}
                        {groupedConversations.unread.length > 0 && (
                            <div>
                                <SectionHeader
                                    title="Non lus"
                                    count={groupedConversations.unread.length}
                                    icon={Mail}
                                    color="green"
                                />
                                <div className="divide-y divide-gray-100">
                                    {groupedConversations.unread.map((conversation) => (
                                        <ContactListItem
                                            key={conversation.id}
                                            conversation={conversation}
                                            isSelected={selectedId === conversation.id}
                                            onClick={() => onSelect(conversation.id)}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Non assignees (Unassigned) */}
                        {groupedConversations.unassigned.length > 0 && (
                            <div>
                                <SectionHeader
                                    title="Non assignees"
                                    count={groupedConversations.unassigned.length}
                                    icon={UserX}
                                    color="orange"
                                />
                                <div className="divide-y divide-gray-100">
                                    {groupedConversations.unassigned.map((conversation) => (
                                        <ContactListItem
                                            key={conversation.id}
                                            conversation={conversation}
                                            isSelected={selectedId === conversation.id}
                                            onClick={() => onSelect(conversation.id)}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Assignees (Others - assigned and read) */}
                        {groupedConversations.others.length > 0 && (
                            <div>
                                <SectionHeader
                                    title="Assignees"
                                    count={groupedConversations.others.length}
                                    icon={Users}
                                    color="gray"
                                />
                                <div className="divide-y divide-gray-100">
                                    {groupedConversations.others.map((conversation) => (
                                        <ContactListItem
                                            key={conversation.id}
                                            conversation={conversation}
                                            isSelected={selectedId === conversation.id}
                                            onClick={() => onSelect(conversation.id)}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    // Regular list view (for other filters)
                    <AnimatePresence initial={false}>
                        <div className="divide-y divide-gray-100">
                            {filteredConversations.map((conversation: ConversationSummary) => (
                                <ContactListItem
                                    key={conversation.id}
                                    conversation={conversation}
                                    isSelected={selectedId === conversation.id}
                                    onClick={() => onSelect(conversation.id)}
                                />
                            ))}
                        </div>
                    </AnimatePresence>
                )}
            </ScrollArea>
        </div>
    )
}
