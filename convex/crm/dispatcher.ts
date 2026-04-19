/**
 * Push dispatcher — drains crmSyncQueue into provider CRMs.
 * Cron tick (every 20s) selects pending items, locks via CAS, invokes adapter.
 * Classifies errors: auth → reconnect_required, rate_limit → honor Retry-After,
 * transient → backoff + DLQ after MAX_ATTEMPTS, validation → fail immediate no DLQ.
 */

import { v } from "convex/values";
import { internal } from "../_generated/api";
import { Id } from "../_generated/dataModel";
import {
    internalAction,
    internalMutation,
    internalQuery,
} from "../_generated/server";
import { getAdapter } from "./registry";
import { decrypt } from "../lib/encryption";
import { logJson, newCorrelationId, sanitizeError } from "./core/logger";
import { CIRCUIT_BREAKER, DLQ } from "./core/constants";
import {
    CRMAuthError,
    CRMRateLimitError,
    CRMValidationError,
    CRMError,
} from "./core/errors";
import type { AdapterCallCtx, CRMProvider, ConversationEvent, ConversationEventType } from "./core/types";

const DISPATCHER_BATCH_DEFAULT = 25;

function backoff(retryCount: number): number {
    const exp = DLQ.BACKOFF_BASE_MS * Math.pow(2, retryCount);
    const jitter = Math.random() * DLQ.BACKOFF_BASE_MS;
    return Math.min(exp + jitter, DLQ.BACKOFF_MAX_MS);
}

export const runTick = internalAction({
    args: {},
    handler: async (ctx): Promise<void> => {
        const batch = await ctx.runQuery(internal.crm.dispatcher._pickBatch, {
            limit: DISPATCHER_BATCH_DEFAULT,
        });
        for (const item of batch) {
            const jitter = Math.floor(Math.random() * 500);
            await ctx.scheduler.runAfter(jitter, internal.crm.dispatcher.processOne, {
                queueItemId: item._id,
            });
        }
    },
});

export const _pickBatch = internalQuery({
    args: { limit: v.number() },
    handler: async (ctx, { limit }) => {
        const now = Date.now();
        const candidates = await ctx.db
            .query("crmSyncQueue")
            .withIndex("by_status_nextAttempt", (q) => q.eq("status", "pending"))
            .take(limit * 4);
        return candidates.filter((c) => c.nextAttemptAt <= now).slice(0, limit);
    },
});

