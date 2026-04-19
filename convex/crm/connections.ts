/**
 * CRM connections — Convex mutations + queries.
 * Phase 1: list providers, list connections, minimal reads. Connect/disconnect arrive in Phase 2.
 */

import { v } from "convex/values";
import { query } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { listProviders } from "./core/providers";
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
