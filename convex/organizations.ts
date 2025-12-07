/**
 *   ___                        _          _   _                 
 *  / _ \ _ __ __ _  __ _ _ __ (_)______ _| |_(_) ___  _ __  ___ 
 * | | | | '__/ _` |/ _` | '_ \| |_  / _` | __| |/ _ \| '_ \/ __|
 * | |_| | | | (_| | (_| | | | | |/ / (_| | |_| | (_) | | | \__ \
 *  \___/|_|  \__, |\__,_|_| |_|_/___\__,_|\__|_|\___/|_| |_|___/
 *            |___/                                              
 *
 * ORGANIZATIONS FUNCTIONS
 *
 * CRUD operations for organizations.
 * - listMine: Returns all organizations the user is a member of.
 * - get: Internal helper to fetch an organization by ID.
 */

import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const listMine = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            return [];
        }

        const memberships = await ctx.db
            .query("memberships")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .collect();

        const orgs = await Promise.all(
            memberships.map(async (m) => {
                const org = await ctx.db.get(m.organizationId);
                return org;
            })
        );

        return orgs.filter((org) => org !== null);
    },
});

export const get = query({
    args: { id: v.id("organizations") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    }
});

export const create = mutation({
    args: {
        name: v.string(),
        slug: v.string(),
        businessSector: v.string(),
        website: v.optional(v.string()),
        phone: v.optional(v.string()),
        timezone: v.string(),
        locale: v.string(),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new Error("Unauthorized");
        }

        const existing = await ctx.db
            .query("organizations")
            .withIndex("by_slug", (q) => q.eq("slug", args.slug))
            .first();

        if (existing) {
            throw new Error("Ce nom d'espace (slug) est déjà pris.");
        }

        const orgId = await ctx.db.insert("organizations", {
            name: args.name,
            slug: args.slug,
            businessSector: args.businessSector,
            website: args.website,
            phone: args.phone,
            timezone: args.timezone,
            locale: args.locale,
            onboardingStep: "WHATSAPP_CONNECT", // Next step
            ownerId: userId,
            plan: "FREE",
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        await ctx.db.insert("memberships", {
            userId,
            organizationId: orgId,
            role: "OWNER",
            status: "ONLINE",
            maxConversations: 100,
            activeConversations: 0,
            lastSeenAt: Date.now(),
            joinedAt: Date.now(),
        });

        // Auto-switch to new org
        const session = await ctx.db
            .query("userSessions")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .first();

        if (session) {
            await ctx.db.patch(session._id, {
                currentOrganizationId: orgId,
                lastActivityAt: Date.now(),
            });
        } else {
            await ctx.db.insert("userSessions", {
                userId,
                currentOrganizationId: orgId,
                lastActivityAt: Date.now(),
            });
        }

        return orgId;
    },
});

export const checkSlug = query({
    args: { slug: v.string() },
    handler: async (ctx, args) => {

        const existing = await ctx.db
            .query("organizations")
            .withIndex("by_slug", (q) => q.eq("slug", args.slug))
            .first();

        return !existing;
    },
});
