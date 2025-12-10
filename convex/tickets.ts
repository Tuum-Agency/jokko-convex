import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const create = mutation({
    args: {
        subject: v.string(),
        message: v.string(),
        type: v.union(
            v.literal("BUG"),
            v.literal("FEATURE"),
            v.literal("BILLING"),
            v.literal("OTHER")
        ),
        priority: v.optional(v.union(
            v.literal("LOW"),
            v.literal("MEDIUM"),
            v.literal("HIGH"),
            v.literal("URGENT")
        )),
        contactEmail: v.optional(v.string()),
        contactPhone: v.optional(v.string()),
        attachmentStorageId: v.optional(v.id("_storage")),
        organizationId: v.optional(v.id("organizations")),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);

        const ticketId = await ctx.db.insert("tickets", {
            ...args,
            userId: userId ?? undefined, // If user is logged in
            status: "OPEN",
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        return ticketId;
    },
});

export const listByUser = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) return [];

        return await ctx.db
            .query("tickets")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .order("desc")
            .collect();
    },
});
