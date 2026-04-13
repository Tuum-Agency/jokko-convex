import { v } from "convex/values";
import { query, internalMutation } from "./_generated/server";

const UNLIMITED = -1;

// ============================================
// Queries (publiques, pas besoin d'auth)
// ============================================

export const list = query({
    args: {},
    handler: async (ctx) => {
        const plans = await ctx.db
            .query("plans")
            .collect();
        return plans
            .filter((p) => p.isActive)
            .sort((a, b) => a.sortOrder - b.sortOrder);
    },
});

export const getByKey = query({
    args: { key: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("plans")
            .withIndex("by_key", (q) => q.eq("key", args.key))
            .first();
    },
});

export const getLimitsForOrg = query({
    args: { organizationId: v.id("organizations") },
    handler: async (ctx, args) => {
        const org = await ctx.db.get(args.organizationId);
        if (!org) return null;

        const plan = await ctx.db
            .query("plans")
            .withIndex("by_key", (q) => q.eq("key", org.plan))
            .first();

        return plan;
    },
});

// ============================================
// Seed (idempotent)
// ============================================

const SEED_PLANS = [
    {
        key: "FREE",
        name: "Free",
        description: "Pour tester Jokko.",
        maxAgents: 1,
        maxWhatsappChannels: 1,
        maxConversationsPerMonth: 1_000,
        maxTemplates: 5,
        historyDays: 30,
        monthlyPriceFCFA: 0,
        yearlyPriceFCFA: 0,
        yearlyMonthlyPriceFCFA: 0,
        features: [
            { label: "Boîte de réception unifiée", included: true },
            { label: "Tags & Notes de base", included: true },
        ],
        supportLevel: "Communauté",
        sortOrder: 0,
        isActive: true,
    },
    {
        key: "STARTER",
        name: "Starter",
        description: "Pour les solopreneurs qui se lancent.",
        maxAgents: 1,
        maxWhatsappChannels: 1,
        maxConversationsPerMonth: 1_000,
        maxTemplates: 5,
        historyDays: 30,
        monthlyPriceFCFA: 10_000,
        yearlyPriceFCFA: 96_000,
        yearlyMonthlyPriceFCFA: 8_000,
        features: [
            { label: "Boîte de réception unifiée", included: true },
            { label: "Tags & Notes de base", included: true },
            { label: "Envoi de médias", included: true },
            { label: "Réponses rapides", included: true },
            { label: "Chatbot", included: false },
            { label: "Marketing de masse", included: false },
        ],
        supportLevel: "Email",
        sortOrder: 1,
        isActive: true,
    },
    {
        key: "BUSINESS",
        name: "Business",
        description: "Pour les PME en croissance.",
        maxAgents: 5,
        maxWhatsappChannels: 3,
        maxConversationsPerMonth: 5_000,
        maxTemplates: 20,
        historyDays: UNLIMITED,
        monthlyPriceFCFA: 30_000,
        yearlyPriceFCFA: 288_000,
        yearlyMonthlyPriceFCFA: 24_000,
        features: [
            { label: "Marketing WhatsApp (hors coûts Meta)", included: true },
            { label: "Chatbot & Automatisation", included: true },
            { label: "Statistiques & Segments", included: true },
            { label: "Webhooks", included: true },
            { label: "Envoi de médias", included: true },
            { label: "IA Générative", included: false },
        ],
        supportLevel: "Prioritaire",
        popular: true,
        sortOrder: 2,
        isActive: true,
    },
    {
        key: "PRO",
        name: "Pro",
        description: "Pour les leaders du marché.",
        maxAgents: 20,
        maxWhatsappChannels: 10,
        maxConversationsPerMonth: 10_000,
        maxTemplates: UNLIMITED,
        historyDays: UNLIMITED,
        monthlyPriceFCFA: 70_000,
        yearlyPriceFCFA: 672_000,
        yearlyMonthlyPriceFCFA: 56_000,
        features: [
            { label: "Jokko AI (Assistant Intelligent)", included: true },
            { label: "Flux de conversation (Flows)", included: true },
            { label: "API & Intégrations", included: true },
            { label: "Webhooks", included: true },
            { label: "Marketing Avancé", included: true },
            { label: "Account Manager dédié", included: true },
        ],
        supportLevel: "Dédié 24/7",
        sortOrder: 3,
        isActive: true,
    },
    {
        key: "ENTERPRISE",
        name: "Enterprise",
        description: "Solution sur mesure pour les grandes entreprises.",
        maxAgents: UNLIMITED,
        maxWhatsappChannels: UNLIMITED,
        maxConversationsPerMonth: UNLIMITED,
        maxTemplates: UNLIMITED,
        historyDays: UNLIMITED,
        monthlyPriceFCFA: 0,
        yearlyPriceFCFA: 0,
        yearlyMonthlyPriceFCFA: 0,
        features: [
            { label: "Tout inclus", included: true },
            { label: "Support dédié", included: true },
            { label: "SLA garanti", included: true },
            { label: "Onboarding personnalisé", included: true },
        ],
        supportLevel: "Dédié 24/7 + SLA",
        sortOrder: 4,
        isActive: true,
    },
];

export const seedPlans = internalMutation({
    args: {},
    handler: async (ctx) => {
        for (const planData of SEED_PLANS) {
            const existing = await ctx.db
                .query("plans")
                .withIndex("by_key", (q) => q.eq("key", planData.key))
                .first();

            if (existing) {
                console.log(`[SEED] Plan "${planData.key}" already exists, updating...`);
                await ctx.db.patch(existing._id, planData);
            } else {
                console.log(`[SEED] Creating plan "${planData.key}"...`);
                await ctx.db.insert("plans", planData);
            }
        }
        console.log("[SEED] Plans seeded successfully.");
    },
});
