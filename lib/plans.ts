/**
 * Source unique de vérité pour les plans et tarifs Jokko.
 *
 * Ce fichier est importé côté frontend (landing, dashboard, billing).
 * Pour le backend Convex, voir convex/lib/planLimits.ts qui réexporte les limites.
 */

export type PlanKey = "FREE" | "STARTER" | "BUSINESS" | "PRO" | "ENTERPRISE";

export interface PlanLimits {
    agents: number;
    whatsappChannels: number;
    conversationsPerMonth: number;
    templates: number;
    historyDays: number; // Infinity = illimité
}

export interface PlanPricing {
    monthlyFCFA: number;
    yearlyFCFA: number;
    yearlyMonthlyFCFA: number; // prix mensuel en facturation annuelle
}

export interface PlanFeature {
    label: string;
    included: boolean;
}

export interface PlanDefinition {
    key: PlanKey;
    name: string;
    description: string;
    pricing: PlanPricing;
    limits: PlanLimits;
    features: PlanFeature[];
    supportLevel: string;
    popular?: boolean;
}

// ---------------------------------------------------------------------------
// Limites par plan (utilisées aussi côté backend via convex/lib/planLimits.ts)
// ---------------------------------------------------------------------------

export const PLAN_LIMITS: Record<PlanKey, PlanLimits> = {
    FREE: {
        agents: 1,
        whatsappChannels: 1,
        conversationsPerMonth: 1_000,
        templates: 5,
        historyDays: 30,
    },
    STARTER: {
        agents: 1,
        whatsappChannels: 1,
        conversationsPerMonth: 1_000,
        templates: 5,
        historyDays: 30,
    },
    BUSINESS: {
        agents: 5,
        whatsappChannels: 3,
        conversationsPerMonth: 5_000,
        templates: 20,
        historyDays: Infinity,
    },
    PRO: {
        agents: 20,
        whatsappChannels: 10,
        conversationsPerMonth: 10_000,
        templates: Infinity,
        historyDays: Infinity,
    },
    ENTERPRISE: {
        agents: Infinity,
        whatsappChannels: Infinity,
        conversationsPerMonth: Infinity,
        templates: Infinity,
        historyDays: Infinity,
    },
};

// ---------------------------------------------------------------------------
// Tarifs
// ---------------------------------------------------------------------------

export const PLAN_PRICING: Record<Exclude<PlanKey, "FREE" | "ENTERPRISE">, PlanPricing> = {
    STARTER: { monthlyFCFA: 10_000, yearlyFCFA: 96_000, yearlyMonthlyFCFA: 8_000 },
    BUSINESS: { monthlyFCFA: 30_000, yearlyFCFA: 288_000, yearlyMonthlyFCFA: 24_000 },
    PRO: { monthlyFCFA: 70_000, yearlyFCFA: 672_000, yearlyMonthlyFCFA: 56_000 },
};

// ---------------------------------------------------------------------------
// Définitions complètes (pour les UIs de pricing / billing)
// ---------------------------------------------------------------------------

export const PLANS: PlanDefinition[] = [
    {
        key: "STARTER",
        name: "Starter",
        description: "Pour les solopreneurs qui se lancent.",
        pricing: PLAN_PRICING.STARTER,
        limits: PLAN_LIMITS.STARTER,
        features: [
            { label: "Boîte de réception unifiée", included: true },
            { label: "Tags & Notes de base", included: true },
            { label: "Envoi de médias", included: true },
            { label: "Réponses rapides", included: true },
            { label: "Chatbot", included: false },
            { label: "Marketing de masse", included: false },
        ],
        supportLevel: "Email",
    },
    {
        key: "BUSINESS",
        name: "Business",
        description: "Pour les PME en croissance.",
        pricing: PLAN_PRICING.BUSINESS,
        limits: PLAN_LIMITS.BUSINESS,
        popular: true,
        features: [
            { label: "Marketing WhatsApp (hors coûts Meta)", included: true },
            { label: "Chatbot & Automatisation", included: true },
            { label: "Statistiques & Segments", included: true },
            { label: "Webhooks", included: true },
            { label: "Envoi de médias", included: true },
            { label: "IA Générative", included: false },
        ],
        supportLevel: "Prioritaire",
    },
    {
        key: "PRO",
        name: "Pro",
        description: "Pour les leaders du marché.",
        pricing: PLAN_PRICING.PRO,
        limits: PLAN_LIMITS.PRO,
        features: [
            { label: "Jokko AI (Assistant Intelligent)", included: true },
            { label: "Flux de conversation (Flows)", included: true },
            { label: "API & Intégrations", included: true },
            { label: "Webhooks", included: true },
            { label: "Marketing Avancé", included: true },
            { label: "Account Manager dédié", included: true },
        ],
        supportLevel: "Dédié 24/7",
    },
];

