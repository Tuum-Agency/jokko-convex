
import { v } from "convex/values";
import { query, mutation, QueryCtx, internalQuery } from "./_generated/server";
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

const detectCountryCode = (phone: string): string | undefined => {
    // Clean phone: remove non-alphanumeric (keep + if present)
    let p = phone.replace(/[^0-9+]/g, '');

    // Normalize start
    if (p.startsWith('00')) {
        p = p.substring(2); // Remove 00
    } else if (p.startsWith('+')) {
        p = p.substring(1); // Remove +
    }

    // Known prefixes
    const knownPrefixes = [
        "221", "33", "1", "44", "212", "225", "223", "224", "241", "237",
        "220", "222", "238", "226", "227", "228", "229", "242", "243",
        "34", "32", "49", "41", "39", "27", "234", "233", "254"
    ];

    for (const prefix of knownPrefixes) {
        if (p.startsWith(prefix)) {
            return "+" + prefix;
        }
    }

    // Fallback: first 3 digits if long enough
    if (p.length > 7) {
        return "+" + p.substring(0, 3);
    }

    return undefined;
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

export const get = query({
    args: { id: v.id("contacts") },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) return null; // or throw

        const contact = await ctx.db.get(args.id);
        if (!contact) return null;

        // Verify organization membership/access?
        // Ideally yes.
        const session = await ctx.db.query("userSessions").withIndex("by_user", q => q.eq("userId", userId)).first();
        if (session?.currentOrganizationId !== contact.organizationId) {
            // In strict mode, throw or return null.
            // For now return null to be safe if crossed orgs.
            return null;
        }

        // Enrich tags
        const tags = await Promise.all(
            (contact.tags || []).map(id => ctx.db.get(id))
        );

        // Enrich notes
        let enrichedNotes: any[] = [];
        if (contact.notes) {
            if (Array.isArray(contact.notes)) {
                enrichedNotes = await Promise.all(contact.notes.map(async (n: any) => {
                    const authorId = n.authorId as Id<"users">;
                    const author = authorId ? await ctx.db.get(authorId) : null;
                    // Prefer name, fallback to email, then "Agent"
                    const authorName = author?.name || author?.email || "Agent";
                    return {
                        ...n,
                        authorName
                    };
                }));
                // Sort by date desc
                enrichedNotes.sort((a, b) => b.createdAt - a.createdAt);
            } else {
                // Legacy string note
                enrichedNotes = [{
                    content: contact.notes,
                    authorName: null,
                    createdAt: contact.updatedAt
                }];
            }
        }

        return {
            ...contact,
            id: contact._id, // Client expects 'id'
            // Map tags to strings as expected by UI for now, or objects?
            // UI uses string[] in ContactDetails interface: `tags: string[]`
            tags: tags.filter(t => t).map(t => t!.name),
            notes: enrichedNotes // Return structured array
        };
    }
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
            notes: args.notes, // Storing initial note as string is fine (handled by get)
            tags: tagIds,
            searchName: getSearchName(args),
            countryCode: detectCountryCode(args.phone),
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
        notes: v.optional(v.string()), // Legacy string override
        addNote: v.optional(v.string()), // New structured append
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

        const { id, addNote, notes, ...updates } = args;

        // Recalculate searchName if needed
        const current = await ctx.db.get(id);
        if (!current) throw new Error("Not found");

        // Handle Notes
        let finalNotes: any = current.notes;

        if (addNote) {
            // Append mode
            let currentList: any[] = [];
            if (finalNotes) {
                if (Array.isArray(finalNotes)) {
                    currentList = [...finalNotes];
                } else {
                    // Convert legacy string to list
                    currentList = [{
                        content: finalNotes as string,
                        // No author known for legacy
                        createdAt: current.updatedAt
                    }];
                }
            }

            currentList.push({
                content: addNote,
                authorId: userId,
                createdAt: Date.now()
            });
            finalNotes = currentList;
        } else if (notes !== undefined) {
            // Overwrite mode (legacy or simple edit)
            // If we want to support full structured update from client, we'd need more complex args.
            // For now, if client sends 'notes' string, we save it as string (revert to legacy) OR as single item list?
            // Let's safe it as string to respect strict type if passed, OR standardizes?
            // Schema allows string. Let's allowing string overwrite.
            finalNotes = notes;
        }

        const merged = { ...current, ...updates };
        const searchName = getSearchName(merged);

        await ctx.db.patch(id, {
            ...updates,
            notes: finalNotes,
            tags: tagIds,
            searchName,
            countryCode: updates.phone ? detectCountryCode(updates.phone) : (current.countryCode || (current.phone ? detectCountryCode(current.phone) : undefined)),
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
                countryCode: detectCountryCode(contactData.phone),
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

export const getAvailableCountryCodes = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) return [];

        const session = await ctx.db
            .query("userSessions")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .first();

        if (!session || !session.currentOrganizationId) return [];
        const orgId = session.currentOrganizationId;

        // Since we now store countryCode, we can just fetch unique values.
        // However, we might need to backfill or handle legacy data that doesn't have it yet.
        // For new system, we trust countryCode.
        // If countryCode is missing, we could try to compute it on fly or just ignore?
        // Let's rely on countryCode field for efficiency, assuming data migration or gradual fix.
        // Or for now, we can still scan but prefer countryCode if present.
        // To be safe and quick: scan existing valid countryCodes.

        // This query fetches all contacts, which is expensive. 
        // Ideally we should have a separate facet/index for country codes.
        // For now, let's just collect distinct countryCodes.

        const contacts = await ctx.db
            .query("contacts")
            .withIndex("by_organization", q => q.eq("organizationId", orgId))
            .collect();

        const prefixes = new Set<string>();

        contacts.forEach(c => {
            if (c.countryCode) {
                prefixes.add(c.countryCode);
            } else {
                // Fallback for old contacts
                const detected = detectCountryCode(c.phone);
                if (detected) prefixes.add(detected);
            }
        });

        return Array.from(prefixes).sort();
    }
});

