import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// List broadcasts for the current organization
export const list = query({
    args: {
        search: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const user = await ctx.db.get(userId);
        if (!user) throw new Error("User not found");

        // Get user's current organization from session
        const session = await ctx.db
            .query("userSessions")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .first();

        if (!session?.currentOrganizationId) {
            return [];
        }

        const organizationId = session.currentOrganizationId;

        // Fetch broadcasts
        // TODO: Implement search if needed, for now just list all by org
        const broadcasts = await ctx.db
            .query("broadcasts")
            .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
            .order("desc")
            .collect();

        // Enrich with template name ?
        // Doing it client side or here? Let's do it here to accept fewer roundtrips if possible,
        // but `Promise.all` is cheap here.
        const enrichedBroadcasts = await Promise.all(
            broadcasts.map(async (b) => {
                const template = await ctx.db.get(b.templateId);
                return {
                    ...b,
                    templateName: template?.name || "Unknown Template"
                };
            })
        );

        // Filter by search if provided (client-side style filtering for now as name is not indexed for search yet or we use simple filter)
        if (args.search) {
            const lowerSearch = args.search.toLowerCase();
            return enrichedBroadcasts.filter(b =>
                b.name.toLowerCase().includes(lowerSearch) ||
                b.templateName.toLowerCase().includes(lowerSearch)
            );
        }

        return enrichedBroadcasts;
    },
});

export const get = query({
    args: { id: v.id("broadcasts") },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const broadcast = await ctx.db.get(args.id);
        if (!broadcast) return null;

        // Check organization access
        const session = await ctx.db
            .query("userSessions")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .first();

        if (session?.currentOrganizationId !== broadcast.organizationId) {
            throw new Error("Unauthorized access to this broadcast");
        }

        const template = await ctx.db.get(broadcast.templateId);

        return {
            ...broadcast,
            template
        };
    },
});

export const create = mutation({
    args: {
        name: v.string(),
        templateId: v.id("templates"),
        scheduledAt: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const session = await ctx.db
            .query("userSessions")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .first();

        if (!session?.currentOrganizationId) {
            throw new Error("No organization selected");
        }

        const id = await ctx.db.insert("broadcasts", {
            organizationId: session.currentOrganizationId,
            name: args.name,
            templateId: args.templateId,
            status: args.scheduledAt ? "SCHEDULED" : "DRAFT",
            scheduledAt: args.scheduledAt,
            sentCount: 0,
            deliveredCount: 0,
            readCount: 0,
            repliedCount: 0,
            failedCount: 0,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        return id;
    },
});
