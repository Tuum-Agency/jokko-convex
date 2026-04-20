import { convexTest } from "convex-test";
import { describe, it, expect, beforeEach } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./test.modules";

/**
 * Régression : updateOrgPlan doit déclencher enforceChannelDowngrade
 * quand le plan choisi a moins de canaux autorisés que le plan courant.
 */
describe("Organizations — updateOrgPlan cascade", () => {
    let t: any;
    let userId: string;
    let orgId: string;
    let channelA: string;
    let channelB: string;

    beforeEach(async () => {
        t = convexTest(schema, modules);

        const setup = await t.run(async (ctx: any) => {
            // Seed plans : FREE (1 channel) + BUSINESS (3 channels)
            await ctx.db.insert("plans", {
                key: "FREE",
                name: "Free",
                description: "Plan gratuit",
                maxAgents: 1,
                maxWhatsappChannels: 1,
                maxConversationsPerMonth: 1000,
                maxTemplates: 5,
                historyDays: 30,
                monthlyPriceFCFA: 0,
                yearlyPriceFCFA: 0,
                yearlyMonthlyPriceFCFA: 0,
                features: [],
                supportLevel: "Communauté",
                sortOrder: 0,
                isActive: true,
            });
            await ctx.db.insert("plans", {
                key: "BUSINESS",
                name: "Business",
                description: "Plan Business",
                maxAgents: 5,
                maxWhatsappChannels: 3,
                maxConversationsPerMonth: 5000,
                maxTemplates: 20,
                historyDays: -1,
                monthlyPriceFCFA: 30000,
                yearlyPriceFCFA: 288000,
                yearlyMonthlyPriceFCFA: 24000,
                features: [],
                supportLevel: "Prioritaire",
                sortOrder: 2,
                isActive: true,
            });

            const uid = await ctx.db.insert("users", { email: "owner@test.com", name: "Owner" });
            const oid = await ctx.db.insert("organizations", {
                name: "Cascade Org",
                ownerId: uid,
                plan: "BUSINESS",
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
                metaBusinessAccountId: "waba_cascade",
                accessTokenRef: "token_cascade",
                label: "WABA",
                createdBy: uid,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });

            // 2 canaux actifs — sous BUSINESS (3 autorisés) mais over FREE (1)
            const cA = await ctx.db.insert("whatsappChannels", {
                organizationId: oid,
                wabaId: wid,
                label: "Primary",
                phoneNumberId: "phone_A",
                displayPhoneNumber: "+221 77 000 00 01",
                webhookVerifyTokenRef: "verify_A",
                isOrgDefault: true,
                status: "active",
                createdBy: uid,
                createdAt: 1000,
                updatedAt: 1000,
            });
            const cB = await ctx.db.insert("whatsappChannels", {
                organizationId: oid,
                wabaId: wid,
                label: "Secondary",
                phoneNumberId: "phone_B",
                displayPhoneNumber: "+221 77 000 00 02",
                webhookVerifyTokenRef: "verify_B",
                isOrgDefault: false,
                status: "active",
                createdBy: uid,
                createdAt: 2000,
                updatedAt: 2000,
            });

            return { uid, oid, cA, cB };
        });

        userId = setup.uid;
        orgId = setup.oid;
        channelA = setup.cA;
        channelB = setup.cB;
    });

    it("désactive les canaux excédentaires lors d'un downgrade BUSINESS→FREE", async () => {
        await t.withIdentity({ subject: userId }).mutation(api.organizations.updateOrgPlan, {
            plan: "FREE",
        });

        const channels = await t.run(async (ctx: any) => {
            const chA = await ctx.db.get(channelA);
            const chB = await ctx.db.get(channelB);
            return { chA, chB };
        });

        // Canal default (plus ancien) gardé actif
        expect(channels.chA.status).toBe("active");
        expect(channels.chA.isOrgDefault).toBe(true);

        // Canal secondaire désactivé avec la raison plan_downgrade
        expect(channels.chB.status).toBe("disabled");
        expect(channels.chB.disabledReason).toBe("plan_downgrade");
        expect(channels.chB.isOrgDefault).toBe(false);
    });

    it("notifie l'OWNER après la cascade", async () => {
        await t.withIdentity({ subject: userId }).mutation(api.organizations.updateOrgPlan, {
            plan: "FREE",
        });

        const notifications = await t.run(async (ctx: any) =>
            ctx.db
                .query("notifications")
                .withIndex("by_user", (q: any) => q.eq("userId", userId))
                .collect(),
        );

        const downgradeNotif = notifications.find((n: any) => n.type === "PLAN_DOWNGRADE");
        expect(downgradeNotif).toBeDefined();
        expect(downgradeNotif.metadata.newPlan).toBe("FREE");
        expect(downgradeNotif.metadata.maxChannels).toBe(1);
    });

    it("ne touche à rien quand upgrade FREE→BUSINESS (pas de cascade)", async () => {
        // Repasse l'org en FREE pour partir d'un état propre
        await t.run(async (ctx: any) => {
            await ctx.db.patch(orgId as any, { plan: "FREE" });
            // Désactive B pour aligner avec FREE
            await ctx.db.patch(channelB as any, { status: "disabled" });
        });

        await t.withIdentity({ subject: userId }).mutation(api.organizations.updateOrgPlan, {
            plan: "BUSINESS",
        });

        const channels = await t.run(async (ctx: any) => {
            const chA = await ctx.db.get(channelA);
            const chB = await ctx.db.get(channelB);
            return { chA, chB };
        });

        // Canal A reste actif, canal B reste disabled (on ne réactive pas)
        expect(channels.chA.status).toBe("active");
        expect(channels.chB.status).toBe("disabled");
    });
});
