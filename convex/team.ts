/**
 * TEAM MEMBERS FUNCTIONS
 * 
 * Operations for listing and managing team members.
 */

import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { getMaxAgents } from "./lib/planLimits";

export const listMembers = query({
    args: { organizationId: v.optional(v.id("organizations")) },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) return { members: [], total: 0, currentUserRole: 'agent' };

        // Resolve Org ID
        let orgId = args.organizationId;
        let currentUserRole = "agent";

        if (!orgId) {
            const membership = await ctx.db
                .query("memberships")
                .withIndex("by_user", (q) => q.eq("userId", userId))
                .first();
            if (membership) {
                orgId = membership.organizationId;
                currentUserRole = membership.role.toLowerCase();
            }
        } else {
            // Fetch role for requested org
            const membership = await ctx.db
                .query("memberships")
                .withIndex("by_user_org", (q) => q.eq("userId", userId).eq("organizationId", orgId!))
                .first();
            if (membership) currentUserRole = membership.role.toLowerCase();
        }

        if (!orgId) return { members: [], total: 0, currentUserRole, limit: 3 };

        const memberships = await ctx.db
            .query("memberships")
            .withIndex("by_organization", (q) => q.eq("organizationId", orgId!))
            .collect();

        // Get Limit
        const org = await ctx.db.get(orgId!);
        const limit = org ? getMaxAgents(org.plan) : 1;

        const members = await Promise.all(memberships.map(async (m) => {
            const user = await ctx.db.get(m.userId);
            if (!user) return null;

            return {
                id: m._id, // Membership ID used as Member ID in frontend
                userId: m.userId, // User ID for assignment
                role: m.role.toLowerCase(),
                poleId: m.poleId,
                joinedAt: new Date(m.joinedAt).toISOString(),
                user: {
                    id: m.userId, // Also put it here for consistency if needed
                    name: user.name || "Unknown",
                    email: user.email,
                    avatar: user.image,
                }
            };
        }));

        const validMembers = members.filter(Boolean);
        // Owner doesn't count against the agent seat limit
        const nonOwnerCount = validMembers.filter(m => m!.role !== "owner").length;
        const planName = org?.plan || "FREE";

        return {
            members: validMembers,
            total: validMembers.length,
            nonOwnerCount,
            currentUserRole,
            limit,
            planName,
        };
    }
});

export const updateRole = mutation({
    args: {
        membershipId: v.id("memberships"),
        role: v.string(), // "admin" | "agent" | "owner"
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        // Verify permission: Current user must be owner or admin
        // And generally check hierarchy (Owner > Admin > Agent)
        // Simplified here:

        const targetMembership = await ctx.db.get(args.membershipId);
        if (!targetMembership) throw new Error("Member not found");

        const requesterMembership = await ctx.db
            .query("memberships")
            .withIndex("by_user_org", (q) => q.eq("userId", userId).eq("organizationId", targetMembership.organizationId))
            .first();

        if (!requesterMembership) throw new Error("You are not in this organization");
        if (requesterMembership.role !== "OWNER" && requesterMembership.role !== "ADMIN") {
            throw new Error("Insufficient permissions");
        }

        // Map frontend role string to schema enum
        const roleEnum = args.role.toUpperCase() as "ADMIN" | "AGENT" | "OWNER";

        // Only OWNER can assign the OWNER role
        if (roleEnum === "OWNER" && requesterMembership.role !== "OWNER") {
            throw new Error("Seul le propriétaire peut assigner le rôle OWNER");
        }

        // ADMIN cannot promote to ADMIN (only OWNER can)
        if (roleEnum === "ADMIN" && requesterMembership.role === "ADMIN") {
            throw new Error("Seul le propriétaire peut promouvoir au rôle ADMIN");
        }

        await ctx.db.patch(args.membershipId, { role: roleEnum });
    }
});

export const removeMember = mutation({
    args: {
        membershipId: v.id("memberships"),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const targetMembership = await ctx.db.get(args.membershipId);
        if (!targetMembership) throw new Error("Member not found");

        // Check Permissions
        const requesterMembership = await ctx.db
            .query("memberships")
            .withIndex("by_user_org", (q) => q.eq("userId", userId).eq("organizationId", targetMembership.organizationId))
            .first();

        if (!requesterMembership || (requesterMembership.role !== "OWNER" && requesterMembership.role !== "ADMIN")) {
            throw new Error("Insufficient permissions");
        }

        // Cannot remove owner unless you are the owner (and even then, usually involves transfer)
        if (targetMembership.role === "OWNER") {
            throw new Error("Cannot remove the owner");
        }

        await ctx.db.delete(args.membershipId);
    }
});
