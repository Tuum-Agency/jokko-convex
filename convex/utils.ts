
import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";

export const getOrganization = internalQuery({
    args: { id: v.id("organizations") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});

export const updateMessageStatus = internalMutation({
    args: {
        messageId: v.id("messages"),
        status: v.string(),
        externalId: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.messageId, {
            status: args.status,
            externalId: args.externalId,
            updatedAt: Date.now(),
        });
    },
});
