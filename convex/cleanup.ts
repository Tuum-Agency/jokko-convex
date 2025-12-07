import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const deleteUser = mutation({
    args: { email: v.string() },
    handler: async (ctx, args) => {
        // Find the user
        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .first();

        if (!user) {
            console.log(`User ${args.email} not found`);
            return;
        }

        console.log(`Deleting user: ${user.name} (${user._id})`);

        // Find memberships
        const memberships = await ctx.db
            .query("memberships")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .collect();

        // Delete memberships
        for (const m of memberships) {
            await ctx.db.delete(m._id);
        }

        // Delete user
        await ctx.db.delete(user._id);

        console.log("Successfully deleted user and memberships");
    }
});
