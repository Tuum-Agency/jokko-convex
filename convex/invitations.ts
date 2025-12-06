/**
 *  ___            _ _        _   _                 
 * |_ _|_ __   ___(_) |_ __ _| |_(_) ___  _ __  ___ 
 *  | || '_ \ / _ \ | __/ _` | __| |/ _ \| '_ \/ __|
 *  | || | | |  __/ | || (_| | |_| | (_) | | | \__ \
 * |___|_| |_|\___|_|\__\__,_|\__|_|\___/|_| |_|___/
 *
 * INVITATIONS FUNCTIONS
 *
 * Handles sending and accepting invitations.
 * - create: Creates an invitation and sends an email via AWS SES.
 */

import { v } from "convex/values";
import { action } from "./_generated/server";
import { requirePermission } from "./lib/auth";
import { sendInvitationEmail } from "./lib/email";
import { api } from "./_generated/api";

export const create = action({
    args: {
        organizationId: v.id("organizations"),
        email: v.string(),
        role: v.union(v.literal("ADMIN"), v.literal("AGENT")),
    },
    handler: async (ctx, args) => {
        // 1. Verify permissions
        const { userId, membership } = await ctx.runQuery(api.invitations.validatePermission, {
            organizationId: args.organizationId
        });

        // We can't really call the query validation inside action easily without exposing a public helper 
        // or using `runQuery` to a helper. 
        // But let's assume valid for now or refactor to use a mutation which then calls an internal action. 
        // Best practice in Convex: Mutation creates the record -> Scheduled action sends email.

        // However, following the prompt pattern:

        // 2. Generate token (simple random string for demo)
        const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

        // 3. Create invitation record via mutation
        await ctx.runMutation(api.invitations.createRecord, {
            organizationId: args.organizationId,
            email: args.email,
            role: args.role,
            token,
            invitedById: userId
        });

        // 4. Get org details
        const org = await ctx.runQuery(api.organizations.get, { id: args.organizationId });
        const inviter = await ctx.runQuery(api.users.get, { id: userId });

        if (!org || !inviter) throw new Error("Data consistency error");

        const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${token}`;

        // 5. Send email
        await sendInvitationEmail({
            to: args.email,
            orgName: org.name,
            inviterName: inviter.name || inviter.email || "Un membre",
            role: args.role,
            inviteUrl,
        });

        return { success: true };
    },
});

import { mutation, query } from "./_generated/server";
import { requirePermission as requirePermissionHelper } from "./lib/auth";

// Helper for permission validation in action
export const validatePermission = query({
    args: { organizationId: v.id("organizations") },
    handler: async (ctx, args) => {
        return await requirePermissionHelper(ctx, args.organizationId, "members:invite");
    }
});

// Helper for fetching org
export const get = query({
    args: { id: v.id("organizations") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    }
});

// Helper for creating record
export const createRecord = mutation({
    args: {
        organizationId: v.id("organizations"),
        email: v.string(),
        role: v.union(v.literal("ADMIN"), v.literal("AGENT")),
        token: v.string(),
        invitedById: v.id("users")
    },
    handler: async (ctx, args) => {
        await ctx.db.insert("invitations", {
            organizationId: args.organizationId,
            email: args.email,
            role: args.role,
            token: args.token,
            status: "PENDING",
            invitedById: args.invitedById,
            expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
            createdAt: Date.now(),
        });
    }
});
