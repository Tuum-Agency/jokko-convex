/**
 * OAuth flow — start (build authorize URL) and complete (exchange code, persist tokens).
 * Runs in Convex default runtime (fetch + Web Crypto available).
 */

import { v, ConvexError } from "convex/values";
import {
    action,
    ActionCtx,
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
import {
    generateNonce,
    generatePkceVerifier,
    pkceChallengeFromVerifier,
    signState,
    verifyState,
} from "./core/oauth";
import { encrypt } from "../lib/encryption";
import { logJson, newCorrelationId, sanitizeError } from "./core/logger";
import { OAUTH } from "./core/constants";
import type { CRMProvider } from "./core/types";

const SUPPORTED_OAUTH_PROVIDERS: CRMProvider[] = [
    "hubspot",
    "pipedrive",
    "sellsy",
    "salesforce",
];

const LOCALHOST_REDIRECT_BASE = "https://localhost:1000";

function defaultRedirectBase(): string {
    const base = process.env.SITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL;
    if (!base) throw new Error("SITE_URL env var required for OAuth redirect");
    return base.replace(/\/$/, "");
}

function oauthRedirectUri(provider: string, baseOverride?: string): string {
    const base = baseOverride ?? defaultRedirectBase();
    return `${base.replace(/\/$/, "")}/api/crm/oauth/${provider}/callback`;
}

async function beginOAuthFlow(
    ctx: ActionCtx,
    params: {
        provider: CRMProvider;
        scalingMode?: "standard" | "large";
        redirectBaseOverride?: string;
        mode: "standard" | "local";
    },
): Promise<{ authorizeUrl: string }> {
    const correlationId = newCorrelationId(`oauth_${params.mode === "local" ? "start_local" : "start"}`);
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Non authentifié");

    if (!SUPPORTED_OAUTH_PROVIDERS.includes(params.provider)) {
        throw new Error(`Fournisseur OAuth non supporté au MVP : ${params.provider}`);
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

    const verifier = generatePkceVerifier();
    const challenge = await pkceChallengeFromVerifier(verifier);
    const nonce = generateNonce();
    const state = await signState({
        nonce,
        provider: params.provider,
        organizationId,
        userId,
        createdAtMs: Date.now(),
    });

    const redirectUri = oauthRedirectUri(params.provider, params.redirectBaseOverride);
    await ctx.runMutation(internal.crm.oauth._persistAttempt, {
        state,
        provider: params.provider,
        organizationId: organizationId as Id<"organizations">,
        userId,
        codeVerifier: verifier,
        redirectUri,
        scalingMode: params.scalingMode ?? "standard",
    });

    const adapter = getAdapter(params.provider);
    if (!adapter.buildAuthorizeUrl) {
        throw new Error(`Adapter ${params.provider} n'expose pas buildAuthorizeUrl`);
    }
    const authorizeUrl = adapter.buildAuthorizeUrl({
        state,
        redirectUri,
        codeChallenge: challenge,
    });

    logJson("info", {
        module: "crm.oauth",
        event: params.mode === "local" ? "start_local" : "start",
        provider: params.provider,
        organizationId,
        correlationId,
        redirectUri,
    });

    return { authorizeUrl };
}

export const start = action({
    args: {
        provider: v.string(),
        scalingMode: v.optional(v.union(v.literal("standard"), v.literal("large"))),
    },
    handler: async (ctx, { provider, scalingMode }): Promise<{ authorizeUrl: string }> => {
        return beginOAuthFlow(ctx, {
            provider: provider as CRMProvider,
            scalingMode,
            mode: "standard",
        });
    },
});

/**
 * Dev-only: force the OAuth callback to hit the local Next dev server
 * (`https://localhost:1000/api/crm/oauth/{provider}/callback`) regardless of
 * the deployment's SITE_URL. Let us test OAuth flows locally without having
 * to re-point SITE_URL in prod.
 *
 * Requires the provider's developer portal to whitelist the localhost redirect
 * URL alongside the prod URL.
 */
export const startLocal = action({
    args: {
        provider: v.string(),
        scalingMode: v.optional(v.union(v.literal("standard"), v.literal("large"))),
    },
    handler: async (ctx, { provider, scalingMode }): Promise<{ authorizeUrl: string }> => {
        return beginOAuthFlow(ctx, {
            provider: provider as CRMProvider,
            scalingMode,
            redirectBaseOverride: LOCALHOST_REDIRECT_BASE,
            mode: "local",
        });
    },
});

export const _sessionContext = internalQuery({
    args: { userId: v.id("users") },
    handler: async (ctx, { userId }) => {
        const session = await ctx.db
            .query("userSessions")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .first();
        const organizationId = session?.currentOrganizationId;
        if (!organizationId) {
            return { organizationId: null, role: "AGENT" as const, plan: "FREE" as string };
        }
        const [membership, org] = await Promise.all([
            ctx.db
                .query("memberships")
                .withIndex("by_user_org", (q) =>
                    q.eq("userId", userId).eq("organizationId", organizationId),
                )
                .first(),
            ctx.db.get(organizationId),
        ]);
        return {
            organizationId: organizationId as string | null,
            role: (membership?.role ?? "AGENT") as "OWNER" | "ADMIN" | "AGENT",
            plan: (org?.plan ?? "FREE") as string,
        };
    },
});

export const _persistAttempt = internalMutation({
    args: {
        state: v.string(),
        provider: v.string(),
        organizationId: v.id("organizations"),
        userId: v.id("users"),
        codeVerifier: v.string(),
        redirectUri: v.string(),
        scalingMode: v.union(v.literal("standard"), v.literal("large")),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        await ctx.db.insert("crmOAuthAttempts", {
            state: args.state,
            provider: args.provider,
            organizationId: args.organizationId,
            userId: args.userId,
            codeVerifier: args.codeVerifier,
            redirectUri: args.redirectUri,
            expiresAt: now + OAUTH.STATE_TTL_MS,
            createdAt: now,
        });
    },
});

export const complete = action({
    args: {
        state: v.string(),
        code: v.string(),
    },
    handler: async (
        ctx,
        { state, code },
    ): Promise<{ ok: true; connectionId: Id<"crmConnections">; provider: string }> => {
        const correlationId = newCorrelationId("oauth_complete");

        const payload = await verifyState(state);
        if (!payload) throw new Error("État OAuth invalide ou altéré");

        const attempt = await ctx.runQuery(internal.crm.oauth._getAttempt, { state });
        if (!attempt) throw new Error("Tentative OAuth inconnue");
        if (attempt.consumedAt) throw new Error("Tentative OAuth déjà consommée");
        if (attempt.expiresAt < Date.now()) throw new Error("Tentative OAuth expirée");

        const provided = payload.provider as CRMProvider;
        const adapter = getAdapter(provided);
        if (!adapter.exchangeCode) throw new Error(`Adapter ${provided} n'expose pas exchangeCode`);

        let tokens;
        try {
            tokens = await adapter.exchangeCode({
                code,
                redirectUri: attempt.redirectUri,
                codeVerifier: attempt.codeVerifier,
            });
        } catch (err) {
            const sanitized = sanitizeError(err, { provider: provided, correlationId });
            logJson("error", {
                module: "crm.oauth",
                event: "exchange_code_failed",
                provider: provided,
                correlationId,
                error: sanitized,
            });
            throw new Error(`Échec échange code OAuth : ${sanitized.message}`);
        }

        const accessTokenEnc = await encrypt(tokens.accessToken);
        const refreshTokenEnc = tokens.refreshToken ? await encrypt(tokens.refreshToken) : undefined;

        const connectionId = await ctx.runMutation(internal.crm.oauth._finalizeConnection, {
            state,
            provider: provided,
            organizationId: payload.organizationId as Id<"organizations">,
            userId: payload.userId as Id<"users">,
            accessTokenEnc,
            refreshTokenEnc,
            tokenExpiresAt: tokens.expiresAtMs,
            instanceUrl: tokens.instanceUrl,
            scopes: tokens.scopes,
            remoteAccountId: tokens.remoteAccountId,
            remoteAccountLabel: tokens.remoteAccountLabel,
        });

        logJson("info", {
            module: "crm.oauth",
            event: "connection_created",
            provider: provided,
            organizationId: payload.organizationId,
            connectionId,
            correlationId,
        });

        await ctx.runMutation(internal.crm.importer.startInitialImport, {
            connectionId,
        });

        return { ok: true, connectionId, provider: provided };
    },
});

export const _getAttempt = internalQuery({
    args: { state: v.string() },
    handler: async (ctx, { state }) => {
        return await ctx.db
            .query("crmOAuthAttempts")
            .withIndex("by_state", (q) => q.eq("state", state))
            .first();
    },
});

export const _finalizeConnection = internalMutation({
    args: {
        state: v.string(),
        provider: v.string(),
        organizationId: v.id("organizations"),
        userId: v.id("users"),
        accessTokenEnc: v.string(),
        refreshTokenEnc: v.optional(v.string()),
        tokenExpiresAt: v.optional(v.number()),
        instanceUrl: v.optional(v.string()),
        scopes: v.optional(v.array(v.string())),
        remoteAccountId: v.string(),
        remoteAccountLabel: v.optional(v.string()),
    },
    handler: async (ctx, args): Promise<Id<"crmConnections">> => {
        const now = Date.now();

        const attempt = await ctx.db
            .query("crmOAuthAttempts")
            .withIndex("by_state", (q) => q.eq("state", args.state))
            .first();
        if (attempt) await ctx.db.patch(attempt._id, { consumedAt: now });

        const existingActive = await ctx.db
            .query("crmConnections")
            .withIndex("by_organization_status", (q) =>
                q.eq("organizationId", args.organizationId).eq("status", "active"),
            )
            .first();
        if (existingActive && existingActive.provider !== args.provider) {
            throw new ConvexError({
                code: "ANOTHER_PROVIDER_CONNECTED",
                existingProvider: existingActive.provider,
                attemptedProvider: args.provider,
            });
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
                authMode: "oauth2",
                accessTokenEnc: args.accessTokenEnc,
                refreshTokenEnc: args.refreshTokenEnc,
                tokenExpiresAt: args.tokenExpiresAt,
                instanceUrl: args.instanceUrl,
                scopes: args.scopes,
                remoteAccountLabel: args.remoteAccountLabel,
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
            authMode: "oauth2",
            status: "active",
            accessTokenEnc: args.accessTokenEnc,
            refreshTokenEnc: args.refreshTokenEnc,
            tokenExpiresAt: args.tokenExpiresAt,
            instanceUrl: args.instanceUrl,
            scopes: args.scopes,
            remoteAccountId: args.remoteAccountId,
            remoteAccountLabel: args.remoteAccountLabel,
            scalingMode: "standard",
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
