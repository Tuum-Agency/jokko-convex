import { convexTest } from "convex-test";
import { describe, it, expect } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./test.modules";
import {
    planIncludesFeature,
    planRank,
    minPlanForFeature,
    FEATURE_MIN_PLAN,
    PLAN_ORDER,
    type PlanKey,
    type PlanFeature,
} from "@jokko/core/planFeatures";

/**
 * Tests exhaustifs du feature gating plan × features × mutations.
 *
 * Matrix testée :
 *   Plans : FREE, STARTER, BUSINESS, PRO, ENTERPRISE
 *   Features : flows, broadcasts, integrations_crm, ai
 *   Mutations : flows.create, flows.createFromAI, broadcasts.create
 */

/** Seed complet : plans + user OWNER + org au plan donné + session + WABA/canal actif. */
async function seedOrgWithPlan(t: any, plan: PlanKey) {
    return await t.run(async (ctx: any) => {
        // Table plans (nécessaire pour les quotas qui sont vérifiés en amont)
        const existing = await ctx.db.query("plans").collect();
        if (existing.length === 0) {
            for (const key of PLAN_ORDER) {
                await ctx.db.insert("plans", {
                    key,
                    name: key,
                    description: key,
                    maxAgents: key === "FREE" ? 1 : key === "STARTER" ? 2 : 10,
                    maxWhatsappChannels: key === "FREE" ? 1 : key === "STARTER" ? 1 : 3,
                    maxConversationsPerMonth: 100000,
                    maxTemplates: 100,
                    historyDays: -1,
                    monthlyPriceFCFA: 0,
                    yearlyPriceFCFA: 0,
                    yearlyMonthlyPriceFCFA: 0,
                    features: [],
                    supportLevel: "Communauté",
                    sortOrder: PLAN_ORDER.indexOf(key),
                    isActive: true,
                });
            }
        }

        const uid = await ctx.db.insert("users", {
            email: `owner-${plan}@test.com`,
            name: `Owner ${plan}`,
        });
        const oid = await ctx.db.insert("organizations", {
            name: `Org ${plan}`,
            ownerId: uid,
            plan,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
        await ctx.db.insert("memberships", {
            userId: uid,
            organizationId: oid,
            role: "OWNER",
            status: "ONLINE",
            maxConversations: 10,
            activeConversations: 0,
            lastSeenAt: Date.now(),
            joinedAt: Date.now(),
        });
        await ctx.db.insert("userSessions", {
            userId: uid,
            currentOrganizationId: oid,
            lastActivityAt: Date.now(),
        });

        const wid = await ctx.db.insert("wabas", {
            organizationId: oid,
            metaBusinessAccountId: `meta-${plan}`,
            accessTokenRef: `token-${plan}`,
            label: "WABA",
            createdBy: uid,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
        await ctx.db.insert("whatsappChannels", {
            organizationId: oid,
            wabaId: wid,
            label: "Default",
            phoneNumberId: `phone-${plan}`,
            displayPhoneNumber: "+221770000000",
            webhookVerifyTokenRef: `verify-${plan}`,
            isOrgDefault: true,
            status: "active",
            createdBy: uid,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        // Template pour tests broadcasts
        const tplId = await ctx.db.insert("templates", {
            organizationId: oid,
            name: `tpl-${plan}`,
            slug: `tpl-${plan}`,
            type: "TEXT",
            category: "MARKETING",
            language: "fr",
            status: "APPROVED",
            sentCount: 0,
            deliveredCount: 0,
            readCount: 0,
            repliedCount: 0,
            clickedCount: 0,
            convertedCount: 0,
            failedCount: 0,
            blockedCount: 0,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        return { uid, oid, tplId };
    });
}

describe("Plan features — helpers purs", () => {
    it("respecte la hiérarchie PLAN_ORDER", () => {
        expect(planRank("FREE")).toBe(0);
        expect(planRank("STARTER")).toBe(1);
        expect(planRank("BUSINESS")).toBe(2);
        expect(planRank("PRO")).toBe(3);
        expect(planRank("ENTERPRISE")).toBe(4);
        expect(planRank("UNKNOWN" as any)).toBe(-1);
    });

    it("planIncludesFeature — matrice complète", () => {
        // flows requiert BUSINESS+
        expect(planIncludesFeature("FREE", "flows")).toBe(false);
        expect(planIncludesFeature("STARTER", "flows")).toBe(false);
        expect(planIncludesFeature("BUSINESS", "flows")).toBe(true);
        expect(planIncludesFeature("PRO", "flows")).toBe(true);
        expect(planIncludesFeature("ENTERPRISE", "flows")).toBe(true);

        // broadcasts requiert BUSINESS+
        expect(planIncludesFeature("FREE", "broadcasts")).toBe(false);
        expect(planIncludesFeature("STARTER", "broadcasts")).toBe(false);
        expect(planIncludesFeature("BUSINESS", "broadcasts")).toBe(true);
        expect(planIncludesFeature("PRO", "broadcasts")).toBe(true);

        // integrations_crm requiert PRO+
        expect(planIncludesFeature("FREE", "integrations_crm")).toBe(false);
        expect(planIncludesFeature("STARTER", "integrations_crm")).toBe(false);
        expect(planIncludesFeature("BUSINESS", "integrations_crm")).toBe(false);
        expect(planIncludesFeature("PRO", "integrations_crm")).toBe(true);
        expect(planIncludesFeature("ENTERPRISE", "integrations_crm")).toBe(true);

        // ai requiert PRO+
        expect(planIncludesFeature("FREE", "ai")).toBe(false);
        expect(planIncludesFeature("BUSINESS", "ai")).toBe(false);
        expect(planIncludesFeature("PRO", "ai")).toBe(true);
    });

    it("plan inconnu → false pour toutes les features", () => {
        const features: PlanFeature[] = [
            "flows",
            "broadcasts",
            "segments",
            "webhooks",
            "integrations_crm",
            "ai",
            "analytics_advanced",
        ];
        for (const f of features) {
            expect(planIncludesFeature("GARBAGE", f)).toBe(false);
        }
    });

    it("minPlanForFeature retourne les constantes attendues", () => {
        expect(minPlanForFeature("flows")).toBe("BUSINESS");
        expect(minPlanForFeature("broadcasts")).toBe("BUSINESS");
        expect(minPlanForFeature("integrations_crm")).toBe("PRO");
        expect(minPlanForFeature("ai")).toBe("PRO");
    });
});

describe("Plan features — flows.create bloqué par plan", () => {
    const blockedPlans: PlanKey[] = ["FREE", "STARTER"];
    const allowedPlans: PlanKey[] = ["BUSINESS", "PRO", "ENTERPRISE"];

    for (const plan of blockedPlans) {
        it(`REJETTE flows.create pour plan ${plan}`, async () => {
            const t = convexTest(schema, modules);
            const { uid } = await seedOrgWithPlan(t, plan);

            await expect(
                t.withIdentity({ subject: uid }).mutation(api.flows.create, {
                    name: "Welcome Flow",
                    triggerType: "NEW_CONVERSATION",
                }),
            ).rejects.toThrow(/Fonctionnalité réservée au plan BUSINESS/);
        });
    }

    for (const plan of allowedPlans) {
        it(`AUTORISE flows.create pour plan ${plan}`, async () => {
            const t = convexTest(schema, modules);
            const { uid } = await seedOrgWithPlan(t, plan);

            const flowId = await t
                .withIdentity({ subject: uid })
                .mutation(api.flows.create, {
                    name: "Welcome Flow",
                    triggerType: "NEW_CONVERSATION",
                });
            expect(flowId).toBeDefined();
        });
    }
});

describe("Plan features — flows.createFromAI requiert ai ET flows", () => {
    // AI est PRO+ donc plus restrictif que flows (BUSINESS+). BUSINESS doit échouer.
    const blockedPlans: PlanKey[] = ["FREE", "STARTER", "BUSINESS"];
    const allowedPlans: PlanKey[] = ["PRO", "ENTERPRISE"];

    for (const plan of blockedPlans) {
        it(`REJETTE createFromAI pour plan ${plan}`, async () => {
            const t = convexTest(schema, modules);
            const { uid } = await seedOrgWithPlan(t, plan);

            await expect(
                t.withIdentity({ subject: uid }).mutation(api.flows.createFromAI, {
                    name: "AI Flow",
                    triggerType: "NEW_CONVERSATION",
                    nodes: "[]",
                    edges: "[]",
                }),
            ).rejects.toThrow(/Fonctionnalité réservée/);
        });
    }

    for (const plan of allowedPlans) {
        it(`AUTORISE createFromAI pour plan ${plan}`, async () => {
            const t = convexTest(schema, modules);
            const { uid } = await seedOrgWithPlan(t, plan);

            const flowId = await t
                .withIdentity({ subject: uid })
                .mutation(api.flows.createFromAI, {
                    name: "AI Flow",
                    triggerType: "NEW_CONVERSATION",
                    nodes: "[]",
                    edges: "[]",
                });
            expect(flowId).toBeDefined();
        });
    }
});

describe("Plan features — broadcasts.create bloqué par plan", () => {
    const blockedPlans: PlanKey[] = ["FREE", "STARTER"];
    const allowedPlans: PlanKey[] = ["BUSINESS", "PRO", "ENTERPRISE"];

    for (const plan of blockedPlans) {
        it(`REJETTE broadcasts.create pour plan ${plan}`, async () => {
            const t = convexTest(schema, modules);
            const { uid, tplId } = await seedOrgWithPlan(t, plan);

            await expect(
                t.withIdentity({ subject: uid }).mutation(api.broadcasts.create, {
                    name: "Promo",
                    templateId: tplId as any,
                    audienceConfig: { type: "ALL" },
                }),
            ).rejects.toThrow(/Fonctionnalité réservée au plan BUSINESS/);
        });
    }

    for (const plan of allowedPlans) {
        it(`AUTORISE broadcasts.create pour plan ${plan}`, async () => {
            const t = convexTest(schema, modules);
            const { uid, tplId } = await seedOrgWithPlan(t, plan);

            const bid = await t
                .withIdentity({ subject: uid })
                .mutation(api.broadcasts.create, {
                    name: "Promo",
                    templateId: tplId as any,
                    audienceConfig: { type: "ALL" },
                });
            expect(bid).toBeDefined();
        });
    }
});
