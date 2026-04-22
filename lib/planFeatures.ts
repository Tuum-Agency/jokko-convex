/**
 * Feature manifest — mapping des fonctionnalités Jokko vers le plan minimum requis.
 *
 * Source unique de vérité côté front ET back (le fichier convex/lib/planFeatures.ts
 * réexporte les mêmes constantes via import relatif pour garantir la cohérence).
 *
 * Convention :
 *   - clé stable en camelCase (ne JAMAIS la changer une fois déployée)
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
    | "ai"
    | "flows"
    | "api"
    | "advancedMarketing"
    | "accountManager";

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
        label: "Marketing de masse",
        minPlan: "BUSINESS",
        description: "Campagnes WhatsApp à grande échelle",
    },
    chatbot: {
        label: "Chatbot & Automatisation",
        minPlan: "BUSINESS",
    },
    advancedStats: {
        label: "Statistiques & Segments",
        minPlan: "BUSINESS",
    },
    webhooks: {
        label: "Webhooks",
        minPlan: "BUSINESS",
    },
    segmentation: {
        label: "Segmentation avancée",
        minPlan: "BUSINESS",
    },

    // ---------- Pro ----------
    ai: {
        label: "Jokko AI",
        minPlan: "PRO",
        description: "Assistant intelligent et génération IA",
    },
    flows: {
        label: "Flux de conversation (Flows)",
        minPlan: "PRO",
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

export function planRank(plan: PlanKey | string | null | undefined): number {
    if (!plan) return 0;
    return PLAN_RANK[plan as PlanKey] ?? 0;
}

export function planIncludesFeature(plan: PlanKey | string, feature: FeatureKey): boolean {
    const f = FEATURES[feature];
    if (!f) return false;
    return planRank(plan) >= planRank(f.minPlan);
}
