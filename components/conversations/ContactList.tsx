'use client'

import { useState, useMemo, useCallback } from 'react'
import { Search, UserX, Archive, Inbox, User, Phone, MessageSquare, X, Mail, Users } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

import { Input } from '@/components/ui/input'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useConversations, type ConversationFilter, type ConversationSummary } from '@/hooks/useConversations'
import { useChannels } from '@/hooks/useChannels'
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
}: {
    conversation: ConversationSummary
    isSelected: boolean
    onClick: () => void
    showAssignee?: boolean
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
                VIDEO: 'Vid\u00e9o',
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

    return (
        <button
            onClick={onClick}
            className={cn(
                'w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-150 cursor-pointer',
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
                    <span className={cn(
                        'text-[11px] shrink-0',
                        unreadCount > 0 ? 'text-green-600 font-semibold' : 'text-gray-400'
                    )}>
                        {timeAgo}
                    </span>
                </div>
                <div className="flex items-center justify-between gap-2 mt-0.5">
                    <p className={cn(
                        'text-[13px] truncate',
                        unreadCount > 0 ? 'text-gray-600 font-medium' : 'text-gray-400'
                    )}>
                        {messagePreview}
                    </p>
                    {unreadCount > 0 && (
                        <Badge className="h-[18px] min-w-[18px] rounded-full bg-green-500 hover:bg-green-500 text-white text-[10px] px-1 shrink-0 font-semibold">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </Badge>
                    )}
                </div>
                {showAssignee && assignedTo && (
                    <p className="text-[10px] text-gray-400 mt-0.5 truncate">
                        Assign\u00e9e \u00e0 {assignedTo.name || assignedTo.email?.split('@')[0]}
                    </p>
                )}
            </div>
        </button>
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

    const {
        conversations,
        filter,
        setFilter,
        isLoading,
        unreadCount: totalUnread,
        currentMember,
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

        return result
    }, [conversations, searchQuery, channelFilter, primaryScope, activeSecondary, currentMember])

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

    const renderList = (items: ConversationSummary[], hideAssignee = false) =>
        items.map((conv) => (
            <ContactListItem
                key={conv.id}
                conversation={conv}
                isSelected={selectedId === conv.id}
                onClick={() => onSelect(conv.id)}
                showAssignee={!hideAssignee}
            />
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
            </div>

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
                ) : groupedByOwnership ? (
                    /* Grouped view: scope=all, secondary=none, no search */
                    <div>
                        {groupedByOwnership.mine.length > 0 && (
                            <>
                                <SectionDivider
                                    title="Mes conversations"
                                    count={groupedByOwnership.mine.length}
                                />
                                {renderList(groupedByOwnership.mine, true)}
                            </>
                        )}

                        {groupedByOwnership.unassigned.length > 0 && (
                            <>
                                <SectionDivider
                                    title="Non assign\u00e9es"
                                    count={groupedByOwnership.unassigned.length}
                                />
                                {renderList(groupedByOwnership.unassigned)}
                            </>
                        )}

                        {groupedByOwnership.team.length > 0 && (
                            <>
                                <SectionDivider
                                    title="\u00c9quipe"
                                    count={groupedByOwnership.team.length}
                                />
                                {renderList(groupedByOwnership.team)}
                            </>
                        )}
                    </div>
                ) : (
                    /* Flat list for filtered views */
                    <div>
                        {renderList(filteredConversations, filter === 'mine')}
                    </div>
                )}
            </ScrollArea>
        </div>
    )
}
