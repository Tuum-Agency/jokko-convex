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
        // 1. Setup: create user, organization, membership, and session
        const { userId } = await t.run(async (ctx: any) => {
            const userId = await ctx.db.insert("users", {
                email: "test@example.com",
                name: "Test User",
            });
            const orgId = await ctx.db.insert("organizations", {
                name: "Test Org",
                slug: "test-org",
                ownerId: userId,
                plan: "FREE",
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
            { phone: "+221770000002", firstName: "Import", lastName: "Two", tags: ["Imported", "VIP"] },
        ];

        const result = await t.withIdentity({ subject: userId }).mutation(api.contacts.batchCreate, {
            contacts: contactsData,
        });

        // 3. Verify Result
        expect(result.created).toBe(2);
        expect(result.errors).toHaveLength(0);

        // 4. Verify Database
        const contacts = await t.withIdentity({ subject: userId }).query(api.contacts.list, {
            paginationOpts: { numItems: 10, cursor: null },
        });

        expect(contacts.page).toHaveLength(2);
        expect(contacts.page[0].firstName).toBe("Import");
        expect(contacts.page[0].tags[0].name).toBe("Imported");
    });
});
