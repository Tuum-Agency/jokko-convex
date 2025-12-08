import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Helper to get current Org ID
async function getCurrentOrgId(ctx: any) {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
        throw new Error("Unauthorized");
    }

    const session = await ctx.db
        .query("userSessions")
        .withIndex("by_user", (q: any) => q.eq("userId", userId))
        .first();

    if (!session || !session.currentOrganizationId) {
        throw new Error("Unauthorized: No active organization");
    }

    return session.currentOrganizationId;
}

export const list = query({
    args: {},
    handler: async (ctx) => {
        const organizationId = await getCurrentOrgId(ctx);

        return await ctx.db
            .query("flows")
            .withIndex("by_organization", (q) =>
                q.eq("organizationId", organizationId)
            )
            .order("desc")
            .collect();
    },
});

export const get = query({
    args: { flowId: v.id("flows") },
    handler: async (ctx, args) => {
        const flow = await ctx.db.get(args.flowId);
        if (!flow) {
            throw new Error("Flow not found");
        }

        // Ensure user belongs to the flow's organization
        const organizationId = await getCurrentOrgId(ctx);
        if (flow.organizationId !== organizationId) {
            throw new Error("Unauthorized");
        }

        return flow;
    },
});

export const create = mutation({
    args: {
        name: v.string(),
        description: v.optional(v.string()),
        triggerType: v.string(),
    },
    handler: async (ctx, args) => {
        const organizationId = await getCurrentOrgId(ctx);

        const flowId = await ctx.db.insert("flows", {
            organizationId,
            name: args.name,
            description: args.description,
            triggerType: args.triggerType,
            nodes: "[]", // Start with empty array
            edges: "[]", // Start with empty array
            isActive: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
        return flowId;
    },
});

export const createFromAI = mutation({
    args: {
        name: v.string(),
        description: v.optional(v.string()),
        nodes: v.string(),
        edges: v.string(),
    },
    handler: async (ctx, args) => {
        const organizationId = await getCurrentOrgId(ctx);

        const flowId = await ctx.db.insert("flows", {
            organizationId,
            name: args.name,
            description: args.description,
            triggerType: "AI_GENERATED",
            nodes: args.nodes,
            edges: args.edges,
            isActive: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        return flowId;
    },
});

export const update = mutation({
    args: {
        flowId: v.id("flows"),
        name: v.optional(v.string()),
        description: v.optional(v.string()),
        nodes: v.optional(v.string()),
        edges: v.optional(v.string()),
        isActive: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const flow = await ctx.db.get(args.flowId);
        if (!flow) {
            throw new Error("Flow not found");
        }

        const organizationId = await getCurrentOrgId(ctx);
        if (flow.organizationId !== organizationId) {
            throw new Error("Unauthorized");
        }

        const { flowId, ...updates } = args;
        await ctx.db.patch(flowId, {
            ...updates,
            updatedAt: Date.now(),
        });
    },
});

export const deleteFlow = mutation({
    args: { flowId: v.id("flows") },
    handler: async (ctx, args) => {
        const flow = await ctx.db.get(args.flowId);
        if (!flow) {
            throw new Error("Flow not found");
        }

        const organizationId = await getCurrentOrgId(ctx);
        if (flow.organizationId !== organizationId) {
            throw new Error("Unauthorized");
        }

        await ctx.db.delete(args.flowId);
    },
});
