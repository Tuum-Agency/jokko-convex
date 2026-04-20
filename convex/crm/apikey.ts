/**
 * API key connection flow — validates the key, encrypts it, persists the connection.
 * Used by providers with authMode="apiKey" (Axonaut, noCRM.io).
 */

import { v } from "convex/values";
import {
    action,
    internalMutation,
    internalQuery,
    MutationCtx,
} from "../_generated/server";
import { internal } from "../_generated/api";
import { Id } from "../_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { hasPermission } from "../lib/permissions";
import { requirePlanFeatureInAction } from "../lib/planFeatures";
import { getAdapter } from "./registry";
import { getProviderInfo } from "./core/providers";
import { encrypt } from "../lib/encryption";
import { logJson, newCorrelationId, sanitizeError } from "./core/logger";
import type { CRMProvider } from "./core/types";

const SUPPORTED_APIKEY_PROVIDERS: CRMProvider[] = ["axonaut", "nocrm"];

export const connectWithApiKey = action({
    args: {
        provider: v.string(),
        apiKey: v.string(),
        instanceUrl: v.optional(v.string()),
        scalingMode: v.optional(v.union(v.literal("standard"), v.literal("large"))),
    },
    handler: async (
        ctx,
        args,
    ): Promise<{ ok: true; connectionId: Id<"crmConnections">; provider: string }> => {
        const correlationId = newCorrelationId("apikey_connect");
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Non authentifié");

        const provided = args.provider as CRMProvider;
        if (!SUPPORTED_APIKEY_PROVIDERS.includes(provided)) {
            throw new Error(`Fournisseur API key non supporté : ${args.provider}`);
        }

        const info = getProviderInfo(provided);
        if (info.authMode !== "apiKey") {
            throw new Error(`Le fournisseur ${provided} n'utilise pas une clé API`);
        }

        const { organizationId, role, plan } = await ctx.runQuery(
            internal.crm.oauth._sessionContext,
            { userId },
        );
        if (!organizationId) throw new Error("Aucune organisation active");
        if (!hasPermission(role, "integrations:manage")) {
            throw new Error("Permission refusée : integrations:manage");
        }
        // Feature gate plan : intégrations CRM réservées au plan PRO+
        await requirePlanFeatureInAction(plan, "integrations_crm");

        const trimmedKey = args.apiKey.trim();
        if (!trimmedKey) throw new Error("Clé API requise");

        const adapter = getAdapter(provided);
        if (!adapter.validateApiKey) {
            throw new Error(`Adapter ${provided} n'expose pas validateApiKey`);
        }

        let validation;
        try {
            validation = await adapter.validateApiKey({
                apiKey: trimmedKey,
                instanceUrl: args.instanceUrl,
            });
        } catch (err) {
            const sanitized = sanitizeError(err, { provider: provided, correlationId });
            logJson("error", {
                module: "crm.apikey",
                event: "validate_failed",
                provider: provided,
                correlationId,
                error: sanitized,
            });
            throw new Error(`Validation clé API échouée : ${sanitized.message}`);
        }

        if (!validation.ok || !validation.accountInfo) {
            logJson("warn", {
                module: "crm.apikey",
                event: "validate_rejected",
                provider: provided,
                correlationId,
            });
            throw new Error("Clé API invalide ou compte introuvable");
        }

        const apiKeyEnc = await encrypt(trimmedKey);

        const connectionId = await ctx.runMutation(internal.crm.apikey._finalize, {
            provider: provided,
            organizationId: organizationId as Id<"organizations">,
            userId,
            apiKeyEnc,
            instanceUrl: args.instanceUrl,
            remoteAccountId: validation.accountInfo.remoteAccountId,
            remoteAccountLabel: validation.accountInfo.remoteAccountLabel,
            scalingMode: args.scalingMode ?? "standard",
        });

        logJson("info", {
            module: "crm.apikey",
            event: "connection_created",
            provider: provided,
            organizationId,
            connectionId,
            correlationId,
        });

        await ctx.runMutation(internal.crm.importer.startInitialImport, {
            connectionId,
        });

        return { ok: true, connectionId, provider: provided };
    },
});

