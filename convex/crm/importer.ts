/**
 * Progressive import job — one tick = one page.
 * Kicked off after OAuth success; resumes via scheduler.runAfter.
 */

import { v } from "convex/values";
import { internal } from "../_generated/api";
import { Id } from "../_generated/dataModel";
import {
    action,
    internalAction,
    internalMutation,
    internalQuery,
} from "../_generated/server";
import { getAdapter } from "./registry";
import { decrypt } from "../lib/encryption";
import { logJson, newCorrelationId, sanitizeError } from "./core/logger";
import { normalizeToE164, fullNameFrom } from "./core/mapping";
import type {
    AdapterCallCtx,
    CRMProvider,
    UnifiedContact,
    UnifiedDeal,
} from "./core/types";
import { IMPORT } from "./core/constants";

export const startInitialImport = internalMutation({
    args: { connectionId: v.id("crmConnections") },
    handler: async (ctx, { connectionId }) => {
        const connection = await ctx.db.get(connectionId);
        if (!connection) return;

        const now = Date.now();
        const jobId = await ctx.db.insert("crmImportJobs", {
            organizationId: connection.organizationId,
            connectionId,
            jobType: "initial_import",
            phase: "contacts",
            status: "pending",
            processed: 0,
            matched: 0,
            created: 0,
            skipped: 0,
            startedAt: now,
            createdAt: now,
            updatedAt: now,
        });

        await ctx.scheduler.runAfter(0, internal.crm.importer.runTick, { jobId });
    },
});

export const runTick = internalAction({
    args: { jobId: v.id("crmImportJobs") },
    handler: async (ctx, { jobId }): Promise<void> => {
        const correlationId = newCorrelationId("import");
        const bootstrap = await ctx.runQuery(internal.crm.importer._bootstrapTick, {
            jobId,
        });
        if (!bootstrap) return;
        const { job, connection } = bootstrap;
        if (job.status === "completed" || job.status === "cancelled") return;

        if (!connection || connection.status !== "active") {
            await ctx.runMutation(internal.crm.importer._markFailed, {
                jobId,
                reason: "connection_not_active",
            });
            return;
        }

        let accessToken: string | undefined;
        if (connection.accessTokenEnc) {
            try {
                accessToken = await decrypt(connection.accessTokenEnc);
            } catch (err) {
                logJson("error", {
                    module: "crm.importer",
                    event: "decrypt_failed",
                    provider: connection.provider as CRMProvider,
                    connectionId: String(connection._id),
                    correlationId,
                    error: sanitizeError(err),
                });
                await ctx.runMutation(internal.crm.importer._markFailed, {
                    jobId,
                    reason: "decrypt_failed",
                });
                return;
            }
        }

        const adapter = getAdapter(connection.provider as CRMProvider);
        const callCtx: AdapterCallCtx = {
            provider: connection.provider as CRMProvider,
            connectionId: String(connection._id),
            organizationId: String(connection.organizationId),
            correlationId,
            credentials: {
                accessToken,
                apiKey: undefined,
                instanceUrl: connection.instanceUrl,
            },
            scalingMode: connection.scalingMode,
        };

        try {
            if (job.phase === "contacts") {
                const page = await adapter.pullContactsPage({
                    ctx: callCtx,
                    cursor: job.cursor,
                });
                await ctx.runMutation(internal.crm.importer._persistContactBatch, {
                    jobId,
                    connectionId: job.connectionId,
                    contacts: page.items,
                });
                await ctx.runMutation(internal.crm.importer._patchJobAfterTick, {
                    jobId,
                    nextCursor: page.nextCursor,
                    hasMore: page.hasMore,
                    pageSize: page.items.length,
                });
                if (page.hasMore) {
                    await ctx.scheduler.runAfter(
                        500,
                        internal.crm.importer.runTick,
                        { jobId },
                    );
                } else {
                    const supportsDeals = adapter.capabilities.supportsDeals && !!adapter.pullDealsPage;
                    if (supportsDeals) {
                        await ctx.runMutation(internal.crm.importer._transitionToDeals, {
                            jobId,
                        });
                        await ctx.scheduler.runAfter(
                            500,
                            internal.crm.importer.runTick,
                            { jobId },
                        );
                    } else {
                        await ctx.runMutation(internal.crm.importer._complete, { jobId });
                    }
                }
            } else {
                if (!adapter.pullDealsPage) {
                    await ctx.runMutation(internal.crm.importer._complete, { jobId });
                    return;
                }
                const page = await adapter.pullDealsPage({
                    ctx: callCtx,
                    cursor: job.cursor,
                });
                await ctx.runMutation(internal.crm.importer._persistDealBatch, {
                    jobId,
                    connectionId: job.connectionId,
                    deals: page.items,
                });
                await ctx.runMutation(internal.crm.importer._patchJobAfterTick, {
                    jobId,
                    nextCursor: page.nextCursor,
                    hasMore: page.hasMore,
                    pageSize: page.items.length,
                });
                if (page.hasMore) {
                    await ctx.scheduler.runAfter(
                        500,
                        internal.crm.importer.runTick,
                        { jobId },
                    );
                } else {
                    await ctx.runMutation(internal.crm.importer._complete, { jobId });
                }
            }
        } catch (err) {
            const sanitized = sanitizeError(err, {
                provider: connection.provider as CRMProvider,
                correlationId,
            });
            logJson("error", {
                module: "crm.importer",
                event: "tick_failed",
                provider: connection.provider as CRMProvider,
                connectionId: String(connection._id),
                jobId: String(jobId),
                correlationId,
                error: sanitized,
            });
            await ctx.runMutation(internal.crm.importer._markFailed, {
                jobId,
                reason: sanitized.message.slice(0, 200),
            });
        }
    },
});

