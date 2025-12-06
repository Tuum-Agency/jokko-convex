/**
 *  _   _                 ____                     
 * | | | |___  ___       |  _ \ ___ _ __ _ __ ___  
 * | | | / __|/ _ \      | |_) / _ \ '__| '_ ` _ \ 
 * | |_| \__ \  __/      |  __/  __/ |  | | | | | |
 *  \___/|___/\___|      |_|   \___|_|  |_| |_| |_|
 *
 * PERMISSION HOOKS
 *
 * Hooks to check user permissions in the current organization.
 * - usePermission: Checks a specific permission
 * - useCan: Returns a set of common capability checks
 */

import { hasPermission, Permission, canSeeAllConversations } from "@/convex/lib/permissions";
import { useCurrentOrg } from "./use-current-org";

export function usePermission(permission: Permission): boolean {
    const { membership } = useCurrentOrg();
    if (!membership) return false;
    return hasPermission(membership.role, permission);
}

export function useCan() {
    const { membership } = useCurrentOrg();
    const role = membership?.role;

    return {
        invite: role ? hasPermission(role, "members:invite") : false,
        assign: role ? hasPermission(role, "conversations:assign") : false,
        seeAll: role ? canSeeAllConversations(role) : false,
        configWhatsApp: role ? hasPermission(role, "settings:whatsapp") : false,
        isOwner: role === "OWNER",
        isAdmin: role === "OWNER" || role === "ADMIN",
    };
}