export const processOne = internalAction({
    args: { queueItemId: v.id("crmSyncQueue") },
    handler: async (ctx, { queueItemId }): Promise<void> => {
        const correlationId = newCorrelationId("dispatch");
        const locked = await ctx.runMutation(internal.crm.dispatcher._tryLock, {
            queueItemId,
        });
        if (!locked) return;

        const bundle = await ctx.runQuery(internal.crm.dispatcher._loadItemBundle, {
            queueItemId,
        });
        if (!bundle || !bundle.item || !bundle.connection) {
            await ctx.runMutation(internal.crm.dispatcher._markFailed, {
                queueItemId,
                errorMessage: "item_or_connection_missing",
                retryable: false,
            });
            return;
        }
        const { item, connection, quota } = bundle;

        if (connection.status !== "active") {
            await ctx.runMutation(internal.crm.dispatcher._requeue, {
                queueItemId,
                nextAttemptAt: Date.now() + 30_000,
            });
            return;
        }

        if (quota?.circuitState === "open") {
            const openedAt = quota.circuitOpenedAt ?? 0;
            if (Date.now() - openedAt < CIRCUIT_BREAKER.HALF_OPEN_AFTER_MS) {
                await ctx.runMutation(internal.crm.dispatcher._requeue, {
                    queueItemId,
                    nextAttemptAt: Date.now() + CIRCUIT_BREAKER.HALF_OPEN_AFTER_MS,
                });
                return;
            }
            await ctx.runMutation(internal.crm.dispatcher._setCircuitState, {
                provider: connection.provider,
                remoteAccountId: connection.remoteAccountId,
                rateLimitPerHour: 40_000,
                state: "half_open",
            });
        }

        let accessToken: string | undefined;
        if (connection.accessTokenEnc) {
            try {
                accessToken = await decrypt(connection.accessTokenEnc);
            } catch (err) {
                await ctx.runMutation(internal.crm.dispatcher._markConnectionReconnect, {
                    connectionId: connection._id,
                    reason: sanitizeError(err).message,
                });
                await ctx.runMutation(internal.crm.dispatcher._requeue, {
                    queueItemId,
                    nextAttemptAt: Date.now() + 60_000,
                });
                return;
            }
        }

        const provider = connection.provider as CRMProvider;
        const adapter = getAdapter(provider);
        const adapterCtx: AdapterCallCtx = {
            provider,
            connectionId: String(connection._id),
            organizationId: String(connection.organizationId),
            correlationId,
            credentials: {
                accessToken,
                instanceUrl: connection.instanceUrl,
            },
            scalingMode: connection.scalingMode,
        };

        const event: ConversationEvent = {
            type: item.eventType as ConversationEventType,
            occurredAtMs: (item.payload?.occurredAtMs as number | undefined) ?? item.enqueuedAtMs,
            contactId: String(item.payload?.contactId ?? ""),
            contactExternalId: item.payload?.contactExternalId as string | undefined,
            metadata: item.payload?.metadata as Record<string, unknown> | undefined,
        };

        const startedAt = Date.now();
        try {
            if (!event.contactExternalId) {
                throw new CRMValidationError("contactExternalId missing (contact not linked to CRM)", {
                    provider,
                });
            }
            await adapter.pushConversationEvent({ ctx: adapterCtx, event });
            const durationMs = Date.now() - startedAt;

            await ctx.runMutation(internal.crm.dispatcher._markSucceeded, {
                queueItemId,
                provider,
                remoteAccountId: connection.remoteAccountId,
                rateLimitPerHour: adapter.capabilities.rateLimitPerHour,
                durationMs,
            });

            logJson("info", {
                module: "crm.dispatcher",
                event: "push_succeeded",
                provider,
                connectionId: String(connection._id),
                queueItemId: String(queueItemId),
                correlationId,
                durationMs,
            });
        } catch (err) {
            const sanitized = sanitizeError(err, { provider, correlationId });
            const isAuth = err instanceof CRMAuthError;
            const isValidation = err instanceof CRMValidationError;
            const isRateLimit = err instanceof CRMRateLimitError;
            const retryable = err instanceof CRMError ? Boolean(err.meta?.retryable ?? !isValidation) : true;
            const retryAfterMs = err instanceof CRMError ? err.meta?.retryAfterMs : undefined;

            logJson("error", {
                module: "crm.dispatcher",
                event: "push_failed",
                provider,
                connectionId: String(connection._id),
                queueItemId: String(queueItemId),
                correlationId,
                error: sanitized,
            });

            if (isAuth) {
                await ctx.runMutation(internal.crm.dispatcher._markConnectionReconnect, {
                    connectionId: connection._id,
                    reason: sanitized.message,
                });
                await ctx.runMutation(internal.crm.dispatcher._requeue, {
                    queueItemId,
                    nextAttemptAt: Date.now() + 5 * 60_000,
                    errorMessage: sanitized.message,
                });
                return;
            }

            if (isValidation) {
                await ctx.runMutation(internal.crm.dispatcher._markFailed, {
                    queueItemId,
                    errorMessage: sanitized.message,
                    retryable: false,
                });
                return;
            }

            await ctx.runMutation(internal.crm.dispatcher._recordProviderFailure, {
                provider,
                remoteAccountId: connection.remoteAccountId,
                rateLimitPerHour: adapter.capabilities.rateLimitPerHour,
            });

            const nextRetry = item.retryCount + 1;
            if (nextRetry >= DLQ.MAX_ATTEMPTS) {
                await ctx.runMutation(internal.crm.dispatcher._deadLetter, {
                    queueItemId,
                    errorMessage: sanitized.message,
                });
            } else {
                const wait = isRateLimit && retryAfterMs ? retryAfterMs : backoff(nextRetry);
                await ctx.runMutation(internal.crm.dispatcher._scheduleRetry, {
                    queueItemId,
                    nextAttemptAt: Date.now() + wait,
                    retryCount: nextRetry,
                    errorMessage: sanitized.message,
                });
            }
        }
    },
});

