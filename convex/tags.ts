
import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) return { tags: [] };

        const session = await ctx.db
            .query("userSessions")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .first();

        if (!session || !session.currentOrganizationId) return { tags: [] };

        const tags = await ctx.db
            .query("tags")
            .withIndex("by_organization", (q) => q.eq("organizationId", session.currentOrganizationId!))
            .collect();

        return { tags };
    },
});

export const create = mutation({
    args: {
        name: v.string(),
        color: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const session = await ctx.db
            .query("userSessions")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .first();

        if (!session || !session.currentOrganizationId) throw new Error("No active organization");

        // Check if tag exists
        const existing = await ctx.db
            .query("tags")
            .withIndex("by_org_name", (q) =>
                q.eq("organizationId", session.currentOrganizationId!).eq("name", args.name)
            )
            .first();

        if (existing) return existing._id;

        return await ctx.db.insert("tags", {
            organizationId: session.currentOrganizationId,
            name: args.name,
            color: args.color,
            createdAt: Date.now(),
        });
    },
});
