import { internalQuery } from "./_generated/server";

/**
 * Debug query to check current auth identity.
 * Internal only — not callable from clients.
 */
export const checkAuth = internalQuery({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity) {
            return { authenticated: false, message: "Not authenticated" };
        }

        const user = await ctx.db
            .query("users")
            .withIndex("email", (q) => q.eq("email", identity.email!))
            .first();

        return {
            authenticated: true,
            identity: {
                email: identity.email,
                name: identity.name,
                tokenIdentifier: identity.tokenIdentifier,
            },
            userExistsInDB: !!user,
            userId: user?._id,
        };
    },
});

/**
 * List all users in the database.
 * Internal only — not callable from clients.
 */
export const listAllUsers = internalQuery({
    args: {},
    handler: async (ctx) => {
        const users = await ctx.db.query("users").collect();
        return users.map(u => ({
            _id: u._id,
            email: u.email,
            name: u.name,
        }));
    },
});
