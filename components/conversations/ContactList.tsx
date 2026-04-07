'use client'

import { useState, useMemo, useCallback } from 'react'
import { Search, UserX, Archive, Inbox, User, Phone, MessageSquare, X, Mail, Users, Clock, UserPlus, CheckCheck, Pin, ArrowUpDown, SortAsc, CheckSquare } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

import { Input } from '@/components/ui/input'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useConversations, type ConversationFilter, type ConversationSummary } from '@/hooks/useConversations'
import { useChannels } from '@/hooks/useChannels'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'
import { cn } from '@/lib/utils'

// ============================================
// TYPES
// ============================================

interface ContactListProps {
    selectedId?: string
    onSelect: (conversationId: string) => void
}

type PrimaryScope = 'all' | 'mine'
type SecondaryFilter = 'none' | 'unread' | 'unassigned' | 'archived'
type SortOption = 'recent' | 'oldest' | 'unread' | 'name'

// ============================================
// SECONDARY FILTER CONFIG
// ============================================

const secondaryFilters: { value: SecondaryFilter; label: string; icon: React.ElementType; hideWhenMine?: boolean }[] = [
    { value: 'none', label: 'Tout', icon: Inbox },
    { value: 'unread', label: 'Non lus', icon: Mail },
    { value: 'unassigned', label: 'Non assign\u00e9es', icon: UserX, hideWhenMine: true },
    { value: 'archived', label: 'Archiv\u00e9es', icon: Archive },
]

// ============================================
// HELPERS
// ============================================

function getWindowStatus(expiresAt?: number): { color: 'green' | 'orange' | 'red'; label: string } | null {
    if (!expiresAt) return null
    const remaining = expiresAt - Date.now()
    if (remaining <= 0) return { color: 'red', label: 'Fenêtre expirée' }
    const hours = Math.floor(remaining / 3_600_000)
    const minutes = Math.floor((remaining % 3_600_000) / 60_000)
    const timeLabel = hours > 0 ? `${hours}h${minutes.toString().padStart(2, '0')} restantes` : `${minutes}min restantes`
    if (remaining < 4 * 3_600_000) return { color: 'orange', label: timeLabel }
    return { color: 'green', label: timeLabel }
}

function computeBackendFilter(primary: PrimaryScope, secondary: SecondaryFilter): ConversationFilter {
    if (secondary === 'archived') return 'archived'
    if (primary === 'mine') return 'mine'
    if (secondary === 'unread') return 'unread'
    if (secondary === 'unassigned') return 'unassigned'
    return 'all'
}

// ============================================
// SECTION DIVIDER
// ============================================

