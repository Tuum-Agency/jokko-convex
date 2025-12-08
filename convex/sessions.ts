/**
 *  ____                 _                 
 * / ___|  ___  ___ ___ (_) ___  _ __  ___ 
 * \___ \ / _ \/ __/ __|| |/ _ \| '_ \/ __|
 *  ___) |  __/\__ \__ \| | (_) | | | \__ \
 * |____/ \___||___/___/|_|\___/|_| |_|___/
 *
 * SESSIONS FUNCTIONS
 *
 * Handles user sessions, specifically for tenancy.
 * - current: Returns the current active session (organization)
 * - switchOrganization: Updates the current organization for the user
 */

import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const current = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            return null;
        }

        const session = await ctx.db
            .query("userSessions")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .first();

        if (!session || !session.currentOrganizationId) {
            return null;
        }

        const organization = await ctx.db.get(session.currentOrganizationId);
        if (!organization) return null;

        const membership = await ctx.db
            .query("memberships")
            .withIndex("by_user_org", (q) =>
                q.eq("userId", userId).eq("organizationId", organization._id)
            )
            .first();

        return {
            session,
            organization,
            membership,
        };
    },
});

export const switchOrganization = mutation({
    args: { organizationId: v.id("organizations") },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new Error("Unauthenticated");
        }

        // Verify membership
        const membership = await ctx.db
            .query("memberships")
            .withIndex("by_user_org", (q) =>
                q.eq("userId", userId).eq("organizationId", args.organizationId)
            )
            .first();

        if (!membership) {
            throw new Error("You are not a member of this organization");
        }

        const session = await ctx.db
            .query("userSessions")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .first();

        if (session) {
            await ctx.db.patch(session._id, {
                currentOrganizationId: args.organizationId,
                lastActivityAt: Date.now(),
            });
        } else {
            await ctx.db.insert("userSessions", {
                userId,
                currentOrganizationId: args.organizationId,
                lastActivityAt: Date.now(),
            });
        }
    },
});

export const ensure = mutation({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) return null;

        const session = await ctx.db
            .query("userSessions")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .first();

        if (session && session.currentOrganizationId) return session.currentOrganizationId;

        // Try to find any membership
        const membership = await ctx.db
            .query("memberships")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .first();

        let orgId;

        if (membership) {
            orgId = membership.organizationId;
        } else {
            // Create default organization
            orgId = await ctx.db.insert("organizations", {
                name: "My Organization",
                slug: "my-org-" + Date.now(),
                ownerId: userId,
                plan: "FREE",
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });
            await ctx.db.insert("memberships", {
                userId,
                organizationId: orgId,
                role: "OWNER",
                status: "ONLINE",
                maxConversations: 0,
                activeConversations: 0,
                lastSeenAt: Date.now(),
                joinedAt: Date.now(),
            });
        }

        if (session) {
            await ctx.db.patch(session._id, {
                currentOrganizationId: orgId,
                lastActivityAt: Date.now(),
            });
        } else {
            await ctx.db.insert("userSessions", {
                userId,
                currentOrganizationId: orgId,
                lastActivityAt: Date.now(),
            });
        }

        // Fetch the organization to get the slug
        const organization = await ctx.db.get(orgId);

        return {
            organizationId: orgId,
            slug: organization?.slug
        };
    }
});
