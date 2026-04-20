/**
 * CRM connections — Convex mutations + queries.
 */

import { v } from "convex/values";
import {
    action,
    internalMutation,
    internalQuery,
    query,
} from "../_generated/server";
import { internal } from "../_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";
import { getProviderInfo, listProviders } from "./core/providers";
import { hasPermission } from "../lib/permissions";
import { decrypt } from "../lib/encryption";
import { getAdapter } from "./registry";
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
            supportsRevoke: p.capabilities.supportsRevoke,
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
 * Internal: loads enough state to perform a disconnect + remote revocation.
 * Enforces organization scoping + `integrations:manage` permission.
 * Returns encrypted tokens that the caller (an `action`) will decrypt and
 * pass to the adapter's `revokeToken` before wiping them.
 */
export const _prepareDisconnect = internalQuery({
    args: { connectionId: v.id("crmConnections"), userId: v.id("users") },
    handler: async (ctx, { connectionId, userId }) => {
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

        return {
            provider: conn.provider as CRMProvider,
            organizationId: conn.organizationId,
            accessTokenEnc: conn.accessTokenEnc,
            refreshTokenEnc: conn.refreshTokenEnc,
        };
    },
});

/**
 * Internal: wipes encrypted tokens, flips status to "disconnected", records
 * the audit log. Called by the `disconnect` action after best-effort remote
 * revocation.
 */
export const _finalizeDisconnect = internalMutation({
    args: {
        connectionId: v.id("crmConnections"),
        userId: v.id("users"),
        remoteRevokeStatus: v.union(
            v.literal("success"),
            v.literal("failed"),
            v.literal("skipped"),
        ),
    },
    handler: async (ctx, { connectionId, userId, remoteRevokeStatus }) => {
        const conn = await ctx.db.get(connectionId);
        if (!conn) throw new Error("connection_not_found");

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
            severity: remoteRevokeStatus === "failed" ? "warning" : "info",
            metadataSanitized: { remoteRevoke: remoteRevokeStatus },
            createdAt: now,
        });

        return { ok: true as const };
    },
});

/**
 * Disconnects a CRM connection.
 *
 * Flow:
 *   1. Permission check via internal query (org scoping + `integrations:manage`)
 *   2. Best-effort OAuth revoke on provider side (Salesforce is the only
 *      adapter that actually implements this today; others are no-ops)
 *   3. Wipe encrypted tokens + audit log via internal mutation
 *
 * A failed remote revoke does NOT abort the disconnect — local state is the
 * source of truth and the user can still revoke access manually from the
 * provider's UI (the dialog already warns about this case).
 */
export const disconnect = action({
    args: { connectionId: v.id("crmConnections") },
    handler: async (ctx, { connectionId }): Promise<{ ok: true }> => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("unauthenticated");

        const prepared = await ctx.runQuery(internal.crm.connections._prepareDisconnect, {
            connectionId,
            userId,
        });

        const providerInfo = getProviderInfo(prepared.provider);
        let remoteRevokeStatus: "success" | "failed" | "skipped" = "skipped";

        if (providerInfo.capabilities.supportsRevoke) {
            const adapter = getAdapter(prepared.provider);
            if (adapter.revokeToken) {
                try {
                    const accessToken = prepared.accessTokenEnc
                        ? await decrypt(prepared.accessTokenEnc)
                        : undefined;
                    const refreshToken = prepared.refreshTokenEnc
                        ? await decrypt(prepared.refreshTokenEnc)
                        : undefined;
                    await adapter.revokeToken({ accessToken, refreshToken });
                    remoteRevokeStatus = "success";
                } catch {
                    // Best effort: local wipe is the source of truth. A failed
                    // remote revoke is logged but does not block disconnect.
                    remoteRevokeStatus = "failed";
                }
            }
        }

        await ctx.runMutation(internal.crm.connections._finalizeDisconnect, {
            connectionId,
            userId,
            remoteRevokeStatus,
        });

        return { ok: true };
    },
});
