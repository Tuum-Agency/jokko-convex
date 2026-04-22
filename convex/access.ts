/**
 * Access status — query publique qui retourne en un seul appel l'état du
 * trial, du plan sélectionné, et la map de droits d'accès pour toutes les
 * features référencées dans `lib/planFeatures`.
 *
 * Consommée par le hook `useAccessStatus` / `useFeatureAccess` côté client.
 */

import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import {
    featureUnlockSource,
    getTrialEndsAt,
    hasChosenPlan,
    isTrialing,
} from "./lib/planHelpers";
import { FEATURES, type FeatureKey, type PlanKey } from "./lib/planFeatures";

type FeatureStatus = {
    accessible: boolean;
    source: "trial" | "plan" | "locked";
    minPlan: PlanKey;
    label: string;
};

export const getAccessStatus = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) return null;

        const session = await ctx.db
            .query("userSessions")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .first();
        if (!session?.currentOrganizationId) return null;

        const org = await ctx.db.get(session.currentOrganizationId);
        if (!org) return null;

        const now = Date.now();
        const trialEndsAt = getTrialEndsAt(org);
        const trialing = isTrialing(org, now);

        const features: Record<FeatureKey, FeatureStatus> = {} as any;
        for (const key of Object.keys(FEATURES) as FeatureKey[]) {
            const def = FEATURES[key];
            const source = featureUnlockSource(org, key, now);
            features[key] = {
                accessible: source !== "locked",
                source,
                minPlan: def.minPlan,
                label: def.label,
            };
        }

        return {
            plan: org.plan as PlanKey,
            hasSelectedPlan: hasChosenPlan(org),
            isTrialing: trialing,
            trialStartedAt: org.trialStartedAt ?? org.createdAt ?? null,
            trialEndsAt: trialEndsAt ?? null,
            trialDaysLeft: trialEndsAt
                ? Math.max(0, Math.ceil((trialEndsAt - now) / (24 * 60 * 60 * 1000)))
                : 0,
            features,
        };
    },
});

/**
 * Backfill : remplit trialStartedAt / trialEndsAt sur les orgs existantes
 * qui n'ont pas encore ces champs. Idempotent.
 */
export const backfillTrial = mutation({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Non authentifié");

        const orgs = await ctx.db.query("organizations").collect();
        const TRIAL_MS = 14 * 24 * 60 * 60 * 1000;
        let patched = 0;

        for (const org of orgs) {
            if (org.trialStartedAt && org.trialEndsAt) continue;
            const startedAt = org.trialStartedAt ?? org.createdAt ?? Date.now();
            await ctx.db.patch(org._id, {
                trialStartedAt: startedAt,
                trialEndsAt: startedAt + TRIAL_MS,
                hasSelectedPlan: org.hasSelectedPlan ?? org.plan !== "FREE",
                updatedAt: Date.now(),
            });
            patched += 1;
        }

        return { patched };
    },
});

/**
 * Dev-only : force l'expiration du trial pour tester le lock post-trial.
 * Ne pas exposer en prod — à utiliser depuis le dashboard Convex / CLI.
 */
export const expireTrialDev = mutation({
    args: { organizationId: v.id("organizations") },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Non authentifié");

        const membership = await ctx.db
            .query("memberships")
            .withIndex("by_user_org", (q) =>
                q.eq("userId", userId).eq("organizationId", args.organizationId),
            )
            .first();
        if (!membership || (membership.role !== "OWNER" && membership.role !== "ADMIN")) {
            throw new Error("Réservé aux OWNER/ADMIN");
        }

        const now = Date.now();
        await ctx.db.patch(args.organizationId, {
            trialStartedAt: now - 20 * 24 * 60 * 60 * 1000,
            trialEndsAt: now - 6 * 24 * 60 * 60 * 1000,
            updatedAt: now,
        });
        return { ok: true };
    },
});

/**
 * Dev-only : réinitialise un trial de 14 jours sur l'org courante.
 */
export const resetTrialDev = mutation({
    args: { organizationId: v.id("organizations") },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Non authentifié");

        const membership = await ctx.db
            .query("memberships")
            .withIndex("by_user_org", (q) =>
                q.eq("userId", userId).eq("organizationId", args.organizationId),
            )
            .first();
        if (!membership || (membership.role !== "OWNER" && membership.role !== "ADMIN")) {
            throw new Error("Réservé aux OWNER/ADMIN");
        }

        const now = Date.now();
        await ctx.db.patch(args.organizationId, {
            trialStartedAt: now,
            trialEndsAt: now + 14 * 24 * 60 * 60 * 1000,
            updatedAt: now,
        });
        return { ok: true };
    },
});
