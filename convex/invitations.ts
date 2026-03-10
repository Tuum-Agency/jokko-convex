import { v } from "convex/values";
import { action, query, mutation, internalMutation } from "./_generated/server";
import { requirePermission } from "./lib/auth";
import { sendInvitationEmail } from "./lib/email";
import { api, internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";

// LIST PENDING INVITATIONS
export const list = query({
    args: { organizationId: v.optional(v.id("organizations")) },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) return { invitations: [], total: 0 };

        // Resolve Org ID
        let orgId = args.organizationId;
        if (!orgId) {
            const membership = await ctx.db
                .query("memberships")
                .withIndex("by_user", (q) => q.eq("userId", userId))
                .first();
            if (membership) orgId = membership.organizationId;
        }

        if (!orgId) return { invitations: [], total: 0 };

        const invitations = await ctx.db
            .query("invitations")
            .withIndex("by_org_status", (q) => q.eq("organizationId", orgId!).eq("status", "PENDING"))
            .collect();

        const invitationsWithDetails = await Promise.all(invitations.map(async (inv) => {
            // Optional: Fetch Inviter details if needed
            return {
                id: inv._id,
                email: inv.email,
                role: inv.role.toLowerCase(),
                poleId: inv.poleId,
                status: inv.status,
                createdAt: new Date(inv.createdAt).toISOString(),
                expiresAt: new Date(inv.expiresAt).toISOString(),
            };
        }));

        return {
            invitations: invitationsWithDetails,
            total: invitations.length
        };
    }
});

// CANCEL INVITATION
export const cancel = mutation({
    args: { id: v.id("invitations") },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const invitation = await ctx.db.get(args.id);
        if (!invitation) throw new Error("Invitation not found");

        const membership = await ctx.db
            .query("memberships")
            .withIndex("by_user_org", (q) => q.eq("userId", userId).eq("organizationId", invitation.organizationId))
            .first();

        if (!membership || (membership.role !== "OWNER" && membership.role !== "ADMIN")) {
            throw new Error("Insufficient permissions");
        }

        await ctx.db.patch(args.id, { status: "CANCELLED" });
    }
});