export const _tryLock = internalMutation({
    args: { queueItemId: v.id("crmSyncQueue") },
    handler: async (ctx, { queueItemId }): Promise<boolean> => {
        const item = await ctx.db.get(queueItemId);
        if (!item || item.status !== "pending") return false;
        if (item.nextAttemptAt > Date.now()) return false;
        const now = Date.now();
        await ctx.db.patch(queueItemId, {
            status: "processing",
            lockedAt: now,
            processingStartedAt: now,
            updatedAt: now,
        });
        return true;
    },
});

export const _loadItemBundle = internalQuery({
    args: { queueItemId: v.id("crmSyncQueue") },
    handler: async (ctx, { queueItemId }) => {
        const item = await ctx.db.get(queueItemId);
        if (!item) return null;
        const connection = await ctx.db.get(item.connectionId);
        if (!connection) return { item, connection: null, quota: null };
        const quota = await ctx.db
            .query("crmRemoteAccountQuota")
            .withIndex("by_provider_account", (q) =>
                q.eq("provider", connection.provider).eq("remoteAccountId", connection.remoteAccountId),
            )
            .first();
        return { item, connection, quota };
    },
});

export const _markSucceeded = internalMutation({
    args: {
        queueItemId: v.id("crmSyncQueue"),
        provider: v.string(),
        remoteAccountId: v.string(),
        rateLimitPerHour: v.number(),
        durationMs: v.number(),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        await ctx.db.patch(args.queueItemId, {
            status: "succeeded",
            lastAttemptAt: now,
            updatedAt: now,
        });
        const existing = await ctx.db
            .query("crmRemoteAccountQuota")
            .withIndex("by_provider_account", (q) =>
                q.eq("provider", args.provider).eq("remoteAccountId", args.remoteAccountId),
            )
            .first();
        if (existing) {
            await ctx.db.patch(existing._id, {
                callsUsed: existing.callsUsed + 1,
                circuitState: "closed",
                circuitOpenedAt: undefined,
                consecutiveErrors: 0,
                updatedAt: now,
            });
        } else {
            await ctx.db.insert("crmRemoteAccountQuota", {
                provider: args.provider,
                remoteAccountId: args.remoteAccountId,
                windowStartMs: now,
                callsUsed: 1,
                rateLimitPerHour: args.rateLimitPerHour,
                circuitState: "closed",
                consecutiveErrors: 0,
                updatedAt: now,
            });
        }
    },
});

export const _markFailed = internalMutation({
    args: {
        queueItemId: v.id("crmSyncQueue"),
        errorMessage: v.string(),
        retryable: v.boolean(),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        await ctx.db.patch(args.queueItemId, {
            status: "failed",
            lastAttemptAt: now,
            lastError: args.errorMessage,
            updatedAt: now,
        });
    },
});

export const _deadLetter = internalMutation({
    args: { queueItemId: v.id("crmSyncQueue"), errorMessage: v.string() },
    handler: async (ctx, args) => {
        const now = Date.now();
        const item = await ctx.db.get(args.queueItemId);
        if (!item) return;
        await ctx.db.patch(args.queueItemId, {
            status: "dead_letter",
            deadLetteredAt: now,
            lastError: args.errorMessage,
            updatedAt: now,
        });
        await ctx.db.insert("integrationAuditLog", {
            organizationId: item.organizationId,
            connectionId: item.connectionId,
            action: "crm.queue.dead_lettered",
            severity: "error",
            entityType: "queue_item",
            entityId: String(args.queueItemId),
            metadataSanitized: { reason: args.errorMessage, retries: item.retryCount },
            createdAt: now,
        });
    },
});

export const _scheduleRetry = internalMutation({
    args: {
        queueItemId: v.id("crmSyncQueue"),
        nextAttemptAt: v.number(),
        retryCount: v.number(),
        errorMessage: v.string(),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        await ctx.db.patch(args.queueItemId, {
            status: "pending",
            retryCount: args.retryCount,
            nextAttemptAt: args.nextAttemptAt,
            lockedAt: undefined,
            processingStartedAt: undefined,
            lastAttemptAt: now,
            lastError: args.errorMessage,
            updatedAt: now,
        });
    },
});

