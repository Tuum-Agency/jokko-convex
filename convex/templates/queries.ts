
import { v } from "convex/values";
import { query } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { paginationOptsValidator } from "convex/server";
import { Id } from "../_generated/dataModel";

// Force rebuild
export const list = query({
    args: {
        paginationOpts: paginationOptsValidator,
        search: v.optional(v.string()),
        type: v.optional(v.string()),
        status: v.optional(v.string()),
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

        if (args.search) {
            // Search by name
            return await ctx.db
                .query("templates")
                .withSearchIndex("search_templates", q =>
                    q.search("name", args.search!)
                        .eq("organizationId", orgId)
                )
                .paginate(args.paginationOpts);
        }

        let query = ctx.db
            .query("templates")
            .withIndex("by_organization", q => q.eq("organizationId", orgId));

        if (args.type) {
            query = ctx.db
                .query("templates")
                .withIndex("by_org_and_type", q => q.eq("organizationId", orgId).eq("type", args.type!));
        } else if (args.status) {
            query = ctx.db
                .query("templates")
                .withIndex("by_org_and_status", q => q.eq("organizationId", orgId).eq("status", args.status!));
        }

        return await query.order("desc").paginate(args.paginationOpts);
    },
});

export const get = query({
    args: { id: v.id("templates") },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const session = await ctx.db
            .query("userSessions")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .first();

        if (!session || !session.currentOrganizationId) return null;

        const template = await ctx.db.get(args.id);
        if (!template || template.organizationId !== session.currentOrganizationId) return null;

        return template;
    },
});

export const listAll = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const session = await ctx.db
            .query("userSessions")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .first();

        if (!session || !session.currentOrganizationId) {
            return [];
        }

        const orgId = session.currentOrganizationId;

        const templates = await ctx.db
            .query("templates")
            .withIndex("by_organization", q => q.eq("organizationId", orgId))
            .filter(q => q.eq(q.field("status"), "APPROVED")) // Only approved templates for campaigns?
            .collect();

        return templates;
    },
});

export const listForSync = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const session = await ctx.db
            .query("userSessions")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .first();

        if (!session || !session.currentOrganizationId) return [];

        return await ctx.db
            .query("templates")
            .withIndex("by_organization", q => q.eq("organizationId", session.currentOrganizationId!))
            .collect();
    },
});
