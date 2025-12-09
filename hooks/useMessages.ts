import { usePaginatedQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMemo, useCallback } from "react";

export interface Message {
    id: string
    content: string | null
    type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT' | 'LOCATION' | 'STICKER' | 'REACTION' | 'SYSTEM'
    timestamp: number
    direction: 'INBOUND' | 'OUTBOUND'
    status: 'PENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED'
    senderId?: string
    media?: {
        url: string
        storageId?: string
        mimeType?: string
        fileName?: string
        fileSize?: number
        thumbnailUrl?: string
    }[]
    replyTo?: {
        id: string
        content: string | null
        type: string
    }
    isForwarded?: boolean
    reaction?: string
    latitude?: number
    longitude?: number
    locationName?: string
    locationAddress?: string
}

interface UseMessagesProps {
    conversationId: string
    organizationId?: string
}

export function useMessages({ conversationId, organizationId }: UseMessagesProps) {
    const { results, status, loadMore } = usePaginatedQuery(
        api.messages.list,
        conversationId ? { conversationId: conversationId as Id<"conversations">, organizationId: organizationId as Id<"organizations"> } : "skip",
        { initialNumItems: 20 }
    );

    const isLoading = status === "LoadingFirstPage";
    const isFetchingNextPage = status === "LoadingMore";
    const hasNextPage = status === "CanLoadMore";

    const retryMutation = useMutation(api.messages.retry);
    const resendMessage = useCallback(async (messageId: string) => {
        await retryMutation({ messageId: messageId as Id<"messages"> });
    }, [retryMutation]);

    const messages = useMemo(() => {
        if (!results) return [];

        // Map Convex documents to Message interface
        // Note: results are ordered DESC (newest first) from backend
        // but the UI usually expects them ascending or handles it?
        // ConversationView reverses them or renders grouped?
        // Usually chat UIs render newest at bottom.
        // If list returns newest first, we should reverse to get chronological order.

        return results.map((msg: any) => ({
            id: msg._id,
            content: msg.content || null,
            type: msg.type as Message['type'],
            timestamp: msg._creationTime,
            direction: msg.direction as Message['direction'],
            status: msg.status as Message['status'],
            senderId: msg.senderId,
            media: msg.mediaUrl ? [{
                url: msg.mediaUrl,
                storageId: msg.mediaStorageId, // Map from backend
                mimeType: msg.mediaType,
                fileName: msg.fileName,
                fileSize: msg.fileSize,
            }] : undefined,
            replyTo: msg.replyToId ? {
                id: msg.replyToId,
                content: "Reponse", // Cannot resolve content synchronously here without join
                type: "TEXT"
            } : undefined,
            isForwarded: msg.isForwarded,
            latitude: msg.latitude,
            longitude: msg.longitude,
            locationName: msg.locationName,
            locationAddress: msg.locationAddress,
        })).reverse(); // Reverse to have oldest first (chronological) 
    }, [results]);

    return {
        messages,
        isLoading,
        isFetchingNextPage,
        hasNextPage,
        loadMore: () => loadMore(20),
        resendMessage
    };
}
