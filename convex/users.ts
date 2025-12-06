/**
 *  _   _ ____  _____ ____  ____  
 * | | | / ___|| ____|  _ \/ ___| 
 * | | | \___ \|  _| | |_) \___ \ 
 * | |_| |___) | |___|  _ < ___) |
 *  \___/|____/|_____|_| \_\____/ 
 *
 * USERS FUNCTIONS
 *
 * Handles user-related operations.
 * - me: Returns the current authenticated user
 * - get: Internal helper to get a user by ID
 */

import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const me = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            return null;
        }
        return await ctx.db.get(userId);
    },
});

export const get = query({
    args: { id: v.id("users") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});
export const completeOnboarding = mutation({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new Error("Unauthorized");
        }
        await ctx.db.patch(userId, {
            onboardingCompleted: true,
        });
    },
});
