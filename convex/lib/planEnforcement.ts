/**
 * Plan enforcement — cascade de downgrade partagée entre Stripe webhooks
 * et mutations applicatives (updateOrgPlan, backfill, etc.).
 *
 * Désactive les canaux WhatsApp excédentaires, met en pause les broadcasts
 * SCHEDULED concernés, notifie OWNER/ADMIN.
 */

import type { MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { getMaxChannels, isUnlimited } from "./planHelpers";

export async function enforceChannelDowngrade(
    ctx: MutationCtx,
    organizationId: Id<"organizations">,
    newPlan: string,
): Promise<number> {
    const maxChannels = await getMaxChannels(ctx, newPlan);
    if (isUnlimited(maxChannels)) return 0;

    const channels = await ctx.db
        .query("whatsappChannels")
        .withIndex("by_org", (q) => q.eq("organizationId", organizationId))
        .collect();

    const activeChannels = channels.filter(
        (c) => c.status !== "disabled" && c.status !== "banned",
    );
    if (activeChannels.length <= maxChannels) return 0;

    const sorted = [...activeChannels].sort((a, b) => {
        if (a.isOrgDefault && !b.isOrgDefault) return -1;
        if (!a.isOrgDefault && b.isOrgDefault) return 1;
        return a.createdAt - b.createdAt;
    });

    const toKeep = sorted.slice(0, maxChannels);
    const toDisable = sorted.slice(maxChannels);
    const now = Date.now();
    const disabledIds: Id<"whatsappChannels">[] = [];

    for (const ch of toDisable) {
        await ctx.db.patch(ch._id, {
            status: "disabled",
            disabledReason: "plan_downgrade",
            disabledAt: now,
            isOrgDefault: false,
            updatedAt: now,
        });
        disabledIds.push(ch._id);
    }

    const hasDefault = toKeep.some((c) => c.isOrgDefault);
    if (!hasDefault && toKeep.length > 0) {
        await ctx.db.patch(toKeep[0]._id, { isOrgDefault: true, updatedAt: now });
    }

    if (disabledIds.length > 0) {
        const scheduled = await ctx.db
            .query("broadcasts")
            .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
            .filter((q) => q.eq(q.field("status"), "SCHEDULED"))
            .collect();
        for (const b of scheduled) {
            if (b.whatsappChannelId && disabledIds.includes(b.whatsappChannelId)) {
                await ctx.db.patch(b._id, { status: "DRAFT", updatedAt: now });
                await ctx.db.insert("broadcastActivities", {
                    broadcastId: b._id,
                    type: "paused",
                    message: `Campagne dépubliée : canal désactivé après passage au plan ${newPlan}`,
                    createdAt: now,
                });
            }
        }
    }

    const memberships = await ctx.db
        .query("memberships")
        .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
        .collect();
    for (const m of memberships) {
        if (m.role !== "OWNER" && m.role !== "ADMIN") continue;
        await ctx.db.insert("notifications", {
            organizationId,
            userId: m.userId,
            type: "PLAN_DOWNGRADE",
            title: "Canaux désactivés après changement de plan",
            message: `Votre plan ${newPlan} autorise ${maxChannels} canal${maxChannels > 1 ? "aux" : ""}. ${disabledIds.length} canal${disabledIds.length > 1 ? "aux ont été désactivés" : " a été désactivé"}.`,
            link: "/dashboard/channels",
            isRead: false,
            metadata: {
                disabledChannelIds: disabledIds.map((id) => id.toString()),
                newPlan,
                maxChannels,
            },
            createdAt: now,
        });
    }

    return disabledIds.length;
}
