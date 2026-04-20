/**
 * Public queries for consumers (frontend) that need to know whether a Jokko
 * contact is linked to an external CRM record.
 */

import { v } from "convex/values";
import { internalMutation, query } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Id } from "../_generated/dataModel";
import {
    buildExternalContactUrl,
    PROVIDER_DISPLAY_NAMES,
} from "./core/externalUrls";

const PURGE_GRACE_PERIOD_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const PURGE_BATCH_SIZE = 500;

export const getLinkForContact = query({
    args: { contactId: v.id("contacts") },
    handler: async (ctx, { contactId }) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) return null;

        const session = await ctx.db
            .query("userSessions")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .first();
        if (!session?.currentOrganizationId) return null;

        const contact = await ctx.db.get(contactId);
        if (!contact || contact.organizationId !== session.currentOrganizationId) {
            return null;
        }

        const link = await ctx.db
            .query("crmContactLinks")
            .withIndex("by_contact", (q) => q.eq("contactId", contactId))
            .filter((q) => q.eq(q.field("linkStatus"), "linked"))
            .first();
        if (!link) return null;

        const connection = await ctx.db.get(link.connectionId);
        if (!connection || connection.status === "disconnected") return null;

        const externalUrl = buildExternalContactUrl({
            provider: link.provider,
            externalId: link.externalId,
            remoteAccountId: connection.remoteAccountId,
            instanceUrl: connection.instanceUrl,
        });

        return {
            provider: link.provider,
            providerLabel: PROVIDER_DISPLAY_NAMES[link.provider] ?? link.provider,
            externalId: link.externalId,
            externalUrl,
            connectionId: String(link.connectionId),
            connectionStatus: connection.status,
            remoteAccountLabel: connection.remoteAccountLabel ?? null,
            linkedAt: link.linkedAt,
            lastPulledAt: link.lastPulledAt,
            lastPushedAt: link.lastPushedAt ?? null,
        };
    },
});

/**
 * Cron-driven purge of stale `crmContactLinks`.
 *
 * Tied to the UX promise made by DisconnectDialog: "Liens contacts ↔ CRM
 * conservés pour permettre une reconnexion rapide pendant 7 jours." Past that
 * grace period, we delete the links so that a fresh OAuth connection starts
 * from a clean slate and no stale externalId lingers against a CRM tenant
 * that the user may no longer control.
 *
 * A batch limit keeps any single transaction bounded; the cron reruns daily
 * so oversized backlogs drain over a few ticks rather than in one shot.
 */
export const purgeStaleLinks = internalMutation({
    args: {},
    handler: async (ctx) => {
        const now = Date.now();
        const cutoff = now - PURGE_GRACE_PERIOD_MS;

        const staleConnections = await ctx.db
            .query("crmConnections")
            .filter((q) =>
                q.and(
                    q.eq(q.field("status"), "disconnected"),
                    q.lt(q.field("revokedAt"), cutoff),
                ),
            )
            .collect();

        let deletedLinks = 0;
        const perOrgDeleted = new Map<Id<"organizations">, number>();

        for (const conn of staleConnections) {
            if (deletedLinks >= PURGE_BATCH_SIZE) break;
            const links = await ctx.db
                .query("crmContactLinks")
                .withIndex("by_connection", (q) => q.eq("connectionId", conn._id))
                .take(PURGE_BATCH_SIZE - deletedLinks);
            for (const link of links) {
                await ctx.db.delete(link._id);
                deletedLinks += 1;
                perOrgDeleted.set(
                    conn.organizationId,
                    (perOrgDeleted.get(conn.organizationId) ?? 0) + 1,
                );
            }
        }

        for (const [organizationId, count] of perOrgDeleted) {
            await ctx.db.insert("integrationAuditLog", {
                organizationId,
                action: "contact_links_purged",
                severity: "info",
                metadataSanitized: { deletedLinks: count, cutoff },
                createdAt: now,
            });
        }

        return { deletedLinks, staleConnections: staleConnections.length };
    },
});
