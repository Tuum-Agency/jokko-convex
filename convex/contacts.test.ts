
import { convexTest } from "convex-test";
import { describe, it, expect, beforeEach } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./test.modules"; // We need to generate this or use import.meta.glob if using vite?
// convex-test usually requires t.ts to setup

// Actually, convex-test needs to bundle modules. 
// A simpler way without full setup might be tricky.
// Let's assume standard convex-test usage.

describe("Contacts", () => {
    let t: any;

    beforeEach(async () => {
        t = convexTest(schema, modules);
    });

    it("should create contacts in batch", async () => {
        // 1. Setup Identity
        const realUserId = await t.run(async (ctx: any) => {
            return await ctx.db.insert("users", { email: "test@example.com", name: "Test User" });
        });

        await t.withIdentity({ subject: realUserId }).mutation(api.sessions.ensure, {});

        // 2. Call batchCreate
        const contactsData = [
            { phone: "+221770000001", firstName: "Import", lastName: "One", tags: ["Imported"] },
            { phone: "+221770000002", firstName: "Import", lastName: "Two", tags: ["Imported", "VIP"] }
        ];

        const result = await t.withIdentity({ subject: realUserId }).mutation(api.contacts.batchCreate, {
            contacts: contactsData
        });

        // 3. Verify Result
        expect(result.created).toBe(2);
        expect(result.errors).toHaveLength(0);

        // 4. Verify Database
        const contacts = await t.withIdentity({ subject: realUserId }).query(api.contacts.list, {
            paginationOpts: { numItems: 10, cursor: null }
        });

        expect(contacts.page).toHaveLength(2);
        expect(contacts.page[0].firstName).toBe("Import");
        expect(contacts.page[0].tags[0].name).toBe("Imported");
    });
});
