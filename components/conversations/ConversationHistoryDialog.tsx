
'use client'

import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MessageBubble } from './MessageBubble'
import { Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface ConversationHistoryDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    conversationId: Id<"conversations"> | null
}

export function ConversationHistoryDialog({
    open,
    onOpenChange,
    conversationId,
}: ConversationHistoryDialogProps) {
    // 1. Fetch messages
    // Note: useMessages hook handles real-time and enrichment, but here we might just want simple list
    // Let's use useQuery directly for simplicity as "history" doesn't change much
    const messagesResult = useQuery(
        api.messages.list,
        conversationId ? { conversationId, paginationOpts: { numItems: 100, cursor: null } } : "skip"
    )

    const messages = messagesResult && 'page' in messagesResult ? messagesResult.page : []
    const isLoading = messagesResult === undefined

    // 2. Fetch conversation details for title (date, etc.)
    const conversation = useQuery(
        api.conversations.getById,
        conversationId ? { id: conversationId } : "skip"
    )

    // Reverse messages to show oldest top? 
    // Usually chat shows newest at bottom. `api.messages.list` returns newest first (desc).
    // So we need to reverse them for display (Oldest -> Newest)
    const sortedMessages = [...messages].reverse()

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>
                        Details du ticket
                    </DialogTitle>
                    <DialogDescription>
                        {conversation ? (
                            <>
                                {conversation.status} • {format(new Date(conversation.createdAt), 'PPpp', { locale: fr })}
                            </>
                        ) : "Chargement..."}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 min-h-0 border rounded-md bg-[#efeae2] overflow-hidden relative">
                    {/* Background pattern */}
                    <div
                        className="absolute inset-0 opacity-40 pointer-events-none"
                        style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4cfc6' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                        }}
                    />

                    {isLoading ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                        </div>
                    ) : (
                        <ScrollArea className="h-full p-4">
                            <div className="space-y-4">
                                {sortedMessages.length === 0 ? (
                                    <p className="text-center text-gray-500 text-sm py-10">Aucun message</p>
                                ) : (
                                    sortedMessages.map((msg, index) => {
                                        // Mock Message type compatibility if needed
                                        // MessageBubble expects "Message" type.
                                        // The query returns objects that match Message shape mostly.
                                        // We need to cast or ensure it works.
                                        // Also we pass empty handlers since this is history view.

                                        // Determine grouping
                                        const prevMsg = sortedMessages[index - 1]
                                        const isGrouped = prevMsg &&
                                            prevMsg.direction === msg.direction &&
                                            (new Date(msg.timestamp).getTime() - new Date(prevMsg.timestamp).getTime() < 60000)

                                        return (
                                            <MessageBubble
                                                key={msg.id}
                                                // @ts-ignore - types might slightly differ between hook and direct query return
                                                message={msg}
                                                isGrouped={!!isGrouped}
                                                onResend={async () => { }}
                                                onReply={() => { }}
                                                onForward={() => { }}
                                                readonly={true} // If MessageBubble supports it, or we just rely on no-ops
                                            />
                                        )
                                    })
                                )}
                            </div>
                        </ScrollArea>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
