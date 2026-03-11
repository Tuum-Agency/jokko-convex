import { convexTest } from "convex-test";
import { describe, it, expect, beforeEach } from "vitest";
import { internal } from "./_generated/api";
import schema from "./schema";
import { modules } from "./test.modules";

describe("Migration", () => {
    let t: any;
    let userId: string;
    let orgId: string;

    beforeEach(async () => {
        t = convexTest(schema, modules);

        // Setup: user + org with legacy WhatsApp config
        const setup = await t.run(async (ctx: any) => {
            const uid = await ctx.db.insert("users", { email: "owner@test.com", name: "Owner" });
            const oid = await ctx.db.insert("organizations", {
                name: "Migrating Org",
                ownerId: uid,
                plan: "BUSINESS",
                whatsapp: {
                    phoneNumberId: "legacy_phone_123",
                    businessAccountId: "legacy_waba_456",
                    accessToken: "legacy_token",
                    webhookVerifyToken: "verify_abc",
                    displayPhoneNumber: "+221 77 000 00 01",
                    verifiedName: "Legacy Business",
                },
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });
            return { uid, oid };
        });

        userId = setup.uid;
        orgId = setup.oid;
    });

    it("should migrate org: create WABA + channel", async () => {
        const result = await t.mutation(internal.migration.migrateOrg, {
            organizationId: orgId,
            createdBy: userId,
        });

        expect(result.status).toBe("created");
        expect(result.wabaId).toBeDefined();
        expect(result.channelId).toBeDefined();

        // Verify WABA
        const waba = await t.run(async (ctx: any) => ctx.db.get(result.wabaId));
        expect(waba.metaBusinessAccountId).toBe("legacy_waba_456");
        expect(waba.organizationId).toBe(orgId);

        // Verify channel
        const channel = await t.run(async (ctx: any) => ctx.db.get(result.channelId));
        expect(channel.phoneNumberId).toBe("legacy_phone_123");
        expect(channel.isOrgDefault).toBe(true);
        expect(channel.status).toBe("active");
        expect(channel.displayPhoneNumber).toBe("+221 77 000 00 01");
    });

    it("should be idempotent (re-run does not duplicate)", async () => {
        const result1 = await t.mutation(internal.migration.migrateOrg, {
            organizationId: orgId,
            createdBy: userId,
        });

        const result2 = await t.mutation(internal.migration.migrateOrg, {
            organizationId: orgId,
            createdBy: userId,
        });

        expect(result1.wabaId).toBe(result2.wabaId);
        expect(result1.channelId).toBe(result2.channelId);
    });

    it("should skip org without WhatsApp config", async () => {
        const noWaOrgId = await t.run(async (ctx: any) => {
            return await ctx.db.insert("organizations", {
                name: "No WhatsApp Org",
                ownerId: userId,
                plan: "FREE",
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });
        });

        const result = await t.mutation(internal.migration.migrateOrg, {
            organizationId: noWaOrgId,
            createdBy: userId,
        });

        expect(result.status).toBe("skipped");
    });

    it("should backfill conversations", async () => {
        // First migrate org to get a channel
        const { channelId } = await t.mutation(internal.migration.migrateOrg, {
            organizationId: orgId,
            createdBy: userId,
        });

        // Create conversations without whatsappChannelId
        await t.run(async (ctx: any) => {
            for (let i = 0; i < 5; i++) {
                await ctx.db.insert("conversations", {
                    organizationId: orgId,
                    channel: "WHATSAPP",
                    status: "OPEN",
                    unreadCount: 0,
                    lastMessageAt: Date.now(),
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                });
            }
        });

        const result = await t.mutation(internal.migration.backfillConversations, {
            organizationId: orgId,
            channelId,
        });

        expect(result.updated).toBe(5);
        expect(result.done).toBe(true);
    });

    it("should backfill flows", async () => {
        const { channelId } = await t.mutation(internal.migration.migrateOrg, {
            organizationId: orgId,
            createdBy: userId,
        });

        await t.run(async (ctx: any) => {
            await ctx.db.insert("flows", {
                organizationId: orgId,
                name: "Welcome Flow",
                triggerType: "NEW_CONVERSATION",
                nodes: "[]",
                edges: "[]",
                isActive: true,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });
        });

        const result = await t.mutation(internal.migration.backfillFlows, {
            organizationId: orgId,
            channelId,
        });

        expect(result.updated).toBe(1);
    });

    it("should backfill broadcasts", async () => {
        const { channelId } = await t.mutation(internal.migration.migrateOrg, {
            organizationId: orgId,
            createdBy: userId,
        });

        // Need a template for broadcast
        const templateId = await t.run(async (ctx: any) => {
            return await ctx.db.insert("templates", {
                organizationId: orgId,
                name: "promo",
                slug: "promo",
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
        });

        await t.run(async (ctx: any) => {
            await ctx.db.insert("broadcasts", {
                organizationId: orgId,
                name: "Promo Campaign",
                templateId,
                audienceConfig: { type: "ALL" },
                status: "COMPLETED",
                sentCount: 100,
                deliveredCount: 90,
                readCount: 50,
                repliedCount: 10,
                failedCount: 5,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });
        });

        const result = await t.mutation(internal.migration.backfillBroadcasts, {
            organizationId: orgId,
            channelId,
        });

        expect(result.updated).toBe(1);
    });

    it("should report migration status", async () => {
        // Before migration
        let status = await t.query(internal.migration.getMigrationStatus, {
            organizationId: orgId,
        });

        expect(status.hasLegacyWhatsApp).toBe(true);
        expect(status.wabaCount).toBe(0);
        expect(status.channelCount).toBe(0);

        // After migration
        await t.mutation(internal.migration.migrateOrg, {
            organizationId: orgId,
            createdBy: userId,
        });

        status = await t.query(internal.migration.getMigrationStatus, {
            organizationId: orgId,
        });

        expect(status.wabaCount).toBe(1);
        expect(status.channelCount).toBe(1);
    });
});
