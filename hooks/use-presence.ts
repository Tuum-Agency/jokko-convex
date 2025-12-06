/**
 *  _   _                 ____                                       
 * | | | |___  ___       |  _ \ _ __ ___  ___  ___ _ __   ___ ___  
 * | | | / __|/ _ \      | |_) | '__/ _ \/ __|/ _ \ '_ \ / __/ _ \ 
 * | |_| \__ \  __/      |  __/| | |  __/\__ \  __/ | | | (_|  __/ 
 *  \___/|___/\___|      |_|   |_|  \___||___/\___|_| |_|\___\___| 
 *
 * PRESENCE HOOKS
 *
 * Hooks to manage and view presence in the current organization.
 * - usePresence: View all members' status
 * - useMyStatus: Manage own status
 */

import { useQuery, useMutation } from "convex/react";
import { useEffect } from "react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useCurrentOrg } from "./use-current-org";

export function usePresence(organizationId: Id<"organizations">) {
    const members = useQuery(api.presence.listWithPresence, { organizationId });
    const updateStatus = useMutation(api.presence.updateStatus);
    const heartbeat = useMutation(api.presence.heartbeat);

    // Auto heartbeat every 30s
    useEffect(() => {
        if (!organizationId) return;

        // Initial heartbeat
        heartbeat({ organizationId });

        const interval = setInterval(() => {
            heartbeat({ organizationId });
        }, 30_000);

        return () => clearInterval(interval);
    }, [organizationId, heartbeat]);

    return {
        members,
        online: members?.filter((m) => m.status === "ONLINE") ?? [],
        busy: members?.filter((m) => m.status === "BUSY") ?? [],
        away: members?.filter((m) => m.status === "AWAY") ?? [],
        offline: members?.filter((m) => m.status === "OFFLINE") ?? [],
        updateStatus,
    };
}

export function useMyStatus() {
    const { membership } = useCurrentOrg();
    const updateStatus = useMutation(api.presence.updateStatus);

    return {
        status: membership?.status,
        statusMessage: membership?.statusMessage,
        activeConversations: membership?.activeConversations,
        maxConversations: membership?.maxConversations,
        updateStatus,
    };
}
