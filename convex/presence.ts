/**
 *  ____                                         
 * |  _ \ _ __ ___  ___  ___ _ __   ___ ___  
 * | |_) | '__/ _ \/ __|/ _ \ '_ \ / __/ _ \ 
 * |  __/| | |  __/\__ \  __/ | | | (_|  __/ 
 * |_|   |_|  \___||___/\___|_| |_|\___\___| 
 *
 * PRESENCE SYSTEM
 *
 * Real-time user presence and status management.
 * - Heartbeat mechanism to detect online status
 * - Manual status updates (BUSY, AWAY, ONLINE)
 * - Automatic timeout handling via crons
 */

import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { requireMembership } from "./lib/auth";

/**
 * Get all members with presence (real-time)
 */
export const listWithPresence = query({
    args: { organizationId: v.id("organizations") },
    handler: async (ctx, args) => {
        const memberships = await ctx.db
            .query("memberships")
            .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
            .collect();

        return Promise.all(
            memberships.map(async (m) => {
                const user = await ctx.db.get(m.userId);
                return {
                    ...m,
                    user: { name: user?.name, email: user?.email, image: user?.image },
                };
            })
        );
    },
});

/**
 * Update own status (manual)
 */
export const updateStatus = mutation({
    args: {
        organizationId: v.id("organizations"),
        status: v.union(v.literal("ONLINE"), v.literal("AWAY"), v.literal("OFFLINE")),
        statusMessage: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const { membership } = await requireMembership(ctx, args.organizationId);

        // If setting ONLINE but at capacity → BUSY
        let finalStatus: "ONLINE" | "AWAY" | "OFFLINE" | "BUSY" = args.status;
        if (args.status === "ONLINE" && membership.activeConversations >= membership.maxConversations) {
            finalStatus = "BUSY";
        }

        await ctx.db.patch(membership._id, {
            status: finalStatus,
            statusMessage: args.statusMessage,
            lastSeenAt: Date.now(),
        });
    },
});

/**
 * Heartbeat - appelé toutes les 30s par le client
 */
export const heartbeat = mutation({
    args: { organizationId: v.id("organizations") },
    handler: async (ctx, args) => {
        const { membership } = await requireMembership(ctx, args.organizationId);

        if (membership.status === "OFFLINE") {
            // Reconnexion
            const newStatus = membership.activeConversations >= membership.maxConversations
                ? "BUSY"
                : "ONLINE";
            await ctx.db.patch(membership._id, {
                status: newStatus,
                lastSeenAt: Date.now(),
            });
        } else if (membership.status !== "AWAY") {
            // Juste update lastSeenAt
            await ctx.db.patch(membership._id, { lastSeenAt: Date.now() });
        }
    },
});

/**
 * Recalculate status after conversation change
 */
export const recalculateStatus = internalMutation({
    args: { membershipId: v.id("memberships") },
    handler: async (ctx, args) => {
        const membership = await ctx.db.get(args.membershipId);
        if (!membership || membership.status === "OFFLINE" || membership.status === "AWAY") return;

        const newStatus = membership.activeConversations >= membership.maxConversations
            ? "BUSY"
            : "ONLINE";

        if (membership.status !== newStatus) {
            await ctx.db.patch(args.membershipId, { status: newStatus });
        }
    },
});

/**
 * Check timeouts - Cron every minute
 */
export const checkTimeouts = internalMutation({
    handler: async (ctx) => {
        const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;

        const stale = await ctx.db
            .query("memberships")
            .filter((q) =>
                q.and(
                    q.neq(q.field("status"), "OFFLINE"),
                    q.lt(q.field("lastSeenAt"), fiveMinutesAgo)
                )
            )
            .collect();

        for (const m of stale) {
            await ctx.db.patch(m._id, { status: "OFFLINE" });
        }
    },
});

/**
 * TYPING INDICATORS
 */
export const sendTyping = mutation({
    args: {
        organizationId: v.id("organizations"),
        conversationId: v.id("conversations"),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) return;

        // Upsert typing status
        const existing = await ctx.db
            .query("typing")
            .withIndex("by_conversation_user", (q) =>
                q.eq("conversationId", args.conversationId).eq("userId", userId)
            )
            .first();

        if (existing) {
            await ctx.db.patch(existing._id, { timestamp: Date.now() });
        } else {
            await ctx.db.insert("typing", {
                conversationId: args.conversationId,
                userId: userId,
                timestamp: Date.now(),
            });
        }
    },
});

export const listTyping = query({
    args: {
        conversationId: v.id("conversations"),
    },
    handler: async (ctx, args) => {
        const threshold = Date.now() - 3000; // 3 seconds ago max

        const typing = await ctx.db
            .query("typing")
            .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
            .filter((q) => q.gt(q.field("timestamp"), threshold))
            .collect();

        // Enrich with user name
        return Promise.all(
            typing.map(async (t) => {
                const user = await ctx.db.get(t.userId);
                return {
                    userId: t.userId,
                    name: user?.name?.split(" ")[0] || "Someone",
                };
            })
        );
    },
});
