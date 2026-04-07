"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import Stripe from "stripe";
import { getAuthUserId } from "@convex-dev/auth/server";
import { priceIdFromPlan } from "./lib/stripePlans";
import { Id } from "./_generated/dataModel";

function getStripe(): Stripe {
    return new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: "2026-02-25.clover",
    });
}

function getAppUrl(): string {
    return process.env.APP_URL || "https://app.jokko.co";
}

/**
 * Build a redirect URL that includes the org slug as a subdomain
 * so that Stripe redirects directly to the right tenant context
 * (avoids losing query params during subdomain redirect in the dashboard layout).
 */
function buildRedirectUrl(baseUrl: string, path: string, orgSlug?: string): string {
    try {
        const url = new URL(baseUrl);
        // Only add subdomain if the host is bare (no subdomain already)
        if (orgSlug) {
            const hostname = url.hostname;
            if (hostname === "localhost") {
                url.hostname = `${orgSlug}.localhost`;
            } else {
                const rootDomain = process.env.ROOT_DOMAIN || "jokko.co";
                if (hostname === rootDomain || hostname === `www.${rootDomain}` || hostname === `app.${rootDomain}`) {
                    url.hostname = `${orgSlug}.${rootDomain}`;
                }
            }
        }
        url.pathname = path;
        return url.toString();
    } catch {
        return `${baseUrl}${path}`;
    }
}

/**
 * Create a Stripe Checkout Session for upgrading the org's plan.
 * Guards:
 * - Blocks if org already has an active/trialing subscription
 * - Checks trialUsed to prevent unlimited free trials
 * - Cancels any lingering incomplete subscriptions before creating a new one
 * - Persists customerId immediately after creation
 */
export const createCheckoutSession = action({
    args: {
        planKey: v.union(v.literal("STARTER"), v.literal("BUSINESS"), v.literal("PRO")),
        interval: v.optional(v.union(v.literal("month"), v.literal("year"))),
    },
    handler: async (ctx, args): Promise<{ url: string }> => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Non authentifié");

        // Verify role (only OWNER/ADMIN)
        const role = await ctx.runQuery(internal.sessions.getCurrentSession, {});
        if (!role?.organizationId) throw new Error("Aucune organisation active");

        const session = role;
        const org: any = await ctx.runQuery(internal.utils.getOrganization, { id: session.organizationId as any });
        if (!org) throw new Error("Organisation introuvable");

        // Guard: block if org already has an active or trialing subscription
        const existingStatus = org.stripe?.status;
        if (existingStatus === "active" || existingStatus === "trialing") {
            throw new Error(
                "Vous avez déjà un abonnement actif. Utilisez le portail de gestion pour modifier ou annuler votre abonnement."
            );
        }

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

            // Persist customerId immediately so subsequent calls don't create duplicates
            await ctx.runMutation(internal.stripe.saveCustomerId, {
                organizationId: org._id,
                stripeCustomerId: customerId,
            });
        } else {
            // Cancel any incomplete/past_due subscriptions on this customer to prevent duplicates
            const existingSubs = await stripe.subscriptions.list({
                customer: customerId,
                status: "all",
            });
            for (const sub of existingSubs.data) {
                if (sub.status === "incomplete" || sub.status === "incomplete_expired" || sub.status === "past_due") {
                    try {
                        await stripe.subscriptions.cancel(sub.id);
                    } catch {
                        // Ignore errors canceling stale subscriptions
                    }
                }
            }
        }

        // Determine trial eligibility: only if never used before
        const trialUsed = org.stripe?.trialUsed === true;
        const trialDays = trialUsed ? undefined : 7;

        // Create checkout session
        const successUrl = buildRedirectUrl(appUrl, "/dashboard/billing?success=true", org.slug);
        const cancelUrl = buildRedirectUrl(appUrl, "/dashboard/billing?canceled=true", org.slug);

        const checkoutSession = await stripe.checkout.sessions.create({
            customer: customerId,
            mode: "subscription",
            line_items: [{ price: priceId, quantity: 1 }],
            success_url: successUrl,
            cancel_url: cancelUrl,
            subscription_data: {
                metadata: { organizationId: org._id },
                ...(trialDays ? { trial_period_days: trialDays } : {}),
            },
            metadata: { organizationId: org._id, priceId },
            // Prevent duplicate active subscriptions by allowing only one per customer
            allow_promotion_codes: true,
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
            return_url: buildRedirectUrl(appUrl, "/dashboard/billing", org.slug),
        });

        return { url: portalSession.url };
    },
});

