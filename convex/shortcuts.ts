import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

import { paginationOptsValidator } from "convex/server";

// List shortcuts for the current user's organization
export const list = query({
    args: {
        paginationOpts: paginationOptsValidator,
        search: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) return { page: [], isDone: true, continueCursor: "" };

        // Check user session for org
        const session = await ctx.db
            .query("userSessions")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .first();

        if (!session?.currentOrganizationId) return { page: [], isDone: true, continueCursor: "" };
        const organizationId = session.currentOrganizationId;

        if (args.search) {
            return await ctx.db
                .query("shortcuts")
                .withSearchIndex("search_shortcuts", (q) =>
                    q.search("shortcut", args.search!).eq("organizationId", organizationId)
                )
                .paginate(args.paginationOpts);
        }

        return await ctx.db
            .query("shortcuts")
            .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
            .order("desc")
            .paginate(args.paginationOpts);
    },
});

// Create a new shortcut
export const create = mutation({
    args: {
        shortcut: v.string(),
        text: v.string(),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const session = await ctx.db
            .query("userSessions")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .first();

        if (!session?.currentOrganizationId) throw new Error("No organization selected");

        const organizationId = session.currentOrganizationId;

        // Clean shortcut (ensure it starts with /)
        let shortcut = args.shortcut.trim();
        if (!shortcut.startsWith("/")) {
            shortcut = "/" + shortcut;
        }

        // Check if shortcut already exists (optional, but good UX)
        const existing = await ctx.db
            .query("shortcuts")
            .withIndex("by_org_shortcut", (q) => q.eq("organizationId", organizationId).eq("shortcut", shortcut))
            .first();

        if (existing) {
            throw new Error(`Le raccourci "${shortcut}" existe déjà.`);
        }

        await ctx.db.insert("shortcuts", {
            organizationId,
            shortcut,
            text: args.text,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
    },
});

// Update a shortcut
export const update = mutation({
    args: {
        id: v.id("shortcuts"),
        shortcut: v.string(),
        text: v.string(),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const existing = await ctx.db.get(args.id);
        if (!existing) throw new Error("Not found");

        const session = await ctx.db
            .query("userSessions")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .first();

        if (existing.organizationId !== session?.currentOrganizationId) {
            throw new Error("Unauthorized");
        }

        // Clean shortcut
        let shortcut = args.shortcut.trim();
        if (!shortcut.startsWith("/")) {
            shortcut = "/" + shortcut;
        }

        // Check duplicate if changing shortcut
        if (shortcut !== existing.shortcut) {
            const busy = await ctx.db
                .query("shortcuts")
                .withIndex("by_org_shortcut", (q) => q.eq("organizationId", existing.organizationId).eq("shortcut", shortcut))
                .first();
            if (busy) throw new Error(`Le raccourci "${shortcut}" existe déjà.`);
        }

        await ctx.db.patch(args.id, {
            shortcut,
            text: args.text,
            updatedAt: Date.now(),
        });
    },
});

// Delete a shortcut
export const deleteShortcut = mutation({
    args: {
        id: v.id("shortcuts"),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const existing = await ctx.db.get(args.id);
        if (!existing) throw new Error("Not found");

        const session = await ctx.db
            .query("userSessions")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .first();

        if (existing.organizationId !== session?.currentOrganizationId) {
            throw new Error("Unauthorized");
        }

        await ctx.db.delete(args.id);
    },
});
