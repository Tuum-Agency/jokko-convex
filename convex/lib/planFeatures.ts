/**
 * Re-export du manifest de features depuis `lib/planFeatures` pour que Convex
 * et le client utilisent exactement les mêmes constantes.
 *
 * Règles de gating appliquées dans `planHelpers.hasFeatureAccess()`.
 */

export {
    FEATURES,
    PLAN_LABEL,
    PLAN_RANK,
    planIncludesFeature,
    planRank,
} from "../../lib/planFeatures";
export type { FeatureKey, PlanKey } from "../../lib/planFeatures";
