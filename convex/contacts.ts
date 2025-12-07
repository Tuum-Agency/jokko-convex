
import { v } from "convex/values";
import { query, mutation, QueryCtx } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { paginationOptsValidator } from "convex/server";
import { Id } from "./_generated/dataModel";
import { ConvexError } from "convex/values";

// Helper to normalize search text
const getSearchName = (args: { name?: string, firstName?: string, lastName?: string, phone?: string, email?: string }) => {
    const parts = [
        args.name,
        args.firstName,
        args.lastName,
        args.phone,
        args.email
    ];
    return parts.filter(Boolean).join(" ").toLowerCase();
};

export const list = query({
    args: {
        paginationOpts: paginationOptsValidator,
        search: v.optional(v.string()),
        tag: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const session = await ctx.db
            .query("userSessions")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .first();

        if (!session || !session.currentOrganizationId) {
            return {
                page: [],
                isDone: true,
                continueCursor: "",
            };
        }

        const orgId = session.currentOrganizationId;

        let results;

        if (args.search) {
            results = await ctx.db
                .query("contacts")
                .withSearchIndex("search_contacts", q =>
                    q.search("searchName", args.search!)
                        .eq("organizationId", orgId)
                )
                .paginate(args.paginationOpts);
        } else {
            // Default listing
            // TODO: Filter by tag if provided. For now ignore tag filter in query, do strictly on client or fetch all?
            // Given pagination, filtering in memory effectively requires fetching *more*.
            // We will skip tag filtering on backend for now as it needs a dedicated index/table structure.

            results = await ctx.db
                .query("contacts")
                .withIndex("by_org_created", q => q.eq("organizationId", orgId))
                .order("desc") // Newest first
                .paginate(args.paginationOpts);
        }

        // Enrich with tags
        const contacts = results.page;
        const allTagIds = new Set<string>();
        contacts.forEach(c => c.tags?.forEach((t: string) => allTagIds.add(t)));

        const tags = await Promise.all(
            Array.from(allTagIds).map(id => ctx.db.get(id as Id<"tags">))
        );

        const tagMap = new Map(tags.filter(t => t).map(t => [t!._id, t]));

        const enrichedContacts = contacts.map(c => ({
            ...c,
            tags: c.tags?.map((tid: string) => tagMap.get(tid as Id<"tags">)).filter(Boolean) || []
        }));

        return {
            ...results,
            page: enrichedContacts
        };
    },
});

