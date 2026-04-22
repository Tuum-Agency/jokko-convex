/**
 * Plan helpers - reads limits from the `plans` table (source unique de vérité).
 *
 * Replaces the hardcoded planLimits.ts.
 * Convention: -1 = unlimited.
 */

import type { Doc } from "../_generated/dataModel";
import { QueryCtx, MutationCtx } from "../_generated/server";
import { FEATURES, type FeatureKey, planRank } from "./planFeatures";

const UNLIMITED = -1;

export function isUnlimited(value: number): boolean {
    return value === UNLIMITED;
}

// ============================================
// Trial + plan access — règles globales
// ============================================

type OrgLike = Pick<
    Doc<"organizations">,
    "plan" | "trialEndsAt" | "hasSelectedPlan" | "createdAt"
>;

/**
 * Renvoie true si l'organisation est actuellement dans sa période d'essai
 * de 14 jours (toutes features déverrouillées).
 */
export function isTrialing(org: OrgLike | null | undefined, now: number = Date.now()): boolean {
    if (!org) return false;
    if (typeof org.trialEndsAt === "number") {
        return now < org.trialEndsAt;
    }
    // Backfill implicite pour les orgs créées avant l'ajout du trial :
    // on considère qu'elles bénéficient de 14 jours à partir de createdAt.
    if (typeof org.createdAt === "number") {
        const TRIAL_MS = 14 * 24 * 60 * 60 * 1000;
        return now < org.createdAt + TRIAL_MS;
    }
    return false;
}

/**
 * L'organisation a-t-elle explicitement sélectionné un plan payant ?
 * FREE est un sentinel "pas de plan choisi".
 */
export function hasChosenPlan(org: OrgLike | null | undefined): boolean {
    if (!org) return false;
    if (org.hasSelectedPlan === true) return true;
    // Fallback : orgs ENTERPRISE attribuées manuellement ou payantes sans flag explicite.
    return org.plan !== "FREE";
}

/**
 * Retourne la date de fin de trial (ou undefined si pas applicable).
 */
export function getTrialEndsAt(org: OrgLike | null | undefined): number | undefined {
    if (!org) return undefined;
    if (typeof org.trialEndsAt === "number") return org.trialEndsAt;
    if (typeof org.createdAt === "number") {
        return org.createdAt + 14 * 24 * 60 * 60 * 1000;
    }
    return undefined;
}

/**
 * Droit d'accès à une feature en tenant compte du trial et du plan choisi.
 * - Trial actif → accessible, peu importe le plan
 * - Trial expiré + aucun plan → verrouillé (lockAll)
 * - Trial expiré + plan choisi → accessible si planRank(plan) >= planRank(feature.minPlan)
 */
export function hasFeatureAccess(
    org: OrgLike | null | undefined,
    feature: FeatureKey,
    now: number = Date.now(),
): boolean {
    if (!org) return false;
    if (isTrialing(org, now)) return true;
    if (!hasChosenPlan(org)) return false;
    const def = FEATURES[feature];
    if (!def) return false;
    return planRank(org.plan as any) >= planRank(def.minPlan);
}

/**
 * Source du déverrouillage pour affichage UI.
 * - "trial" : accessible uniquement grâce au trial
 * - "plan" : inclus dans le plan choisi
 * - "locked" : non accessible
 */
export function featureUnlockSource(
    org: OrgLike | null | undefined,
    feature: FeatureKey,
    now: number = Date.now(),
): "trial" | "plan" | "locked" {
    if (!org) return "locked";
    const trialing = isTrialing(org, now);
    const def = FEATURES[feature];
    if (!def) return "locked";
    const inPlan = hasChosenPlan(org) && planRank(org.plan as any) >= planRank(def.minPlan);
    if (inPlan) return "plan";
    if (trialing) return "trial";
    return "locked";
}

// ============================================
// Lecture du plan depuis la DB
// ============================================

async function getPlan(ctx: QueryCtx | MutationCtx, planKey: string) {
    const plan = await ctx.db
        .query("plans")
        .withIndex("by_key", (q) => q.eq("key", planKey))
        .first();
    if (!plan) throw new Error(`Plan "${planKey}" not found in database`);
    return plan;
}

export async function getMaxChannels(ctx: QueryCtx | MutationCtx, planKey: string): Promise<number> {
    return (await getPlan(ctx, planKey)).maxWhatsappChannels;
}

export async function getMaxAgents(ctx: QueryCtx | MutationCtx, planKey: string): Promise<number> {
    return (await getPlan(ctx, planKey)).maxAgents;
}

export async function getConversationLimit(ctx: QueryCtx | MutationCtx, planKey: string): Promise<number> {
    return (await getPlan(ctx, planKey)).maxConversationsPerMonth;
}

export async function getPlanLimits(ctx: QueryCtx | MutationCtx, planKey: string) {
    const plan = await getPlan(ctx, planKey);
    return {
        maxAgents: plan.maxAgents,
        maxWhatsappChannels: plan.maxWhatsappChannels,
        maxConversationsPerMonth: plan.maxConversationsPerMonth,
        maxTemplates: plan.maxTemplates,
        historyDays: plan.historyDays,
    };
}
