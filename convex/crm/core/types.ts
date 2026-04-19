/**
 * Core CRM types — lingua franca between adapters and dispatcher/importer.
 * No Convex imports here: adapters must remain pure functions, testable in isolation.
 */

export type CRMProvider =
    | "hubspot"
    | "pipedrive"
    | "salesforce"
    | "sellsy"
    | "axonaut"
    | "nocrm";

export type CRMAuthMode = "oauth2" | "apiKey";

export interface CRMCapabilities {
    authMode: CRMAuthMode;
    supportsWebhooks: boolean;
    supportsIncrementalPull: boolean;
    supportsDeals: boolean;
    supportsRevoke: boolean;
    rateLimitPerHour: number;
    pageSizeStandard: number;
    pageSizeLarge: number;
    pollIntervalStandardMs: number;
    pollIntervalLargeMs: number;
    requiredScopes?: string[];
}

export interface AuthTokens {
    accessToken: string;
    refreshToken?: string;
    expiresAtMs?: number;
    scopes?: string[];
    instanceUrl?: string;
    remoteAccountId: string;
    remoteAccountLabel?: string;
}

export interface UnifiedContact {
    externalId: string;
    firstName?: string;
    lastName?: string;
    fullName?: string;
    emails: string[];
    phones: Array<{ raw: string; type?: string }>;
    company?: string;
    jobTitle?: string;
    externalOwnerId?: string;
    externalTags?: string[];
    externalLifecycleStage?: string;
    externalCustomSnapshot?: Record<string, unknown>;
    externalUpdatedAtMs?: number;
}

export interface UnifiedDeal {
    externalId: string;
    title: string;
    contactExternalId?: string;
    pipeline?: string;
    stage?: string;
    status?: string;
    ownerId?: string;
    amount?: number;
    currency?: string;
    rawSnapshot?: Record<string, unknown>;
    externalUpdatedAtMs?: number;
}

export interface Page<T> {
    items: T[];
    nextCursor?: string;
    hasMore: boolean;
}

export type ConversationEventType =
    | "conversation_opened"
    | "conversation_assigned"
    | "conversation_resolved";

export interface ConversationEvent {
    type: ConversationEventType;
    occurredAtMs: number;
    contactId: string;
    contactExternalId?: string;
    metadata?: Record<string, unknown>;
}

export interface PushResult {
    ok: true;
    providerEventId?: string;
    providerTimestampMs?: number;
}

export interface ParsedWebhookEvent {
    eventKey: string;
    eventType: string;
    entityType: "contact" | "deal" | "unknown";
    entityExternalId?: string;
    remoteAccountId?: string;
    occurredAtMs?: number;
    externalUpdatedAtMs?: number;
    payload?: Record<string, unknown>;
}

export interface AdapterCallCtx {
    provider: CRMProvider;
    connectionId: string;
    organizationId: string;
    correlationId: string;
    credentials: {
        accessToken?: string;
        apiKey?: string;
        instanceUrl?: string;
    };
    scalingMode: "standard" | "large";
}

export interface CRMAdapter {
    provider: CRMProvider;
    capabilities: CRMCapabilities;

    buildAuthorizeUrl?(p: {
        state: string;
        redirectUri: string;
        codeChallenge?: string;
    }): string;

    exchangeCode?(p: {
        code: string;
        redirectUri: string;
        codeVerifier?: string;
    }): Promise<AuthTokens>;

    refreshToken?(p: { refreshToken: string }): Promise<AuthTokens>;

    revokeToken?(p: { accessToken?: string; refreshToken?: string }): Promise<void>;

    validateApiKey?(p: { apiKey: string }): Promise<{
        ok: boolean;
        accountInfo?: { remoteAccountId: string; remoteAccountLabel?: string };
    }>;

    pullContactsPage(p: {
        ctx: AdapterCallCtx;
        cursor?: string;
        sinceMs?: number;
    }): Promise<Page<UnifiedContact>>;

    pullDealsPage?(p: {
        ctx: AdapterCallCtx;
        cursor?: string;
        sinceMs?: number;
    }): Promise<Page<UnifiedDeal>>;

    findContactByPhone?(p: {
        ctx: AdapterCallCtx;
        phoneE164: string;
    }): Promise<UnifiedContact | null>;

    findContactByEmail?(p: {
        ctx: AdapterCallCtx;
        email: string;
    }): Promise<UnifiedContact | null>;

    pushConversationEvent(p: {
        ctx: AdapterCallCtx;
        event: ConversationEvent;
    }): Promise<PushResult>;

    verifyWebhookSignature?(p: {
        rawBody: string;
        headers: Record<string, string | undefined>;
        secret: string;
    }): Promise<boolean>;

    parseWebhookEvent?(p: {
        rawBody: string;
        headers: Record<string, string | undefined>;
    }): Promise<ParsedWebhookEvent[]>;
}
