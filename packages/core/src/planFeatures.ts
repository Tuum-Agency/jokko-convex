/**
 * Feature manifest — mapping des fonctionnalités Jokko vers le plan minimum requis.
 *
 * Source unique de vérité côté front ET back (le fichier convex/lib/planFeatures.ts
 * réexporte les mêmes constantes via import relatif pour garantir la cohérence).
 *
 * Convention :
 *   - clé stable (ne JAMAIS la changer une fois déployée)
 *   - `minPlan` = plan minimum qui déverrouille la feature
 *   - `label` = libellé FR affiché dans les badges
 *
 * Règle de gating :
 *   - Pendant le trial : toutes les features sont accessibles (badge "Inclus dans X")
 *   - Après expiration, sans plan choisi (FREE sentinel) : tout est verrouillé
 *   - Après expiration, avec plan : rangOf(plan) >= rangOf(feature.minPlan)
 */

export type PlanKey = "FREE" | "STARTER" | "BUSINESS" | "PRO" | "ENTERPRISE";

export const PLAN_RANK: Record<PlanKey, number> = {
    FREE: 0,
    STARTER: 1,
    BUSINESS: 2,
    PRO: 3,
    ENTERPRISE: 4,
};

/**
 * Ordre hiérarchique : un plan plus à droite inclut toutes les features
 * des plans à sa gauche.
 */
export const PLAN_ORDER: PlanKey[] = ["FREE", "STARTER", "BUSINESS", "PRO", "ENTERPRISE"];

export const PLAN_LABEL: Record<PlanKey, string> = {
    FREE: "Free",
    STARTER: "Starter",
    BUSINESS: "Business",
    PRO: "Pro",
    ENTERPRISE: "Enterprise",
};

export type FeatureKey =
    | "inbox"
    | "tagsNotes"
    | "quickReplies"
    | "mediaUpload"
    | "broadcasts"
    | "chatbot"
    | "advancedStats"
    | "webhooks"
    | "segmentation"
    | "integrations_crm"
    | "ai"
    | "flows"
    | "api"
    | "advancedMarketing"
    | "accountManager";

/**
 * Alias conservé pour compatibilité avec le code existant (snake_case).
 * @deprecated Utilise FeatureKey.
 */
export type PlanFeature =
    | "flows"
    | "broadcasts"
    | "segments"
    | "webhooks"
    | "integrations_crm"
    | "ai"
    | "analytics_advanced";

export const FEATURES: Record<
    FeatureKey,
    { label: string; minPlan: PlanKey; description?: string }
> = {
    // ---------- Inclus dès Starter ----------
    inbox: {
        label: "Boîte de réception unifiée",
        minPlan: "STARTER",
    },
    tagsNotes: {
        label: "Tags & Notes",
        minPlan: "STARTER",
    },
    quickReplies: {
        label: "Réponses rapides",
        minPlan: "STARTER",
    },
    mediaUpload: {
        label: "Envoi de médias",
        minPlan: "STARTER",
    },

    // ---------- Business ----------
    broadcasts: {
        label: "Campagnes marketing",
        minPlan: "BUSINESS",
        description: "Campagnes WhatsApp à grande échelle",
    },
    chatbot: {
        label: "Chatbot & Automatisation",
        minPlan: "BUSINESS",
    },
    advancedStats: {
        label: "Analytics avancées",
        minPlan: "BUSINESS",
    },
    webhooks: {
        label: "Webhooks",
        minPlan: "BUSINESS",
    },
    segmentation: {
        label: "Segments",
        minPlan: "BUSINESS",
    },
    flows: {
        label: "Automatisations",
        minPlan: "BUSINESS",
    },

    // ---------- Pro ----------
    integrations_crm: {
        label: "Intégrations CRM",
        minPlan: "PRO",
    },
    ai: {
        label: "Jokko AI",
        minPlan: "PRO",
        description: "Assistant intelligent et génération IA",
    },
    api: {
        label: "API & Intégrations",
        minPlan: "PRO",
    },
    advancedMarketing: {
        label: "Marketing Avancé",
        minPlan: "PRO",
    },

    // ---------- Enterprise ----------
    accountManager: {
        label: "Account Manager dédié",
        minPlan: "ENTERPRISE",
    },
};

/**
 * Map legacy (snake_case) -> FeatureKey canonique.
 * Permet aux consommateurs existants de main de continuer à fonctionner.
 */
const LEGACY_FEATURE_ALIASES: Record<PlanFeature, FeatureKey> = {
    flows: "flows",
    broadcasts: "broadcasts",
    segments: "segmentation",
    webhooks: "webhooks",
    integrations_crm: "integrations_crm",
    ai: "ai",
    analytics_advanced: "advancedStats",
};

/**
 * Table publique FEATURE_MIN_PLAN : conservée pour le code hérité qui utilise
 * le type PlanFeature (snake_case).
 */
export const FEATURE_MIN_PLAN: Record<PlanFeature, PlanKey> = {
    flows: FEATURES.flows.minPlan,
    broadcasts: FEATURES.broadcasts.minPlan,
    segments: FEATURES.segmentation.minPlan,
    webhooks: FEATURES.webhooks.minPlan,
    integrations_crm: FEATURES.integrations_crm.minPlan,
    ai: FEATURES.ai.minPlan,
    analytics_advanced: FEATURES.advancedStats.minPlan,
};

export const FEATURE_LABELS: Record<PlanFeature, string> = {
    flows: FEATURES.flows.label,
    broadcasts: FEATURES.broadcasts.label,
    segments: FEATURES.segmentation.label,
    webhooks: FEATURES.webhooks.label,
    integrations_crm: FEATURES.integrations_crm.label,
    ai: FEATURES.ai.label,
    analytics_advanced: FEATURES.advancedStats.label,
};

export function planRank(plan: PlanKey | string | null | undefined): number {
    if (plan == null) return 0;
    const rank = PLAN_RANK[plan as PlanKey];
    return rank ?? -1;
}

/**
 * Résout n'importe quelle clé (FeatureKey ou PlanFeature legacy) vers la clé canonique.
 */
function resolveFeatureKey(feature: FeatureKey | PlanFeature | string): FeatureKey | null {
    if (feature in FEATURES) return feature as FeatureKey;
    if (feature in LEGACY_FEATURE_ALIASES) return LEGACY_FEATURE_ALIASES[feature as PlanFeature];
    return null;
}

export function planIncludesFeature(
    plan: PlanKey | string,
    feature: FeatureKey | PlanFeature,
): boolean {
    const key = resolveFeatureKey(feature);
    if (!key) return false;
    return planRank(plan) >= planRank(FEATURES[key].minPlan);
}

/**
 * Pour l'UI : retourne le plan minimum requis pour une feature.
 */
export function minPlanForFeature(feature: FeatureKey | PlanFeature): PlanKey {
    const key = resolveFeatureKey(feature);
    if (!key) return "FREE";
    return FEATURES[key].minPlan;
}
