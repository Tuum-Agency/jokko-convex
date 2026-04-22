
import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";

export const getOrganization = internalQuery({
    args: { id: v.id("organizations") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});

// List orgs with WhatsApp configured (for diagnostics)
export const listWhatsAppOrgs = internalQuery({
    args: {},
    handler: async (ctx) => {
        const orgs = await ctx.db.query("organizations").collect();
        return orgs
            .filter((o) => o.whatsapp?.phoneNumberId)
            .map((o) => ({
                _id: o._id,
                name: o.name,
                phoneNumberId: o.whatsapp?.phoneNumberId,
                displayPhoneNumber: (o.whatsapp as any)?.displayPhoneNumber,
                wabaId: o.whatsapp?.businessAccountId,
            }));
    },
});

export const patchMessageMedia = internalMutation({
    args: {
        messageId: v.id("messages"),
        mediaStorageId: v.id("_storage"),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.messageId, {
            mediaStorageId: args.mediaStorageId,
            updatedAt: Date.now(),
        });
    },
});

/**
 * Backfill old audio/video/document messages that were stored with raw JSON content.
 * Extracts the WhatsApp media ID from the content and schedules download.
 */
export const backfillMediaMessages = internalMutation({
    args: {},
    handler: async (ctx) => {
        // Find messages with type AUDIO/VIDEO/DOCUMENT/IMAGE that have no mediaUrl and no mediaStorageId
        const types = ["AUDIO", "VIDEO", "DOCUMENT", "IMAGE", "STICKER"];
        let fixed = 0;

        for (const type of types) {
            const messages = await ctx.db
                .query("messages")
                .filter((q) =>
                    q.and(
                        q.eq(q.field("type"), type),
                        q.eq(q.field("mediaStorageId"), undefined),
                        q.eq(q.field("mediaUrl"), undefined)
                    )
                )
                .take(100);

            for (const msg of messages) {
                if (!msg.content) continue;

                // Try to extract media ID from old format: [TYPE] {"audio":{"id":"12345",...}...
                const jsonMatch = msg.content.match(/\{.*"id"\s*:\s*"(\d+)"/);
                if (!jsonMatch?.[1]) continue;

                const whatsappMediaId = jsonMatch[1];

                // Extract mime_type if available
                const mimeMatch = msg.content.match(/"mime_type"\s*:\s*"([^"]+)"/);
                const mediaType = mimeMatch?.[1];

                // Update message with extracted data
                await ctx.db.patch(msg._id, {
                    mediaUrl: whatsappMediaId,
                    mediaType: mediaType,
                    content: type === "AUDIO" ? "" : msg.content.replace(/^\[.*?\]\s*\{.*$/, "").trim() || "",
                    updatedAt: Date.now(),
                });

                // Schedule media download
                await ctx.scheduler.runAfter(fixed * 500, internal.whatsapp_actions.downloadMedia, {
                    messageId: msg._id,
                    organizationId: msg.organizationId,
                    whatsappMediaId,
                });

                fixed++;
            }
        }

        console.log(`[BACKFILL] Scheduled download for ${fixed} media messages`);
        return { fixed };
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

// ============================================
// CALLS: internal helpers used by call_actions.ts
// ============================================

export const getCall = internalQuery({
    args: { id: v.id("calls") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});

export const getWhatsAppChannel = internalQuery({
    args: { id: v.id("whatsappChannels") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});

export const getWaba = internalQuery({
    args: { id: v.id("wabas") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});

export const updateCallStatus = internalMutation({
    args: {
        callId: v.id("calls"),
        status: v.union(
            v.literal("RINGING"),
            v.literal("PRE_ACCEPTED"),
            v.literal("CONNECTED"),
            v.literal("TERMINATED"),
            v.literal("REJECTED"),
            v.literal("MISSED"),
            v.literal("FAILED"),
            v.literal("REQUESTING_PERMISSION"),
            v.literal("PERMISSION_GRANTED"),
        ),
        terminationReason: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const patch: Record<string, unknown> = {
            status: args.status,
            updatedAt: Date.now(),
        };
        if (args.terminationReason !== undefined) {
            patch.terminationReason = args.terminationReason;
        }
        if (
            args.status === "FAILED" ||
            args.status === "TERMINATED" ||
            args.status === "REJECTED" ||
            args.status === "MISSED"
        ) {
            patch.endedAt = Date.now();
        }
        await ctx.db.patch(args.callId, patch);
    },
});
