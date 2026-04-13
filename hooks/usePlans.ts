import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
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
