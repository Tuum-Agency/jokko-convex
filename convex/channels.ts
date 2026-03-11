import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { requireMembership, requirePermission } from "./lib/auth";
import { getMaxChannels } from "./lib/planLimits";

// ============================================
// Queries
// ============================================

export const list = query({
    args: { organizationId: v.id("organizations") },
    handler: async (ctx, args) => {
        await requireMembership(ctx, args.organizationId);

        const channels = await ctx.db
            .query("whatsappChannels")
            .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
            .collect();

        // Enrich with team name and WABA label
        const enriched = await Promise.all(
            channels.map(async (ch) => {
                const team = ch.primaryTeamId ? await ctx.db.get(ch.primaryTeamId) : null;
                const waba = await ctx.db.get(ch.wabaId);
                return {
                    ...ch,
                    primaryTeam: team ? { _id: team._id, name: team.name, color: team.color } : null,
                    waba: waba ? { _id: waba._id, label: waba.label, metaBusinessAccountId: waba.metaBusinessAccountId } : null,
                };
            })
        );

        return enriched;
    },
});

export const getById = query({
    args: { id: v.id("whatsappChannels") },
    handler: async (ctx, args) => {
        const channel = await ctx.db.get(args.id);
        if (!channel) return null;

        await requireMembership(ctx, channel.organizationId);

        const team = channel.primaryTeamId ? await ctx.db.get(channel.primaryTeamId) : null;
        const waba = await ctx.db.get(channel.wabaId);

        return {
            ...channel,
            primaryTeam: team ? { _id: team._id, name: team.name } : null,
            waba: waba ? { _id: waba._id, label: waba.label, metaBusinessAccountId: waba.metaBusinessAccountId } : null,
        };
    },
});

export const getOrgDefault = query({
    args: { organizationId: v.id("organizations") },
    handler: async (ctx, args) => {
        await requireMembership(ctx, args.organizationId);

        return await ctx.db
            .query("whatsappChannels")
            .withIndex("by_org_default", (q) =>
                q.eq("organizationId", args.organizationId).eq("isOrgDefault", true)
            )
            .first();
    },
});

// ============================================
// Mutations
// ============================================

