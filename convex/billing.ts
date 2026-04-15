import { v } from "convex/values";
import { internalMutation, query, MutationCtx } from "./_generated/server";
import { getMaxChannels, getConversationLimit, isUnlimited } from "./lib/planHelpers";
import { requireMembership } from "./lib/auth";

export { getMaxChannels } from "./lib/planHelpers";

export const getUsageStats = query({
    args: { organizationId: v.id("organizations") },
    handler: async (ctx, args) => {
        await requireMembership(ctx, args.organizationId);
        const org = await ctx.db.get(args.organizationId);
        return org?.usageStats;
    }
});

// Helper to check and increment usage
// Should be called when a NEW service conversation starts (window opens)
export const checkAndIncrementServiceUsage = internalMutation({
    args: {
        organizationId: v.id("organizations")
    },
    handler: async (ctx, args) => {
        const org = await ctx.db.get(args.organizationId);
        if (!org) throw new Error("Org not found");

        const now = Date.now();
        let stats = org.usageStats;

        // Initialize if empty or expired
        if (!stats || now > stats.periodEnd) {
            const periodStart = now;
            const periodEnd = new Date(now).setMonth(new Date(now).getMonth() + 1);

            stats = {
                periodStart,
                periodEnd,
                serviceConversationsCount: 0
            };
        }

        const limit = await getConversationLimit(ctx, org.plan);

        if (!isUnlimited(limit) && stats.serviceConversationsCount >= limit) {
            return {
                allowed: false,
                reason: "LIMIT_EXCEEDED",
                limit,
                current: stats.serviceConversationsCount
            };
        }

        // Increment
        await ctx.db.patch(args.organizationId, {
            usageStats: {
                ...stats,
                serviceConversationsCount: stats.serviceConversationsCount + 1
            }
        });

        return {
            allowed: true,
            current: stats.serviceConversationsCount + 1,
            limit
        };
    }
});

/**
 * Resets usage for a specific organization (Can be run by Cron)
 */
export const resetUsage = internalMutation({
    args: { organizationId: v.id("organizations") },
    handler: async (ctx, args) => {
        const now = Date.now();
        const periodEnd = new Date(now).setMonth(new Date(now).getMonth() + 1);

        await ctx.db.patch(args.organizationId, {
            usageStats: {
                periodStart: now,
                periodEnd: periodEnd,
                serviceConversationsCount: 0
            }
        });
    }
});
