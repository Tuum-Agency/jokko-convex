/**
 * Plan feature gating — verrouillage de fonctionnalités par plan d'abonnement.
 *
 * Distinct des quotas (nombre max de canaux, agents, templates) gérés par
 * planLimits.ts. Ici on gate des FEATURES entières : flows/automatisation,
 * broadcasts, intégrations CRM, IA générative.
 *
 * Source de vérité partagée avec le client via lib/planFeatures.ts (racine).
 */

import type { QueryCtx, MutationCtx, ActionCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import {
    PLAN_ORDER,
    FEATURE_MIN_PLAN,
    planIncludesFeature,
    type PlanFeature,
    type PlanKey,
} from "../../lib/planFeatures";

export { PLAN_ORDER, FEATURE_MIN_PLAN, planIncludesFeature };
export type { PlanFeature, PlanKey };

/**
 * Throw si le plan de l'org n'inclut pas la feature demandée.
 * Lève une erreur user-friendly en français avec le plan minimum requis.
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
