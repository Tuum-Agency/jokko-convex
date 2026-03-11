import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Get current authenticated user
 */
export const me = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) return null;

        return await ctx.db.get(userId);
    },
});

/**
 * Get current user role in the active organization
 */
export const currentUserRole = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) return null;

        const session = await ctx.db
            .query("userSessions")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .first();

        if (!session?.currentOrganizationId) return null;

        const membership = await ctx.db
            .query("memberships")
            .withIndex("by_user_org", (q) =>
                q.eq("userId", userId).eq("organizationId", session.currentOrganizationId!)
            )
            .first();

        return membership?.role;
    },
});


/**
 * Get user by ID
 */
export const get = query({
    args: { id: v.id("users") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});

/**
 * Complete user onboarding
 */
export const completeOnboarding = mutation({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        await ctx.db.patch(userId, {
            onboardingCompleted: true,
            updatedAt: Date.now(),
        });
    },
});

/**
 * Ensure user exists in DB after authentication
 * This should be called immediately after login
 */
export const ensureUser = mutation({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity || !identity.email) {
            return { success: false, message: "Not authenticated" };
        }

        // Check if user exists
        const existingUser = await ctx.db
            .query("users")
            .withIndex("email", (q) => q.eq("email", identity.email!))
            .first();

        if (existingUser) {
            return {
                success: true,
                message: "User already exists",
                userId: existingUser._id,
                created: false,
            };
        }

        // Create user
        const userId = await ctx.db.insert("users", {
            email: identity.email,
            name: identity.name || identity.email.split("@")[0],
            image: identity.pictureUrl,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        console.log(`[ENSURE USER] Created user: ${identity.email} with ID: ${userId}`);

        return {
            success: true,
            message: "User created successfully",
            userId,
            created: true,
        };
    },
});

/**
 * Diagnostic: who am I
 */
export const whoAmI = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity) {
            return { authenticated: false };
        }

        const user = await ctx.db
            .query("users")
            .withIndex("email", (q) => q.eq("email", identity.email!))
            .first();

        return {
            authenticated: true,
            email: identity.email,
            name: identity.name,
            userExistsInDB: !!user,
            userId: user?._id,
        };
    },
});
// ... (existing code)

// ... existing code ...

export const updatePresence = mutation({
    args: {},
    handler: async (ctx) => {
        // ... presence logic ...
        // (Keep existing code)
        const userId = await getAuthUserId(ctx);
        if (!userId) return null;

        const session = await ctx.db
            .query("userSessions")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .first();

        if (!session?.currentOrganizationId) return null;

        await ctx.db.patch(session._id, {
            lastActivityAt: Date.now(),
        });

        const membership = await ctx.db
            .query("memberships")
            .withIndex("by_user_org", (q) =>
                q.eq("userId", userId).eq("organizationId", session.currentOrganizationId!)
            )
            .first();

        if (membership) {
            const updates: any = { lastSeenAt: Date.now() };
            if (membership.status === "OFFLINE") {
                updates.status = "ONLINE";
            }
            await ctx.db.patch(membership._id, updates);
        }
    },
});

/**
 * Generate upload URL for avatar
 */
export const generateUploadUrl = mutation(async (ctx) => {
    return await ctx.storage.generateUploadUrl();
});

/**
 * Update user profile
 */
export const updateProfile = mutation({
    args: {
        name: v.optional(v.string()),
        email: v.optional(v.string()), // Email updates might require verification flow
        phone: v.optional(v.string()),
        imageStorageId: v.optional(v.id("_storage")),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const updates: any = {
            updatedAt: Date.now(),
        };

        if (args.name !== undefined) updates.name = args.name;
        if (args.phone !== undefined) updates.phone = args.phone; // Assuming phone field exists in schema or we add it

        // Handle image update from storage ID
        if (args.imageStorageId) {
            updates.image = await ctx.storage.getUrl(args.imageStorageId);
        }

        await ctx.db.patch(userId, updates);
    },
});

/**
 * Delete account
 */
export const deleteAccount = mutation({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        // Vérifier que l'utilisateur n'est pas le seul OWNER d'une organisation
        const memberships = await ctx.db
            .query("memberships")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .collect();

        for (const membership of memberships) {
            if (membership.role === "OWNER") {
                // Vérifier s'il y a d'autres OWNER dans cette organisation
                const otherOwners = await ctx.db
                    .query("memberships")
                    .withIndex("by_organization", (q) =>
                        q.eq("organizationId", membership.organizationId)
                    )
                    .filter((q) =>
                        q.and(
                            q.eq(q.field("role"), "OWNER"),
                            q.neq(q.field("userId"), userId)
                        )
                    )
                    .first();

                if (!otherOwners) {
                    // Vérifier s'il y a d'autres membres
                    const otherMembers = await ctx.db
                        .query("memberships")
                        .withIndex("by_organization", (q) =>
                            q.eq("organizationId", membership.organizationId)
                        )
                        .filter((q) => q.neq(q.field("userId"), userId))
                        .first();

                    if (otherMembers) {
                        throw new Error(
                            "Vous êtes le seul propriétaire d'une organisation qui a d'autres membres. " +
                            "Veuillez transférer la propriété avant de supprimer votre compte."
                        );
                    }
                }
            }
        }

        // 1. Delete user sessions
        const sessions = await ctx.db
            .query("userSessions")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .collect();

        for (const session of sessions) {
            await ctx.db.delete(session._id);
        }

        // 2. Delete memberships (et supprimer les organisations orphelines)
        for (const membership of memberships) {
            await ctx.db.delete(membership._id);

            // Si l'utilisateur était le seul membre, supprimer l'organisation
            const remainingMembers = await ctx.db
                .query("memberships")
                .withIndex("by_organization", (q) =>
                    q.eq("organizationId", membership.organizationId)
                )
                .first();

            if (!remainingMembers) {
                await ctx.db.delete(membership.organizationId);
            }
        }

        // 3. Delete user
        await ctx.db.delete(userId);
    },
});

/**
 * Reset onboarding for all users (internal only)
 */
export const resetOnboarding = internalMutation({
    args: {},
    handler: async (ctx) => {
        const users = await ctx.db.query("users").collect();
        let count = 0;
        for (const user of users) {
            await ctx.db.patch(user._id, { onboardingCompleted: undefined });
            count++;
        }
        // Delete userSessions
        const sessions = await ctx.db.query("userSessions").collect();
        for (const s of sessions) await ctx.db.delete(s._id);
        // Delete auto-created dummy orgs and their memberships
        const orgs = await ctx.db.query("organizations").collect();
        let orgsDeleted = 0;
        for (const org of orgs) {
            if (org.name === "My Organization") {
                const memberships = await ctx.db.query("memberships")
                    .withIndex("by_organization", (q: any) => q.eq("organizationId", org._id))
                    .collect();
                for (const m of memberships) await ctx.db.delete(m._id);
                await ctx.db.delete(org._id);
                orgsDeleted++;
            }
        }
        return { usersReset: count, sessionsDeleted: sessions.length, orgsDeleted };
    },
});
