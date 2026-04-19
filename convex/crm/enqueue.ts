/**
 * Helpers to enqueue conversation events into crmSyncQueue.
 * Called from conversation mutations (opened/assigned/resolved).
 */

import { MutationCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";
import type { ConversationEventType } from "./core/types";

async function hashKey(input: string): Promise<string> {
    const data = new TextEncoder().encode(input);
    const buf = await crypto.subtle.digest("SHA-256", data);
    const bytes = new Uint8Array(buf);
    let hex = "";
    for (let i = 0; i < bytes.length; i++) hex += bytes[i].toString(16).padStart(2, "0");
    return hex.slice(0, 32);
}

export interface EnqueueInput {
    organizationId: Id<"organizations">;
    eventType: ConversationEventType;
    contactId: Id<"contacts">;
    occurredAtMs: number;
    conversationId?: Id<"conversations">;
    metadata?: Record<string, unknown>;
}

/**
 * Enqueues a conversation event for all active CRM connections of the org.
 * Safe to call on every conversation transition: no network, pure DB writes.
 */
export async function enqueueConversationEvent(
    ctx: MutationCtx,
    input: EnqueueInput,
): Promise<void> {
    const active = await ctx.db
        .query("crmConnections")
        .withIndex("by_organization_status", (q) =>
            q.eq("organizationId", input.organizationId).eq("status", "active"),
        )
        .collect();
    if (active.length === 0) return;

    const now = Date.now();
    for (const c of active) {
        const link = await ctx.db
            .query("crmContactLinks")
            .withIndex("by_contact", (q) => q.eq("contactId", input.contactId))
            .filter((q) => q.eq(q.field("connectionId"), c._id))
            .first();
        const contactExternalId = link?.externalId;

        const raw = `${c._id}:${input.eventType}:${input.contactId}:${input.conversationId ?? ""}:${input.occurredAtMs}`;
        const idempotencyKey = await hashKey(raw);

        const existing = await ctx.db
            .query("crmSyncQueue")
            .withIndex("by_idempotency", (q) => q.eq("idempotencyKey", idempotencyKey))
            .first();
        if (existing) continue;

        await ctx.db.insert("crmSyncQueue", {
            organizationId: input.organizationId,
            connectionId: c._id,
            eventType: input.eventType,
            payload: {
                contactId: input.contactId,
                contactExternalId,
                conversationId: input.conversationId,
                occurredAtMs: input.occurredAtMs,
                metadata: input.metadata,
            },
            idempotencyKey,
            entityType: "contact",
            entityId: contactExternalId ?? undefined,
            status: "pending",
            retryCount: 0,
            nextAttemptAt: now,
            enqueuedAtMs: now,
            createdAt: now,
            updatedAt: now,
        });
    }
}
