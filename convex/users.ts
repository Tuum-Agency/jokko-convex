import { mutation, query } from "./_generated/server";
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
            .withIndex("by_email", (q) => q.eq("email", identity.email!))
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
            .withIndex("by_email", (q) => q.eq("email", identity.email!))
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

export const updatePresence = mutation({
    args: {},
    handler: async (ctx) => {
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
