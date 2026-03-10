/**
 *     _         _   _     
 *    / \  _   _| |_| |__  
 *   / _ \| | | | __| '_ \ 
 *  / viewBox \ |_| | |_| | | |
 * /_/   \_\__,_|\__|_| |_|
 *
 * AUTH HELPER FUNCTIONS
 *
 * Provides backend helpers to secure Convex functions:
 * - requireAuth: Ensures user is logged in
 * - requireMembership: Ensures user belongs to an organization
 * - requirePermission: Ensures user has specific permission in an organization
 */

import { QueryCtx, MutationCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";
import { hasPermission, Permission } from "./permissions";
import { getAuthUserId } from "@convex-dev/auth/server";

export async function requireAuth(ctx: QueryCtx | MutationCtx): Promise<Id<"users">> {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
        throw new Error("Non authentifié");
    }

    return userId;
}

export async function requireMembership(
    ctx: QueryCtx | MutationCtx,
    organizationId: Id<"organizations">
) {
    const userId = await requireAuth(ctx);

    const membership = await ctx.db
        .query("memberships")
        .withIndex("by_user_org", (q) =>
            q.eq("userId", userId).eq("organizationId", organizationId)
        )
        .first();

    if (!membership) {
        throw new Error("Non membre de cette organisation");
    }

    return { userId, membership };
}

export async function requirePermission(
    ctx: QueryCtx | MutationCtx,
    organizationId: Id<"organizations">,
    permission: Permission
) {
    const { userId, membership } = await requireMembership(ctx, organizationId);

    if (!hasPermission(membership.role, permission)) {
        throw new Error(`Permission refusée: ${permission}`);
    }

    return { userId, membership };
}
