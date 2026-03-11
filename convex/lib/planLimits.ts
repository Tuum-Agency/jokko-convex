/**
 * Limites des plans pour le backend Convex.
 *
 * Source de vérité partagée : ces valeurs DOIVENT correspondre à lib/plans.ts.
 * On ne peut pas importer directement depuis lib/ dans Convex, donc on duplique
 * uniquement les limites numériques ici.
 */

export type PlanKey = "FREE" | "STARTER" | "BUSINESS" | "PRO" | "ENTERPRISE";

export const CONVERSATION_LIMITS: Record<PlanKey, number> = {
    FREE: 1_000,
    STARTER: 1_000,
    BUSINESS: 5_000,
    PRO: 10_000,
    ENTERPRISE: Infinity,
};

export const CHANNEL_LIMITS: Record<PlanKey, number> = {
    FREE: 1,
    STARTER: 1,
    BUSINESS: 3,
    PRO: 10,
    ENTERPRISE: Infinity,
};

export const AGENT_LIMITS: Record<PlanKey, number> = {
    FREE: 1,
    STARTER: 1,
    BUSINESS: 5,
    PRO: 20,
    ENTERPRISE: Infinity,
};

export function getMaxChannels(plan: string): number {
    return CHANNEL_LIMITS[plan as PlanKey] ?? 1;
}

export function getMaxAgents(plan: string): number {
    return AGENT_LIMITS[plan as PlanKey] ?? 1;
}

export function getConversationLimit(plan: string): number {
    return CONVERSATION_LIMITS[plan as PlanKey] ?? 1_000;
}
