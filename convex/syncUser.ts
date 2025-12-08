import { mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Force sync authenticated user to database
 * Run this after signing in if you get "Utilisateur non trouvé"
 */
export const syncAuthUser = mutation({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity || !identity.email) {
            throw new Error("Not authenticated or no email in identity");
        }

        // Check if user exists
        const existingUser = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", identity.email!))
            .first();

        if (existingUser) {
            return {
                success: true,
                message: "User already exists in database",
                userId: existingUser._id,
                email: existingUser.email,
            };
        }

        // Create user if doesn't exist
        const userId = await ctx.db.insert("users", {
            email: identity.email,
            name: identity.name || identity.email.split("@")[0],
            image: identity.pictureUrl,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        return {
            success: true,
            message: "User created successfully",
            userId,
            email: identity.email,
        };
    },
});
