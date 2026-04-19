/**
 * Delta polling — fires every minute (cron) and picks connections whose
 * `nextPollAt` is due. Each candidate triggers a `delta_poll` import job using
 * `sinceMs = lastPollAt`. Adapters that support incremental pull (via sinceMs)
 * get real delta; others fall back to full scans (rare MVP providers).
 */

import { internalAction, internalMutation, internalQuery } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import type { CRMProvider } from "./core/types";
import { getProviderInfo } from "./core/providers";
import { logJson } from "./core/logger";

const POLLER_BATCH = 50;

export const runTick = internalAction({
    args: {},
    handler: async (ctx): Promise<void> => {
        const due = await ctx.runQuery(internal.crm.poller._listDueConnections, {
            limit: POLLER_BATCH,
        });
        for (const c of due) {
            await ctx.runMutation(internal.crm.poller._kickDeltaPoll, {
                connectionId: c._id,
            });
        }
        if (due.length > 0) {
            logJson("info", {
                module: "crm.poller",
                event: "tick",
                count: due.length,
            });
        }
    },
});

export const _listDueConnections = internalQuery({
    args: { limit: v.number() },
    handler: async (ctx, { limit }) => {
        const now = Date.now();
        const rows = await ctx.db
            .query("crmConnections")
            .withIndex("by_nextPollAt")
            .order("asc")
            .take(limit * 3);
        const due = rows.filter(
            (c) => c.status === "active" && (c.nextPollAt ?? 0) <= now,
        );
        return due.slice(0, limit);
    },
});

export const _kickDeltaPoll = internalMutation({
    args: { connectionId: v.id("crmConnections") },
    handler: async (ctx, { connectionId }) => {
        const conn = await ctx.db.get(connectionId);
        if (!conn || conn.status !== "active") return;

        const info = getProviderInfo(conn.provider as CRMProvider);
        const intervalMs =
            conn.scalingMode === "large"
                ? info.capabilities.pollIntervalLargeMs
                : info.capabilities.pollIntervalStandardMs;

        const now = Date.now();
        const sinceMs = conn.lastPollAt ?? conn.lastSyncAt ?? now - intervalMs;

        const existingRunning = await ctx.db
            .query("crmImportJobs")
            .withIndex("by_connection", (q) => q.eq("connectionId", connectionId))
            .filter((q) =>
                q.and(
                    q.or(
                        q.eq(q.field("status"), "pending"),
                        q.eq(q.field("status"), "running"),
                    ),
                    q.eq(q.field("jobType"), "delta_poll"),
                ),
            )
            .first();
        if (existingRunning) {
            return;
        }

        const jobId = await ctx.db.insert("crmImportJobs", {
            organizationId: conn.organizationId,
            connectionId,
            jobType: "delta_poll",
            phase: "contacts",
            status: "pending",
            sinceMs,
            processed: 0,
            matched: 0,
            created: 0,
            skipped: 0,
            startedAt: now,
            createdAt: now,
            updatedAt: now,
        });

        await ctx.db.patch(connectionId, {
            lastPollAt: now,
            nextPollAt: now + intervalMs,
            updatedAt: now,
        });

        await ctx.scheduler.runAfter(0, internal.crm.importer.runTick, { jobId });
    },
});
