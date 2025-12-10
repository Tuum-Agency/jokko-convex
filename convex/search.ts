import { v } from "convex/values";
import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const searchGlobal = query({
    args: { query: v.string() },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) return { contacts: [], pages: [] };

        const user = await ctx.db.get(userId);
        if (!user) return { contacts: [], pages: [] };

        // Determine org (using session or membership - strictly we need orgId context. 
        // For now, let's assume we search in the user's current session or we join memberships.
        // But search needs to be fast. Let's look up the session.)
        const session = await ctx.db
            .query("userSessions")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .first();

        const organizationId = session?.currentOrganizationId;

        if (!organizationId) return { contacts: [], pages: [] };

        const queryText = args.query.trim().toLowerCase();
        if (!queryText) return { contacts: [], pages: [] };

        // 1. Search Contacts
        const contacts = await ctx.db
            .query("contacts")
            .withSearchIndex("search_contacts", (q) =>
                q.search("searchName", queryText).eq("organizationId", organizationId)
            )
            .take(5);

        // 2. Search Navigation Pages (Static list filtered)
        const allPages = [
            { name: "Conversations", href: "/dashboard/conversations", icon: "MessageSquare" },
            { name: "Contacts", href: "/dashboard/contacts", icon: "Users" },
            { name: "Templates", href: "/dashboard/templates", icon: "FileText" },
            { name: "Broadcasts", href: "/dashboard/broadcasts", icon: "Send" },
            { name: "Analytics", href: "/dashboard/analytics", icon: "TrendingUp" },
            { name: "Automatisation", href: "/dashboard/flows", icon: "Workflow" },
            { name: "Team", href: "/dashboard/team", icon: "Building" },
            { name: "Settings", href: "/dashboard/settings", icon: "Settings" },
            { name: "Billing", href: "/dashboard/billing", icon: "CreditCard" },
            { name: "Help & Support", href: "/dashboard/help", icon: "HelpCircle" },
        ];

        const pages = allPages.filter(p =>
            p.name.toLowerCase().includes(queryText)
        );

        return {
            contacts: contacts.map(c => ({
                id: c._id,
                name: c.name || c.phone,
                type: "CONTACT",
                link: `/dashboard/contacts?id=${c._id}`
            })),
            pages: pages.map(p => ({
                id: p.href,
                name: p.name,
                type: "PAGE",
                link: p.href,
                icon: p.icon
            }))
        };
    },
});
