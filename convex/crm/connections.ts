/**
 * CRM connections — Convex mutations + queries.
 */

import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { listProviders } from "./core/providers";
import { hasPermission } from "../lib/permissions";
import type { CRMProvider } from "./core/types";

/**
 * Public catalog of CRM providers with availability flags.
 * Safe to call without auth (pure metadata).
 */
export const listAvailableProviders = query({
    args: {},
    handler: async () => {
        return listProviders().map((p) => ({
            key: p.key,
            displayName: p.displayName,
            authMode: p.authMode,
            availability: p.availability,
            docsUrl: p.docsUrl,
            supportsDeals: p.capabilities.supportsDeals,
            supportsWebhooks: p.capabilities.supportsWebhooks,
        }));
    },
});

/**
 * Lists CRM connections for the current user's active organization.
 * Returns a safe shape: NEVER exposes encrypted tokens.
 */
export const listForCurrentOrganization = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) return [];

        const session = await ctx.db
            .query("userSessions")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .first();
        if (!session?.currentOrganizationId) return [];

        const connections = await ctx.db
            .query("crmConnections")
            .withIndex("by_organization", (q) =>
                q.eq("organizationId", session.currentOrganizationId!),
            )
            .collect();

        return connections.map((c) => ({
            _id: c._id,
            provider: c.provider as CRMProvider,
            status: c.status,
            authMode: c.authMode,
            scalingMode: c.scalingMode,
            remoteAccountLabel: c.remoteAccountLabel,
            connectedAt: c.connectedAt,
            lastSyncAt: c.lastSyncAt,
            lastPollAt: c.lastPollAt,
            lastErrorAt: c.lastErrorAt,
            lastErrorCode: c.lastErrorCode,
            lastErrorMessageSanitized: c.lastErrorMessageSanitized,
            tokenExpiresAt: c.tokenExpiresAt,
        }));
    },
});

/**
 * Returns metadata for a single connection (same safe shape as list).
 */
export const getConnection = query({
    args: { connectionId: v.id("crmConnections") },
    handler: async (ctx, { connectionId }) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) return null;

        const conn = await ctx.db.get(connectionId);
        if (!conn) return null;

        const session = await ctx.db
            .query("userSessions")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .first();
        if (session?.currentOrganizationId !== conn.organizationId) return null;

        return {
            _id: conn._id,
            provider: conn.provider,
            status: conn.status,
            authMode: conn.authMode,
            scalingMode: conn.scalingMode,
            remoteAccountLabel: conn.remoteAccountLabel,
            connectedAt: conn.connectedAt,
            connectedBy: conn.connectedBy,
            lastSyncAt: conn.lastSyncAt,
            lastPollAt: conn.lastPollAt,
            tokenExpiresAt: conn.tokenExpiresAt,
            lastErrorAt: conn.lastErrorAt,
            lastErrorCode: conn.lastErrorCode,
            lastErrorMessageSanitized: conn.lastErrorMessageSanitized,
            scopes: conn.scopes,
            instanceUrl: conn.instanceUrl,
            debugMode: conn.debugMode,
        };
    },
});

/**
 * Disconnects a CRM connection.
 * Erases encrypted tokens immediately (per design §5.1), sets status to "disconnected",
 * records audit log. Does NOT delete crmContactLinks (keeps historical mapping).
 * Requires `integrations:manage` permission.
 */
export const disconnect = mutation({
    args: { connectionId: v.id("crmConnections") },
    handler: async (ctx, { connectionId }) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("unauthenticated");

        const conn = await ctx.db.get(connectionId);
        if (!conn) throw new Error("connection_not_found");

        const session = await ctx.db
            .query("userSessions")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .first();
        if (session?.currentOrganizationId !== conn.organizationId) {
            throw new Error("forbidden");
        }

        const membership = await ctx.db
            .query("memberships")
            .withIndex("by_user_org", (q) =>
                q.eq("userId", userId).eq("organizationId", conn.organizationId),
            )
            .first();
        if (!membership) throw new Error("forbidden");
        if (!hasPermission(membership.role, "integrations:manage")) {
            throw new Error("forbidden");
        }

        const now = Date.now();
        await ctx.db.patch(connectionId, {
            status: "disconnected",
            accessTokenEnc: undefined,
            refreshTokenEnc: undefined,
            apiKeyEnc: undefined,
            tokenExpiresAt: undefined,
            revokedAt: now,
            revokedBy: userId,
            updatedAt: now,
        });

        await ctx.db.insert("integrationAuditLog", {
            organizationId: conn.organizationId,
            userId,
            connectionId,
            provider: conn.provider,
            action: "disconnect",
            severity: "info",
            createdAt: now,
        });

        return { ok: true as const };
    },
});