export const _bootstrapTick = internalQuery({
    args: { jobId: v.id("crmImportJobs") },
    handler: async (ctx, { jobId }) => {
        const job = await ctx.db.get(jobId);
        if (!job) return null;
        const connection = await ctx.db.get(job.connectionId);
        return { job, connection };
    },
});

export const _patchJobAfterTick = internalMutation({
    args: {
        jobId: v.id("crmImportJobs"),
        nextCursor: v.optional(v.string()),
        hasMore: v.boolean(),
        pageSize: v.number(),
    },
    handler: async (ctx, args) => {
        const job = await ctx.db.get(args.jobId);
        if (!job) return;
        const now = Date.now();
        await ctx.db.patch(args.jobId, {
            status: "running",
            cursor: args.nextCursor,
            processed: job.processed + args.pageSize,
            lastHeartbeatAt: now,
            updatedAt: now,
        });
    },
});

export const _transitionToDeals = internalMutation({
    args: { jobId: v.id("crmImportJobs") },
    handler: async (ctx, { jobId }) => {
        const now = Date.now();
        await ctx.db.patch(jobId, {
            phase: "deals",
            cursor: undefined,
            processed: 0,
            status: "running",
            lastHeartbeatAt: now,
            updatedAt: now,
        });
    },
});

export const _complete = internalMutation({
    args: { jobId: v.id("crmImportJobs") },
    handler: async (ctx, { jobId }) => {
        const now = Date.now();
        const job = await ctx.db.get(jobId);
        if (!job) return;
        await ctx.db.patch(jobId, {
            status: "completed",
            completedAt: now,
            updatedAt: now,
        });
        await ctx.db.patch(job.connectionId, {
            lastSyncAt: now,
            updatedAt: now,
        });
        await ctx.db.insert("integrationAuditLog", {
            organizationId: job.organizationId,
            connectionId: job.connectionId,
            action: "crm.import.completed",
            severity: "info",
            metadataSanitized: { phase: job.phase, processed: job.processed },
            createdAt: now,
        });
    },
});

export const _markFailed = internalMutation({
    args: { jobId: v.id("crmImportJobs"), reason: v.string() },
    handler: async (ctx, { jobId, reason }) => {
        const job = await ctx.db.get(jobId);
        if (!job) return;
        const now = Date.now();
        await ctx.db.patch(jobId, {
            status: "failed",
            errorDetails: reason,
            updatedAt: now,
        });
        await ctx.db.insert("integrationAuditLog", {
            organizationId: job.organizationId,
            connectionId: job.connectionId,
            action: "crm.import.failed",
            severity: "error",
            metadataSanitized: { phase: job.phase, reason },
            createdAt: now,
        });
    },
});

