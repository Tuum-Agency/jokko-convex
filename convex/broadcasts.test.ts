import { convexTest } from "convex-test";
import { describe, it, expect, beforeEach } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./test.modules";

describe("Broadcasts", () => {
    let t: any;
    let userId: string;
    let orgId: string;
    let templateId: string;
    let tagId1: string;
    let tagId2: string;
    let contactIds: string[];

    beforeEach(async () => {
        t = convexTest(schema, modules);

        // Create owner user
        userId = await t.run(async (ctx: any) => {
            return await ctx.db.insert("users", { email: "owner@test.com", name: "Owner" });
        });

        // Create organization
        orgId = await t.run(async (ctx: any) => {
            return await ctx.db.insert("organizations", {
                name: "Test Org",
                ownerId: userId,
                plan: "BUSINESS",
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });
        });

        // Create membership and userSession
        await t.run(async (ctx: any) => {
            await ctx.db.insert("memberships", {
                userId,
                organizationId: orgId,
                role: "OWNER",
                status: "ONLINE",
                maxConversations: 10,
                activeConversations: 0,
                lastSeenAt: Date.now(),
                joinedAt: Date.now(),
            });
            await ctx.db.insert("userSessions", {
                userId,
                currentOrganizationId: orgId,
                lastActivityAt: Date.now(),
            });
        });

        // Create tags
        const tags = await t.run(async (ctx: any) => {
            const t1 = await ctx.db.insert("tags", {
                organizationId: orgId,
                name: "VIP",
                createdAt: Date.now(),
            });
            const t2 = await ctx.db.insert("tags", {
                organizationId: orgId,
                name: "Prospect",
                createdAt: Date.now(),
            });
            return { tagId1: t1, tagId2: t2 };
        });
        tagId1 = tags.tagId1;
        tagId2 = tags.tagId2;

        // Create template with all required fields
        templateId = await t.run(async (ctx: any) => {
            return await ctx.db.insert("templates", {
                organizationId: orgId,
                name: "Welcome Template",
                slug: "welcome",
                type: "MARKETING",
                category: "MARKETING",
                language: "fr",
                status: "APPROVED",
                body: "Hello {{1}}",
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

        // Create 5 contacts
        contactIds = await t.run(async (ctx: any) => {
            const c1 = await ctx.db.insert("contacts", {
                organizationId: orgId,
                phone: "+221701234567",
                name: "Mamadou",
                searchName: "mamadou +221701234567",
                tags: [tagId1],
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });
            const c2 = await ctx.db.insert("contacts", {
                organizationId: orgId,
                phone: "+221709876543",
                name: "Fatou",
                searchName: "fatou +221709876543",
                tags: [tagId1, tagId2],
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });
            const c3 = await ctx.db.insert("contacts", {
                organizationId: orgId,
                phone: "+33612345678",
                name: "Pierre",
                searchName: "pierre +33612345678",
                tags: [tagId2],
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });
            const c4 = await ctx.db.insert("contacts", {
                organizationId: orgId,
                phone: "+33698765432",
                name: "Marie",
                searchName: "marie +33698765432",
                tags: [],
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });
            const c5 = await ctx.db.insert("contacts", {
                organizationId: orgId,
                phone: "+1234567890",
                name: "John",
                searchName: "john +1234567890",
                tags: [tagId1],
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });
            return [c1, c2, c3, c4, c5];
        });
    });

    // ============================================
    // list
    // ============================================
    describe("list", () => {
        it("should return broadcasts for organization", async () => {
            await t.withIdentity({ subject: userId }).mutation(api.broadcasts.create, {
                name: "Campaign Alpha",
                templateId,
                audienceConfig: { type: "ALL" as const },
            });

            const result = await t.withIdentity({ subject: userId }).query(api.broadcasts.list, {});

            expect(result).toHaveLength(1);
            expect(result[0].name).toBe("Campaign Alpha");
            expect(result[0].templateName).toBe("Welcome Template");
        });

        it("should filter by search term", async () => {
            await t.withIdentity({ subject: userId }).mutation(api.broadcasts.create, {
                name: "Campaign Alpha",
                templateId,
                audienceConfig: { type: "ALL" as const },
            });
            await t.withIdentity({ subject: userId }).mutation(api.broadcasts.create, {
                name: "Campaign Beta",
                templateId,
                audienceConfig: { type: "ALL" as const },
            });

            const result = await t.withIdentity({ subject: userId }).query(api.broadcasts.list, {
                search: "Alpha",
            });

            expect(result).toHaveLength(1);
            expect(result[0].name).toBe("Campaign Alpha");
        });

        it("should return enriched channel name", async () => {
            // Create WABA first (required by whatsappChannels)
            const wabaId = await t.run(async (ctx: any) => {
                return await ctx.db.insert("wabas", {
                    organizationId: orgId,
                    metaBusinessAccountId: "meta-123",
                    accessTokenRef: "token-ref",
                    label: "Test WABA",
                    createdBy: userId,
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                });
            });

            const channelId = await t.run(async (ctx: any) => {
                return await ctx.db.insert("whatsappChannels", {
                    organizationId: orgId,
                    wabaId,
                    label: "Jokko Support",
                    phoneNumberId: "phone-123",
                    displayPhoneNumber: "+221771234567",
                    webhookVerifyTokenRef: "verify-ref",
                    isOrgDefault: true,
                    status: "active" as const,
                    createdBy: userId,
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                });
            });

            await t.withIdentity({ subject: userId }).mutation(api.broadcasts.create, {
                name: "Channel Campaign",
                templateId,
                audienceConfig: { type: "ALL" as const },
                whatsappChannelId: channelId,
            });

            const result = await t.withIdentity({ subject: userId }).query(api.broadcasts.list, {});

            expect(result).toHaveLength(1);
            expect(result[0].channelName).toBe("Jokko Support");
        });
    });

    // ============================================
    // get
    // ============================================
    describe("get", () => {
        it("should return broadcast with template and totalAudience", async () => {
            const broadcastId = await t.withIdentity({ subject: userId }).mutation(api.broadcasts.create, {
                name: "Full Audience",
                templateId,
                audienceConfig: { type: "ALL" as const },
            });

            const result = await t.withIdentity({ subject: userId }).query(api.broadcasts.get, {
                id: broadcastId,
            });

            expect(result).not.toBeNull();
            expect(result!.name).toBe("Full Audience");
            expect(result!.template).not.toBeNull();
            expect(result!.template!.name).toBe("Welcome Template");
            expect(result!.totalAudience).toBe(5);
        });

        it("should return null for non-existent broadcast", async () => {
            // Create a broadcast then delete it to get a valid-shaped but non-existent ID
            const broadcastId = await t.withIdentity({ subject: userId }).mutation(api.broadcasts.create, {
                name: "Temp",
                templateId,
                audienceConfig: { type: "ALL" as const },
            });
            await t.withIdentity({ subject: userId }).mutation(api.broadcasts.deleteBroadcast, {
                id: broadcastId,
            });

            const result = await t.withIdentity({ subject: userId }).query(api.broadcasts.get, {
                id: broadcastId,
            });

            expect(result).toBeNull();
        });
    });

    // ============================================
    // create
    // ============================================
    describe("create", () => {
        it("should create a draft broadcast", async () => {
            const broadcastId = await t.withIdentity({ subject: userId }).mutation(api.broadcasts.create, {
                name: "Draft Campaign",
                templateId,
                audienceConfig: { type: "ALL" as const },
            });

            const broadcast = await t.run(async (ctx: any) => ctx.db.get(broadcastId));

            expect(broadcast).not.toBeNull();
            expect(broadcast.name).toBe("Draft Campaign");
            expect(broadcast.status).toBe("DRAFT");
            expect(broadcast.sentCount).toBe(0);
            expect(broadcast.deliveredCount).toBe(0);
            expect(broadcast.readCount).toBe(0);
            expect(broadcast.repliedCount).toBe(0);
            expect(broadcast.failedCount).toBe(0);
        });

        it("should create scheduled broadcast", async () => {
            const scheduledAt = Date.now() + 86400000; // Tomorrow
            const broadcastId = await t.withIdentity({ subject: userId }).mutation(api.broadcasts.create, {
                name: "Scheduled Campaign",
                templateId,
                scheduledAt,
                audienceConfig: { type: "ALL" as const },
            });

            const broadcast = await t.run(async (ctx: any) => ctx.db.get(broadcastId));

            expect(broadcast.status).toBe("SCHEDULED");
            expect(broadcast.scheduledAt).toBe(scheduledAt);
        });

        it("should throw for non-admin user", async () => {
            const agentId = await t.run(async (ctx: any) => {
                const aId = await ctx.db.insert("users", { email: "agent@test.com", name: "Agent" });
                await ctx.db.insert("memberships", {
                    userId: aId,
                    organizationId: orgId,
                    role: "AGENT",
                    status: "ONLINE",
                    maxConversations: 5,
                    activeConversations: 0,
                    lastSeenAt: Date.now(),
                    joinedAt: Date.now(),
                });
                await ctx.db.insert("userSessions", {
                    userId: aId,
                    currentOrganizationId: orgId,
                    lastActivityAt: Date.now(),
                });
                return aId;
            });

            await expect(
                t.withIdentity({ subject: agentId }).mutation(api.broadcasts.create, {
                    name: "Unauthorized Campaign",
                    templateId,
                    audienceConfig: { type: "ALL" as const },
                })
            ).rejects.toThrow("Permission refusée");
        });
    });

    // ============================================
    // estimateAudience
    // ============================================
    describe("estimateAudience", () => {
        it("should count ALL contacts", async () => {
            const result = await t.withIdentity({ subject: userId }).query(api.broadcasts.estimateAudience, {
                audienceConfig: { type: "ALL" as const },
            });

            expect(result.count).toBe(5);
        });

        it("should count by TAGS", async () => {
            const result = await t.withIdentity({ subject: userId }).query(api.broadcasts.estimateAudience, {
                audienceConfig: { type: "TAGS" as const, tags: [tagId1] },
            });

            // Mamadou (tagId1), Fatou (tagId1, tagId2), John (tagId1)
            expect(result.count).toBe(3);
        });

        it("should count by COUNTRIES", async () => {
            const result = await t.withIdentity({ subject: userId }).query(api.broadcasts.estimateAudience, {
                audienceConfig: { type: "COUNTRIES" as const, countries: ["+221"] },
            });

            // Mamadou (+221...), Fatou (+221...)
            expect(result.count).toBe(2);
        });

        it("should return 0 for empty tag filter", async () => {
            // Create a non-existent tag ID by inserting and deleting
            const fakeTagId = await t.run(async (ctx: any) => {
                const id = await ctx.db.insert("tags", {
                    organizationId: orgId,
                    name: "Temp",
                    createdAt: Date.now(),
                });
                await ctx.db.delete(id);
                return id;
            });

            const result = await t.withIdentity({ subject: userId }).query(api.broadcasts.estimateAudience, {
                audienceConfig: { type: "TAGS" as const, tags: [fakeTagId] },
            });

            expect(result.count).toBe(0);
        });
    });

    // ============================================
    // duplicate
    // ============================================
    describe("duplicate", () => {
        it("should duplicate broadcast as draft with reset stats", async () => {
            const originalId = await t.withIdentity({ subject: userId }).mutation(api.broadcasts.create, {
                name: "Original Campaign",
                templateId,
                audienceConfig: { type: "TAGS" as const, tags: [tagId1] },
            });

            // Manually patch some stats to simulate a sent broadcast
            await t.run(async (ctx: any) => {
                await ctx.db.patch(originalId, {
                    status: "COMPLETED",
                    sentCount: 100,
                    deliveredCount: 95,
                    readCount: 50,
                    repliedCount: 10,
                    failedCount: 5,
                });
            });

            const duplicateId = await t.withIdentity({ subject: userId }).mutation(api.broadcasts.duplicate, {
                id: originalId,
            });

            const duplicate = await t.run(async (ctx: any) => ctx.db.get(duplicateId));

            expect(duplicate.name).toBe("Original Campaign (Copie)");
            expect(duplicate.status).toBe("DRAFT");
            expect(duplicate.sentCount).toBe(0);
            expect(duplicate.deliveredCount).toBe(0);
            expect(duplicate.readCount).toBe(0);
            expect(duplicate.repliedCount).toBe(0);
            expect(duplicate.failedCount).toBe(0);
            expect(duplicate.templateId).toBe(templateId);
            expect(duplicate.audienceConfig.type).toBe("TAGS");
        });
    });

    // ============================================
    // deleteBroadcast
    // ============================================
    describe("deleteBroadcast", () => {
        it("should delete broadcast", async () => {
            const broadcastId = await t.withIdentity({ subject: userId }).mutation(api.broadcasts.create, {
                name: "To Delete",
                templateId,
                audienceConfig: { type: "ALL" as const },
            });

            await t.withIdentity({ subject: userId }).mutation(api.broadcasts.deleteBroadcast, {
                id: broadcastId,
            });

            const broadcast = await t.run(async (ctx: any) => ctx.db.get(broadcastId));
            expect(broadcast).toBeNull();
        });

        it("should throw for non-admin", async () => {
            const broadcastId = await t.withIdentity({ subject: userId }).mutation(api.broadcasts.create, {
                name: "Protected",
                templateId,
                audienceConfig: { type: "ALL" as const },
            });

            const agentId = await t.run(async (ctx: any) => {
                const aId = await ctx.db.insert("users", { email: "agent@test.com", name: "Agent" });
                await ctx.db.insert("memberships", {
                    userId: aId,
                    organizationId: orgId,
                    role: "AGENT",
                    status: "ONLINE",
                    maxConversations: 5,
                    activeConversations: 0,
                    lastSeenAt: Date.now(),
                    joinedAt: Date.now(),
                });
                await ctx.db.insert("userSessions", {
                    userId: aId,
                    currentOrganizationId: orgId,
                    lastActivityAt: Date.now(),
                });
                return aId;
            });

            await expect(
                t.withIdentity({ subject: agentId }).mutation(api.broadcasts.deleteBroadcast, {
                    id: broadcastId,
                })
            ).rejects.toThrow();
        });
    });

    // ============================================
    // archiveBroadcast
    // ============================================
    describe("archiveBroadcast", () => {
        it("should archive broadcast", async () => {
            const broadcastId = await t.withIdentity({ subject: userId }).mutation(api.broadcasts.create, {
                name: "To Archive",
                templateId,
                audienceConfig: { type: "ALL" as const },
            });

            await t.withIdentity({ subject: userId }).mutation(api.broadcasts.archiveBroadcast, {
                id: broadcastId,
            });

            const broadcast = await t.run(async (ctx: any) => ctx.db.get(broadcastId));
            expect(broadcast.status).toBe("CANCELLED");
        });
    });

    // ============================================
    // getActivity
    // ============================================
    describe("getActivity", () => {
        it("should return creation event", async () => {
            const broadcastId = await t.withIdentity({ subject: userId }).mutation(api.broadcasts.create, {
                name: "Activity Test",
                templateId,
                audienceConfig: { type: "ALL" as const },
            });

            const result = await t.withIdentity({ subject: userId }).query(api.broadcasts.getActivity, {
                broadcastId,
            });

            expect(result.activities.length).toBeGreaterThanOrEqual(1);
            const createdEvent = result.activities.find((a: any) => a.type === "created");
            expect(createdEvent).toBeDefined();
        });
    });

    // ============================================
    // exportBroadcasts
    // ============================================
    describe("exportBroadcasts", () => {
        it("should export broadcasts as flat objects", async () => {
            await t.withIdentity({ subject: userId }).mutation(api.broadcasts.create, {
                name: "Export Campaign 1",
                templateId,
                audienceConfig: { type: "ALL" as const },
            });
            await t.withIdentity({ subject: userId }).mutation(api.broadcasts.create, {
                name: "Export Campaign 2",
                templateId,
                audienceConfig: { type: "TAGS" as const, tags: [tagId1] },
            });

            const result = await t.withIdentity({ subject: userId }).query(api.broadcasts.exportBroadcasts, {});

            expect(result).toHaveLength(2);

            // Verify flat object shape
            for (const item of result) {
                expect(item).toHaveProperty("name");
                expect(item).toHaveProperty("templateName");
                expect(item).toHaveProperty("status");
                expect(item).toHaveProperty("sentCount");
                expect(item).toHaveProperty("deliveredCount");
                expect(item).toHaveProperty("readCount");
                expect(item).toHaveProperty("repliedCount");
                expect(item).toHaveProperty("failedCount");
                expect(item).toHaveProperty("createdAt");
                expect(item).toHaveProperty("completedAt");
                expect(item.templateName).toBe("Welcome Template");
                expect(item.status).toBe("DRAFT");
                expect(item.sentCount).toBe(0);
            }
        });
    });
});
