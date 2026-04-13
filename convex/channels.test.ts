import { convexTest } from "convex-test";
import { describe, it, expect, beforeEach } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";
import { modules } from "./test.modules";

describe("Channels", () => {
    let t: any;
    let userId: string;
    let orgId: string;
    let wabaId: string;

    beforeEach(async () => {
        t = convexTest(schema, modules);

        // Setup: user + org + membership + WABA
        const setup = await t.run(async (ctx: any) => {
            await ctx.db.insert("plans", {
                key: "BUSINESS",
                name: "Business",
                description: "Pour les PME en croissance.",
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
                name: "Test Org",
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
                metaBusinessAccountId: "waba_123",
                accessTokenRef: "enc_token_abc",
                label: "Main WABA",
                createdBy: uid,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });
            return { uid, oid, wid };
        });

        userId = setup.uid;
        orgId = setup.oid;
        wabaId = setup.wid;
    });

    it("should create a channel", async () => {
        const channelId = await t.withIdentity({ subject: userId }).mutation(api.channels.create, {
            organizationId: orgId,
            wabaId,
            label: "Support Line",
            phoneNumberId: "123456789",
            displayPhoneNumber: "+221 77 000 00 01",
        });

        expect(channelId).toBeDefined();

        const channel = await t.run(async (ctx: any) => {
            return await ctx.db.get(channelId);
        });

        expect(channel.label).toBe("Support Line");
        expect(channel.isOrgDefault).toBe(true); // First channel auto-becomes default
        expect(channel.status).toBe("active");
    });

    it("should list channels with WABA info", async () => {
        await t.withIdentity({ subject: userId }).mutation(api.channels.create, {
            organizationId: orgId,
            wabaId,
            label: "Channel 1",
            phoneNumberId: "phone_1",
            displayPhoneNumber: "+221 77 000 00 01",
        });
        await t.withIdentity({ subject: userId }).mutation(api.channels.create, {
            organizationId: orgId,
            wabaId,
            label: "Channel 2",
            phoneNumberId: "phone_2",
            displayPhoneNumber: "+221 77 000 00 02",
        });

        const channels = await t.withIdentity({ subject: userId }).query(api.channels.list, {
            organizationId: orgId,
        });

        expect(channels).toHaveLength(2);
        expect(channels[0].waba).toBeDefined();
        expect(channels[0].waba.metaBusinessAccountId).toBe("waba_123");
    });

    it("should enforce plan channel limits", async () => {
        // BUSINESS plan = 3 channels
        await t.withIdentity({ subject: userId }).mutation(api.channels.create, {
            organizationId: orgId,
            wabaId,
            label: "Ch 1",
            phoneNumberId: "p1",
            displayPhoneNumber: "+1",
        });
        await t.withIdentity({ subject: userId }).mutation(api.channels.create, {
            organizationId: orgId,
            wabaId,
            label: "Ch 2",
            phoneNumberId: "p2",
            displayPhoneNumber: "+2",
        });
        await t.withIdentity({ subject: userId }).mutation(api.channels.create, {
            organizationId: orgId,
            wabaId,
            label: "Ch 3",
            phoneNumberId: "p3",
            displayPhoneNumber: "+3",
        });

        // 4th channel should fail
        await expect(
            t.withIdentity({ subject: userId }).mutation(api.channels.create, {
                organizationId: orgId,
                wabaId,
                label: "Ch 4",
                phoneNumberId: "p4",
                displayPhoneNumber: "+4",
            })
        ).rejects.toThrow("Channel limit reached");
    });

    it("should reconnect existing channel on duplicate phone number", async () => {
        const ch1 = await t.withIdentity({ subject: userId }).mutation(api.channels.create, {
            organizationId: orgId,
            wabaId,
            label: "Ch 1",
            phoneNumberId: "same_phone",
            displayPhoneNumber: "+1",
        });

        // Creating with same phoneNumberId should reconnect (return existing ID)
        const ch2 = await t.withIdentity({ subject: userId }).mutation(api.channels.create, {
            organizationId: orgId,
            wabaId,
            label: "Ch 2",
            phoneNumberId: "same_phone",
            displayPhoneNumber: "+2",
        });

        expect(ch2).toBe(ch1);
    });

    it("should switch org default", async () => {
        const ch1 = await t.withIdentity({ subject: userId }).mutation(api.channels.create, {
            organizationId: orgId,
            wabaId,
            label: "Ch 1",
            phoneNumberId: "p1",
            displayPhoneNumber: "+1",
        });

        const ch2 = await t.withIdentity({ subject: userId }).mutation(api.channels.create, {
            organizationId: orgId,
            wabaId,
            label: "Ch 2",
            phoneNumberId: "p2",
            displayPhoneNumber: "+2",
        });

        // ch1 should be default (first created)
        let channel1 = await t.run(async (ctx: any) => ctx.db.get(ch1));
        expect(channel1.isOrgDefault).toBe(true);

        // Set ch2 as default
        await t.withIdentity({ subject: userId }).mutation(api.channels.setOrgDefault, { id: ch2 });

        channel1 = await t.run(async (ctx: any) => ctx.db.get(ch1));
        const channel2 = await t.run(async (ctx: any) => ctx.db.get(ch2));

        expect(channel1.isOrgDefault).toBe(false);
        expect(channel2.isOrgDefault).toBe(true);
    });

    it("should prevent disabling default channel", async () => {
        const ch1 = await t.withIdentity({ subject: userId }).mutation(api.channels.create, {
            organizationId: orgId,
            wabaId,
            label: "Default",
            phoneNumberId: "p1",
            displayPhoneNumber: "+1",
        });

        await expect(
            t.withIdentity({ subject: userId }).mutation(api.channels.disable, { id: ch1 })
        ).rejects.toThrow("Cannot disable the default channel");
    });

    it("should disable non-default channel", async () => {
        await t.withIdentity({ subject: userId }).mutation(api.channels.create, {
            organizationId: orgId,
            wabaId,
            label: "Default",
            phoneNumberId: "p1",
            displayPhoneNumber: "+1",
        });

        const ch2 = await t.withIdentity({ subject: userId }).mutation(api.channels.create, {
            organizationId: orgId,
            wabaId,
            label: "Secondary",
            phoneNumberId: "p2",
            displayPhoneNumber: "+2",
        });

        await t.withIdentity({ subject: userId }).mutation(api.channels.disable, { id: ch2 });

        const channel = await t.run(async (ctx: any) => ctx.db.get(ch2));
        expect(channel.status).toBe("disabled");
    });

    it("should enforce WABA org coherence", async () => {
        // Create another org's WABA
        const otherOrgSetup = await t.run(async (ctx: any) => {
            const uid2 = await ctx.db.insert("users", { email: "other@test.com", name: "Other" });
            const oid2 = await ctx.db.insert("organizations", {
                name: "Other Org",
                ownerId: uid2,
                plan: "BUSINESS",
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });
            const wid2 = await ctx.db.insert("wabas", {
                organizationId: oid2,
                metaBusinessAccountId: "waba_other",
                accessTokenRef: "enc_other",
                createdBy: uid2,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });
            return { wid2 };
        });

        await expect(
            t.withIdentity({ subject: userId }).mutation(api.channels.create, {
                organizationId: orgId,
                wabaId: otherOrgSetup.wid2,
                label: "Sneaky",
                phoneNumberId: "sneaky_phone",
                displayPhoneNumber: "+sneaky",
            })
        ).rejects.toThrow("WABA does not belong");
    });

    it("should get or create WABA idempotently", async () => {
        // First call creates
        const id1 = await t.mutation(internal.channels.getOrCreateWaba, {
            organizationId: orgId,
            metaBusinessAccountId: "new_waba_456",
            accessTokenRef: "enc_new",
            createdBy: userId,
            label: "New WABA",
        });

        // Second call returns same
        const id2 = await t.mutation(internal.channels.getOrCreateWaba, {
            organizationId: orgId,
            metaBusinessAccountId: "new_waba_456",
            accessTokenRef: "enc_new",
            createdBy: userId,
        });

        expect(id1).toBe(id2);
    });
});
