/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║       components/conversations/ForwardMessageModal.tsx        ║
 * ╠═══════════════════════════════════════════════════════════════╣
 * ║ DESCRIPTION:                                                  ║
 * ║   Modal pour transférer un message à une autre conversation.  ║
 * ╚═══════════════════════════════════════════════════════════════╝
 */

'use client'

import { useState, useMemo } from 'react'
import { Search, Forward, Loader2, Check } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useConversations } from '@/hooks/useConversations'
import type { Message } from '@/hooks/useMessages'
import { cn } from '@/lib/utils'

// ============================================
// TYPES
// ============================================

interface ForwardMessageModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    message: Message | null
    currentConversationId: string
    onForward: (conversationId: string, message: Message) => Promise<void>
}

// ============================================
// COMPONENT
// ============================================

export function ForwardMessageModal({
    open,
    onOpenChange,
    message,
    currentConversationId,
    onForward,
}: ForwardMessageModalProps) {
    const [search, setSearch] = useState('')
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [isForwarding, setIsForwarding] = useState(false)
    const [forwardedTo, setForwardedTo] = useState<string | null>(null)

    const { conversations, isLoading } = useConversations()

    // Filter conversations (exclude current one)
    const filteredConversations = useMemo(() => {
        if (!conversations) return []

        return conversations
            .filter(conv => conv.id !== currentConversationId)
            .filter(conv => {
                if (!search) return true
                const searchLower = search.toLowerCase()
                return (
                    conv.contact.name?.toLowerCase().includes(searchLower) ||
                    conv.contact.phone?.toLowerCase().includes(searchLower)
                )
            })
    }, [conversations, currentConversationId, search])

    // Get message preview text
    const getMessagePreview = (msg: Message): string => {
        if (msg.content) {
            return msg.content.length > 50 ? msg.content.substring(0, 50) + '...' : msg.content
        }
        switch (msg.type) {
            case 'IMAGE': return 'Photo'
            case 'VIDEO': return 'Video'
            case 'AUDIO': return 'Message vocal'
            case 'DOCUMENT': return 'Document'
            case 'LOCATION': return 'Position'
            case 'STICKER': return 'Sticker'
            default: return 'Message'
        }
    }

    // Handle forward
    const handleForward = async (conversationId: string) => {
        if (!message || isForwarding) return

        setSelectedId(conversationId)
        setIsForwarding(true)

        try {
            await onForward(conversationId, message)
            setForwardedTo(conversationId)

            // Close modal after short delay
            setTimeout(() => {
                onOpenChange(false)
                setSelectedId(null)
                setForwardedTo(null)
                setSearch('')
            }, 1000)
        } catch (error) {
            console.error('Forward failed:', error)
        } finally {
            setIsForwarding(false)
        }
    }

    // Reset state when modal closes
    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen) {
            setSearch('')
            setSelectedId(null)
            setForwardedTo(null)
        }
        onOpenChange(newOpen)
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Forward className="h-5 w-5" />
                        Transférer le message
                    </DialogTitle>
                    <DialogDescription>
                        Sélectionnez une conversation pour transférer ce message
                    </DialogDescription>
                </DialogHeader>

                {/* Message preview */}
                {message && (
                    <div className="p-3 bg-gray-50 rounded-lg border-l-4 border-green-500">
                        <p className="text-sm text-gray-600">
                            {getMessagePreview(message)}
                        </p>
                    </div>
                )}

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Rechercher une conversation..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>

                {/* Conversations list */}
                <ScrollArea className="h-[300px] -mx-6 px-6">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                        </div>
                    ) : filteredConversations.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            {search ? 'Aucune conversation trouvée' : 'Aucune autre conversation'}
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {filteredConversations.map((conv) => {
                                const isSelected = selectedId === conv.id
                                const isForwarded = forwardedTo === conv.id

                                return (
                                    <button
                                        key={conv.id}
                                        onClick={() => handleForward(conv.id)}
                                        disabled={isForwarding}
                                        className={cn(
                                            'w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left',
                                            isForwarded
                                                ? 'bg-green-50'
                                                : isSelected
                                                    ? 'bg-gray-100'
                                                    : 'hover:bg-gray-50'
                                        )}
                                    >
                                        <Avatar className="h-10 w-10">
                                            <AvatarFallback className="bg-green-100 text-green-700">
                                                {(conv.contact.name || conv.contact.phone || '?')[0].toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>

                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-900 truncate">
                                                {conv.contact.name || conv.contact.phone}
                                            </p>
                                            {conv.contact.name && (
                                                <p className="text-sm text-gray-500 truncate">
                                                    {conv.contact.phone}
                                                </p>
                                            )}
                                        </div>

                                        {isForwarded ? (
                                            <div className="flex items-center gap-1 text-green-600">
                                                <Check className="h-5 w-5" />
                                                <span className="text-sm">Envoyé</span>
                                            </div>
                                        ) : isSelected && isForwarding ? (
                                            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                                        ) : (
                                            <Forward className="h-5 w-5 text-gray-400" />
                                        )}
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}