// ---------------------------------------------------------------------------
// Tableau comparatif détaillé (pour la page tarifs)
// ---------------------------------------------------------------------------

export interface ComparisonFeature {
    name: string;
    help?: string;
    starter: string | boolean;
    business: string | boolean;
    pro: string | boolean;
}

export interface ComparisonCategory {
    category: string;
    items: ComparisonFeature[];
}

export const COMPARISON_TABLE: ComparisonCategory[] = [
    {
        category: "Général",
        items: [
            { name: "Agents (Utilisateurs)", starter: "1", business: "5", pro: "20", help: "Nombre de personnes pouvant accéder au compte." },
            { name: "Numéros WhatsApp", starter: "1", business: "3", pro: "10", help: "Nombre de numéros de téléphone connectables." },
            { name: "Conversations/mois", starter: "1 000", business: "5 000", pro: "10 000", help: "Conversations de service incluses par mois." },
            { name: "Contacts", starter: "Illimité", business: "Illimité", pro: "Illimité", help: "Nombre de contacts dans votre CRM." },
            { name: "Historique des messages", starter: "30 jours", business: "Illimité", pro: "Illimité", help: "Durée de conservation des conversations." },
        ],
    },
    {
        category: "Messagerie & Diffusion",
        items: [
            { name: "Boîte de réception unifiée", starter: true, business: true, pro: true, help: "Messages centralisés au même endroit." },
            { name: "Campagnes Marketing (Broadcast)", starter: false, business: "Illimité", pro: "Illimité", help: "Envoi en masse. Les frais de conversation WhatsApp (Meta) sont à votre charge." },
            { name: "Segmentation avancée", starter: false, business: true, pro: true, help: "Filtrez vos clients par tags et attributs." },
            { name: "Modèles de messages (Templates)", starter: "5", business: "20", pro: "Illimité", help: "Modèles pré-approuvés par Meta." },
            { name: "Envoi de médias (Images, Vidéos, Docs)", starter: true, business: true, pro: true, help: "Support de tous les fichiers." },
        ],
    },
    {
        category: "Automatisation & IA",
        items: [
            { name: "Réponses rapides", starter: true, business: true, pro: true, help: "Raccourcis clavier pour les messages fréquents." },
            { name: "Chatbot (Règles simples)", starter: false, business: true, pro: true, help: "Automatisation basique par mots-clés." },
            { name: "Jokko AI (Assistant Intelligent)", starter: false, business: false, pro: "Inclus", help: "IA générative qui répond à vos clients." },
            { name: "Flux de conversation (Flows)", starter: false, business: false, pro: true, help: "Création de parcours clients complexes." },
        ],
    },
    {
        category: "Support & Technique",
        items: [
            { name: "Support Client", starter: "Email", business: "Prioritaire", pro: "Dédié 24/7", help: "Niveau de support inclus." },
            { name: "Onboarding assisté", starter: false, business: false, pro: true, help: "Configuration initiale par nos experts." },
            { name: "API Access", starter: false, business: false, pro: true, help: "Connectez Jokko à vos outils." },
            { name: "Webhooks", starter: false, business: true, pro: true, help: "Recevez les événements en temps réel." },
        ],
    },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function formatLimit(value: number): string {
    if (value === Infinity) return "Illimité";
    return new Intl.NumberFormat("fr-FR").format(value);
}

export function getPlan(key: PlanKey): PlanDefinition | undefined {
    return PLANS.find((p) => p.key === key);
}

export function getLimits(key: string): PlanLimits {
    return PLAN_LIMITS[key as PlanKey] ?? PLAN_LIMITS.FREE;
}