// Valid credit pack amounts (must match lib/credit-packs.ts)
const VALID_AMOUNTS = [5_000, 10_000, 25_000, 50_000, 100_000];

/**
 * Create a Stripe Checkout Session for credit recharge (one-time payment).
 * XOF is a 2-decimal currency in Stripe: 5000 FCFA = 500000 in minor units.
 */
export const createCreditsCheckoutSession = action({
    args: {
        amount: v.number(),
    },
    handler: async (ctx, args): Promise<{ url: string; paymentSessionId: string }> => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Non authentifié");

        if (!VALID_AMOUNTS.includes(args.amount)) {
            throw new Error("Montant invalide");
        }

        const session = await ctx.runQuery(internal.sessions.getCurrentSession, {});
        if (!session?.organizationId) throw new Error("Aucune organisation active");

        const organizationId = session.organizationId as Id<"organizations">;

        const org: any = await ctx.runQuery(internal.utils.getOrganization, { id: organizationId });
        if (!org) throw new Error("Organisation introuvable");

        // Create payment session
        const { sessionId } = await ctx.runMutation(
            internal.payments.createPaymentSession,
            {
                organizationId,
                userId,
                amount: args.amount,
                credits: args.amount,
                provider: "STRIPE",
            }
        );

        const stripe = getStripe();
        const appUrl = getAppUrl();

        // Get or create Stripe customer
        let customerId = org.stripe?.customerId;
        if (!customerId) {
            const customer = await stripe.customers.create({
                name: org.name,
                metadata: { organizationId: org._id },
            });
            customerId = customer.id;

            // Persist customerId immediately
            await ctx.runMutation(internal.stripe.saveCustomerId, {
                organizationId: org._id,
                stripeCustomerId: customerId,
            });
        }

        // Create one-time payment checkout session
        // XOF in Stripe: 2-decimal currency → multiply by 100
        const checkoutSession = await stripe.checkout.sessions.create({
            customer: customerId,
            mode: "payment",
            line_items: [
                {
                    price_data: {
                        currency: "xof",
                        unit_amount: args.amount * 100,
                        product_data: {
                            name: `Recharge Jokko - ${new Intl.NumberFormat("fr-FR").format(args.amount)} FCFA`,
                        },
                    },
                    quantity: 1,
                },
            ],
            success_url: buildRedirectUrl(appUrl, `/dashboard/billing/recharge?session=${sessionId}&status=success`, org.slug),
            cancel_url: buildRedirectUrl(appUrl, `/dashboard/billing/recharge?session=${sessionId}&status=cancel`, org.slug),
            metadata: {
                organizationId: org._id,
                paymentSessionId: sessionId,
                type: "credits",
            },
        });

        if (!checkoutSession.url) throw new Error("Stripe session creation failed");

        // Update payment session with Stripe details
        await ctx.runMutation(internal.payments.updatePaymentSession, {
            sessionId,
            providerSessionId: checkoutSession.id,
            checkoutUrl: checkoutSession.url,
            providerMetadata: {
                stripeSessionId: checkoutSession.id,
                paymentIntent: checkoutSession.payment_intent,
            },
        });

        return { url: checkoutSession.url, paymentSessionId: sessionId };
    },
});
