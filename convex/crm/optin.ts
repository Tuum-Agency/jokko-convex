/**
 * Opt-in stats for CRM-imported contacts.
 * Per design §A6 the post-import banner shows `0 / N opt-ins collectés` reactively.
 */

import { query } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getImportedOptInStats = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) return null;

        const session = await ctx.db
            .query("userSessions")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .first();
        const organizationId = session?.currentOrganizationId;
        if (!organizationId) return null;

        const links = await ctx.db
            .query("crmContactLinks")
            .withIndex("by_org_provider_external", (q) =>
                q.eq("organizationId", organizationId),
            )
            .collect();

        if (links.length === 0) {
            return { imported: 0, granted: 0, unknown: 0, revoked: 0 };
        }

        let granted = 0;
        let revoked = 0;
        let unknown = 0;
        for (const link of links) {
            const contact = await ctx.db.get(link.contactId);
            if (!contact) continue;
            const status = contact.whatsappOptIn?.status ?? "unknown";
            if (status === "granted") granted += 1;
            else if (status === "revoked") revoked += 1;
            else unknown += 1;
        }

        return { imported: links.length, granted, revoked, unknown };
    },
});
