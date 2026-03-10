
import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";

export const getOrganization = internalQuery({
    args: { id: v.id("organizations") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});

// List orgs with WhatsApp configured (for diagnostics)
export const listWhatsAppOrgs = internalQuery({
    args: {},
    handler: async (ctx) => {
        const orgs = await ctx.db.query("organizations").collect();
        return orgs
            .filter((o) => o.whatsapp?.phoneNumberId)
            .map((o) => ({
                _id: o._id,
                name: o.name,
                phoneNumberId: o.whatsapp?.phoneNumberId,
                displayPhoneNumber: (o.whatsapp as any)?.displayPhoneNumber,
                wabaId: o.whatsapp?.businessAccountId,
            }));
    },
});

export const updateMessageStatus = internalMutation({
    args: {
        messageId: v.id("messages"),
        status: v.string(),
        externalId: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.messageId, {
            status: args.status,
            externalId: args.externalId,
            updatedAt: Date.now(),
        });
    },
});
