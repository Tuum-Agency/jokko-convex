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

export const repairStats = mutation({
    args: {},
    handler: async (ctx) => {
        const memberships = await ctx.db.query("memberships").collect();
        let updates = 0;

        for (const m of memberships) {
            // Count actual open conversations assigned to this user
            const count = await ctx.db
                .query("conversations")
                .withIndex("by_assigned", (q) => q.eq("assignedTo", m.userId))
                .filter(q => q.eq(q.field("status"), "OPEN"))
                .collect();

            const realCount = count.length;

            if (m.activeConversations !== realCount) {
                await ctx.db.patch(m._id, {
                    activeConversations: realCount
                });
                updates++;
                console.log(`Updated ${m.userId}: ${m.activeConversations} -> ${realCount}`);
            }
        }

        return `Repaired stats for ${updates} agents.`;
    }
});
