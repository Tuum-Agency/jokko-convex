import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { rateLimiter } from "./lib/rateLimits";

export const generateUploadUrl = mutation({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Non authentifie");

        await rateLimiter.limit(ctx, "uploadFile", { key: userId, throws: true });

        return await ctx.storage.generateUploadUrl();
    },
});

export const getDownloadUrl = mutation({
    args: {
        storageId: v.id("_storage"),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Non authentifie");
        return await ctx.storage.getUrl(args.storageId);
    },
});
