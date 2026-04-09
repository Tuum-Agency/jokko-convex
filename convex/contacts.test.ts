import { convexTest } from "convex-test";
import { describe, it, expect, beforeEach } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./test.modules";

describe("Contacts", () => {
    let t: any;

    beforeEach(async () => {
        t = convexTest(schema, modules);
    });

    it("should create contacts in batch", async () => {
        // 1. Setup: create user, org, membership, and session
        const { userId } = await t.run(async (ctx: any) => {
            const userId = await ctx.db.insert("users", { email: "test@example.com", name: "Test User" });
            const orgId = await ctx.db.insert("organizations", {
                name: "Test Org",
                slug: "test-org",
                ownerId: userId,
                plan: "BUSINESS",
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });
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
            return { userId, orgId };
        });

        // 2. Call batchCreate
        const contactsData = [
            { phone: "+221770000001", firstName: "Import", lastName: "One", tags: ["Imported"] },
            { phone: "+221770000002", firstName: "Import", lastName: "Two", tags: ["Imported", "VIP"] }
        ];

        const result = await t.withIdentity({ subject: userId }).mutation(api.contacts.batchCreate, {
            contacts: contactsData
        });

        // 3. Verify Result
        expect(result.created).toBe(2);
        expect(result.errors).toHaveLength(0);

        // 4. Verify Database
        const contacts = await t.withIdentity({ subject: userId }).query(api.contacts.list, {
            paginationOpts: { numItems: 10, cursor: null }
        });

        expect(contacts.page).toHaveLength(2);
        expect(contacts.page[0].firstName).toBe("Import");
        expect(contacts.page[0].tags[0].name).toBe("Imported");
    });

    // ============================================
    // DETECT DUPLICATES
    // ============================================
    describe("detectDuplicates", () => {
        it("should return empty when no duplicates exist", async () => {
            const { userId } = await t.run(async (ctx: any) => {
                const userId = await ctx.db.insert("users", { email: "dup@example.com", name: "Dup User" });
                const orgId = await ctx.db.insert("organizations", {
                    name: "Dup Org",
                    slug: "dup-org",
                    ownerId: userId,
                    plan: "BUSINESS",
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                });
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
                // Two contacts with different phones and names
                await ctx.db.insert("contacts", {
                    organizationId: orgId,
                    phone: "+221770000001",
                    name: "Alice",
                    searchName: "alice +221770000001",
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                });
                await ctx.db.insert("contacts", {
                    organizationId: orgId,
                    phone: "+221780000002",
                    name: "Bob",
                    searchName: "bob +221780000002",
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                });
                return { userId };
            });

            const result = await t.withIdentity({ subject: userId }).query(api.contacts.detectDuplicates, {});
            expect(result).toHaveLength(0);
        });

        it("should detect duplicates by phone number (same last 9 digits)", async () => {
            const { userId } = await t.run(async (ctx: any) => {
                const userId = await ctx.db.insert("users", { email: "dup2@example.com", name: "Dup User 2" });
                const orgId = await ctx.db.insert("organizations", {
                    name: "Dup Org 2",
                    slug: "dup-org-2",
                    ownerId: userId,
                    plan: "BUSINESS",
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                });
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
                // Two contacts with same last 9 digits but different prefix
                await ctx.db.insert("contacts", {
                    organizationId: orgId,
                    phone: "+221770001111",
                    name: "Contact A",
                    searchName: "contact a +221770001111",
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                });
                await ctx.db.insert("contacts", {
                    organizationId: orgId,
                    phone: "+33770001111",
                    name: "Contact B",
                    searchName: "contact b +33770001111",
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                });
                return { userId };
            });

            const result = await t.withIdentity({ subject: userId }).query(api.contacts.detectDuplicates, {});
            expect(result.length).toBeGreaterThanOrEqual(1);
            // The group should contain both contacts
            const group = result[0];
            expect(group).toHaveLength(2);
            const phones = group.map((c: any) => c.phone).sort();
            expect(phones).toContain("+221770001111");
            expect(phones).toContain("+33770001111");
        });

        it("should detect duplicates by exact name match", async () => {
            const { userId } = await t.run(async (ctx: any) => {
                const userId = await ctx.db.insert("users", { email: "dup3@example.com", name: "Dup User 3" });
                const orgId = await ctx.db.insert("organizations", {
                    name: "Dup Org 3",
                    slug: "dup-org-3",
                    ownerId: userId,
                    plan: "BUSINESS",
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                });
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
                // Two contacts with same name but different phones
                await ctx.db.insert("contacts", {
                    organizationId: orgId,
                    phone: "+221770009999",
                    name: "Amadou Diallo",
                    searchName: "amadou diallo +221770009999",
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                });
                await ctx.db.insert("contacts", {
                    organizationId: orgId,
                    phone: "+221780008888",
                    name: "Amadou Diallo",
                    searchName: "amadou diallo +221780008888",
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                });
                return { userId };
            });

            const result = await t.withIdentity({ subject: userId }).query(api.contacts.detectDuplicates, {});
            expect(result.length).toBeGreaterThanOrEqual(1);
            // Find the group that has the name duplicates
            const nameGroup = result.find((g: any[]) =>
                g.every((c: any) => c.name === "Amadou Diallo")
            );
            expect(nameGroup).toBeDefined();
            expect(nameGroup).toHaveLength(2);
        });
    });

    // ============================================
    // MERGE DUPLICATES
    // ============================================
    describe("mergeDuplicates", () => {
        it("should merge duplicate contacts into primary", async () => {
            const { userId, primaryId, dupId } = await t.run(async (ctx: any) => {
                const userId = await ctx.db.insert("users", { email: "merge@example.com", name: "Merge User" });
                const orgId = await ctx.db.insert("organizations", {
                    name: "Merge Org",
                    slug: "merge-org",
                    ownerId: userId,
                    plan: "BUSINESS",
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                });
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
                const primaryId = await ctx.db.insert("contacts", {
                    organizationId: orgId,
                    phone: "+221770001111",
                    name: "Primary Contact",
                    searchName: "primary contact +221770001111",
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                });
                const dupId = await ctx.db.insert("contacts", {
                    organizationId: orgId,
                    phone: "+33770001111",
                    name: "Duplicate Contact",
                    email: "dup@test.com",
                    company: "DupCo",
                    searchName: "duplicate contact +33770001111",
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                });
                return { userId, orgId, primaryId, dupId };
            });

            const result = await t.withIdentity({ subject: userId }).mutation(api.contacts.mergeDuplicates, {
                primaryId,
                duplicateIds: [dupId],
            });

            expect(result.contactsMerged).toBe(1);

            // The primary should now have the email and company from the duplicate
            const primary = await t.withIdentity({ subject: userId }).query(api.contacts.get, { id: primaryId });
            expect(primary).not.toBeNull();
            expect(primary!.email).toBe("dup@test.com");
            expect(primary!.company).toBe("DupCo");
        });

        it("should transfer conversations from duplicates to primary", async () => {
            const { userId, primaryId, dupId } = await t.run(async (ctx: any) => {
                const userId = await ctx.db.insert("users", { email: "merge2@example.com", name: "Merge User 2" });
                const orgId = await ctx.db.insert("organizations", {
                    name: "Merge Org 2",
                    slug: "merge-org-2",
                    ownerId: userId,
                    plan: "BUSINESS",
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                });
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
                const primaryId = await ctx.db.insert("contacts", {
                    organizationId: orgId,
                    phone: "+221770002222",
                    name: "Primary",
                    searchName: "primary +221770002222",
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                });
                const dupId = await ctx.db.insert("contacts", {
                    organizationId: orgId,
                    phone: "+33770002222",
                    name: "Dup",
                    searchName: "dup +33770002222",
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                });
                // Create a conversation linked to the duplicate
                await ctx.db.insert("conversations", {
                    organizationId: orgId,
                    contactId: dupId,
                    channel: "WHATSAPP",
                    status: "OPEN",
                    lastMessageAt: Date.now(),
                    unreadCount: 0,
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                });
                return { userId, orgId, primaryId, dupId };
            });

            const result = await t.withIdentity({ subject: userId }).mutation(api.contacts.mergeDuplicates, {
                primaryId,
                duplicateIds: [dupId],
            });

            expect(result.conversationsTransferred).toBe(1);

            // Verify the conversation now points to primaryId
            const conversations = await t.run(async (ctx: any) => {
                return await ctx.db.query("conversations").collect();
            });
            expect(conversations).toHaveLength(1);
            expect(conversations[0].contactId).toBe(primaryId);
        });

        it("should merge tags (union)", async () => {
            const { userId, primaryId, dupId } = await t.run(async (ctx: any) => {
                const userId = await ctx.db.insert("users", { email: "merge3@example.com", name: "Merge User 3" });
                const orgId = await ctx.db.insert("organizations", {
                    name: "Merge Org 3",
                    slug: "merge-org-3",
                    ownerId: userId,
                    plan: "BUSINESS",
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                });
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
                const tag1 = await ctx.db.insert("tags", {
                    organizationId: orgId,
                    name: "VIP",
                    createdAt: Date.now(),
                });
                const tag2 = await ctx.db.insert("tags", {
                    organizationId: orgId,
                    name: "Lead",
                    createdAt: Date.now(),
                });
                const tag3 = await ctx.db.insert("tags", {
                    organizationId: orgId,
                    name: "New",
                    createdAt: Date.now(),
                });
                const primaryId = await ctx.db.insert("contacts", {
                    organizationId: orgId,
                    phone: "+221770003333",
                    name: "Tagged Primary",
                    tags: [tag1, tag2],
                    searchName: "tagged primary +221770003333",
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                });
                const dupId = await ctx.db.insert("contacts", {
                    organizationId: orgId,
                    phone: "+33770003333",
                    name: "Tagged Dup",
                    tags: [tag2, tag3],
                    searchName: "tagged dup +33770003333",
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                });
                return { userId, orgId, primaryId, dupId, tag1, tag2, tag3 };
            });

            const result = await t.withIdentity({ subject: userId }).mutation(api.contacts.mergeDuplicates, {
                primaryId,
                duplicateIds: [dupId],
            });

            // Tags should be the union: tag1, tag2, tag3 (3 unique)
            expect(result.tagsCount).toBe(3);
        });

        it("should delete duplicate contacts after merge", async () => {
            const { userId, primaryId, dupId } = await t.run(async (ctx: any) => {
                const userId = await ctx.db.insert("users", { email: "merge4@example.com", name: "Merge User 4" });
                const orgId = await ctx.db.insert("organizations", {
                    name: "Merge Org 4",
                    slug: "merge-org-4",
                    ownerId: userId,
                    plan: "BUSINESS",
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                });
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
                const primaryId = await ctx.db.insert("contacts", {
                    organizationId: orgId,
                    phone: "+221770004444",
                    name: "Keeper",
                    searchName: "keeper +221770004444",
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                });
                const dupId = await ctx.db.insert("contacts", {
                    organizationId: orgId,
                    phone: "+33770004444",
                    name: "Goner",
                    searchName: "goner +33770004444",
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                });
                return { userId, orgId, primaryId, dupId };
            });

            await t.withIdentity({ subject: userId }).mutation(api.contacts.mergeDuplicates, {
                primaryId,
                duplicateIds: [dupId],
            });

            // Verify the duplicate is deleted
            const dupContact = await t.run(async (ctx: any) => {
                return await ctx.db.get(dupId);
            });
            expect(dupContact).toBeNull();

            // Primary should still exist
            const primaryContact = await t.run(async (ctx: any) => {
                return await ctx.db.get(primaryId);
            });
            expect(primaryContact).not.toBeNull();
        });
    });

    // ============================================
    // SEGMENTS
    // ============================================
    describe("Segments (listSegments, createSegment, deleteSegment)", () => {
        it("should create a segment with filters", async () => {
            const { userId } = await t.run(async (ctx: any) => {
                const userId = await ctx.db.insert("users", { email: "seg@example.com", name: "Seg User" });
                const orgId = await ctx.db.insert("organizations", {
                    name: "Seg Org",
                    slug: "seg-org",
                    ownerId: userId,
                    plan: "BUSINESS",
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                });
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
                return { userId };
            });

            const segmentId = await t.withIdentity({ subject: userId }).mutation(api.contacts.createSegment, {
                name: "VIP Sénégal",
                filters: {
                    tags: ["VIP"],
                    country: "Sénégal",
                },
            });

            expect(segmentId).toBeDefined();
        });

        it("should list segments for org", async () => {
            const { userId } = await t.run(async (ctx: any) => {
                const userId = await ctx.db.insert("users", { email: "seg2@example.com", name: "Seg User 2" });
                const orgId = await ctx.db.insert("organizations", {
                    name: "Seg Org 2",
                    slug: "seg-org-2",
                    ownerId: userId,
                    plan: "BUSINESS",
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                });
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
                // Pre-insert segments
                await ctx.db.insert("contactSegments", {
                    organizationId: orgId,
                    name: "Segment A",
                    filters: { tags: ["A"] },
                    createdBy: userId,
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                });
                await ctx.db.insert("contactSegments", {
                    organizationId: orgId,
                    name: "Segment B",
                    filters: { country: "France" },
                    createdBy: userId,
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                });
                return { userId };
            });

            const segments = await t.withIdentity({ subject: userId }).query(api.contacts.listSegments, {});
            expect(segments).toHaveLength(2);
            const names = segments.map((s: any) => s.name).sort();
            expect(names).toEqual(["Segment A", "Segment B"]);
        });

        it("should delete a segment", async () => {
            const { userId, segmentId } = await t.run(async (ctx: any) => {
                const userId = await ctx.db.insert("users", { email: "seg3@example.com", name: "Seg User 3" });
                const orgId = await ctx.db.insert("organizations", {
                    name: "Seg Org 3",
                    slug: "seg-org-3",
                    ownerId: userId,
                    plan: "BUSINESS",
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                });
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
                const segmentId = await ctx.db.insert("contactSegments", {
                    organizationId: orgId,
                    name: "To Delete",
                    filters: {},
                    createdBy: userId,
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                });
                return { userId, segmentId };
            });

            await t.withIdentity({ subject: userId }).mutation(api.contacts.deleteSegment, {
                id: segmentId,
            });

            // Verify it's gone
            const segments = await t.withIdentity({ subject: userId }).query(api.contacts.listSegments, {});
            expect(segments).toHaveLength(0);
        });

        it("should not delete segment from another org", async () => {
            const { userId2, segmentId1 } = await t.run(async (ctx: any) => {
                // Org 1 with its segment
                const userId1 = await ctx.db.insert("users", { email: "seg4a@example.com", name: "Seg User 4A" });
                const orgId1 = await ctx.db.insert("organizations", {
                    name: "Seg Org 4A",
                    slug: "seg-org-4a",
                    ownerId: userId1,
                    plan: "BUSINESS",
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                });
                await ctx.db.insert("memberships", {
                    userId: userId1,
                    organizationId: orgId1,
                    role: "OWNER",
                    status: "ONLINE",
                    maxConversations: 10,
                    activeConversations: 0,
                    lastSeenAt: Date.now(),
                    joinedAt: Date.now(),
                });
                await ctx.db.insert("userSessions", {
                    userId: userId1,
                    currentOrganizationId: orgId1,
                    lastActivityAt: Date.now(),
                });
                const segmentId1 = await ctx.db.insert("contactSegments", {
                    organizationId: orgId1,
                    name: "Org1 Segment",
                    filters: {},
                    createdBy: userId1,
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                });

                // Org 2 with a different user
                const userId2 = await ctx.db.insert("users", { email: "seg4b@example.com", name: "Seg User 4B" });
                const orgId2 = await ctx.db.insert("organizations", {
                    name: "Seg Org 4B",
                    slug: "seg-org-4b",
                    ownerId: userId2,
                    plan: "BUSINESS",
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                });
                await ctx.db.insert("memberships", {
                    userId: userId2,
                    organizationId: orgId2,
                    role: "OWNER",
                    status: "ONLINE",
                    maxConversations: 10,
                    activeConversations: 0,
                    lastSeenAt: Date.now(),
                    joinedAt: Date.now(),
                });
                await ctx.db.insert("userSessions", {
                    userId: userId2,
                    currentOrganizationId: orgId2,
                    lastActivityAt: Date.now(),
                });

                return { userId2, segmentId1 };
            });

            // User 2 tries to delete Org 1's segment — should throw
            await expect(
                t.withIdentity({ subject: userId2 }).mutation(api.contacts.deleteSegment, {
                    id: segmentId1,
                })
            ).rejects.toThrow("Unauthorized");
        });
    });

    // ============================================
    // GET CONTACT TIMELINE
    // ============================================
    describe("getContactTimeline", () => {
        it("should return empty for contact with no messages", async () => {
            const { userId, contactId } = await t.run(async (ctx: any) => {
                const userId = await ctx.db.insert("users", { email: "tl@example.com", name: "TL User" });
                const orgId = await ctx.db.insert("organizations", {
                    name: "TL Org",
                    slug: "tl-org",
                    ownerId: userId,
                    plan: "BUSINESS",
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                });
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
                const contactId = await ctx.db.insert("contacts", {
                    organizationId: orgId,
                    phone: "+221770005555",
                    name: "No Messages",
                    searchName: "no messages +221770005555",
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                });
                return { userId, contactId };
            });

            const timeline = await t.withIdentity({ subject: userId }).query(api.contacts.getContactTimeline, {
                contactId,
            });
            expect(timeline).toHaveLength(0);
        });

        it("should return messages from contact's conversations", async () => {
            const { userId, contactId } = await t.run(async (ctx: any) => {
                const userId = await ctx.db.insert("users", { email: "tl2@example.com", name: "TL User 2" });
                const orgId = await ctx.db.insert("organizations", {
                    name: "TL Org 2",
                    slug: "tl-org-2",
                    ownerId: userId,
                    plan: "BUSINESS",
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                });
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
                const contactId = await ctx.db.insert("contacts", {
                    organizationId: orgId,
                    phone: "+221770006666",
                    name: "Has Messages",
                    searchName: "has messages +221770006666",
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                });
                const convId = await ctx.db.insert("conversations", {
                    organizationId: orgId,
                    contactId,
                    channel: "WHATSAPP",
                    status: "OPEN",
                    lastMessageAt: Date.now(),
                    unreadCount: 0,
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                });
                // Insert 3 messages
                await ctx.db.insert("messages", {
                    organizationId: orgId,
                    conversationId: convId,
                    contactId,
                    type: "TEXT",
                    content: "Bonjour",
                    direction: "INBOUND",
                    status: "DELIVERED",
                    createdAt: Date.now() - 3000,
                    updatedAt: Date.now() - 3000,
                });
                await ctx.db.insert("messages", {
                    organizationId: orgId,
                    conversationId: convId,
                    senderId: userId,
                    type: "TEXT",
                    content: "Salut!",
                    direction: "OUTBOUND",
                    status: "SENT",
                    createdAt: Date.now() - 2000,
                    updatedAt: Date.now() - 2000,
                });
                await ctx.db.insert("messages", {
                    organizationId: orgId,
                    conversationId: convId,
                    contactId,
                    type: "IMAGE",
                    direction: "INBOUND",
                    status: "DELIVERED",
                    createdAt: Date.now() - 1000,
                    updatedAt: Date.now() - 1000,
                });
                return { userId, contactId };
            });

            const timeline = await t.withIdentity({ subject: userId }).query(api.contacts.getContactTimeline, {
                contactId,
            });
            expect(timeline).toHaveLength(3);
            // First entry should be most recent (image)
            expect(timeline[0].type).toBe("message_received");
            expect(timeline[0].content).toBe("Image");
            // Second should be the outbound text
            expect(timeline[1].type).toBe("message_sent");
            expect(timeline[1].content).toBe("Salut!");
            // Third should be the inbound text
            expect(timeline[2].type).toBe("message_received");
            expect(timeline[2].content).toBe("Bonjour");
        });

        it("should return max 20 entries sorted desc", async () => {
            const { userId, contactId } = await t.run(async (ctx: any) => {
                const userId = await ctx.db.insert("users", { email: "tl3@example.com", name: "TL User 3" });
                const orgId = await ctx.db.insert("organizations", {
                    name: "TL Org 3",
                    slug: "tl-org-3",
                    ownerId: userId,
                    plan: "BUSINESS",
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                });
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
                const contactId = await ctx.db.insert("contacts", {
                    organizationId: orgId,
                    phone: "+221770007777",
                    name: "Many Messages",
                    searchName: "many messages +221770007777",
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                });
                const convId = await ctx.db.insert("conversations", {
                    organizationId: orgId,
                    contactId,
                    channel: "WHATSAPP",
                    status: "OPEN",
                    lastMessageAt: Date.now(),
                    unreadCount: 0,
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                });
                // Insert 25 messages
                const baseTime = Date.now();
                for (let i = 0; i < 25; i++) {
                    await ctx.db.insert("messages", {
                        organizationId: orgId,
                        conversationId: convId,
                        contactId,
                        type: "TEXT",
                        content: `Message ${i}`,
                        direction: "INBOUND",
                        status: "DELIVERED",
                        createdAt: baseTime - (25 - i) * 1000,
                        updatedAt: baseTime - (25 - i) * 1000,
                    });
                }
                return { userId, contactId };
            });

            const timeline = await t.withIdentity({ subject: userId }).query(api.contacts.getContactTimeline, {
                contactId,
            });
            expect(timeline).toHaveLength(20);
            // Should be sorted desc (most recent first)
            for (let i = 0; i < timeline.length - 1; i++) {
                expect(timeline[i].timestamp).toBeGreaterThanOrEqual(timeline[i + 1].timestamp);
            }
        });
    });
});
