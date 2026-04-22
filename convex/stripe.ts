import { v } from "convex/values";
import { internalMutation, type MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { planFromPriceId } from "./lib/stripePlans";
import { getMaxChannels, isUnlimited } from "./lib/planHelpers";

/**
 * Applique la règle de cascade lors d'un downgrade de plan :
 * désactive les canaux WhatsApp excédentaires en gardant en priorité
 * le canal default/primary, puis les plus anciens.
 *
 * - status -> "disabled"
 * - disabledReason -> "plan_downgrade"
 * - disabledAt -> timestamp
 *
 * Met également en pause les broadcasts SCHEDULED liés aux canaux désactivés
 * et notifie l'OWNER de l'organisation.
 */
async function enforceChannelDowngrade(
    ctx: MutationCtx,
    organizationId: Id<"organizations">,
    newPlan: string,
): Promise<number> {
    const maxChannels = await getMaxChannels(ctx, newPlan);
    if (isUnlimited(maxChannels)) return 0;

    const channels = await ctx.db
        .query("whatsappChannels")
        .withIndex("by_org", (q) => q.eq("organizationId", organizationId))
        .collect();

    const activeChannels = channels.filter((c) => c.status !== "disabled" && c.status !== "banned");
    if (activeChannels.length <= maxChannels) return 0;

    // Règle déterministe : default/primary d'abord, puis les plus anciens
    const sorted = [...activeChannels].sort((a, b) => {
        if (a.isOrgDefault && !b.isOrgDefault) return -1;
        if (!a.isOrgDefault && b.isOrgDefault) return 1;
        return a.createdAt - b.createdAt;
    });

    const toKeep = sorted.slice(0, maxChannels);
    const toDisable = sorted.slice(maxChannels);
    const now = Date.now();
    const disabledIds: Id<"whatsappChannels">[] = [];

    for (const ch of toDisable) {
        await ctx.db.patch(ch._id, {
            status: "disabled",
            disabledReason: "plan_downgrade",
            disabledAt: now,
            isOrgDefault: false,
            updatedAt: now,
        });
        disabledIds.push(ch._id);
    }

    // Assurer qu'un canal default reste si la liste à garder en contient au moins un
    const hasDefault = toKeep.some((c) => c.isOrgDefault);
    if (!hasDefault && toKeep.length > 0) {
        await ctx.db.patch(toKeep[0]._id, { isOrgDefault: true, updatedAt: now });
    }

    // Pause des broadcasts SCHEDULED qui ciblent les canaux désactivés
    if (disabledIds.length > 0) {
        const scheduled = await ctx.db
            .query("broadcasts")
            .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
            .filter((q) => q.eq(q.field("status"), "SCHEDULED"))
            .collect();
        for (const b of scheduled) {
            if (b.whatsappChannelId && disabledIds.includes(b.whatsappChannelId)) {
                await ctx.db.patch(b._id, { status: "DRAFT", updatedAt: now });
                await ctx.db.insert("broadcastActivities", {
                    broadcastId: b._id,
                    type: "paused",
                    message: `Campagne dépubliée : canal désactivé après passage au plan ${newPlan}`,
                    createdAt: now,
                });
            }
        }
    }

    // Notifications — on notifie OWNER et ADMIN de l'organisation
    const memberships = await ctx.db
        .query("memberships")
        .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
        .collect();
    for (const m of memberships) {
        if (m.role !== "OWNER" && m.role !== "ADMIN") continue;
        await ctx.db.insert("notifications", {
            organizationId,
            userId: m.userId,
            type: "PLAN_DOWNGRADE",
            title: "Canaux désactivés après changement de plan",
            message: `Votre plan ${newPlan} autorise ${maxChannels} canal${maxChannels > 1 ? "aux" : ""}. ${disabledIds.length} canal${disabledIds.length > 1 ? "aux ont été désactivés" : " a été désactivé"}.`,
            link: "/dashboard/channels",
            isRead: false,
            metadata: {
                disabledChannelIds: disabledIds.map((id) => id.toString()),
                newPlan,
                maxChannels,
            },
            createdAt: now,
        });
    }

    return disabledIds.length;
}

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
            hasSelectedPlan: true,
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

        // Cascade enforcement si le nouveau plan a des limites inférieures
        await enforceChannelDowngrade(ctx, org._id as Id<"organizations">, plan);
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
            hasSelectedPlan: true,
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

        await enforceChannelDowngrade(ctx, org._id, plan);
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
            hasSelectedPlan: false,
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

        await enforceChannelDowngrade(ctx, org._id, "FREE");
    },
});

/**
 * Migration / régularisation rétroactive : applique la règle de cascade
 * à toutes les organisations existantes. Utile après le déploiement
 * pour désactiver les canaux excédentaires d'orgs déjà en dépassement.
 */
export const backfillPlanLimits = internalMutation({
    args: {},
    handler: async (ctx) => {
        const orgs = await ctx.db.query("organizations").collect();
        let totalDisabled = 0;
        let orgsAffected = 0;
        for (const org of orgs) {
            const disabled = await enforceChannelDowngrade(ctx, org._id, org.plan);
            if (disabled > 0) {
                totalDisabled += disabled;
                orgsAffected += 1;
            }
        }
        console.log(
            `[backfillPlanLimits] Désactivé ${totalDisabled} canaux dans ${orgsAffected} orgs`,
        );
        return { totalDisabled, orgsAffected };
    },
});
