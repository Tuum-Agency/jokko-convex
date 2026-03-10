"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import Stripe from "stripe";
import { getAuthUserId } from "@convex-dev/auth/server";
import { priceIdFromPlan } from "./lib/stripePlans";

function getStripe(): Stripe {
    return new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: "2026-02-25.clover",
    });
}

function getAppUrl(): string {
    return process.env.APP_URL || "https://app.jokko.co";
}

/**
 * Create a Stripe Checkout Session for upgrading the org's plan.
 */
export const createCheckoutSession = action({
    args: {
        planKey: v.union(v.literal("STARTER"), v.literal("BUSINESS"), v.literal("PRO")),
        interval: v.optional(v.union(v.literal("month"), v.literal("year"))),
    },
    handler: async (ctx, args): Promise<{ url: string }> => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Non authentifié");

        // Get current org
        const session = await ctx.runQuery(internal.sessions.getCurrentSession, {});
        if (!session?.organizationId) throw new Error("Aucune organisation active");

        const org: any = await ctx.runQuery(internal.utils.getOrganization, { id: session.organizationId as any });
        if (!org) throw new Error("Organisation introuvable");

        const interval = args.interval || "month";
        const priceId = priceIdFromPlan(args.planKey, interval);
        if (!priceId) throw new Error(`No Stripe price configured for plan ${args.planKey} (${interval})`);

        const stripe = getStripe();
        const appUrl = getAppUrl();

        // Get or create Stripe customer
        let customerId = org.stripe?.customerId;
        if (!customerId) {
            const customer = await stripe.customers.create({
                name: org.name,
                metadata: { organizationId: org._id, plan: args.planKey },
            });
            customerId = customer.id;
        }

        // Create checkout session
        const checkoutSession = await stripe.checkout.sessions.create({
            customer: customerId,
            mode: "subscription",
            line_items: [{ price: priceId, quantity: 1 }],
            success_url: `${appUrl}/dashboard/billing?success=true`,
            cancel_url: `${appUrl}/dashboard/billing?canceled=true`,
            subscription_data: {
                metadata: { organizationId: org._id },
                trial_period_days: 7,
            },
            metadata: { organizationId: org._id },
        });

        if (!checkoutSession.url) throw new Error("Stripe session creation failed");

        return { url: checkoutSession.url };
    },
});

/**
 * Create a Stripe Customer Portal session for managing the subscription.
 */
export const createPortalSession = action({
    args: {},
    handler: async (ctx): Promise<{ url: string }> => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Non authentifié");

        const session = await ctx.runQuery(internal.sessions.getCurrentSession, {});
        if (!session?.organizationId) throw new Error("Aucune organisation active");

        const org: any = await ctx.runQuery(internal.utils.getOrganization, { id: session.organizationId as any });
        if (!org?.stripe?.customerId) throw new Error("Aucun abonnement Stripe lié à cette organisation");

        const stripe = getStripe();
        const appUrl = getAppUrl();

        const portalSession = await stripe.billingPortal.sessions.create({
            customer: org.stripe.customerId,
            return_url: `${appUrl}/dashboard/billing`,
        });

        return { url: portalSession.url };
    },
});
