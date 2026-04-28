/**
 * Re-export du manifest de features depuis `lib/planFeatures` pour que Convex
 * et le client utilisent exactement les mêmes constantes. Ajoute les helpers
 * serveur `requirePlanFeature` / `requirePlanFeatureInAction`.
 *
 * Règles de gating appliquées dans `planHelpers.hasFeatureAccess()`.
 */

import type { QueryCtx, MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import {
    FEATURE_MIN_PLAN,
    planIncludesFeature,
    type PlanFeature,
    type PlanKey,
} from "@jokko/core/planFeatures";

export {
    FEATURES,
    FEATURE_MIN_PLAN,
    FEATURE_LABELS,
    PLAN_LABEL,
    PLAN_ORDER,
    PLAN_RANK,
    planIncludesFeature,
    planRank,
    minPlanForFeature,
} from "@jokko/core/planFeatures";
export type { FeatureKey, PlanFeature, PlanKey } from "@jokko/core/planFeatures";

/**
 * Throw si le plan de l'org n'inclut pas la feature demandée.
 */
export async function requirePlanFeature(
    ctx: QueryCtx | MutationCtx,
    organizationId: Id<"organizations">,
    feature: PlanFeature,
): Promise<void> {
    const org = await ctx.db.get(organizationId);
    if (!org) throw new Error("Organization not found");

    if (!planIncludesFeature(org.plan as PlanKey, feature)) {
        const min = FEATURE_MIN_PLAN[feature];
        throw new Error(
            `Fonctionnalité réservée au plan ${min} ou supérieur. Votre plan actuel : ${org.plan}. Passez à ${min} pour y accéder.`,
        );
    }
}

/**
 * Variante pour les actions Convex : l'action n'a pas accès à ctx.db,
 * elle doit récupérer l'org via une internalQuery.
 */
export async function requirePlanFeatureInAction(
    plan: string,
    feature: PlanFeature,
): Promise<void> {
    if (!planIncludesFeature(plan as PlanKey, feature)) {
        const min = FEATURE_MIN_PLAN[feature];
        throw new Error(
            `Fonctionnalité réservée au plan ${min} ou supérieur. Votre plan actuel : ${plan}. Passez à ${min} pour y accéder.`,
        );
    }
}
