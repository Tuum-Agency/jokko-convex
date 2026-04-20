/**
 * Plan features matrix — partagé client/serveur.
 *
 * Définit quelles FEATURES sont verrouillées à quel plan minimum.
 * Distinct des QUOTAS (planLimits) qui sont des compteurs numériques.
 *
 * Utilisé côté :
 * - Serveur : convex/lib/planFeatures.ts (requirePlanFeature)
 * - Client : hooks/use-plan-feature.ts + components/plan/FeatureGate
 * - Sidebar : filtre des items de navigation par plan
 */

export type PlanKey = "FREE" | "STARTER" | "BUSINESS" | "PRO" | "ENTERPRISE";

/**
 * Ordre hiérarchique : un plan plus à droite inclut toutes les features
 * des plans à sa gauche.
 */
export const PLAN_ORDER: PlanKey[] = ["FREE", "STARTER", "BUSINESS", "PRO", "ENTERPRISE"];

/**
 * Features gatées. Chaque feature a un plan minimum pour être accessible.
 */
export type PlanFeature =
    | "flows" // Automatisations / chatbot via React Flow
    | "broadcasts" // Campagnes marketing
    | "segments" // Segments de contacts
    | "webhooks" // Webhooks entrants/sortants
    | "integrations_crm" // Connecteurs CRM (Pipedrive, HubSpot, Salesforce, etc.)
    | "ai" // Jokko AI (createFromAI, suggestions IA)
    | "analytics_advanced"; // Tableaux de bord avancés / exports

export const FEATURE_MIN_PLAN: Record<PlanFeature, PlanKey> = {
    flows: "BUSINESS",
    broadcasts: "BUSINESS",
    segments: "BUSINESS",
    webhooks: "BUSINESS",
    integrations_crm: "PRO",
    ai: "PRO",
    analytics_advanced: "BUSINESS",
};

/**
 * Labels user-friendly des features pour l'UI.
 */
export const FEATURE_LABELS: Record<PlanFeature, string> = {
    flows: "Automatisations",
    broadcasts: "Campagnes marketing",
    segments: "Segments",
    webhooks: "Webhooks",
    integrations_crm: "Intégrations CRM",
    ai: "Jokko AI",
    analytics_advanced: "Analytics avancées",
};

/**
 * Indice du plan dans la hiérarchie. -1 si inconnu.
 */
export function planRank(plan: PlanKey | string): number {
    return PLAN_ORDER.indexOf(plan as PlanKey);
}

/**
 * Un plan `plan` inclut-il la feature demandée ?
 * Un plan inconnu est traité comme FREE (le plus restrictif).
 */
export function planIncludesFeature(plan: PlanKey | string, feature: PlanFeature): boolean {
    const rank = planRank(plan);
    const minRank = planRank(FEATURE_MIN_PLAN[feature]);
    if (rank < 0) return false;
    return rank >= minRank;
}

/**
 * Pour l'UI : retourne le plan minimum requis pour une feature.
 */
export function minPlanForFeature(feature: PlanFeature): PlanKey {
    return FEATURE_MIN_PLAN[feature];
}
