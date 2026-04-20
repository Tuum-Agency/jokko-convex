/**
 * Admin surface — queries and mutations exposing audit log, DLQ items,
 * manual replay of dead-lettered pushes, and debug-mode toggling.
 * All operations are scoped to the caller's active organization and
 * require the integrations:manage permission for writes.
 */

import { v } from "convex/values";
import { mutation, MutationCtx, query, QueryCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { hasPermission } from "../lib/permissions";

const DEBUG_MODE_TTL_MS = 24 * 60 * 60_000;
const AUDIT_DEFAULT_LIMIT = 50;
const AUDIT_MAX_LIMIT = 200;
const DLQ_DEFAULT_LIMIT = 50;
const DLQ_MAX_LIMIT = 200;

async function _getOrgAndRole(
    ctx: QueryCtx | MutationCtx,
    userId: Id<"users">,
): Promise<{
    organizationId: Id<"organizations"> | null;
    role: "OWNER" | "ADMIN" | "AGENT" | null;
}> {
    const session = await ctx.db
        .query("userSessions")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .first();
    const organizationId = session?.currentOrganizationId ?? null;
    if (!organizationId) return { organizationId: null, role: null };
    const membership = await ctx.db
        .query("memberships")
        .withIndex("by_user_org", (q) =>
            q.eq("userId", userId).eq("organizationId", organizationId),
        )
        .first();
    return { organizationId, role: membership?.role ?? null };
}

/**
 * Lists recent audit log entries for the current organization.
 * Optionally filter by connectionId.
 */
export const listAuditLog = query({
    args: {
        connectionId: v.optional(v.id("crmConnections")),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) return [];
        const { organizationId } = await _getOrgAndRole(ctx, userId);
        if (!organizationId) return [];

        const limit = Math.min(args.limit ?? AUDIT_DEFAULT_LIMIT, AUDIT_MAX_LIMIT);
        const rows = await ctx.db
            .query("integrationAuditLog")
            .withIndex("by_org_created", (q) => q.eq("organizationId", organizationId))
            .order("desc")
            .take(limit * 2);

        const filtered = args.connectionId
            ? rows.filter((r) => r.connectionId === args.connectionId)
            : rows;

        return filtered.slice(0, limit).map((r) => ({
            _id: r._id,
            connectionId: r.connectionId,
            provider: r.provider,
            action: r.action,
            severity: r.severity,
            entityType: r.entityType,
            entityId: r.entityId,
            metadataSanitized: r.metadataSanitized,
            createdAt: r.createdAt,
            userId: r.userId,
        }));
    },
});

/**
 * Lists queue items currently in the DLQ (dead_letter or failed) for the org.
 */
export const listDLQItems = query({
    args: {
        connectionId: v.optional(v.id("crmConnections")),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) return [];
        const { organizationId } = await _getOrgAndRole(ctx, userId);
        if (!organizationId) return [];

        const limit = Math.min(args.limit ?? DLQ_DEFAULT_LIMIT, DLQ_MAX_LIMIT);

        const dead = await ctx.db
            .query("crmSyncQueue")
            .withIndex("by_org_status", (q) =>
                q.eq("organizationId", organizationId).eq("status", "dead_letter"),
            )
            .order("desc")
            .take(limit);

        const failed = await ctx.db
            .query("crmSyncQueue")
            .withIndex("by_org_status", (q) =>
                q.eq("organizationId", organizationId).eq("status", "failed"),
            )
            .order("desc")
            .take(limit);

        const merged = [...dead, ...failed]
            .filter((i) => (args.connectionId ? i.connectionId === args.connectionId : true))
            .sort((a, b) => b.updatedAt - a.updatedAt)
            .slice(0, limit);

        return merged.map((i) => ({
            _id: i._id,
            connectionId: i.connectionId,
            status: i.status,
            eventType: i.eventType,
            entityType: i.entityType,
            entityId: i.entityId,
            retryCount: i.retryCount,
            lastError: i.lastError,
            deadLetteredAt: i.deadLetteredAt,
            lastAttemptAt: i.lastAttemptAt,
            enqueuedAtMs: i.enqueuedAtMs,
            updatedAt: i.updatedAt,
        }));
    },
});

/**
 * Replays a DLQ entry: resets status to pending, retryCount to 0, schedules immediate retry.
 * Writes an audit log entry. Requires integrations:manage.
 */
export const replayDLQItem = mutation({
    args: { queueItemId: v.id("crmSyncQueue") },
    handler: async (ctx, { queueItemId }) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("unauthenticated");

        const item = await ctx.db.get(queueItemId);
        if (!item) throw new Error("item_not_found");

        const { organizationId, role } = await _getOrgAndRole(ctx, userId);
        if (organizationId !== item.organizationId) throw new Error("forbidden");
        if (!role || !hasPermission(role, "integrations:manage")) throw new Error("forbidden");

        if (item.status !== "dead_letter" && item.status !== "failed") {
            throw new Error(`cannot_replay_status_${item.status}`);
        }

        const now = Date.now();
        await ctx.db.patch(queueItemId, {
            status: "pending",
            retryCount: 0,
            nextAttemptAt: now,
            deadLetteredAt: undefined,
            lockedAt: undefined,
            processingStartedAt: undefined,
            lastError: undefined,
            updatedAt: now,
        });

        await ctx.db.insert("integrationAuditLog", {
            organizationId: item.organizationId,
            userId,
            connectionId: item.connectionId,
            action: "crm.queue.replayed",
            severity: "info",
            entityType: "queue_item",
            entityId: String(queueItemId),
            metadataSanitized: {
                previousStatus: item.status,
                retriesBeforeReplay: item.retryCount,
            },
            createdAt: now,
        });

        return { ok: true as const };
    },
});

/**
 * Toggles debug mode on a connection. Enabling sets a 24h auto-expiry.
 * Requires integrations:manage.
 */
export const setDebugMode = mutation({
    args: {
        connectionId: v.id("crmConnections"),
        enabled: v.boolean(),
    },
    handler: async (ctx, { connectionId, enabled }) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("unauthenticated");

        const conn = await ctx.db.get(connectionId);
        if (!conn) throw new Error("connection_not_found");

        const { organizationId, role } = await _getOrgAndRole(ctx, userId);
        if (organizationId !== conn.organizationId) throw new Error("forbidden");
        if (!role || !hasPermission(role, "integrations:manage")) throw new Error("forbidden");

        const now = Date.now();
        await ctx.db.patch(connectionId, {
            debugMode: enabled ? true : undefined,
            debugModeExpiresAt: enabled ? now + DEBUG_MODE_TTL_MS : undefined,
            updatedAt: now,
        });

        await ctx.db.insert("integrationAuditLog", {
            organizationId: conn.organizationId,
            userId,
            connectionId,
            provider: conn.provider,
            action: enabled ? "crm.connection.debug_enabled" : "crm.connection.debug_disabled",
            severity: "info",
            metadataSanitized: enabled ? { expiresAt: now + DEBUG_MODE_TTL_MS } : undefined,
            createdAt: now,
        });

        return { ok: true as const, expiresAt: enabled ? now + DEBUG_MODE_TTL_MS : null };
    },
});
