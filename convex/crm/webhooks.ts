/**
 * Webhooks entry — called from convex/http.ts after raw body is captured.
 * Responsibilities: signature verify, idempotent receipt persistence, fast 200 ack.
 * Deep processing is deferred to internal actions to keep ack latency low.
 */

import { v } from "convex/values";
import { internal } from "../_generated/api";
import { Id } from "../_generated/dataModel";
import {
    httpAction,
    internalAction,
    internalMutation,
    internalQuery,
} from "../_generated/server";
import { getAdapter } from "./registry";
import { decrypt } from "../lib/encryption";
import { logJson, newCorrelationId, sanitizeError } from "./core/logger";
import type { CRMProvider, ParsedWebhookEvent } from "./core/types";

const SUPPORTED_WEBHOOK_PROVIDERS: CRMProvider[] = [
    "hubspot",
    "pipedrive",
    "sellsy",
    "axonaut",
];

/**
 * HTTP action exposed at /webhooks/crm/:provider.
 * Verifies signature with provider-specific secret, persists receipt, returns 200.
 */
export const handle = httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const parts = url.pathname.split("/").filter(Boolean);
    const provider = parts[parts.length - 1] as CRMProvider;
    const correlationId = newCorrelationId("webhook");

    if (!SUPPORTED_WEBHOOK_PROVIDERS.includes(provider)) {
        return new Response(JSON.stringify({ error: "provider_not_supported" }), {
            status: 404,
            headers: { "content-type": "application/json" },
        });
    }

    const rawBody = await request.text();
    const headers: Record<string, string | undefined> = {};
    request.headers.forEach((value, key) => {
        headers[key.toLowerCase()] = value;
    });

    const adapter = getAdapter(provider);
    if (!adapter.verifyWebhookSignature || !adapter.parseWebhookEvent) {
        return new Response(JSON.stringify({ error: "not_implemented" }), {
            status: 501,
            headers: { "content-type": "application/json" },
        });
    }

    const secret = getWebhookSecret(provider);
    if (!secret) {
        logJson("error", {
            module: "crm.webhooks",
            event: "missing_secret",
            provider,
            correlationId,
        });
        return new Response(JSON.stringify({ error: "missing_secret" }), {
            status: 500,
            headers: { "content-type": "application/json" },
        });
    }

    const valid = await adapter.verifyWebhookSignature({ rawBody, headers, secret });
    if (!valid) {
        logJson("warn", {
            module: "crm.webhooks",
            event: "invalid_signature",
            provider,
            correlationId,
        });
        return new Response(JSON.stringify({ error: "invalid_signature" }), {
            status: 401,
            headers: { "content-type": "application/json" },
        });
    }

    let events: ParsedWebhookEvent[];
    try {
        events = await adapter.parseWebhookEvent({ rawBody, headers });
    } catch (err) {
        logJson("error", {
            module: "crm.webhooks",
            event: "parse_failed",
            provider,
            correlationId,
            error: sanitizeError(err, { provider, correlationId }),
        });
        return new Response(JSON.stringify({ error: "parse_failed" }), {
            status: 400,
            headers: { "content-type": "application/json" },
        });
    }

    await ctx.runMutation(internal.crm.webhooks._persistReceipts, {
        provider,
        events,
    });

    for (const e of events) {
        await ctx.scheduler.runAfter(0, internal.crm.webhooks.processEvent, {
            provider,
            eventKey: e.eventKey,
        });
    }

    return new Response(JSON.stringify({ ok: true, received: events.length }), {
        status: 200,
        headers: { "content-type": "application/json" },
    });
});

function getWebhookSecret(provider: CRMProvider): string | null {
    switch (provider) {
        case "hubspot":
            return process.env.HUBSPOT_CLIENT_SECRET ?? null;
        case "pipedrive":
            return process.env.PIPEDRIVE_WEBHOOK_SECRET ?? null;
        case "sellsy":
            return process.env.SELLSY_WEBHOOK_SECRET ?? null;
        case "axonaut":
            return process.env.AXONAUT_WEBHOOK_SECRET ?? null;
        default:
            return null;
    }
}