// CREATE INVITATION (Link to Action or direct mutation)
// We use an Action to handle email sending (side effect)
export const create = action({
    args: {
        organizationId: v.optional(v.id("organizations")),
        email: v.string(),
        name: v.optional(v.string()), // Add name to args
        role: v.string(), // "admin" | "agent"
        poleId: v.optional(v.id("poles")),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        // Resolve Org ID (We need to fetch it via Query if not provided)
        let orgId = args.organizationId;
        let orgName = "Organization";

        if (orgId) {
            const org = await ctx.runQuery(api.organizations.get, { id: orgId });
            if (org) orgName = org.name;
        } else {
            const userOrgs = await ctx.runQuery(api.organizations.listMine); // This returns array
            if (userOrgs && userOrgs.length > 0) {
                orgId = userOrgs[0]._id;
                orgName = userOrgs[0].name;
            }
        }

        if (!orgId) throw new Error("Organization not found");

        // 2. Generate cryptographically secure token
        const token = crypto.randomUUID();

        const roleEnum = args.role.toUpperCase() as "ADMIN" | "AGENT";

        // 3. Create invitation record via internal mutation
        await ctx.runMutation(internal.invitations.createRecord, {
            organizationId: orgId,
            email: args.email.trim(),
            name: args.name,
            role: roleEnum,
            poleId: args.poleId,
            token,
            invitedBySubject: identity.subject // passing subject to resolve user
        });

        // 4. Send email
        const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/invite/${token}`;
        const inviterName = identity.name || identity.email || "Someone";

        try {
            await sendInvitationEmail({
                to: args.email,
                orgName: orgName,
                inviterName: inviterName,
                role: roleEnum,
                inviteUrl: inviteUrl,
            });
        } catch (error) {
            console.error("Failed to send email:", error);
            // We don't throw here to avoid failing the whole action if email fails? 
            // Better to log it. The invitation is created anyway.
        }

        return { success: true };
    },
});

// INTERNAL HELPER MUTATION — not callable from clients
export const createRecord = internalMutation({
    args: {
        organizationId: v.id("organizations"),
        email: v.string(),
        name: v.optional(v.string()),
        role: v.union(v.literal("ADMIN"), v.literal("AGENT")),
        poleId: v.optional(v.id("poles")),
        token: v.string(),
        invitedBySubject: v.string() // We pass the sub from identity to resolve user
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx); // Use this if called from client
        // But if called from action, we might have lost context? 
        // No, getAuthUserId relies on headers. 
        // If called via `ctx.runMutation` from an action, the auth headers might not propagate unless configured.
        // Actually, best practice is to trust the Action if it's internal.

        // Let's rely on finding the user by their subject if possible, OR just trust `getAuthUserId` if it works.
        // If `ctx.runMutation` is authenticated as the user who triggered the action, it works.

        let inviterId = await getAuthUserId(ctx);
        if (!inviterId) {
            // Fallback: This gets tricky. For now let's hope auth propagates or we query user by subject if we stored it.
            // Since we don't have a "by_subject" index on users shown in schema (only email), skipping complex resolution.
            // We'll throw if direct auth fails.
            throw new Error("Could not resolve inviter");
        }

        await ctx.db.insert("invitations", {
            organizationId: args.organizationId,
            email: args.email,
            name: args.name,
            role: args.role,
            poleId: args.poleId,
            token: args.token,
            status: "PENDING",
            invitedById: inviterId,
            expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
            createdAt: Date.now(),
        });
    }
});

// GET INVITATION FOR RESEND
export const getForResend = query({
    args: { id: v.id("invitations") },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) return null;

        const invitation = await ctx.db.get(args.id);
        if (!invitation) return null;

        const org = await ctx.db.get(invitation.organizationId);
        if (!org) return null;

        // Check permission (admin/owner of org)
        const membership = await ctx.db
            .query("memberships")
            .withIndex("by_user_org", (q) => q.eq("userId", userId).eq("organizationId", invitation.organizationId))
            .first();

        if (!membership || !["OWNER", "ADMIN"].includes(membership.role)) {
            return null;
        }

        return {
            invitation,
            orgName: org.name,
        };
    }
});

// RESEND INVITATION
export const resend = action({
    args: { id: v.id("invitations") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const data = await ctx.runQuery(api.invitations.getForResend, { id: args.id });
        if (!data) throw new Error("Invitation not found or unauthorized");

        const { invitation, orgName } = data;

        if (invitation.status !== "PENDING") {
            throw new Error("Invitation is not pending");
        }

        const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/invite/${invitation.token}`;
        const inviterName = identity.name || identity.email || "Someone";

        // Extend expiry via mutation if needed?
        // For now just resend the email with same token, it's valid for 7 days.
        // If it was expired, we would need to refresh it.
        // Let's assume for now it's PENDING and not checked here for expiry (expiration is usually checked on consume).

        await sendInvitationEmail({
            to: invitation.email,
            orgName: orgName,
            inviterName: inviterName,
            role: invitation.role as "ADMIN" | "AGENT",
            inviteUrl: inviteUrl,
        });

        return { success: true };
    }
});

// GET INVITATION BY TOKEN
export const getByToken = query({
    args: { token: v.string() },
    handler: async (ctx, args) => {
        const invitation = await ctx.db
            .query("invitations")
            .withIndex("by_token", (q) => q.eq("token", args.token))
            .first();

        if (!invitation) return null;
        if (invitation.status === "ACCEPTED") return {
            status: "ACCEPTED", invitation: {
                orgName: (await ctx.db.get(invitation.organizationId))?.name || "Organisation"
            }
        };
        if (invitation.status !== "PENDING") return null;
        if (invitation.expiresAt < Date.now()) return { status: "EXPIRED" };

        const org = await ctx.db.get(invitation.organizationId);
        if (!org) return null;

        // Optionally get inviter info
        const inviter = await ctx.db.get(invitation.invitedById);

        return {
            status: "VALID",
            invitation: {
                id: invitation._id,
                email: invitation.email,
                name: invitation.name, // Return name
                role: invitation.role,
                orgName: org.name,
                inviterName: inviter?.name || inviter?.email || "Un membre",
            }
        };
    }
});