export const _requeue = internalMutation({
    args: {
        queueItemId: v.id("crmSyncQueue"),
        nextAttemptAt: v.number(),
        errorMessage: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        await ctx.db.patch(args.queueItemId, {
            status: "pending",
            nextAttemptAt: args.nextAttemptAt,
            lockedAt: undefined,
            processingStartedAt: undefined,
            lastError: args.errorMessage,
            updatedAt: now,
        });
    },
});

export const _markConnectionReconnect = internalMutation({
    args: { connectionId: v.id("crmConnections"), reason: v.string() },
    handler: async (ctx, args) => {
        const now = Date.now();
        const c = await ctx.db.get(args.connectionId);
        if (!c) return;
        await ctx.db.patch(args.connectionId, {
            status: "reconnect_required",
            lastErrorAt: now,
            lastErrorCode: "AUTH",
            lastErrorMessageSanitized: args.reason.slice(0, 500),
            updatedAt: now,
        });
        await ctx.db.insert("integrationAuditLog", {
            organizationId: c.organizationId,
            connectionId: args.connectionId,
            provider: c.provider,
            action: "crm.connection.reconnect_required",
            severity: "warning",
            metadataSanitized: { reason: args.reason.slice(0, 200) },
            createdAt: now,
        });
    },
});

export const _recordProviderFailure = internalMutation({
    args: {
        provider: v.string(),
        remoteAccountId: v.string(),
        rateLimitPerHour: v.number(),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        const existing = await ctx.db
            .query("crmRemoteAccountQuota")
            .withIndex("by_provider_account", (q) =>
                q.eq("provider", args.provider).eq("remoteAccountId", args.remoteAccountId),
            )
            .first();
        const errors = (existing?.consecutiveErrors ?? 0) + 1;
        const shouldOpen = errors >= CIRCUIT_BREAKER.CONSECUTIVE_ERRORS_TO_OPEN;
        const nextState: "closed" | "open" = shouldOpen ? "open" : existing?.circuitState === "half_open" ? "open" : (existing?.circuitState ?? "closed") as "closed";
        if (existing) {
            await ctx.db.patch(existing._id, {
                consecutiveErrors: errors,
                circuitState: nextState,
                circuitOpenedAt: nextState === "open" ? now : existing.circuitOpenedAt,
                updatedAt: now,
            });
        } else {
            await ctx.db.insert("crmRemoteAccountQuota", {
                provider: args.provider,
                remoteAccountId: args.remoteAccountId,
                windowStartMs: now,
                callsUsed: 0,
                rateLimitPerHour: args.rateLimitPerHour,
                circuitState: nextState,
                circuitOpenedAt: nextState === "open" ? now : undefined,
                consecutiveErrors: errors,
                updatedAt: now,
            });
        }
    },
});

export const _setCircuitState = internalMutation({
    args: {
        provider: v.string(),
        remoteAccountId: v.string(),
        rateLimitPerHour: v.number(),
        state: v.union(v.literal("closed"), v.literal("half_open"), v.literal("open")),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        const existing = await ctx.db
            .query("crmRemoteAccountQuota")
            .withIndex("by_provider_account", (q) =>
                q.eq("provider", args.provider).eq("remoteAccountId", args.remoteAccountId),
            )
            .first();
        if (existing) {
            await ctx.db.patch(existing._id, {
                circuitState: args.state,
                circuitOpenedAt: args.state === "open" ? now : undefined,
                updatedAt: now,
            });
        } else {
            await ctx.db.insert("crmRemoteAccountQuota", {
                provider: args.provider,
                remoteAccountId: args.remoteAccountId,
                windowStartMs: now,
                callsUsed: 0,
                rateLimitPerHour: args.rateLimitPerHour,
                circuitState: args.state,
                consecutiveErrors: 0,
                updatedAt: now,
            });
        }
    },
});

