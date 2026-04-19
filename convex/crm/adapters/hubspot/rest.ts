/**
 * HubSpot REST adapter — STUB Phase 1.
 * Full implementation arrives in Phase 2 (HubSpot e2e).
 * Exported signatures match the CRMAdapter contract so registry + dispatcher compile.
 */

import {
    CRMError,
    CRMValidationError,
} from "../../core/errors";
import type {
    AdapterCallCtx,
    AuthTokens,
    ConversationEvent,
    Page,
    ParsedWebhookEvent,
    PushResult,
    UnifiedContact,
    UnifiedDeal,
} from "../../core/types";

const provider = "hubspot" as const;

export function buildAuthorizeUrl(_p: {
    state: string;
    redirectUri: string;
    codeChallenge?: string;
}): string {
    throw new CRMError("hubspot.buildAuthorizeUrl not implemented (Phase 2)", {
        provider,
        retryable: false,
    });
}

export async function exchangeCode(_p: {
    code: string;
    redirectUri: string;
    codeVerifier?: string;
}): Promise<AuthTokens> {
    throw new CRMError("hubspot.exchangeCode not implemented (Phase 2)", {
        provider,
        retryable: false,
    });
}

export async function refreshToken(_p: { refreshToken: string }): Promise<AuthTokens> {
    throw new CRMError("hubspot.refreshToken not implemented (Phase 2)", {
        provider,
        retryable: false,
    });
}

export async function revokeToken(_p: {
    accessToken?: string;
    refreshToken?: string;
}): Promise<void> {
    // best-effort noop until Phase 2
}

export async function pullContactsPage(_p: {
    ctx: AdapterCallCtx;
    cursor?: string;
    sinceMs?: number;
}): Promise<Page<UnifiedContact>> {
    throw new CRMError("hubspot.pullContactsPage not implemented (Phase 2)", {
        provider,
        retryable: false,
    });
}

export async function pullDealsPage(_p: {
    ctx: AdapterCallCtx;
    cursor?: string;
    sinceMs?: number;
}): Promise<Page<UnifiedDeal>> {
    throw new CRMError("hubspot.pullDealsPage not implemented (Phase 2)", {
        provider,
        retryable: false,
    });
}

export async function findContactByPhone(_p: {
    ctx: AdapterCallCtx;
    phoneE164: string;
}): Promise<UnifiedContact | null> {
    return null;
}

export async function findContactByEmail(_p: {
    ctx: AdapterCallCtx;
    email: string;
}): Promise<UnifiedContact | null> {
    return null;
}

export async function pushConversationEvent(_p: {
    ctx: AdapterCallCtx;
    event: ConversationEvent;
}): Promise<PushResult> {
    throw new CRMError("hubspot.pushConversationEvent not implemented (Phase 2)", {
        provider,
        retryable: false,
    });
}

export async function verifyWebhookSignature(_p: {
    rawBody: string;
    headers: Record<string, string | undefined>;
    secret: string;
}): Promise<boolean> {
    return false;
}

export async function parseWebhookEvent(_p: {
    rawBody: string;
    headers: Record<string, string | undefined>;
}): Promise<ParsedWebhookEvent[]> {
    throw new CRMValidationError(
        "hubspot.parseWebhookEvent not implemented (Phase 2)",
        { provider }
    );
}