export const create = mutation({
    args: {
        phone: v.string(),
        name: v.optional(v.string()),
        firstName: v.optional(v.string()),
        lastName: v.optional(v.string()),
        email: v.optional(v.string()),
        company: v.optional(v.string()),
        jobTitle: v.optional(v.string()),
        address: v.optional(v.string()),
        city: v.optional(v.string()),
        country: v.optional(v.string()),
        notes: v.optional(v.string()),
        tags: v.array(v.string()), // Tag names
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const session = await ctx.db
            .query("userSessions")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .first();

        if (!session || !session.currentOrganizationId) throw new Error("No active organization");

        const orgId = session.currentOrganizationId;

        // Check duplicate phone
        const existing = await ctx.db
            .query("contacts")
            .withIndex("by_org_phone", q => q.eq("organizationId", orgId).eq("phone", args.phone))
            .first();

        if (existing) {
            throw new ConvexError({
                code: 'DUPLICATE_CONTACT',
                message: 'Un contact avec ce numéro existe déjà.',
                existingId: existing._id
            });
        }

        // Resolve tags
        const tagIds = [];
        for (const tagName of args.tags) {
            let tag = await ctx.db
                .query("tags")
                .withIndex("by_org_name", q => q.eq("organizationId", orgId).eq("name", tagName))
                .first();

            if (!tag) {
                const id = await ctx.db.insert("tags", {
                    organizationId: orgId,
                    name: tagName,
                    createdAt: Date.now()
                });
                tagIds.push(id);
            } else {
                tagIds.push(tag._id);
            }
        }

        const contactId = await ctx.db.insert("contacts", {
            organizationId: orgId,
            phone: args.phone,
            name: args.name,
            firstName: args.firstName,
            lastName: args.lastName,
            email: args.email,
            company: args.company,
            jobTitle: args.jobTitle,
            address: args.address,
            city: args.city,
            country: args.country,
            notes: args.notes,
            tags: tagIds,
            searchName: getSearchName(args),
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        return contactId;
    },
});

export const update = mutation({
    args: {
        id: v.id("contacts"),
        phone: v.optional(v.string()), // usually immutable but allowed
        name: v.optional(v.string()),
        firstName: v.optional(v.string()),
        lastName: v.optional(v.string()),
        email: v.optional(v.string()),
        company: v.optional(v.string()),
        jobTitle: v.optional(v.string()),
        address: v.optional(v.string()),
        city: v.optional(v.string()),
        country: v.optional(v.string()),
        notes: v.optional(v.string()),
        tags: v.array(v.string()),
    },
    handler: async (ctx, args) => {
        // Boilerplate auth
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");
        const session = await ctx.db.query("userSessions").withIndex("by_user", q => q.eq("userId", userId)).first();
        if (!session || !session.currentOrganizationId) throw new Error("No active organization");

        // Resolve tags
        const tagIds = [];
        for (const tagName of args.tags) {
            let tag = await ctx.db
                .query("tags")
                .withIndex("by_org_name", q => q.eq("organizationId", session.currentOrganizationId!).eq("name", tagName))
                .first();
            if (!tag) {
                const id = await ctx.db.insert("tags", {
                    organizationId: session.currentOrganizationId!,
                    name: tagName,
                    createdAt: Date.now()
                });
                tagIds.push(id);
            } else {
                tagIds.push(tag._id);
            }
        }

        const { id, ...updates } = args;

        // Recalculate searchName if needed
        // We need existing data to fully reconstruct it if some fields are missing in updates? 
        // Usually updates include all form fields. 
        // Or we merge.
        const current = await ctx.db.get(id);
        if (!current) throw new Error("Not found");

        const merged = { ...current, ...updates };
        const searchName = getSearchName(merged);

        await ctx.db.patch(id, {
            ...updates,
            tags: tagIds,
            searchName,
            updatedAt: Date.now()
        });
    }
});

export const remove = mutation({
    args: { id: v.id("contacts") },
    handler: async (ctx, args) => {
        // Boilerplate auth
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");
        // Verify membership implicitly via finding contact in org?
        // Optimization: delete if it exists.
        // Ideally verify ownership/org.
        const contact = await ctx.db.get(args.id);
        if (!contact) return;

        const session = await ctx.db.query("userSessions").withIndex("by_user", q => q.eq("userId", userId)).first();
        if (!session || session.currentOrganizationId !== contact.organizationId) {
            throw new Error("Unauthorized");
        }

        await ctx.db.delete(args.id);
    }
});

export const batchCreate = mutation({
    args: {
        contacts: v.array(
            v.object({
                phone: v.string(),
                name: v.optional(v.string()),
                firstName: v.optional(v.string()),
                lastName: v.optional(v.string()),
                email: v.optional(v.string()),
                company: v.optional(v.string()),
                jobTitle: v.optional(v.string()),
                address: v.optional(v.string()),
                city: v.optional(v.string()),
                country: v.optional(v.string()),
                notes: v.optional(v.string()),
                tags: v.array(v.string()),
            })
        ),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const session = await ctx.db
            .query("userSessions")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .first();

        if (!session || !session.currentOrganizationId) throw new Error("No active organization");
        const orgId = session.currentOrganizationId;

        let createdCount = 0;
        let errors = [];

        for (const contactData of args.contacts) {
            // Check duplicate phone
            // Ideally we batch fetch existing phones.
            const existing = await ctx.db
                .query("contacts")
                .withIndex("by_org_phone", q => q.eq("organizationId", orgId).eq("phone", contactData.phone))
                .first();

            if (existing) {
                errors.push({ phone: contactData.phone, error: "Duplicate number" });
                continue;
            }

            // Resolve tags
            const tagIds = [];
            for (const tagName of contactData.tags) {
                if (!tagName) continue;
                let tag = await ctx.db
                    .query("tags")
                    .withIndex("by_org_name", q => q.eq("organizationId", orgId).eq("name", tagName))
                    .first();

                if (!tag) {
                    const id = await ctx.db.insert("tags", {
                        organizationId: orgId,
                        name: tagName,
                        createdAt: Date.now()
                    });
                    tagIds.push(id);
                } else {
                    tagIds.push(tag._id);
                }
            }

            const searchName = getSearchName(contactData);

            await ctx.db.insert("contacts", {
                organizationId: orgId,
                ...contactData,
                tags: tagIds,
                searchName,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });
            createdCount++;
        }

        return {
            created: createdCount,
            errors
        };
    },
});
