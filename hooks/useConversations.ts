import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useMemo } from "react";
import { useCurrentOrg } from "./use-current-org";
import { Id } from "@/convex/_generated/dataModel";

export type ConversationFilter = 'all' | 'unread' | 'unassigned' | 'archived' | 'mine';

export interface ConversationSummary {
    id: string;
    contact: {
        id: string;
        name: string | null;
        phone: string;
        avatarUrl?: string | null;
        isBlocked?: boolean;
    };
    lastMessageText: string | null;
    lastMessageAt: number;
    lastMessageType: string;
    unreadCount: number;
    assignedTo?: {
        id: string;
        name: string | null;
        email: string;
        avatar: string | null;
    };
    tags: string[];
    channel: string;
    status: string;
}

export function useConversations() {
    const { currentOrg, membership } = useCurrentOrg();
    const [filter, setFilter] = useState<ConversationFilter>('all');
    const [search, setSearch] = useState('');

    const conversationsData = useQuery(api.conversations.list,
        currentOrg ? {
            organizationId: currentOrg._id as Id<"organizations">,
            filter: filter as any, // Cast to match backend union if needed or ensure backend supports all
            search: search || undefined
        } : "skip"
    );

    const conversations: ConversationSummary[] = useMemo(() => {
        if (!conversationsData) return [];

        return conversationsData.map((c: any) => ({
            id: c._id,
            contact: {
                id: c.contact?._id || "unknown",
                name: c.contact?.name || null,
                phone: c.contact?.phoneNumber || "Unknown",
                avatarUrl: c.contact?.profilePicture || null,
                isBlocked: c.contact?.isBlocked,
            },
            lastMessageText: c.preview,
            lastMessageAt: c.lastMessageAt,
            lastMessageType: "TEXT",
            unreadCount: c.unreadCount,
            assignedTo: c.assignedTo ? {
                id: c.assignedTo._id,
                name: c.assignedTo.user.name,
                email: c.assignedTo.user.email,
                avatar: c.assignedTo.user.image || null
            } : undefined,
            tags: c.tags || [],
            channel: c.channel,
            status: c.status
        }));
    }, [conversationsData]);

    const unreadCount = useMemo(() => {
        if (!conversationsData) return 0;
        return conversationsData.reduce((acc: number, c: any) => acc + (c.unreadCount || 0), 0);
    }, [conversationsData]);

    const resolveMutation = useMutation(api.conversations.resolve);
    const reopenMutation = useMutation(api.conversations.reopen);
    const archiveMutation = useMutation(api.conversations.archive);
    const markAsReadMutation = useMutation(api.conversations.markAsRead);
    const toggleBlockMutation = useMutation(api.contacts.toggleBlock);

    // Status state for actions
    const [isResolving, setIsResolving] = useState(false);

    const resolveConversation = async (id: string) => {
        setIsResolving(true);
        try {
            await resolveMutation({ id: id as Id<"conversations"> });
        } finally {
            setIsResolving(false);
        }
    };

    const reopenResolvedConversation = async (id: string) => {
        setIsResolving(true);
        try {
            await reopenMutation({ id: id as Id<"conversations"> });
        } finally {
            setIsResolving(false);
        }
    };

    const archiveConversation = async (id: string) => {
        setIsResolving(true); // Reuse resolving state
        try {
            await archiveMutation({ id: id as Id<"conversations"> });
        } finally {
            setIsResolving(false);
        }
    };

    const blockContact = async (contactId: string) => {
        await toggleBlockMutation({ id: contactId as Id<"contacts"> });
    }

    const markAsRead = async (id: string) => {
        await markAsReadMutation({ id: id as Id<"conversations"> });
    };

    const currentMember = useMemo(() => {
        if (!membership) return null;
        return {
            id: membership.userId,
            role: membership.role.toLowerCase() as 'owner' | 'admin' | 'agent',
            organizationId: membership.organizationId
        };
    }, [membership]);

    return {
        conversations,
        filter,
        setFilter,
        search,
        setSearch,
        isLoading: conversationsData === undefined,
        unreadCount,
        resolveConversation,
        reopenResolvedConversation,
        archiveConversation,
        blockContact,
        markAsRead,
        isResolving,
        currentMember
    };
}
