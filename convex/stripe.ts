import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import { planFromPriceId } from "./lib/stripePlans";

/**
 * Persist the Stripe customer ID immediately after creation.
 * Prevents duplicate customer creation on concurrent calls.
 */
export const saveCustomerId = internalMutation({
    args: {
        organizationId: v.id("organizations"),
        stripeCustomerId: v.string(),
    },
    handler: async (ctx, args) => {
        const org = await ctx.db.get(args.organizationId);
        if (!org) throw new Error(`Organization ${args.organizationId} not found`);

        await ctx.db.patch(org._id, {
            stripe: {
                ...org.stripe,
                customerId: args.stripeCustomerId,
            },
            updatedAt: Date.now(),
        });
    },
});

/**
 * Called when a Stripe Checkout Session completes (new subscription).
 * - Resolves the priceId from the subscription object (not session metadata)
 * - Sets trialUsed = true to prevent unlimited free trials
 */
export const handleCheckoutCompleted = internalMutation({
    args: {
        organizationId: v.string(),
        stripeCustomerId: v.string(),
        subscriptionId: v.string(),
        priceId: v.string(),
        currentPeriodEnd: v.number(),
        status: v.string(),
    },
    handler: async (ctx, args) => {
        const org = await ctx.db.get(args.organizationId as any);
        if (!org) throw new Error(`Organization ${args.organizationId} not found`);

        const plan = planFromPriceId(args.priceId);

        await ctx.db.patch(org._id, {
            plan: plan as any,
            stripe: {
                customerId: args.stripeCustomerId,
                subscriptionId: args.subscriptionId,
                priceId: args.priceId,
                status: args.status,
                currentPeriodEnd: args.currentPeriodEnd,
                trialUsed: true, // Mark trial as used
            },
            updatedAt: Date.now(),
        });
    },
});

/**
 * Called when a subscription is updated (renewal, plan change, status change).
 */
export const updateSubscription = internalMutation({
    args: {
        stripeCustomerId: v.string(),
        subscriptionId: v.string(),
        priceId: v.string(),
        status: v.string(),
        currentPeriodEnd: v.number(),
        organizationId: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // Try by stripe customer index first, fallback to direct org ID
        let org: any = await ctx.db
            .query("organizations")
            .withIndex("by_stripe_customer", (q) => q.eq("stripe.customerId", args.stripeCustomerId))
            .first();

        if (!org && args.organizationId) {
            org = await ctx.db.get(args.organizationId as any);
        }

        if (!org) {
            console.error(`[Stripe] No org found for customer ${args.stripeCustomerId}`);
            return;
        }

        const plan = planFromPriceId(args.priceId);

        // Determine if trial was used (status is trialing or was trialing before)
        const trialUsed = org.stripe?.trialUsed === true ||
            args.status === "trialing" ||
            args.status === "active";

        await ctx.db.patch(org._id, {
            plan: plan as any,
            stripe: {
                customerId: args.stripeCustomerId,
                subscriptionId: args.subscriptionId,
                priceId: args.priceId,
                status: args.status,
                currentPeriodEnd: args.currentPeriodEnd,
                trialUsed,
            },
            updatedAt: Date.now(),
        });
    },
});

/**
 * Called when a subscription is canceled/deleted.
 */
export const cancelSubscription = internalMutation({
    args: {
        stripeCustomerId: v.string(),
    },
    handler: async (ctx, args) => {
        const org = await ctx.db
            .query("organizations")
            .withIndex("by_stripe_customer", (q) => q.eq("stripe.customerId", args.stripeCustomerId))
            .first();

        if (!org) {
            console.error(`[Stripe] No org found for customer ${args.stripeCustomerId}`);
            return;
        }

        await ctx.db.patch(org._id, {
            plan: "FREE" as any,
            stripe: {
                customerId: args.stripeCustomerId,
                subscriptionId: org.stripe?.subscriptionId,
                priceId: org.stripe?.priceId,
                status: "canceled",
                currentPeriodEnd: org.stripe?.currentPeriodEnd,
                trialUsed: org.stripe?.trialUsed ?? true,
            },
            updatedAt: Date.now(),
        });
    },
});