export const _persistContactBatch = internalMutation({
    args: {
        jobId: v.id("crmImportJobs"),
        connectionId: v.id("crmConnections"),
        contacts: v.array(v.any()),
    },
    handler: async (ctx, { jobId, connectionId, contacts }) => {
        const connection = await ctx.db.get(connectionId);
        if (!connection) return;
        const orgId = connection.organizationId;
        const provider = connection.provider;
        const now = Date.now();

        for (const raw of contacts as UnifiedContact[]) {
            if (!raw?.externalId) continue;

            const existingLink = await ctx.db
                .query("crmContactLinks")
                .withIndex("by_org_provider_external", (q) =>
                    q
                        .eq("organizationId", orgId)
                        .eq("provider", provider)
                        .eq("externalId", raw.externalId),
                )
                .first();

            const phoneResult = raw.phones?.length
                ? _firstPhoneE164(raw.phones)
                : null;
            const email = raw.emails?.[0];

            let contactId: Id<"contacts"> | null = existingLink?.contactId ?? null;
            let linkMethod: "phone" | "email" | "manual" | "import" = "import";
            let matchConfidence: "high" | "medium" | "low" = "low";

            if (!contactId && phoneResult?.ok) {
                const byPhone = await ctx.db
                    .query("contacts")
                    .withIndex("by_organization", (q) => q.eq("organizationId", orgId))
                    .filter((q) => q.eq(q.field("phoneE164"), phoneResult.e164))
                    .first();
                if (byPhone) {
                    contactId = byPhone._id;
                    linkMethod = "phone";
                    matchConfidence = "high";
                }
            }

            if (!contactId && email) {
                const byEmail = await ctx.db
                    .query("contacts")
                    .withIndex("by_organization", (q) => q.eq("organizationId", orgId))
                    .filter((q) => q.eq(q.field("email"), email))
                    .first();
                if (byEmail) {
                    contactId = byEmail._id;
                    linkMethod = "email";
                    matchConfidence = "medium";
                }
            }

            if (!contactId) {
                if (!phoneResult?.ok) {
                    continue;
                }
                const fullName = fullNameFrom({
                    firstName: raw.firstName,
                    lastName: raw.lastName,
                    fullName: raw.fullName,
                });
                const searchName = [fullName, phoneResult.e164, email]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();
                contactId = await ctx.db.insert("contacts", {
                    organizationId: orgId,
                    name: fullName,
                    firstName: raw.firstName,
                    lastName: raw.lastName,
                    phone: phoneResult.e164,
                    phoneE164: phoneResult.e164,
                    phoneCountryCode: phoneResult.countryCode,
                    email,
                    company: raw.company,
                    jobTitle: raw.jobTitle,
                    whatsappOptIn: {
                        status: "unknown",
                        source: "crm_import_unknown",
                        at: now,
                    },
                    searchName,
                    createdAt: now,
                    updatedAt: now,
                });
                linkMethod = "import";
            } else {
                const patch: Record<string, unknown> = { updatedAt: now };
                if (phoneResult?.ok) {
                    patch.phoneE164 = phoneResult.e164;
                    patch.phoneCountryCode = phoneResult.countryCode;
                }
                await ctx.db.patch(contactId, patch);
            }

            if (existingLink) {
                await ctx.db.patch(existingLink._id, {
                    lastPulledAt: now,
                    lastSeenExternalUpdateAt: raw.externalUpdatedAtMs,
                    externalOwnerId: raw.externalOwnerId,
                    externalTags: raw.externalTags,
                    externalLifecycleStage: raw.externalLifecycleStage,
                    updatedAt: now,
                });
            } else {
                await ctx.db.insert("crmContactLinks", {
                    organizationId: orgId,
                    contactId,
                    connectionId,
                    provider,
                    externalId: raw.externalId,
                    linkStatus: "linked",
                    linkMethod,
                    matchConfidence,
                    externalOwnerId: raw.externalOwnerId,
                    externalTags: raw.externalTags,
                    externalLifecycleStage: raw.externalLifecycleStage,
                    lastPulledAt: now,
                    lastSeenExternalUpdateAt: raw.externalUpdatedAtMs,
                    linkedAt: now,
                    createdAt: now,
                    updatedAt: now,
                });
            }
        }

        const job = await ctx.db.get(jobId);
        if (job) {
            await ctx.db.patch(jobId, { lastHeartbeatAt: now });
        }
    },
});