export const _persistReceipts = internalMutation({
    args: {
        provider: v.string(),
        events: v.array(v.any()),
    },
    handler: async (ctx, { provider, events }) => {
        const now = Date.now();
        for (const e of events as ParsedWebhookEvent[]) {
            const existing = await ctx.db
                .query("crmWebhookReceipts")
                .withIndex("by_eventKey", (q) => q.eq("eventKey", e.eventKey))
                .first();
            if (existing) continue;

            let connectionId: Id<"crmConnections"> | undefined;
            let organizationId: Id<"organizations"> | undefined;
            if (e.remoteAccountId) {
                const conn = await ctx.db
                    .query("crmConnections")
                    .withIndex("by_provider_remoteAccountId", (q) =>
                        q.eq("provider", provider).eq("remoteAccountId", e.remoteAccountId!),
                    )
                    .first();
                if (conn) {
                    connectionId = conn._id;
                    organizationId = conn.organizationId;
                }
            }

            await ctx.db.insert("crmWebhookReceipts", {
                organizationId,
                connectionId,
                provider,
                eventKey: e.eventKey,
                eventType: e.eventType,
                entityType: e.entityType,
                entityExternalId: e.entityExternalId,
                receivedAt: now,
                status: "received",
            });
        }
    },
});

export const processEvent = internalAction({
    args: { provider: v.string(), eventKey: v.string() },
    handler: async (ctx, { provider, eventKey }): Promise<void> => {
        const correlationId = newCorrelationId("webhook_proc");
        const receipt = await ctx.runQuery(internal.crm.webhooks._loadReceipt, {
            eventKey,
        });
        if (!receipt || receipt.status !== "received") return;

        if (!receipt.connectionId) {
            await ctx.runMutation(internal.crm.webhooks._updateReceiptStatus, {
                eventKey,
                status: "ignored",
                error: "no_connection_for_remoteAccount",
            });
            return;
        }

        const bundle = await ctx.runQuery(internal.crm.webhooks._loadConnectionForReceipt, {
            connectionId: receipt.connectionId,
        });
        if (!bundle || !bundle.connection) {
            await ctx.runMutation(internal.crm.webhooks._updateReceiptStatus, {
                eventKey,
                status: "failed",
                error: "connection_missing",
            });
            return;
        }
        const connection = bundle.connection;

        if (connection.status === "reconnect_required") {
            await ctx.runMutation(internal.crm.webhooks._updateReceiptStatus, {
                eventKey,
                status: "deferred",
            });
            return;
        }

        if (receipt.entityType === "contact" && receipt.entityExternalId) {
            let accessToken: string | undefined;
            if (connection.accessTokenEnc) {
                try {
                    accessToken = await decrypt(connection.accessTokenEnc);
                } catch {
                    /* swallow; pull will fail and be retried */
                }
            }
            if (accessToken) {
                try {
                    const adapter = getAdapter(provider as CRMProvider);
                    if (adapter.findContactByPhone || adapter.findContactByEmail) {
                        // Pull full contact via search endpoint (by id would be ideal; providers vary).
                        // For MVP: defer to polling delta if no id-based getter.
                    }
                } catch (err) {
                    logJson("warn", {
                        module: "crm.webhooks",
                        event: "hydrate_failed",
                        provider: provider as CRMProvider,
                        correlationId,
                        error: sanitizeError(err, { provider: provider as CRMProvider, correlationId }),
                    });
                }
            }
        }

        await ctx.runMutation(internal.crm.webhooks._updateReceiptStatus, {
            eventKey,
            status: "processed",
        });
    },
});

export const _loadReceipt = internalQuery({
    args: { eventKey: v.string() },
    handler: async (ctx, { eventKey }) => {
        return await ctx.db
            .query("crmWebhookReceipts")
            .withIndex("by_eventKey", (q) => q.eq("eventKey", eventKey))
            .first();
    },
});

export const _loadConnectionForReceipt = internalQuery({
    args: { connectionId: v.id("crmConnections") },
    handler: async (ctx, { connectionId }) => {
        const connection = await ctx.db.get(connectionId);
        return { connection };
    },
});

export const _updateReceiptStatus = internalMutation({
    args: {
        eventKey: v.string(),
        status: v.union(
            v.literal("received"),
            v.literal("processed"),
            v.literal("ignored"),
            v.literal("deferred"),
            v.literal("failed"),
            v.literal("superseded_by_resync"),
        ),
        error: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const receipt = await ctx.db
            .query("crmWebhookReceipts")
            .withIndex("by_eventKey", (q) => q.eq("eventKey", args.eventKey))
            .first();
        if (!receipt) return;
        const now = Date.now();
        await ctx.db.patch(receipt._id, {
            status: args.status,
            processedAt: args.status === "processed" ? now : receipt.processedAt,
            lastError: args.error?.slice(0, 500),
        });
    },
});
