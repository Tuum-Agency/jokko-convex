import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const generateUploadUrl = mutation({
    args: {
        // You might want validation here (e.g. file type, size, authentication)
    },
    handler: async (ctx) => {
        return await ctx.storage.generateUploadUrl();
    },
});

export const getDownloadUrl = mutation({
    args: {
        storageId: v.id("_storage"),
    },
    handler: async (ctx, args) => {
        return await ctx.storage.getUrl(args.storageId);
    },
});