export const updateNote = mutation({
    args: {
        contactId: v.id("contacts"),
        noteTimestamp: v.number(),
        newContent: v.string(),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const contact = await ctx.db.get(args.contactId);
        if (!contact) throw new Error("Contact not found");

        const session = await ctx.db.query("userSessions").withIndex("by_user", q => q.eq("userId", userId)).first();
        if (session?.currentOrganizationId !== contact.organizationId) throw new Error("Unauthorized");

        if (!contact.notes || !Array.isArray(contact.notes)) throw new Error("No notes found");

        const notes = [...contact.notes];
        const noteIndex = notes.findIndex((n: any) => n.createdAt === args.noteTimestamp);

        if (noteIndex === -1) throw new Error("Note not found");

        const note = notes[noteIndex];

        if (note.authorId !== userId) {
            throw new Error("You can only edit your own notes");
        }

        notes[noteIndex] = {
            ...note,
            content: args.newContent,
        };

        await ctx.db.patch(args.contactId, { notes: notes });
    }
});

export const removeNote = mutation({
    args: {
        contactId: v.id("contacts"),
        noteTimestamp: v.number(),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const contact = await ctx.db.get(args.contactId);
        if (!contact) throw new Error("Contact not found");

        const session = await ctx.db.query("userSessions").withIndex("by_user", q => q.eq("userId", userId)).first();
        if (session?.currentOrganizationId !== contact.organizationId) throw new Error("Unauthorized");
        const orgId = session.currentOrganizationId;

        if (!contact.notes || !Array.isArray(contact.notes)) return;

        const notes = [...contact.notes];
        const noteIndex = notes.findIndex((n: any) => n.createdAt === args.noteTimestamp);

        if (noteIndex === -1) return;

        const note = notes[noteIndex];

        let canDelete = false;

        if (note.authorId === userId) {
            canDelete = true;
        } else {
            const membership = await ctx.db
                .query("memberships")
                .withIndex("by_user_org", q => q.eq("userId", userId).eq("organizationId", orgId))
                .first();

            if (membership && (membership.role === "ADMIN" || membership.role === "OWNER")) {
                canDelete = true;
            }
        }

        if (!canDelete) {
            throw new Error("Insufficient permissions to delete this note");
        }

        notes.splice(noteIndex, 1);

        await ctx.db.patch(args.contactId, { notes: notes });
    }
});

export const clearAllNotes = mutation({
    args: {
        contactId: v.id("contacts"),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const contact = await ctx.db.get(args.contactId);
        if (!contact) throw new Error("Contact not found");

        const session = await ctx.db.query("userSessions").withIndex("by_user", q => q.eq("userId", userId)).first();
        if (session?.currentOrganizationId !== contact.organizationId) throw new Error("Unauthorized");
        const orgId = session.currentOrganizationId;

        const membership = await ctx.db
            .query("memberships")
            .withIndex("by_user_org", q => q.eq("userId", userId).eq("organizationId", orgId))
            .first();

        if (!membership || (membership.role !== "ADMIN" && membership.role !== "OWNER")) {
            throw new Error("Insufficient permissions. Only Admins and Owners can clear all notes.");
        }

        await ctx.db.patch(args.contactId, { notes: [] });
    }
});

export const listAllForOrg = internalQuery({
    args: { organizationId: v.id("organizations") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("contacts")
            .withIndex("by_organization", q => q.eq("organizationId", args.organizationId))
            .collect();
    }
});
