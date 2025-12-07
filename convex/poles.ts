/**
 * POLES (SERVICES/DEPARTMENTS) FUNCTIONS
 * 
 * CRUD operations for poles.
 */

import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get all poles for the current organization
export const list = query({
    args: { organizationId: v.optional(v.id("organizations")) },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) return { poles: [], total: 0 };

        // Determine org ID (from args or user's session/membership)
        // Ideally we should look up the user's current organization
        // For now, let's assume we find it via membership if not provided
        let orgId = args.organizationId;
        if (!orgId) {
            // Find first org membership as fallback
            const membership = await ctx.db
                .query("memberships")
                .withIndex("by_user", (q) => q.eq("userId", userId))
                .first();
            if (membership) orgId = membership.organizationId;
        }

        if (!orgId) {
            return { poles: [], total: 0 };
        }

        const poles = await ctx.db
            .query("poles")
            .withIndex("by_organization", (q) => q.eq("organizationId", orgId!))
            .collect();

        // Enrich with member count
        const polesWithCounts = await Promise.all(poles.map(async (pole) => {
            const members = await ctx.db
                .query("memberships")
                .collect();
            // We can't query by poleId efficiently without an index if we added it purely as optional
            // But generally data is small enough to filter in memory for now or adding index later.
            // Actually we added index logic in concept but schema defineTable doesn't automatically index optional fields unless specified.
            // Filtering in memory for the prototype.

            const count = members.filter(m => m.organizationId === pole.organizationId && m.poleId === pole._id).length;

            return {
                id: pole._id,
                name: pole.name,
                description: pole.description,
                color: pole.color,
                icon: pole.icon,
                memberCount: count,
                createdAt: pole.createdAt
            };
        }));

        return {
            poles: polesWithCounts,
            total: poles.length
        };
    },
});

export const create = mutation({
    args: {
        organizationId: v.optional(v.id("organizations")), // Optional if implied
        name: v.string(),
        description: v.optional(v.string()),
        color: v.string(),
        icon: v.string(),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        // Resolve Org ID (Similar logic to list)
        let orgId = args.organizationId;
        if (!orgId) {
            const membership = await ctx.db
                .query("memberships")
                .withIndex("by_user", (q) => q.eq("userId", userId))
                .first();
            if (membership) orgId = membership.organizationId;
        }
        if (!orgId) throw new Error("No organization found");

        const poleId = await ctx.db.insert("poles", {
            organizationId: orgId,
            name: args.name,
            description: args.description,
            color: args.color,
            icon: args.icon,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        return poleId;
    }
});

export const update = mutation({
    args: {
        id: v.id("poles"),
        name: v.string(),
        description: v.optional(v.string()),
        color: v.string(),
        icon: v.string(),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        await ctx.db.patch(args.id, {
            name: args.name,
            description: args.description,
            color: args.color,
            icon: args.icon,
            updatedAt: Date.now(),
        });
    }
});

export const remove = mutation({
    args: {
        id: v.id("poles"),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        // Unassign members from this pole
        const members = await ctx.db.query("memberships").filter(q => q.eq(q.field("poleId"), args.id)).collect();

        for (const member of members) {
            await ctx.db.patch(member._id, { poleId: undefined });
        }

        await ctx.db.delete(args.id);
    }
});
