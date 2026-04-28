import { usePresence } from './use-presence';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useState, useCallback, useEffect } from 'react';
import { useCurrentOrg } from './use-current-org';

// Use this for overall presence
export const useRealtime = (organizationId: string) => {
    // Always call usePresence (React hooks must not be called conditionally).
    // usePresence should handle falsy organizationId internally.
    usePresence((organizationId || undefined) as Id<"organizations">);
};

export const useTypingIndicator = (conversationId: string, organizationId?: string) => {
    const sendTypingMutation = useMutation(api.presence.sendTyping);
    const typingUsersData = useQuery(api.presence.listTyping, { conversationId: conversationId as Id<"conversations"> });
    const { currentOrg } = useCurrentOrg();

    const sendTyping = useCallback(async () => {
        if (!conversationId || (!organizationId && !currentOrg?._id)) return;

        await sendTypingMutation({
            conversationId: conversationId as Id<"conversations">,
            organizationId: (organizationId || currentOrg!._id) as Id<"organizations">
        });
    }, [conversationId, organizationId, currentOrg, sendTypingMutation]);

    const typingUsers = typingUsersData?.map(u => u.name) || [];
    const isTyping = typingUsers.length > 0;

    return {
        sendTyping,
        isTyping,
        typingUsers
    };
}