export const _persistDealBatch = internalMutation({
    args: {
        jobId: v.id("crmImportJobs"),
        connectionId: v.id("crmConnections"),
        deals: v.array(v.any()),
    },
    handler: async (ctx, { connectionId, deals }) => {
        const connection = await ctx.db.get(connectionId);
        if (!connection) return;
        const orgId = connection.organizationId;
        const provider = connection.provider;
        const now = Date.now();

        for (const d of deals as UnifiedDeal[]) {
            if (!d?.externalId) continue;

            const existing = await ctx.db
                .query("crmDeals")
                .withIndex("by_org_provider_external", (q) =>
                    q
                        .eq("organizationId", orgId)
                        .eq("provider", provider)
                        .eq("externalId", d.externalId),
                )
                .first();

            let contactId: Id<"contacts"> | undefined;
            if (d.contactExternalId) {
                const link = await ctx.db
                    .query("crmContactLinks")
                    .withIndex("by_org_provider_external", (q) =>
                        q
                            .eq("organizationId", orgId)
                            .eq("provider", provider)
                            .eq("externalId", d.contactExternalId!),
                    )
                    .first();
                if (link) contactId = link.contactId;
            }

            if (existing) {
                await ctx.db.patch(existing._id, {
                    title: d.title,
                    contactId,
                    contactExternalId: d.contactExternalId,
                    pipeline: d.pipeline,
                    stage: d.stage,
                    status: d.status,
                    ownerId: d.ownerId,
                    amount: d.amount,
                    currency: d.currency,
                    rawSnapshot: d.rawSnapshot,
                    rawSnapshotVersion: 1,
                    lastSeenExternalUpdateAt: d.externalUpdatedAtMs,
                    syncedAt: now,
                    updatedAt: now,
                });
            } else {
                await ctx.db.insert("crmDeals", {
                    organizationId: orgId,
                    connectionId,
                    provider,
                    externalId: d.externalId,
                    contactId,
                    contactExternalId: d.contactExternalId,
                    title: d.title,
                    pipeline: d.pipeline,
                    stage: d.stage,
                    status: d.status,
                    ownerId: d.ownerId,
                    amount: d.amount,
                    currency: d.currency,
                    rawSnapshot: d.rawSnapshot,
                    rawSnapshotVersion: 1,
                    lastSeenExternalUpdateAt: d.externalUpdatedAtMs,
                    syncedAt: now,
                    createdAt: now,
                    updatedAt: now,
                });
            }
        }
    },
});

function _firstPhoneE164(
    phones: Array<{ raw: string; type?: string }>,
): { ok: true; e164: string; countryCode: string } | null {
    const order = ["whatsapp", "mobile", "primary"];
    const sorted = [...phones].sort((a, b) => {
        const ai = order.indexOf(a.type ?? "");
        const bi = order.indexOf(b.type ?? "");
        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });
    for (const p of sorted) {
        const r = normalizeToE164(p.raw);
        if (r.ok) return { ok: true, e164: r.e164, countryCode: r.countryCode };
    }
    return null;
}

export const triggerResync = action({
    args: { connectionId: v.id("crmConnections") },
    handler: async (ctx, { connectionId }): Promise<{ jobId: Id<"crmImportJobs"> }> => {
        const jobId = await ctx.runMutation(internal.crm.importer._enqueueResync, {
            connectionId,
        });
        await ctx.scheduler.runAfter(0, internal.crm.importer.runTick, { jobId });
        return { jobId };
    },
});

export const _enqueueResync = internalMutation({
    args: { connectionId: v.id("crmConnections") },
    handler: async (ctx, { connectionId }) => {
        const c = await ctx.db.get(connectionId);
        if (!c) throw new Error("connection not found");
        const now = Date.now();
        return await ctx.db.insert("crmImportJobs", {
            organizationId: c.organizationId,
            connectionId,
            jobType: "resync",
            phase: "contacts",
            status: "pending",
            processed: 0,
            startedAt: now,
            createdAt: now,
            updatedAt: now,
        });
    },
});
