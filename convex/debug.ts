import { query } from "./_generated/server";

export const listAll = query({
    args: {},
    handler: async (ctx) => {
        const users = await ctx.db.query("users").collect();
        const orgs = await ctx.db.query("organizations").collect();
        const memberships = await ctx.db.query("memberships").collect();
        const poles = await ctx.db.query("poles").collect();

        return {
            users: users.map(u => ({ id: u._id, name: u.name, email: u.email })),
            orgs: orgs.map(o => ({ id: o._id, name: o.name, slug: o.slug })),
            memberships: memberships.map(m => ({
                userId: m.userId,
                orgId: m.organizationId,
                role: m.role
            })),
            poles,
            invitations: (await ctx.db.query("invitations").collect()).map(i => ({ email: i.email, name: i.name, status: i.status }))
        };
    }
});
