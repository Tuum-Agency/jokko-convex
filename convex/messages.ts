import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { requireMembership, requirePermission } from "./lib/auth";
import { paginationOptsValidator } from "convex/server";

// ============================================
// Queries
// ============================================

export const list = query({
    args: {
        conversationId: v.optional(v.id("conversations")),
        organizationId: v.optional(v.id("organizations")), // Optional security check
        paginationOpts: paginationOptsValidator,
    },
    handler: async (ctx, args) => {
        if (!args.conversationId) return { page: [], isDone: true, continueCursor: "" };

        const conversation = await ctx.db.get(args.conversationId);
        if (!conversation) throw new Error("Conversation not found");

        // Security check
        if (args.organizationId && conversation.organizationId !== args.organizationId) {
            throw new Error("Access denied");
        }

        // Require membership
        await requireMembership(ctx, conversation.organizationId);

        // List messages
        const messages = await ctx.db
            .query("messages")
            .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId!))
            .order("desc") // Newest first
            .paginate(args.paginationOpts);

        return {
            ...messages,
            page: await Promise.all(messages.page.map(async (msg) => {
                // Enrich if needed (e.g. sender info, media url signing)
                let mediaUrl = msg.mediaUrl;
                if (msg.mediaStorageId) {
                    const url = await ctx.storage.getUrl(msg.mediaStorageId);
                    if (url) mediaUrl = url;
                }

                return {
                    ...msg,
                    id: msg._id,
                    timestamp: msg._creationTime, // Use creation time as timestamp
                    mediaUrl,
                    // Ensure other fields match UI type
                };
            }))
        };
    },
});

// ============================================
// Mutations
// ============================================

export const send = mutation({
    args: {
        conversationId: v.id("conversations"),
        content: v.optional(v.string()),
        type: v.string(), // "TEXT", "IMAGE", etc.
        mediaUrl: v.optional(v.string()),
        mediaStorageId: v.optional(v.id("_storage")),
        mediaType: v.optional(v.string()),
        fileName: v.optional(v.string()),
        fileSize: v.optional(v.number()),
        replyToId: v.optional(v.id("messages")),
        isForwarded: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const conversation = await ctx.db.get(args.conversationId);
        if (!conversation) throw new Error("Conversation not found");

        const { userId } = await requirePermission(ctx, conversation.organizationId, "messages:send");

        // Create message
        const messageId = await ctx.db.insert("messages", {
            organizationId: conversation.organizationId,
            conversationId: args.conversationId,
            senderId: userId,
            contactId: conversation.contactId, // Outbound message to this contact

            type: args.type,
            content: args.content,
            mediaUrl: args.mediaUrl,
            mediaStorageId: args.mediaStorageId,
            mediaType: args.mediaType,
            fileName: args.fileName,
            fileSize: args.fileSize,

            direction: "OUTBOUND",
            status: "PENDING", // Will be updated by backend/webhook

            replyToId: args.replyToId,
            isForwarded: args.isForwarded,

            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        // Update conversation (last message, update time)
        await ctx.db.patch(args.conversationId, {
            lastMessageAt: Date.now(),
            preview: args.content || (args.type === "TEXT" ? args.content : `[${args.type}]`),
            updatedAt: Date.now(),
        });

        // Trigger WhatsApp Send (if text)
        if (args.type === "TEXT" && args.content) {
            const contact = await ctx.db.get(conversation.contactId!);
            if (contact && contact.phone) {
                await ctx.scheduler.runAfter(0, internal.whatsapp_actions.sendMessage, {
                    messageId,
                    organizationId: conversation.organizationId,
                    to: contact.phone,
                    text: args.content
                });
            }
        }

        return messageId;
    },
});

