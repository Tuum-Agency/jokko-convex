import { v } from "convex/values";
import { mutation, query, internalMutation, QueryCtx, MutationCtx } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Helper to get current organization
async function getCurrentOrgId(ctx: QueryCtx | MutationCtx) {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const session = await ctx.db
        .query("userSessions")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .first();

    return session?.currentOrganizationId ?? null;
}

/**
 * Get the current credit balance for the active organization
 */
export const getBalance = query({
    args: {},
    handler: async (ctx) => {
        const orgId = await getCurrentOrgId(ctx);
        if (!orgId) return null;

        const org = await ctx.db.get(orgId);
        return org?.creditBalance ?? 0;
    },
});

/**
 * Get transaction history
 */
export const getTransactions = query({
    args: { limit: v.optional(v.number()) },
    handler: async (ctx, args) => {
        const orgId = await getCurrentOrgId(ctx);
        if (!orgId) return [];

        return await ctx.db
            .query("creditTransactions")
            .withIndex("by_organization", (q) => q.eq("organizationId", orgId))
            .order("desc") // Most recent first
            .take(args.limit ?? 20);
    },
});

/**
 * Add credits to an organization (Admin or Webhook usage)
 */
export const addCredits = internalMutation({
    args: {
        organizationId: v.id("organizations"),
        amount: v.number(),
        description: v.optional(v.string()),
        referenceId: v.optional(v.string()),
        type: v.union(
            v.literal("RECHARGE"),
            v.literal("BONUS"),
            v.literal("REFUND"),
            v.literal("ADJUSTMENT")
        ),
    },
    handler: async (ctx, args) => {
        const org = await ctx.db.get(args.organizationId);
        if (!org) throw new Error("Org not found");

        const currentBalance = org.creditBalance ?? 0;
        const newBalance = currentBalance + args.amount;

        await ctx.db.patch(args.organizationId, {
            creditBalance: newBalance,
        });

        await ctx.db.insert("creditTransactions", {
            organizationId: args.organizationId,
            amount: args.amount,
            type: args.type,
            description: args.description,
            referenceId: args.referenceId,
            balanceAfter: newBalance,
            createdAt: Date.now(),
        });

        return newBalance;
    },
});

/**
 * Deduct credits for the current user's organization (User initiated action)
 */
export const deductCredits = mutation({
    args: {
        amount: v.number(),
        description: v.string(),
        referenceId: v.optional(v.string()), // e.g. broadcast ID
    },
    handler: async (ctx, args) => {
        const orgId = await getCurrentOrgId(ctx);
        if (!orgId) throw new Error("Unauthorized");
        const userId = await getAuthUserId(ctx);

        const org = await ctx.db.get(orgId);
        if (!org) throw new Error("Org not found");

        const currentBalance = org.creditBalance ?? 0;

        if (currentBalance < args.amount) {
            throw new Error("Insufficient credits");
        }

        const newBalance = currentBalance - args.amount;

        await ctx.db.patch(orgId, {
            creditBalance: newBalance,
        });

        await ctx.db.insert("creditTransactions", {
            organizationId: orgId,
            amount: -args.amount,
            type: "USAGE",
            description: args.description,
            referenceId: args.referenceId,
            balanceAfter: newBalance,
            createdAt: Date.now(),
            performedBy: userId ?? undefined,
        });

        return { success: true, newBalance };
    },
});

/**
 * Deduct credits from a specific organization (Internal/System usage)
 */
export const internalDeductCredits = internalMutation({
    args: {
        organizationId: v.id("organizations"),
        amount: v.number(),
        description: v.string(),
        referenceId: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const org = await ctx.db.get(args.organizationId);
        if (!org) throw new Error("Org not found");

        const currentBalance = org.creditBalance ?? 0;

        if (currentBalance < args.amount) {
            throw new Error("Insufficient credits");
        }

        const newBalance = currentBalance - args.amount;

        await ctx.db.patch(args.organizationId, {
            creditBalance: newBalance,
        });

        await ctx.db.insert("creditTransactions", {
            organizationId: args.organizationId,
            amount: -args.amount,
            type: "USAGE",
            description: args.description,
            referenceId: args.referenceId,
            balanceAfter: newBalance,
            createdAt: Date.now(),
        });

        return { success: true, newBalance };
    },
});

/**
 * Debug: Add credits (Dev only or for testing)
 */
export const debugAddCredits = mutation({
    args: {
        amount: v.number(),
    },
    handler: async (ctx, args) => {
        const orgId = await getCurrentOrgId(ctx);
        if (!orgId) throw new Error("Unauthorized");

        const org = await ctx.db.get(orgId);
        if (!org) throw new Error("Org not found");

        const currentBalance = org.creditBalance ?? 0;
        const newBalance = currentBalance + args.amount;

        await ctx.db.patch(orgId, {
            creditBalance: newBalance,
        });

        await ctx.db.insert("creditTransactions", {
            organizationId: orgId,
            amount: args.amount,
            type: "RECHARGE",
            description: "Recharge Test / Debug",
            balanceAfter: newBalance,
            createdAt: Date.now(),
        });

        return newBalance;
    },
});