export const _finalize = internalMutation({
    args: {
        provider: v.string(),
        organizationId: v.id("organizations"),
        userId: v.id("users"),
        apiKeyEnc: v.string(),
        instanceUrl: v.optional(v.string()),
        remoteAccountId: v.string(),
        remoteAccountLabel: v.optional(v.string()),
        scalingMode: v.union(v.literal("standard"), v.literal("large")),
    },
    handler: async (ctx, args): Promise<Id<"crmConnections">> => {
        const now = Date.now();

        const existingActive = await ctx.db
            .query("crmConnections")
            .withIndex("by_organization_status", (q) =>
                q.eq("organizationId", args.organizationId).eq("status", "active"),
            )
            .first();
        if (existingActive && existingActive.provider !== args.provider) {
            throw new Error(
                `Une connexion ${existingActive.provider} est déjà active. Déconnectez-la avant d'ajouter ${args.provider}.`,
            );
        }

        const sameProviderAccount = await ctx.db
            .query("crmConnections")
            .withIndex("by_provider_remoteAccountId", (q) =>
                q.eq("provider", args.provider).eq("remoteAccountId", args.remoteAccountId),
            )
            .first();

        if (sameProviderAccount && sameProviderAccount.organizationId === args.organizationId) {
            await ctx.db.patch(sameProviderAccount._id, {
                status: "active",
                authMode: "apiKey",
                apiKeyEnc: args.apiKeyEnc,
                instanceUrl: args.instanceUrl,
                remoteAccountLabel: args.remoteAccountLabel,
                scalingMode: args.scalingMode,
                lastErrorAt: undefined,
                lastErrorCode: undefined,
                lastErrorMessageSanitized: undefined,
                revokedAt: undefined,
                revokedBy: undefined,
                updatedAt: now,
            });
            await _writeAudit(ctx, {
                organizationId: args.organizationId,
                userId: args.userId,
                connectionId: sameProviderAccount._id,
                provider: args.provider,
                action: "crm.connection.reactivated",
                severity: "info",
                metadataSanitized: { remoteAccountLabel: args.remoteAccountLabel },
            });
            return sameProviderAccount._id;
        }

        const connectionId = await ctx.db.insert("crmConnections", {
            organizationId: args.organizationId,
            provider: args.provider,
            authMode: "apiKey",
            status: "active",
            apiKeyEnc: args.apiKeyEnc,
            instanceUrl: args.instanceUrl,
            remoteAccountId: args.remoteAccountId,
            remoteAccountLabel: args.remoteAccountLabel,
            scalingMode: args.scalingMode,
            connectedAt: now,
            connectedBy: args.userId,
            createdAt: now,
            updatedAt: now,
        });

        await _writeAudit(ctx, {
            organizationId: args.organizationId,
            userId: args.userId,
            connectionId,
            provider: args.provider,
            action: "crm.connection.created",
            severity: "info",
            metadataSanitized: { remoteAccountLabel: args.remoteAccountLabel },
        });

        return connectionId;
    },
});

async function _writeAudit(
    ctx: MutationCtx,
    p: {
        organizationId: Id<"organizations">;
        userId?: Id<"users">;
        connectionId?: Id<"crmConnections">;
        provider?: string;
        action: string;
        severity: "info" | "warning" | "error";
        metadataSanitized?: Record<string, unknown>;
    },
): Promise<void> {
    await ctx.db.insert("integrationAuditLog", {
        organizationId: p.organizationId,
        userId: p.userId,
        connectionId: p.connectionId,
        provider: p.provider,
        action: p.action,
        severity: p.severity,
        metadataSanitized: p.metadataSanitized,
        createdAt: Date.now(),
    });
}