export const create = mutation({
    args: {
        organizationId: v.id("organizations"),
        wabaId: v.id("wabas"),
        label: v.string(),
        phoneNumberId: v.string(),
        displayPhoneNumber: v.string(),
        verifiedName: v.optional(v.string()),
        primaryTeamId: v.optional(v.id("teams")),
        isOrgDefault: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const { userId } = await requirePermission(ctx, args.organizationId, "channels:create");

        // Guard: org coherence for WABA
        const waba = await ctx.db.get(args.wabaId);
        if (!waba || waba.organizationId !== args.organizationId) {
            throw new Error("WABA does not belong to this organization");
        }

        // Guard: org coherence for team
        if (args.primaryTeamId) {
            const team = await ctx.db.get(args.primaryTeamId);
            if (!team || team.organizationId !== args.organizationId) {
                throw new Error("Team does not belong to this organization");
            }
        }

        // Guard: plan limit
        const org = await ctx.db.get(args.organizationId);
        if (!org) throw new Error("Organization not found");

        const existingChannels = await ctx.db
            .query("whatsappChannels")
            .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
            .collect();

        const activeChannels = existingChannels.filter((c) => c.status !== "disabled");
        const maxChannels = getMaxChannels(org.plan);

        if (activeChannels.length >= maxChannels) {
            throw new Error(`Channel limit reached for ${org.plan} plan (max: ${maxChannels})`);
        }

        // Guard: unique phoneNumberId
        const existingPhone = await ctx.db
            .query("whatsappChannels")
            .withIndex("by_phone_id", (q) => q.eq("phoneNumberId", args.phoneNumberId))
            .first();
        if (existingPhone) {
            throw new Error("This phone number is already registered as a channel");
        }

        // Guard: isOrgDefault uniqueness
        const isDefault = args.isOrgDefault ?? (activeChannels.length === 0);
        if (isDefault) {
            const currentDefault = await ctx.db
                .query("whatsappChannels")
                .withIndex("by_org_default", (q) =>
                    q.eq("organizationId", args.organizationId).eq("isOrgDefault", true)
                )
                .first();
            if (currentDefault) {
                await ctx.db.patch(currentDefault._id, { isOrgDefault: false, updatedAt: Date.now() });
            }
        }

        const channelId = await ctx.db.insert("whatsappChannels", {
            organizationId: args.organizationId,
            wabaId: args.wabaId,
            primaryTeamId: args.primaryTeamId,
            label: args.label,
            phoneNumberId: args.phoneNumberId,
            displayPhoneNumber: args.displayPhoneNumber,
            verifiedName: args.verifiedName,
            webhookVerifyTokenRef: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || "",
            isOrgDefault: isDefault,
            status: "active",
            createdBy: userId,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        return channelId;
    },
});

export const update = mutation({
    args: {
        id: v.id("whatsappChannels"),
        label: v.optional(v.string()),
        primaryTeamId: v.optional(v.id("teams")),
    },
    handler: async (ctx, args) => {
        const channel = await ctx.db.get(args.id);
        if (!channel) throw new Error("Channel not found");

        await requirePermission(ctx, channel.organizationId, "channels:update");

        // Guard: org coherence for team
        if (args.primaryTeamId) {
            const team = await ctx.db.get(args.primaryTeamId);
            if (!team || team.organizationId !== channel.organizationId) {
                throw new Error("Team does not belong to this organization");
            }
        }

        const updates: Record<string, any> = { updatedAt: Date.now() };
        if (args.label !== undefined) updates.label = args.label;
        if (args.primaryTeamId !== undefined) updates.primaryTeamId = args.primaryTeamId;

        await ctx.db.patch(args.id, updates);
    },
});

export const disable = mutation({
    args: { id: v.id("whatsappChannels") },
    handler: async (ctx, args) => {
        const channel = await ctx.db.get(args.id);
        if (!channel) throw new Error("Channel not found");

        await requirePermission(ctx, channel.organizationId, "channels:delete");

        if (channel.isOrgDefault) {
            throw new Error("Cannot disable the default channel. Set another channel as default first.");
        }

        await ctx.db.patch(args.id, { status: "disabled", updatedAt: Date.now() });
    },
});

export const setOrgDefault = mutation({
    args: { id: v.id("whatsappChannels") },
    handler: async (ctx, args) => {
        const channel = await ctx.db.get(args.id);
        if (!channel) throw new Error("Channel not found");

        await requirePermission(ctx, channel.organizationId, "channels:update");

        if (channel.status !== "active") {
            throw new Error("Only active channels can be set as default");
        }

        // Remove current default
        const currentDefault = await ctx.db
            .query("whatsappChannels")
            .withIndex("by_org_default", (q) =>
                q.eq("organizationId", channel.organizationId).eq("isOrgDefault", true)
            )
            .first();

        if (currentDefault && currentDefault._id !== channel._id) {
            await ctx.db.patch(currentDefault._id, { isOrgDefault: false, updatedAt: Date.now() });
        }

        await ctx.db.patch(args.id, { isOrgDefault: true, updatedAt: Date.now() });
    },
});

// ============================================
// Internal Mutations (for webhook / migration)
// ============================================

export const getOrCreateWaba = internalMutation({
    args: {
        organizationId: v.id("organizations"),
        metaBusinessAccountId: v.string(),
        accessTokenRef: v.string(),
        createdBy: v.id("users"),
        label: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // Idempotent: check if WABA already exists
        const existing = await ctx.db
            .query("wabas")
            .withIndex("by_meta_waba_id", (q) => q.eq("metaBusinessAccountId", args.metaBusinessAccountId))
            .first();

        if (existing) {
            // Verify org coherence
            if (existing.organizationId !== args.organizationId) {
                throw new Error("This WABA is already linked to another organization");
            }
            return existing._id;
        }

        return await ctx.db.insert("wabas", {
            organizationId: args.organizationId,
            metaBusinessAccountId: args.metaBusinessAccountId,
            accessTokenRef: args.accessTokenRef,
            label: args.label,
            createdBy: args.createdBy,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
    },
});

export const updateLastWebhookAt = internalMutation({
    args: { channelId: v.id("whatsappChannels") },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.channelId, { lastWebhookAt: Date.now() });
    },
});