function SectionDivider({ title, count }: { title: string; count: number }) {
    return (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-50/50">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                {title}
            </span>
            <Badge
                variant="secondary"
                className="text-[10px] px-1.5 py-0 h-4 bg-gray-100 text-gray-500 font-medium"
            >
                {count}
            </Badge>
            <div className="h-px flex-1 bg-gray-200" />
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
    showAssignee = true,
    onArchive,
    onMarkAsRead,
    onAssignToMe,
    onTogglePin,
    isTyping = false,
}: {
    conversation: ConversationSummary
    isSelected: boolean
    onClick: () => void
    showAssignee?: boolean
    onArchive?: (id: string) => void
    onMarkAsRead?: (id: string) => void
    onAssignToMe?: (id: string) => void
    onTogglePin?: (id: string) => void
    isTyping?: boolean
}) {
    const { contact, lastMessageText, lastMessageAt, unreadCount, lastMessageType, assignedTo } = conversation

    const initials = contact.name
        ? contact.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
        : contact.phone.slice(-2)

    const timeAgo = lastMessageAt
        ? formatDistanceToNow(new Date(lastMessageAt), { addSuffix: false, locale: fr })
        : ''

    const messagePreview = useMemo(() => {
        if (!lastMessageText) {
            const typeMap: Record<string, string> = {
                IMAGE: 'Photo',
                VIDEO: 'Vidéo',
                AUDIO: 'Audio',
                DOCUMENT: 'Document',
                LOCATION: 'Position',
                STICKER: 'Sticker',
            }
            return typeMap[lastMessageType] || 'Nouveau message'
        }
        return lastMessageText.length > 45
            ? lastMessageText.slice(0, 45) + '\u2026'
            : lastMessageText
    }, [lastMessageText, lastMessageType])

    const windowStatus = getWindowStatus(conversation.windowExpiresAt)

    return (
        <button
            onClick={onClick}
            className={cn(
                'w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-150 cursor-pointer relative group',
                'hover:bg-gray-50 focus:outline-none focus:bg-gray-50',
                isSelected
                    ? 'bg-green-50/70 hover:bg-green-50/70 border-l-2 border-l-green-600'
                    : 'border-l-2 border-l-transparent'
            )}
        >
            {/* Avatar */}
            <div className="relative shrink-0">
                <Avatar className="h-11 w-11">
                    {contact.avatarUrl && <AvatarImage src={contact.avatarUrl} alt={contact.name || ''} />}
                    <AvatarFallback className="bg-gradient-to-br from-[#14532d] to-[#059669] text-white text-sm font-semibold">
                        {initials}
                    </AvatarFallback>
                </Avatar>
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-white" />
                )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                    <h3 className={cn(
                        'text-sm truncate',
                        unreadCount > 0 ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'
                    )}>
                        {contact.name || contact.phone}
                    </h3>
                    <div className="flex items-center gap-1.5 shrink-0">
                        {windowStatus && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span className={cn(
                                        'inline-block h-2 w-2 rounded-full',
                                        windowStatus.color === 'green' && 'bg-green-500',
                                        windowStatus.color === 'orange' && 'bg-orange-500',
                                        windowStatus.color === 'red' && 'bg-red-500',
                                    )} />
                                </TooltipTrigger>
                                <TooltipContent side="left">
                                    <div className="flex items-center gap-1.5">
                                        <Clock className="h-3 w-3" />
                                        <span className="text-xs">{windowStatus.label}</span>
                                    </div>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        <span className={cn(
                            'text-[11px]',
                            unreadCount > 0 ? 'text-green-600 font-semibold' : 'text-gray-400'
                        )}>
                            {timeAgo}
                        </span>
                    </div>
                </div>
                <div className="flex items-center justify-between gap-2 mt-0.5">
                    {isTyping ? (
                        <span className="flex items-center gap-1 text-[13px] text-green-600 font-medium">
                            <span className="flex gap-0.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                            </span>
                            En train d'écrire...
                        </span>
                    ) : (
                        <p className={cn(
                            'text-[13px] truncate',
                            unreadCount > 0 ? 'text-gray-600 font-medium' : 'text-gray-400'
                        )}>
                            {messagePreview}
                        </p>
                    )}
                    <div className="flex items-center gap-1.5 shrink-0">
                        {/* Response time indicator */}
                        {unreadCount > 0 && conversation.lastMessageDirection === 'INBOUND' && lastMessageAt && (
                            (() => {
                                const waitMs = Date.now() - lastMessageAt
                                const waitHours = Math.floor(waitMs / 3_600_000)
                                const waitMin = Math.floor((waitMs % 3_600_000) / 60_000)
                                if (waitMin < 5) return null
                                return (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <span className={cn(
                                                'inline-flex items-center gap-0.5 text-[10px] font-medium',
                                                waitHours >= 4 ? 'text-red-500' : waitHours >= 1 ? 'text-orange-500' : 'text-gray-400'
                                            )}>
                                                <Clock className="h-3 w-3" />
                                                {waitHours > 0 ? `${waitHours}h` : `${waitMin}m`}
                                            </span>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <span className="text-xs">En attente depuis {waitHours > 0 ? `${waitHours}h${waitMin.toString().padStart(2, '0')}` : `${waitMin} min`}</span>
                                        </TooltipContent>
                                    </Tooltip>
                                )
                            })()
                        )}
                        {unreadCount > 0 && (
                            <Badge className="h-[18px] min-w-[18px] rounded-full bg-green-500 hover:bg-green-500 text-white text-[10px] px-1 shrink-0 font-semibold">
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </Badge>
                        )}
                    </div>
                </div>
                {/* Tags */}
                {conversation.tags.length > 0 && (
                    <div className="flex items-center gap-1 mt-1">
                        {conversation.tags.slice(0, 3).map((tag, i) => (
                            <Tooltip key={i}>
                                <TooltipTrigger asChild>
                                    <span
                                        className="inline-block w-2 h-2 rounded-full"
                                        style={{ backgroundColor: typeof tag === 'object' && (tag as any).color ? (tag as any).color : '#9ca3af' }}
                                    />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <span className="text-xs">{typeof tag === 'object' ? (tag as any).name : tag}</span>
                                </TooltipContent>
                            </Tooltip>
                        ))}
                        {conversation.tags.length > 3 && (
                            <span className="text-[10px] text-gray-400">+{conversation.tags.length - 3}</span>
                        )}
                    </div>
                )}
                {showAssignee && assignedTo && (
                    <p className="text-[10px] text-gray-400 mt-0.5 truncate">
                        Assignée à {assignedTo.name || assignedTo.email?.split('@')[0]}
                    </p>
                )}
            </div>

            {/* Hover quick actions */}
            <div className="absolute inset-y-0 right-0 hidden md:flex items-center gap-1 pr-3 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-l from-white via-white to-transparent pl-8">
                {unreadCount > 0 && onMarkAsRead && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span
                                role="button"
                                onClick={(e) => { e.stopPropagation(); onMarkAsRead(conversation.id) }}
                                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 cursor-pointer"
                            >
                                <CheckCheck className="h-4 w-4" />
                            </span>
                        </TooltipTrigger>
                        <TooltipContent>Marquer comme lu</TooltipContent>
                    </Tooltip>
                )}
                {onAssignToMe && !assignedTo && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span
                                role="button"
                                onClick={(e) => { e.stopPropagation(); onAssignToMe(conversation.id) }}
                                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 cursor-pointer"
                            >
                                <UserPlus className="h-4 w-4" />
                            </span>
                        </TooltipTrigger>
                        <TooltipContent>S'assigner</TooltipContent>
                    </Tooltip>
                )}
                {onTogglePin && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span
                                role="button"
                                onClick={(e) => { e.stopPropagation(); onTogglePin(conversation.id) }}
                                className={cn(
                                    'p-1.5 rounded-full cursor-pointer',
                                    conversation.isPinned
                                        ? 'text-green-600 hover:bg-green-50'
                                        : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                                )}
                            >
                                <Pin className="h-4 w-4" />
                            </span>
                        </TooltipTrigger>
                        <TooltipContent>{conversation.isPinned ? 'Désépingler' : 'Épingler'}</TooltipContent>
                    </Tooltip>
                )}
                {onArchive && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span
                                role="button"
                                onClick={(e) => { e.stopPropagation(); onArchive(conversation.id) }}
                                className="p-1.5 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 cursor-pointer"
                            >
                                <Archive className="h-4 w-4" />
                            </span>
                        </TooltipTrigger>
                        <TooltipContent>Archiver</TooltipContent>
                    </Tooltip>
                )}
            </div>
        </button>
    )
}

