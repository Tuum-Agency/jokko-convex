import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { encrypt } from "./lib/encryption";
import { assertWithinLimit } from "./lib/planLimits";

const BATCH_SIZE = 200;

export const getMigrationStatus = internalQuery({
    args: { organizationId: v.id("organizations") },
    handler: async (ctx, args) => {
        const org = await ctx.db.get(args.organizationId);
        if (!org) return null;

        // Count conversations without whatsappChannelId
        const allConvos = await ctx.db
            .query("conversations")
            .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
            .collect();

        const withoutChannel = allConvos.filter((c) => !c.whatsappChannelId && c.channel === "WHATSAPP");

        // Count flows without whatsappChannelId
        const allFlows = await ctx.db
            .query("flows")
            .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
            .collect();
        const flowsWithoutChannel = allFlows.filter((f) => !f.whatsappChannelId);

        // Count broadcasts without whatsappChannelId
        const allBroadcasts = await ctx.db
            .query("broadcasts")
            .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
            .collect();
        const broadcastsWithoutChannel = allBroadcasts.filter((b) => !b.whatsappChannelId);

        // Check if WABA and channel exist
        const wabas = await ctx.db
            .query("wabas")
            .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
            .collect();

        const channels = await ctx.db
            .query("whatsappChannels")
            .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
            .collect();

        return {
            hasLegacyWhatsApp: !!org.whatsapp?.phoneNumberId,
            wabaCount: wabas.length,
            channelCount: channels.length,
            conversations: {
                total: allConvos.filter((c) => c.channel === "WHATSAPP").length,
                withoutChannel: withoutChannel.length,
            },
            flows: {
                total: allFlows.length,
                withoutChannel: flowsWithoutChannel.length,
            },
            broadcasts: {
                total: allBroadcasts.length,
                withoutChannel: broadcastsWithoutChannel.length,
            },
        };
    },
});

export const migrateOrg = internalMutation({
    args: {
        organizationId: v.id("organizations"),
        createdBy: v.id("users"),
    },
    handler: async (ctx, args) => {
        const org = await ctx.db.get(args.organizationId);
        if (!org) throw new Error("Organization not found");
        if (!org.whatsapp?.phoneNumberId) {
            return { status: "skipped", reason: "No legacy WhatsApp config" };
        }

        const { phoneNumberId, businessAccountId, accessToken, webhookVerifyToken, displayPhoneNumber, verifiedName } = org.whatsapp;

        // 1. Create or get WABA (idempotent)
        let waba = await ctx.db
            .query("wabas")
            .withIndex("by_meta_waba_id", (q) => q.eq("metaBusinessAccountId", businessAccountId))
            .first();

        let wabaId: Id<"wabas">;
        if (waba) {
            wabaId = waba._id;
        } else {
            const encryptedToken = await encrypt(accessToken);
            wabaId = await ctx.db.insert("wabas", {
                organizationId: args.organizationId,
                metaBusinessAccountId: businessAccountId,
                accessTokenRef: encryptedToken,
                label: org.name,
                createdBy: args.createdBy,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });
        }

        // 2. Create channel (idempotent — check by phoneNumberId)
        let channel = await ctx.db
            .query("whatsappChannels")
            .withIndex("by_phone_id", (q) => q.eq("phoneNumberId", phoneNumberId))
            .first();

        let channelId: Id<"whatsappChannels">;
        if (channel) {
            channelId = channel._id;
        } else {
            // Guard plan limit — même en migration on respecte le quota.
            // Évite qu'une org en FREE/STARTER se retrouve avec 2 canaux
            // après migration depuis le format legacy org.whatsapp.
            await assertWithinLimit(ctx, args.organizationId, "channels");
            channelId = await ctx.db.insert("whatsappChannels", {
                organizationId: args.organizationId,
                wabaId,
                label: displayPhoneNumber || phoneNumberId,
                phoneNumberId,
                displayPhoneNumber: displayPhoneNumber || phoneNumberId,
                verifiedName,
                webhookVerifyTokenRef: webhookVerifyToken,
                isOrgDefault: true,
                status: "active",
                createdBy: args.createdBy,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });
        }

        return { status: "created", wabaId, channelId };
    },
});

export const backfillConversations = internalMutation({
    args: {
        organizationId: v.id("organizations"),
        channelId: v.id("whatsappChannels"),
        cursor: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const conversations = await ctx.db
            .query("conversations")
            .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
            .collect();

        const toUpdate = conversations
            .filter((c) => c.channel === "WHATSAPP" && !c.whatsappChannelId)
            .slice(0, BATCH_SIZE);

        for (const conv of toUpdate) {
            await ctx.db.patch(conv._id, { whatsappChannelId: args.channelId });
        }

        const remaining = conversations.filter(
            (c) => c.channel === "WHATSAPP" && !c.whatsappChannelId
        ).length - toUpdate.length;

        return {
            updated: toUpdate.length,
            remaining,
            done: remaining === 0,
        };
    },
});

export const backfillFlows = internalMutation({
    args: {
        organizationId: v.id("organizations"),
        channelId: v.id("whatsappChannels"),
    },
    handler: async (ctx, args) => {
        const flows = await ctx.db
            .query("flows")
            .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
            .collect();

        const toUpdate = flows.filter((f) => !f.whatsappChannelId).slice(0, BATCH_SIZE);

        for (const flow of toUpdate) {
            await ctx.db.patch(flow._id, { whatsappChannelId: args.channelId });
        }

        return { updated: toUpdate.length };
    },
});

export const backfillBroadcasts = internalMutation({
    args: {
        organizationId: v.id("organizations"),
        channelId: v.id("whatsappChannels"),
    },
    handler: async (ctx, args) => {
        const broadcasts = await ctx.db
            .query("broadcasts")
            .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
            .collect();

        const toUpdate = broadcasts.filter((b) => !b.whatsappChannelId).slice(0, BATCH_SIZE);

        for (const broadcast of toUpdate) {
            await ctx.db.patch(broadcast._id, { whatsappChannelId: args.channelId });
        }

        return { updated: toUpdate.length };
    },
});
