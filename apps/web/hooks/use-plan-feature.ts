/**
 * Hook client pour interroger l'accès à une feature selon le plan de l'org active.
 *
 * Utilise le plan exposé dans `useCurrentOrg().currentOrg.plan` (pré-chargé via
 * `api.sessions.current`) et la matrice partagée `lib/planFeatures.ts`.
 *
 * Exemples :
 *   const { allowed, minPlan, currentPlan, isLoading } = usePlanFeature("flows");
 *   if (!allowed) return <Paywall feature="flows" minPlan={minPlan} />;
 */

import { useCurrentOrg } from "./use-current-org";
import {
    planIncludesFeature,
    minPlanForFeature,
    FEATURE_LABELS,
    type PlanFeature,
    type PlanKey,
} from "@jokko/core/planFeatures";

export function usePlanFeature(feature: PlanFeature): {
    allowed: boolean;
    minPlan: PlanKey;
    currentPlan: PlanKey | null;
    featureLabel: string;
    isLoading: boolean;
} {
    const { currentOrg, isLoading } = useCurrentOrg();
    const currentPlan = (currentOrg?.plan as PlanKey | undefined) ?? null;
    const minPlan = minPlanForFeature(feature);
    const allowed = currentPlan ? planIncludesFeature(currentPlan, feature) : false;

    return {
        allowed,
        minPlan,
        currentPlan,
        featureLabel: FEATURE_LABELS[feature],
        isLoading,
    };
}
