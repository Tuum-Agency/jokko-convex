import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireMembership, requirePermission } from "./lib/auth";
import { getAuthUserId } from "@convex-dev/auth/server";

// ============================================
// Queries
// ============================================

export const list = query({
    args: { organizationId: v.id("organizations") },
    handler: async (ctx, args) => {
        await requireMembership(ctx, args.organizationId);

        const teams = await ctx.db
            .query("teams")
            .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
            .collect();

        // Enrich with member count
        const enriched = await Promise.all(
            teams
                .filter((t) => !t.isArchived)
                .map(async (team) => {
                    const members = await ctx.db
                        .query("teamMembers")
                        .withIndex("by_team", (q) => q.eq("teamId", team._id))
                        .collect();

                    return {
                        ...team,
                        memberCount: members.length,
                    };
                })
        );

        return enriched;
    },
});

export const getById = query({
    args: { id: v.id("teams") },
    handler: async (ctx, args) => {
        const team = await ctx.db.get(args.id);
        if (!team) return null;

        await requireMembership(ctx, team.organizationId);

        const members = await ctx.db
            .query("teamMembers")
            .withIndex("by_team", (q) => q.eq("teamId", team._id))
            .collect();

        // Enrich members with user info
        const enrichedMembers = await Promise.all(
            members.map(async (m) => {
                const user = await ctx.db.get(m.userId);
                return {
                    ...m,
                    user: user ? { name: user.name, email: user.email, image: user.image } : null,
                };
            })
        );

        return { ...team, members: enrichedMembers };
    },
});

export const listMyTeams = query({
    args: { organizationId: v.id("organizations") },
    handler: async (ctx, args) => {
        const { userId } = await requireMembership(ctx, args.organizationId);

        const myMemberships = await ctx.db
            .query("teamMembers")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .collect();

        const teams = await Promise.all(
            myMemberships.map(async (m) => {
                const team = await ctx.db.get(m.teamId);
                if (!team || team.organizationId !== args.organizationId || team.isArchived) return null;
                return { ...team, myRole: m.role };
            })
        );

        return teams.filter(Boolean);
    },
});

// ============================================
// Mutations
// ============================================

export const create = mutation({
    args: {
        organizationId: v.id("organizations"),
        name: v.string(),
        description: v.optional(v.string()),
        color: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const { userId } = await requirePermission(ctx, args.organizationId, "teams:create");

        const teamId = await ctx.db.insert("teams", {
            organizationId: args.organizationId,
            name: args.name,
            description: args.description,
            color: args.color,
            createdBy: userId,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        return teamId;
    },
});

export const update = mutation({
    args: {
        id: v.id("teams"),
        name: v.optional(v.string()),
        description: v.optional(v.string()),
        color: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const team = await ctx.db.get(args.id);
        if (!team) throw new Error("Team not found");

        await requirePermission(ctx, team.organizationId, "teams:update");

        const updates: Record<string, any> = { updatedAt: Date.now() };
        if (args.name !== undefined) updates.name = args.name;
        if (args.description !== undefined) updates.description = args.description;
        if (args.color !== undefined) updates.color = args.color;

        await ctx.db.patch(args.id, updates);
    },
});

export const archive = mutation({
    args: { id: v.id("teams") },
    handler: async (ctx, args) => {
        const team = await ctx.db.get(args.id);
        if (!team) throw new Error("Team not found");

        await requirePermission(ctx, team.organizationId, "teams:delete");

        await ctx.db.patch(args.id, { isArchived: true, updatedAt: Date.now() });
    },
});

export const addMember = mutation({
    args: {
        teamId: v.id("teams"),
        userId: v.id("users"),
        role: v.union(v.literal("lead"), v.literal("member")),
    },
    handler: async (ctx, args) => {
        const team = await ctx.db.get(args.teamId);
        if (!team) throw new Error("Team not found");

        await requirePermission(ctx, team.organizationId, "teams:manage_members");

        // Guard: verify target user is a member of the same org
        const targetMembership = await ctx.db
            .query("memberships")
            .withIndex("by_user_org", (q) =>
                q.eq("userId", args.userId).eq("organizationId", team.organizationId)
            )
            .first();
        if (!targetMembership) throw new Error("User is not a member of this organization");

        // Guard: unique membership
        const existing = await ctx.db
            .query("teamMembers")
            .withIndex("by_team_user", (q) =>
                q.eq("teamId", args.teamId).eq("userId", args.userId)
            )
            .first();
        if (existing) throw new Error("User is already a member of this team");

        await ctx.db.insert("teamMembers", {
            teamId: args.teamId,
            userId: args.userId,
            role: args.role,
            joinedAt: Date.now(),
        });
    },
});

export const removeMember = mutation({
    args: {
        teamId: v.id("teams"),
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const team = await ctx.db.get(args.teamId);
        if (!team) throw new Error("Team not found");

        await requirePermission(ctx, team.organizationId, "teams:manage_members");

        const member = await ctx.db
            .query("teamMembers")
            .withIndex("by_team_user", (q) =>
                q.eq("teamId", args.teamId).eq("userId", args.userId)
            )
            .first();

        if (!member) throw new Error("User is not a member of this team");

        await ctx.db.delete(member._id);
    },
});

export const updateMemberRole = mutation({
    args: {
        teamId: v.id("teams"),
        userId: v.id("users"),
        role: v.union(v.literal("lead"), v.literal("member")),
    },
    handler: async (ctx, args) => {
        const team = await ctx.db.get(args.teamId);
        if (!team) throw new Error("Team not found");

        await requirePermission(ctx, team.organizationId, "teams:manage_members");

        const member = await ctx.db
            .query("teamMembers")
            .withIndex("by_team_user", (q) =>
                q.eq("teamId", args.teamId).eq("userId", args.userId)
            )
            .first();

        if (!member) throw new Error("User is not a member of this team");

        await ctx.db.patch(member._id, { role: args.role });
    },
});
