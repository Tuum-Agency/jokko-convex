import { v } from "convex/values";
import { mutation, query, internalMutation, internalQuery } from "./_generated/server";
import { requireMembership, requirePermission } from "./lib/auth";
import { getMaxChannels, isUnlimited } from "./lib/planHelpers";
import { encrypt } from "./lib/encryption";

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

        // Enrich with pole, team, and WABA label
        const enriched = await Promise.all(
            channels.map(async (ch) => {
                const team = ch.primaryTeamId ? await ctx.db.get(ch.primaryTeamId) : null;
                const pole = ch.poleId ? await ctx.db.get(ch.poleId) : null;
                const waba = await ctx.db.get(ch.wabaId);
                // Strip sensitive token fields before returning to client
                const { webhookVerifyTokenRef, ...safeChannel } = ch as any;
                return {
                    ...safeChannel,
                    primaryTeam: team ? { _id: team._id, name: team.name, color: team.color } : null,
                    pole: pole ? { _id: pole._id, name: pole.name, color: pole.color, icon: pole.icon } : null,
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

        // Strip sensitive token fields
        const { webhookVerifyTokenRef, ...safeChannel } = channel as any;
        return {
            ...safeChannel,
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
// Internal Queries (for actions)
// ============================================

export const getChannelWithWaba = internalQuery({
    args: { channelId: v.id("whatsappChannels") },
    handler: async (ctx, args) => {
        const channel = await ctx.db.get(args.channelId);
        if (!channel) throw new Error(`Channel ${args.channelId} not found`);

        const waba = await ctx.db.get(channel.wabaId);
        const org = await ctx.db.get(channel.organizationId);

        return {
            ...channel,
            waba: waba ? {
                _id: waba._id,
                metaBusinessAccountId: waba.metaBusinessAccountId,
                accessTokenRef: waba.accessTokenRef,
                label: waba.label,
            } : null,
            orgWhatsapp: org?.whatsapp ?? null,
        };
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

        // Exclure "disabled" ET "banned" — cohérent avec planLimits.ts et
        // enforceChannelDowngrade. Un canal banned par Meta ne doit pas compter
        // dans le quota (sinon on bloque la création d'un remplaçant).
        const activeChannels = existingChannels.filter(
            (c) => c.status !== "disabled" && c.status !== "banned",
        );
        const maxChannels = await getMaxChannels(ctx, org.plan);

        if (!isUnlimited(maxChannels) && activeChannels.length >= maxChannels) {
            throw new Error(`Channel limit reached for ${org.plan} plan (max: ${maxChannels})`);
        }

        // Reconnect: if phone already exists in same org, update and reactivate
        const existingPhone = await ctx.db
            .query("whatsappChannels")
            .withIndex("by_phone_id", (q) => q.eq("phoneNumberId", args.phoneNumberId))
            .first();
        if (existingPhone) {
            if (existingPhone.organizationId !== args.organizationId) {
                throw new Error("This phone number is already registered by another organization");
            }
            await ctx.db.patch(existingPhone._id, {
                wabaId: args.wabaId,
                status: "active",
                label: args.label,
                displayPhoneNumber: args.displayPhoneNumber,
                verifiedName: args.verifiedName,
                updatedAt: Date.now(),
            });
            return existingPhone._id;
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
        poleId: v.optional(v.id("poles")),
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

        // Guard: org coherence for pole
        if (args.poleId) {
            const pole = await ctx.db.get(args.poleId);
            if (!pole || pole.organizationId !== channel.organizationId) {
                throw new Error("Pole does not belong to this organization");
            }
        }

        const updates: Record<string, any> = { updatedAt: Date.now() };
        if (args.label !== undefined) updates.label = args.label;
        if (args.primaryTeamId !== undefined) updates.primaryTeamId = args.primaryTeamId;
        if (args.poleId !== undefined) updates.poleId = args.poleId;

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
        const encryptedToken = await encrypt(args.accessTokenRef);

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
            // Always refresh the access token on reconnect
            await ctx.db.patch(existing._id, {
                accessTokenRef: encryptedToken,
                updatedAt: Date.now(),
            });
            return existing._id;
        }

        return await ctx.db.insert("wabas", {
            organizationId: args.organizationId,
            metaBusinessAccountId: args.metaBusinessAccountId,
            accessTokenRef: encryptedToken,
            label: args.label,
            createdBy: args.createdBy,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
    },
});

export const internalCreate = internalMutation({
    args: {
        organizationId: v.id("organizations"),
        wabaId: v.id("wabas"),
        label: v.string(),
        phoneNumberId: v.string(),
        displayPhoneNumber: v.string(),
        verifiedName: v.optional(v.string()),
        isOrgDefault: v.optional(v.boolean()),
        createdBy: v.id("users"),
    },
    handler: async (ctx, args) => {
        // Guard: org coherence for WABA
        const waba = await ctx.db.get(args.wabaId);
        if (!waba || waba.organizationId !== args.organizationId) {
            throw new Error("WABA does not belong to this organization");
        }

        // Guard: plan limit
        const org = await ctx.db.get(args.organizationId);
        if (!org) throw new Error("Organization not found");

        const existingChannels = await ctx.db
            .query("whatsappChannels")
            .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
            .collect();

        // Exclure "disabled" ET "banned" — cohérent avec planLimits.ts et
        // enforceChannelDowngrade. Un canal banned par Meta ne doit pas compter
        // dans le quota (sinon on bloque la création d'un remplaçant).
        const activeChannels = existingChannels.filter(
            (c) => c.status !== "disabled" && c.status !== "banned",
        );
        const maxChannels = await getMaxChannels(ctx, org.plan);

        if (!isUnlimited(maxChannels) && activeChannels.length >= maxChannels) {
            throw new Error(`Channel limit reached for ${org.plan} plan (max: ${maxChannels})`);
        }

        // Reconnect: if phone already exists in same org, update and reactivate
        const existingPhone = await ctx.db
            .query("whatsappChannels")
            .withIndex("by_phone_id", (q) => q.eq("phoneNumberId", args.phoneNumberId))
            .first();
        if (existingPhone) {
            if (existingPhone.organizationId !== args.organizationId) {
                throw new Error("This phone number is already registered by another organization");
            }
            await ctx.db.patch(existingPhone._id, {
                wabaId: args.wabaId,
                status: "active",
                label: args.label,
                displayPhoneNumber: args.displayPhoneNumber,
                verifiedName: args.verifiedName,
                updatedAt: Date.now(),
            });
            return existingPhone._id;
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
            label: args.label,
            phoneNumberId: args.phoneNumberId,
            displayPhoneNumber: args.displayPhoneNumber,
            verifiedName: args.verifiedName,
            webhookVerifyTokenRef: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || "",
            isOrgDefault: isDefault,
            status: "active",
            createdBy: args.createdBy,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        return channelId;
    },
});

export const getOrgDefaultWabaCredentials = internalQuery({
    args: { organizationId: v.id("organizations") },
    handler: async (ctx, args) => {
        // Find the org's default channel, or first active channel
        const defaultChannel = await ctx.db
            .query("whatsappChannels")
            .withIndex("by_org_default", (q) =>
                q.eq("organizationId", args.organizationId).eq("isOrgDefault", true)
            )
            .first();

        const channel = defaultChannel || await ctx.db
            .query("whatsappChannels")
            .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
            .filter((q) => q.eq(q.field("status"), "active"))
            .first();

        if (!channel) {
            // Fallback to legacy org.whatsapp
            const org = await ctx.db.get(args.organizationId);
            return {
                accessToken: org?.whatsapp?.accessToken || null,
                businessAccountId: null,
            };
        }

        const waba = await ctx.db.get(channel.wabaId);
        const org = await ctx.db.get(args.organizationId);

        return {
            accessToken: waba?.accessTokenRef || org?.whatsapp?.accessToken || null,
            businessAccountId: waba?.metaBusinessAccountId || null,
        };
    },
});

export const updateLastWebhookAt = internalMutation({
    args: { channelId: v.id("whatsappChannels") },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.channelId, { lastWebhookAt: Date.now() });
    },
});

export const markChannelError = internalMutation({
    args: {
        channelId: v.id("whatsappChannels"),
        status: v.union(v.literal("error"), v.literal("disconnected")),
    },
    handler: async (ctx, args) => {
        const channel = await ctx.db.get(args.channelId);
        if (channel && channel.status === "active") {
            await ctx.db.patch(args.channelId, {
                status: args.status,
                updatedAt: Date.now(),
            });
        }
    },
});
