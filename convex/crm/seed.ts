/**
 * CRM seed — push a fixture of test contacts into an active CRM connection.
 * Used to populate HubSpot / Pipedrive / Sellsy / etc. with sample data for testing.
 *
 * Usage (Convex CLI):
 *   pnpx convex run crm/seed:seedContacts '{"provider":"hubspot","remoteAccountId":"148302799","contacts":[...]}'
 */

import { v } from "convex/values";
import { internalAction, internalQuery } from "../_generated/server";
import { internal } from "../_generated/api";
import { decrypt } from "../lib/encryption";
import {
    createContactsBatch,
    type SeedContactInput,
    type SeedContactResult,
} from "./adapters/hubspot/rest";
import type { AdapterCallCtx, CRMProvider } from "./core/types";
import { newCorrelationId, logJson, sanitizeError } from "./core/logger";

const contactValidator = v.object({
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    company: v.optional(v.string()),
    jobTitle: v.optional(v.string()),
    city: v.optional(v.string()),
    country: v.optional(v.string()),
    lifecycleStage: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
});

type SeedConnectionSnapshot = {
    _id: string;
    organizationId: string;
    provider: string;
    status: string;
    accessTokenEnc?: string;
    instanceUrl?: string;
    remoteAccountId: string;
};

export const _findActiveConnection = internalQuery({
    args: {
        provider: v.string(),
        remoteAccountId: v.optional(v.string()),
    },
    handler: async (ctx, { provider, remoteAccountId }): Promise<SeedConnectionSnapshot | null> => {
        const connections = await ctx.db
            .query("crmConnections")
            .filter((q) =>
                q.and(
                    q.eq(q.field("provider"), provider),
                    q.eq(q.field("status"), "active"),
                ),
            )
            .collect();

        const match = remoteAccountId
            ? connections.find((c) => c.remoteAccountId === remoteAccountId)
            : connections[0];
        if (!match) return null;

        return {
            _id: String(match._id),
            organizationId: String(match.organizationId),
            provider: match.provider,
            status: match.status,
            accessTokenEnc: match.accessTokenEnc,
            instanceUrl: match.instanceUrl,
            remoteAccountId: match.remoteAccountId,
        };
    },
});

export const seedContacts = internalAction({
    args: {
        provider: v.string(),
        remoteAccountId: v.optional(v.string()),
        contacts: v.array(contactValidator),
    },
    handler: async (
        ctx,
        { provider, remoteAccountId, contacts },
    ): Promise<{
        connectionId: string;
        remoteAccountId: string;
        total: number;
        created: number;
        existing: number;
        failed: number;
        results: SeedContactResult[];
    }> => {
        const correlationId = newCorrelationId("seed_contacts");

        if (provider !== "hubspot") {
            throw new Error(`seedContacts: provider "${provider}" not implemented yet (only hubspot for now)`);
        }

        const connection = await ctx.runQuery(internal.crm.seed._findActiveConnection, {
            provider,
            remoteAccountId,
        });
        if (!connection) {
            throw new Error(
                `No active ${provider} connection found${remoteAccountId ? ` for remoteAccountId=${remoteAccountId}` : ""}. Connect via /dashboard/integrations first.`,
            );
        }
        if (!connection.accessTokenEnc) {
            throw new Error(`Connection ${connection._id} has no encrypted access token`);
        }

        const accessToken = await decrypt(connection.accessTokenEnc);

        const callCtx: AdapterCallCtx = {
            provider: connection.provider as CRMProvider,
            connectionId: connection._id,
            organizationId: connection.organizationId,
            correlationId,
            credentials: {
                accessToken,
                instanceUrl: connection.instanceUrl,
            },
            scalingMode: "standard",
        };

        let results: SeedContactResult[];
        try {
            results = await createContactsBatch({
                ctx: callCtx,
                contacts: contacts as SeedContactInput[],
            });
        } catch (err) {
            logJson("error", {
                module: "crm.seed",
                event: "batch_create_failed",
                provider,
                connectionId: connection._id,
                correlationId,
                error: sanitizeError(err),
            });
            throw err;
        }

        const summary = results.reduce(
            (acc, r) => {
                if (r.status === "created") acc.created++;
                else if (r.status === "existing") acc.existing++;
                else acc.failed++;
                return acc;
            },
            { created: 0, existing: 0, failed: 0 },
        );

        logJson("info", {
            module: "crm.seed",
            event: "completed",
            provider,
            connectionId: connection._id,
            remoteAccountId: connection.remoteAccountId,
            correlationId,
            total: contacts.length,
            ...summary,
        });

        return {
            connectionId: connection._id,
            remoteAccountId: connection.remoteAccountId,
            total: contacts.length,
            ...summary,
            results,
        };
    },
});
