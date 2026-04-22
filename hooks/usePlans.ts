import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
    FEATURES,
    PLAN_LABEL,
    type FeatureKey,
    type PlanKey,
} from "@/lib/planFeatures";
import { useCurrentOrg } from "./use-current-org";

export function usePlans() {
    const plans = useQuery(api.plans.list);
    return {
        plans: plans ?? [],
        isLoading: plans === undefined,
    };
}

export function usePlanLimits() {
    const { currentOrg } = useCurrentOrg();
    const plans = useQuery(api.plans.list);
    const currentPlan = plans?.find((p) => p.key === currentOrg?.plan);

    return {
        currentPlan: currentPlan ?? null,
        plans: plans ?? [],
        isLoading: plans === undefined,
    };
}

// ============================================
// Trial + feature access hooks
// ============================================

export type AccessStatus = NonNullable<
    ReturnType<typeof useQuery<typeof api.access.getAccessStatus>>
>;

export function useAccessStatus() {
    const access = useQuery(api.access.getAccessStatus);
    return {
        access: access ?? null,
        isLoading: access === undefined,
    };
}

export function useTrialStatus() {
    const { access, isLoading } = useAccessStatus();
    return {
        isTrialing: access?.isTrialing ?? false,
        trialEndsAt: access?.trialEndsAt ?? null,
        trialDaysLeft: access?.trialDaysLeft ?? 0,
        hasSelectedPlan: access?.hasSelectedPlan ?? false,
        plan: (access?.plan ?? "FREE") as PlanKey,
        isLoading,
    };
}

export type FeatureAccess = {
    /** `true` si l'utilisateur peut utiliser la feature (trial OU plan). */
    accessible: boolean;
    /** `true` quand le déblocage vient UNIQUEMENT du trial (à afficher différemment). */
    isTrialUnlock: boolean;
    /** `true` si la feature fait partie du plan choisi. */
    includedInPlan: boolean;
    /** `true` si trial expiré et feature hors plan (état verrouillé). */
    locked: boolean;
    /** Plan minimum requis pour débloquer la feature hors trial. */
    requiredPlan: PlanKey;
    /** Libellé FR de la feature. */
    label: string;
    /** Libellé FR du plan requis. */
    requiredPlanLabel: string;
    /** True durant le chargement de la query. */
    isLoading: boolean;
};

export function useFeatureAccess(feature: FeatureKey): FeatureAccess {
    const { access, isLoading } = useAccessStatus();
    const def = FEATURES[feature];

    if (!access) {
        return {
            accessible: false,
            isTrialUnlock: false,
            includedInPlan: false,
            locked: true,
            requiredPlan: def.minPlan,
            label: def.label,
            requiredPlanLabel: PLAN_LABEL[def.minPlan],
            isLoading,
        };
    }

    const f = access.features[feature];
    return {
        accessible: f.accessible,
        isTrialUnlock: f.source === "trial",
        includedInPlan: f.source === "plan",
        locked: f.source === "locked",
        requiredPlan: f.minPlan,
        label: f.label,
        requiredPlanLabel: PLAN_LABEL[f.minPlan],
        isLoading,
    };
}