// ACCEPT INVITATION & CREATE USER
// This should probably be an action if we need to do complex auth stuff,
// but usually creating a user is a mutation.
// With Convex Auth, creating a user is handled by the auth adapter usually,
// but we want to create a user AND link the invitation.
export const accept = action({
    args: {
        token: v.string(),
        password: v.string(),
        name: v.string(),
    },
    handler: async (ctx, args) => {
        // 1. Validate Invitation
        const data = await ctx.runQuery(api.invitations.getByToken, { token: args.token });
        if (!data || data.status !== "VALID" || !data.invitation) {
            throw new Error("Invitation invalide ou expirée");
        }

        const { email } = data.invitation;

        // 2. We explicitly use the Convex Auth "password" provider to sign up.
        // But `signIn` from `convex/auth` is server-side only? No, it's usually client-side.
        // Wait, we are in an Action here. We can't easily sign in the user into the browser session from here.
        // The pattern for Convex Auth is usually: Client calls `signIn("password", { email, password, flow: "signUp" })`.
        // BUT we need to also mark the invitation as accepted and link the user.

        // Strategy:
        // 1. Client calls `signIn("password", { email, password, flow: "signUp", name: args.name })`.
        // 2. This creates the user in `users` table via the `Password` provider.
        // 3. AFTER successful sign-in, the client calls a mutation `acceptInvitation` passing the token.
        //    The mutation verifies the currently logged-in user matches the invitation email.
        //    Then it accepts the invitation and creates the membership.

        // However, the user wants "automatic" connection. The `signIn` function on client DOES that.
        // So the flow on `app/invite/[token]/page.tsx` should be:
        // 1. Fetch invitation details using `getByToken`.
        // 2. Show form (Name, Password). Address is pre-filled from invitation.
        // 3. On Submit:
        //    await signIn("password", { email: invitation.email, password, name, flow: "signUp" })
        // 4. If successful, call `api.invitations.acceptLink` (new mutation).
        // 5. Redirect to dashboard.

        return { success: true }; // Placeholder if we don't use this action directly for sign up
    }
});

// ACTUALLY LINK USER TO INVITATION AFTER SIGN UP
export const acceptLink = mutation({
    args: { token: v.string() },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const user = await ctx.db.get(userId);
        if (!user) throw new Error("User not found");

        const invitation = await ctx.db
            .query("invitations")
            .withIndex("by_token", (q) => q.eq("token", args.token))
            .first();

        if (!invitation) throw new Error("Invitation not found");
        if (invitation.status !== "PENDING") throw new Error("Invitation invalid");
        if (invitation.expiresAt < Date.now()) throw new Error("Invitation expired");

        // Verify email matches (optional security, but good practice)
        // normalized email check
        // Verify email matches
        const invitationEmail = invitation.email.trim().toLowerCase();
        const userEmail = user.email?.trim().toLowerCase();

        console.log(`[AcceptLink] Validating email. Invitation: '${invitationEmail}', User: '${userEmail}'`);

        if (invitationEmail !== userEmail) {
            // In some cases user might use different email? 
            // Ideally we enforce it.
            console.error(`Email mismatch details: Invitation Email [${invitationEmail}] vs User Email [${userEmail}]`);
            // We throw the error but now we have logs
            throw new Error("Email mismatch");
        }

        // Create Membership
        await ctx.db.insert("memberships", {
            userId: userId,
            organizationId: invitation.organizationId,
            role: invitation.role === "ADMIN" ? "ADMIN" : "AGENT",
            poleId: invitation.poleId,
            status: "OFFLINE",
            maxConversations: 3, // Default limit
            activeConversations: 0,
            lastSeenAt: Date.now(),
            joinedAt: Date.now(),
            invitedById: invitation.invitedById,
        });

        // Update User if needed (e.g. set default org)
        // ...

        // Mark Accepted
        await ctx.db.patch(invitation._id, {
            status: "ACCEPTED",
            acceptedAt: Date.now(),
            // acceptedByUserId not in schema
        });

        return { organizationId: invitation.organizationId };
    }
});