// ============================================
// CONVERSATION PEEK (hover preview)
// ============================================

function ConversationPeek({ conversationId }: { conversationId: string }) {
    const messages = useQuery(api.messages.preview, {
        conversationId: conversationId as Id<"conversations">
    })

    if (!messages || messages.length === 0) {
        return (
            <p className="text-xs text-gray-400 italic py-2">Aucun message</p>
        )
    }

    return (
        <div className="space-y-1.5 max-w-[280px]">
            {messages.map((msg) => (
                <div
                    key={msg.id}
                    className={cn(
                        'px-2.5 py-1.5 rounded-lg text-xs max-w-[220px]',
                        msg.direction === 'OUTBOUND'
                            ? 'bg-green-100 text-green-900 ml-auto'
                            : 'bg-gray-100 text-gray-700'
                    )}
                >
                    <p className="line-clamp-2">{msg.content}</p>
                </div>
            ))}
        </div>
    )
}

// ============================================
// CONTACT LIST
// ============================================

export function ContactList({ selectedId, onSelect }: ContactListProps) {
    const [searchQuery, setSearchQuery] = useState('')
    const [channelFilter, setChannelFilter] = useState<string>('all')
    const [primaryScope, setPrimaryScope] = useState<PrimaryScope>('all')
    const [activeSecondary, setActiveSecondary] = useState<SecondaryFilter>('none')
    const [sortBy, setSortBy] = useState<SortOption>('recent')
    const [bulkMode, setBulkMode] = useState(false)
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

    const {
        conversations,
        filter,
        setFilter,
        isLoading,
        unreadCount: totalUnread,
        currentMember,
        archiveConversation,
        markAsRead,
        assignToMe,
        togglePin,
    } = useConversations()

    const { channels } = useChannels()
    const hasMultipleChannels = channels.length > 1

    // Only owner/admin can toggle between "Toutes" and "Mes conversations"
    const canToggleScope = currentMember?.role === 'owner' || currentMember?.role === 'admin'

    // Handlers that sync primary + secondary → backend filter
    const handlePrimaryChange = useCallback((scope: PrimaryScope) => {
        setPrimaryScope(scope)
        // Reset incompatible secondary filter
        const nextSecondary = scope === 'mine' && activeSecondary === 'unassigned'
            ? 'none'
            : activeSecondary
        setActiveSecondary(nextSecondary)
        setFilter(computeBackendFilter(scope, nextSecondary))
    }, [activeSecondary, setFilter])

    const handleSecondaryChange = useCallback((sec: SecondaryFilter) => {
        setActiveSecondary(sec)
        setFilter(computeBackendFilter(primaryScope, sec))
    }, [primaryScope, setFilter])

    // Available secondary filters based on primary scope
    const availableSecondary = useMemo(() => {
        if (primaryScope === 'mine') {
            return secondaryFilters.filter(f => !f.hideWhenMine)
        }
        return secondaryFilters
    }, [primaryScope])

    // Client-side filters (channel, search, and combined filters the backend can't handle)
    const filteredConversations = useMemo(() => {
        let result = conversations

        if (channelFilter !== 'all') {
            result = result.filter((conv: ConversationSummary & { whatsappChannelId?: string }) => conv.whatsappChannelId === channelFilter)
        }

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase()
            result = result.filter(
                (conv: ConversationSummary) =>
                    conv.contact.name?.toLowerCase().includes(query) ||
                    conv.contact.phone.includes(query) ||
                    conv.lastMessageText?.toLowerCase().includes(query)
            )
        }

        // "mine + unread" → backend gives "mine", we filter unread client-side
        if (primaryScope === 'mine' && activeSecondary === 'unread') {
            result = result.filter((conv: ConversationSummary) => conv.unreadCount > 0)
        }

        // "mine + archived" → backend gives "archived", we filter by assignee client-side
        if (primaryScope === 'mine' && activeSecondary === 'archived') {
            result = result.filter((conv: ConversationSummary) => conv.assignedTo?.id === currentMember?.id)
        }

        // Sort
        if (sortBy === 'oldest') {
            result = [...result].sort((a, b) => a.lastMessageAt - b.lastMessageAt)
        } else if (sortBy === 'unread') {
            result = [...result].sort((a, b) => b.unreadCount - a.unreadCount)
        } else if (sortBy === 'name') {
            result = [...result].sort((a, b) =>
                (a.contact.name || a.contact.phone).localeCompare(b.contact.name || b.contact.phone)
            )
        }
        // 'recent' is already the default sort from backend

        return result
    }, [conversations, searchQuery, channelFilter, primaryScope, activeSecondary, currentMember, sortBy])

    // Grouped view: only when scope=all + secondary=none (show sections)
    const showGrouped = primaryScope === 'all' && activeSecondary === 'none' && !searchQuery.trim()
    const groupedByOwnership = useMemo(() => {
        if (!showGrouped) return null

        const mine: ConversationSummary[] = []
        const unassigned: ConversationSummary[] = []
        const team: ConversationSummary[] = []

        for (const conv of filteredConversations) {
            if (conv.assignedTo?.id === currentMember?.id) {
                mine.push(conv)
            } else if (!conv.assignedTo) {
                unassigned.push(conv)
            } else {
                team.push(conv)
            }
        }

        return { mine, unassigned, team }
    }, [filteredConversations, showGrouped, currentMember])

    // Bulk actions
    const toggleBulkSelect = useCallback((id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }, [])

    const selectAll = useCallback(() => {
        setSelectedIds(new Set(filteredConversations.map(c => c.id)))
    }, [filteredConversations])

    const clearSelection = useCallback(() => {
        setSelectedIds(new Set())
        setBulkMode(false)
    }, [])

    const handleBulkArchive = useCallback(async () => {
        for (const id of selectedIds) {
            await archiveConversation(id)
        }
        clearSelection()
    }, [selectedIds, archiveConversation, clearSelection])

    const handleBulkMarkAsRead = useCallback(async () => {
        for (const id of selectedIds) {
            await markAsRead(id)
        }
        clearSelection()
    }, [selectedIds, markAsRead, clearSelection])

    // Split pinned conversations
    const pinnedConversations = useMemo(() =>
        filteredConversations.filter(c => c.isPinned),
        [filteredConversations]
    )
    const unpinnedConversations = useMemo(() =>
        filteredConversations.filter(c => !c.isPinned),
        [filteredConversations]
    )

    const renderList = (items: ConversationSummary[], hideAssignee = false) =>
        items.map((conv) => (
            <div key={conv.id} className="flex items-center">
                {bulkMode && (
                    <button
                        onClick={() => toggleBulkSelect(conv.id)}
                        className="shrink-0 pl-3 pr-1 py-3 cursor-pointer"
                    >
                        <div className={cn(
                            'h-5 w-5 rounded border-2 flex items-center justify-center transition-colors',
                            selectedIds.has(conv.id)
                                ? 'bg-green-600 border-green-600 text-white'
                                : 'border-gray-300 hover:border-gray-400'
                        )}>
                            {selectedIds.has(conv.id) && <CheckCheck className="h-3 w-3" />}
                        </div>
                    </button>
                )}
                <HoverCard openDelay={400} closeDelay={100}>
                    <HoverCardTrigger asChild>
                        <div className="flex-1 min-w-0">
                            <ContactListItem
                                conversation={conv}
                                isSelected={selectedId === conv.id}
                                onClick={() => bulkMode ? toggleBulkSelect(conv.id) : onSelect(conv.id)}
                                showAssignee={!hideAssignee}
                                onArchive={bulkMode ? undefined : archiveConversation}
                                onMarkAsRead={bulkMode ? undefined : markAsRead}
                                onAssignToMe={bulkMode ? undefined : assignToMe}
                                onTogglePin={bulkMode ? undefined : togglePin}
                            />
                        </div>
                    </HoverCardTrigger>
                    <HoverCardContent side="right" align="start" className="w-[300px] p-3">
                        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-100">
                            <span className="text-sm font-medium text-gray-900 truncate">
                                {conv.contact.name || conv.contact.phone}
                            </span>
                        </div>
                        <ConversationPeek conversationId={conv.id} />
                    </HoverCardContent>
                </HoverCard>
            </div>
        ))

    return (
        <div className="flex flex-col h-full bg-white">
            {/* ── Header ── */}
            <div className="px-4 pt-4 pb-3 border-b border-gray-100">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                        Conversations
                    </h2>
                    {totalUnread > 0 && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 border border-green-200">
                            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-[11px] font-semibold text-green-700">
                                {totalUnread} non lu{totalUnread > 1 ? 's' : ''}
                            </span>
                        </div>
                    )}
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Rechercher un contact..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-9 pl-9 bg-gray-50/80 border-gray-200 text-sm placeholder:text-gray-400 focus-visible:bg-white"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>
            </div>

            {/* ── Level 1: Primary Scope Toggle (owner/admin only) ── */}
            {canToggleScope && (
                <div className="px-4 py-2.5 border-b border-gray-100">
                    <div className="flex bg-gray-100 rounded-lg p-0.5">
                        <button
                            onClick={() => handlePrimaryChange('all')}
                            className={cn(
                                'flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 cursor-pointer',
                                primaryScope === 'all'
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                            )}
                        >
                            <Users className="h-3.5 w-3.5" />
                            Toutes les conversations
                        </button>
                        <button
                            onClick={() => handlePrimaryChange('mine')}
                            className={cn(
                                'flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 cursor-pointer',
                                primaryScope === 'mine'
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                            )}
                        >
                            <User className="h-3.5 w-3.5" />
                            Mes conversations
                        </button>
                    </div>
                </div>
            )}

            {/* ── Level 2: Secondary Filters ── */}
            <div className="px-3 py-2 border-b border-gray-100 flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
                {availableSecondary.map((sf) => {
                    const Icon = sf.icon
                    const isActive = activeSecondary === sf.value
                    return (
                        <button
                            key={sf.value}
                            onClick={() => handleSecondaryChange(sf.value)}
                            className={cn(
                                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-medium whitespace-nowrap transition-all duration-150 cursor-pointer border',
                                isActive
                                    ? 'bg-gradient-to-r from-[#14532d] to-[#059669] text-white border-transparent shadow-sm shadow-green-900/20'
                                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700'
                            )}
                        >
                            <Icon className="h-3 w-3" />
                            {sf.label}
                        </button>
                    )
                })}

                {/* Channel filter (if multiple) */}
                {hasMultipleChannels && (
                    <Select value={channelFilter} onValueChange={setChannelFilter}>
                        <SelectTrigger className="h-7 text-[11px] w-auto min-w-[110px] border-gray-200 bg-white rounded-full px-2.5 ml-auto shrink-0">
                            <Phone className="h-3 w-3 mr-1" />
                            <SelectValue placeholder="Canal" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tous les canaux</SelectItem>
                            {channels.map((ch: { _id: string; label: string; displayPhoneNumber?: string; status: string }) => (
                                <SelectItem key={ch._id} value={ch._id}>
                                    <div className="flex items-center gap-2">
                                        <div className={cn(
                                            'h-1.5 w-1.5 rounded-full',
                                            ch.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                                        )} />
                                        {ch.label}
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}

                {/* Sort & Bulk — integrated as icon buttons */}
                <div className="flex items-center gap-1 ml-auto shrink-0">
                    <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <SelectTrigger className="h-7 w-7 p-0 border-0 bg-transparent shadow-none [&>svg:last-child]:hidden justify-center text-gray-400 hover:text-gray-600 cursor-pointer">
                                    <ArrowUpDown className="h-3.5 w-3.5" />
                                </SelectTrigger>
                            </TooltipTrigger>
                            <TooltipContent>Trier</TooltipContent>
                        </Tooltip>
                        <SelectContent align="end">
                            <SelectItem value="recent">Plus récentes</SelectItem>
                            <SelectItem value="oldest">Plus anciennes</SelectItem>
                            <SelectItem value="unread">Non lus d'abord</SelectItem>
                            <SelectItem value="name">Par nom</SelectItem>
                        </SelectContent>
                    </Select>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                onClick={() => { setBulkMode(!bulkMode); if (bulkMode) setSelectedIds(new Set()) }}
                                className={cn(
                                    'h-7 w-7 flex items-center justify-center rounded-full transition-colors cursor-pointer',
                                    bulkMode
                                        ? 'bg-green-100 text-green-700'
                                        : 'text-gray-400 hover:text-gray-600'
                                )}
                            >
                                <CheckSquare className="h-3.5 w-3.5" />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent>{bulkMode ? 'Quitter la sélection' : 'Sélection multiple'}</TooltipContent>
                    </Tooltip>
                </div>
            </div>

            {/* ── Bulk Actions Floating Bar ── */}
            {bulkMode && selectedIds.size > 0 && (
                <div className="px-3 py-2 border-b border-green-200 bg-green-50 flex items-center justify-between">
                    <span className="text-xs font-medium text-green-800">
                        {selectedIds.size} sélectionnée{selectedIds.size > 1 ? 's' : ''}
                    </span>
                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={selectAll}
                            className="text-[11px] text-green-700 hover:text-green-900 font-medium cursor-pointer"
                        >
                            Tout
                        </button>
                        <button
                            onClick={handleBulkMarkAsRead}
                            className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium bg-white border border-green-200 text-green-700 hover:bg-green-100 cursor-pointer"
                        >
                            <CheckCheck className="h-3 w-3" />
                            Lus
                        </button>
                        <button
                            onClick={handleBulkArchive}
                            className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium bg-white border border-red-200 text-red-600 hover:bg-red-50 cursor-pointer"
                        >
                            <Archive className="h-3 w-3" />
                            Archiver
                        </button>
                        <button
                            onClick={clearSelection}
                            className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-white cursor-pointer"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>
            )}

            {/* ── Conversations List ── */}
            <ScrollArea className="flex-1">
                {isLoading ? (
                    <div className="p-4 space-y-3">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-3 animate-pulse">
                                <div className="h-11 w-11 rounded-full bg-gray-100" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-3.5 w-28 bg-gray-100 rounded" />
                                    <div className="h-3 w-44 bg-gray-50 rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredConversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                        <div className="h-14 w-14 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center mb-3">
                            <MessageSquare className="h-7 w-7 text-gray-300" />
                        </div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-1">
                            Aucune conversation
                        </h3>
                        <p className="text-xs text-gray-400 max-w-[220px]">
                            {searchQuery
                                ? 'Aucun r\u00e9sultat pour cette recherche'
                                : activeSecondary === 'unread'
                                    ? 'Aucun message non lu'
                                    : activeSecondary === 'unassigned'
                                        ? 'Toutes les conversations sont assign\u00e9es'
                                        : 'Les nouvelles conversations appara\u00eetront ici'}
                        </p>
                    </div>
                ) : (
                    <div>
                        {/* Pinned section */}
                        {pinnedConversations.length > 0 && (
                            <>
                                <SectionDivider
                                    title="Épinglées"
                                    count={pinnedConversations.length}
                                />
                                {renderList(pinnedConversations)}
                            </>
                        )}

                        {groupedByOwnership ? (
                            /* Grouped view: scope=all, secondary=none, no search */
                            <>
                                {groupedByOwnership.mine.filter(c => !c.isPinned).length > 0 && (
                                    <>
                                        <SectionDivider
                                            title="Mes conversations"
                                            count={groupedByOwnership.mine.filter(c => !c.isPinned).length}
                                        />
                                        {renderList(groupedByOwnership.mine.filter(c => !c.isPinned), true)}
                                    </>
                                )}

                                {groupedByOwnership.unassigned.filter(c => !c.isPinned).length > 0 && (
                                    <>
                                        <SectionDivider
                                            title="Non assignées"
                                            count={groupedByOwnership.unassigned.filter(c => !c.isPinned).length}
                                        />
                                        {renderList(groupedByOwnership.unassigned.filter(c => !c.isPinned))}
                                    </>
                                )}

                                {groupedByOwnership.team.filter(c => !c.isPinned).length > 0 && (
                                    <>
                                        <SectionDivider
                                            title="Équipe"
                                            count={groupedByOwnership.team.filter(c => !c.isPinned).length}
                                        />
                                        {renderList(groupedByOwnership.team.filter(c => !c.isPinned))}
                                    </>
                                )}
                            </>
                        ) : (
                            /* Flat list for filtered views */
                            <>
                                {renderList(unpinnedConversations, filter === 'mine')}
                            </>
                        )}
                    </div>
                )}
            </ScrollArea>
        </div>
    )
}
