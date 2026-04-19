/**
 * Salesforce REST adapter. Uses SOQL for queries and Task/Note sObjects for events.
 * OAuth2 web server flow. instance_url from token response drives all API calls.
 * API reference: https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/
 */

import {
    CRMAuthError,
    CRMNotFoundError,
    CRMRateLimitError,
    CRMTransientError,
    CRMValidationError,
} from "../../core/errors";
import type {
    AdapterCallCtx,
    AuthTokens,
    ConversationEvent,
    Page,
    PushResult,
    UnifiedContact,
    UnifiedDeal,
} from "../../core/types";

const SF_AUTH = "https://login.salesforce.com/services/oauth2/authorize";
const SF_TOKEN = "https://login.salesforce.com/services/oauth2/token";
const SF_REVOKE = "https://login.salesforce.com/services/oauth2/revoke";
const API_VERSION = "v60.0";
const DEFAULT_SCOPES = ["api", "refresh_token"];

function env(name: string): string {
    const v = process.env[name];
    if (!v) throw new CRMValidationError(`Missing env var ${name}`, { provider: "salesforce" });
    return v;
}

function statusToError(status: number, body: string): never {
    const meta = { provider: "salesforce" as const, statusCode: status };
    if (status === 401 || status === 403) throw new CRMAuthError(`SF auth: ${body}`, meta);
    if (status === 404) throw new CRMNotFoundError(`SF not found: ${body}`, meta);
    if (status === 429) throw new CRMRateLimitError(`SF rate limit: ${body}`, meta);
    if (status >= 500) throw new CRMTransientError(`SF 5xx: ${body}`, meta);
    if (status >= 400) throw new CRMValidationError(`SF 4xx: ${body}`, meta);
    throw new CRMTransientError(`SF unexpected ${status}: ${body}`, meta);
}

async function sfFetch(
    path: string,
    opts: { instanceUrl: string; accessToken: string; method: "GET" | "POST"; body?: string },
): Promise<unknown> {
    const res = await fetch(`${opts.instanceUrl.replace(/\/$/, "")}${path}`, {
        method: opts.method,
        headers: {
            Authorization: `Bearer ${opts.accessToken}`,
            "Content-Type": "application/json",
        },
        body: opts.body,
    });
    const text = await res.text();
    if (!res.ok) statusToError(res.status, text.slice(0, 500));
    try {
        return JSON.parse(text);
    } catch {
        throw new CRMValidationError(`Salesforce invalid JSON`, { provider: "salesforce" });
    }
}

export function buildAuthorizeUrl(p: {
    state: string;
    redirectUri: string;
    codeChallenge?: string;
}): string {
    const params = new URLSearchParams({
        response_type: "code",
        client_id: env("SALESFORCE_CLIENT_ID"),
        redirect_uri: p.redirectUri,
        scope: DEFAULT_SCOPES.join(" "),
        state: p.state,
    });
    if (p.codeChallenge) {
        params.set("code_challenge", p.codeChallenge);
        params.set("code_challenge_method", "S256");
    }
    return `${SF_AUTH}?${params.toString()}`;
}

export async function exchangeCode(p: {
    code: string;
    redirectUri: string;
    codeVerifier?: string;
}): Promise<AuthTokens> {
    const body = new URLSearchParams({
        grant_type: "authorization_code",
        code: p.code,
        client_id: env("SALESFORCE_CLIENT_ID"),
        client_secret: env("SALESFORCE_CLIENT_SECRET"),
        redirect_uri: p.redirectUri,
    });
    if (p.codeVerifier) body.set("code_verifier", p.codeVerifier);

    const res = await fetch(SF_TOKEN, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
    });
    const text = await res.text();
    if (!res.ok) statusToError(res.status, text.slice(0, 500));
    const token = JSON.parse(text) as {
        access_token: string;
        refresh_token?: string;
        instance_url: string;
        id?: string;
        issued_at?: string;
    };

    // Salesforce tokens are long-lived (no expires_in); use 2h sliding default.
    const orgId = token.id ? token.id.split("/").slice(-2, -1)[0] : "unknown";
    return {
        accessToken: token.access_token,
        refreshToken: token.refresh_token,
        expiresAtMs: Date.now() + 2 * 60 * 60 * 1000,
        scopes: DEFAULT_SCOPES,
        remoteAccountId: orgId ?? "unknown",
        instanceUrl: token.instance_url,
        remoteAccountLabel: token.instance_url,
    };
}

export async function refreshToken(p: { refreshToken: string }): Promise<AuthTokens> {
    const body = new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: p.refreshToken,
        client_id: env("SALESFORCE_CLIENT_ID"),
        client_secret: env("SALESFORCE_CLIENT_SECRET"),
    });
    const res = await fetch(SF_TOKEN, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
    });
    const text = await res.text();
    if (!res.ok) statusToError(res.status, text.slice(0, 500));
    const token = JSON.parse(text) as {
        access_token: string;
        instance_url: string;
        refresh_token?: string;
    };
    return {
        accessToken: token.access_token,
        refreshToken: token.refresh_token ?? p.refreshToken,
        expiresAtMs: Date.now() + 2 * 60 * 60 * 1000,
        remoteAccountId: "unknown",
        instanceUrl: token.instance_url,
    };
}

interface SFContact {
    Id: string;
    FirstName?: string | null;
    LastName?: string | null;
    Email?: string | null;
    Phone?: string | null;
    MobilePhone?: string | null;
    Account?: { Name?: string | null } | null;
    OwnerId?: string | null;
    LastModifiedDate?: string | null;
}

function toUnifiedContact(raw: SFContact): UnifiedContact {
    const phones: Array<{ raw: string; type?: string }> = [];
    if (raw.Phone) phones.push({ raw: raw.Phone, type: "primary" });
    if (raw.MobilePhone) phones.push({ raw: raw.MobilePhone, type: "mobile" });
    return {
        externalId: raw.Id,
        firstName: raw.FirstName ?? undefined,
        lastName: raw.LastName ?? undefined,
        emails: raw.Email ? [raw.Email] : [],
        phones,
        company: raw.Account?.Name ?? undefined,
        externalOwnerId: raw.OwnerId ?? undefined,
        externalUpdatedAtMs: raw.LastModifiedDate ? Date.parse(raw.LastModifiedDate) : undefined,
    };
}

export async function pullContactsPage(p: {
    ctx: AdapterCallCtx;
    cursor?: string;
    sinceMs?: number;
}): Promise<Page<UnifiedContact>> {
    const accessToken = p.ctx.credentials.accessToken;
    const instanceUrl = p.ctx.credentials.instanceUrl;
    if (!accessToken || !instanceUrl) {
        throw new CRMAuthError("missing access token or instance url", { provider: "salesforce" });
    }

    // If cursor is supplied, assume it is a Salesforce nextRecordsUrl (relative path).
    if (p.cursor) {
        const json = (await sfFetch(p.cursor, { instanceUrl, accessToken, method: "GET" })) as {
            records: SFContact[];
            done: boolean;
            nextRecordsUrl?: string;
        };
        return {
            items: json.records.map(toUnifiedContact),
            nextCursor: json.done ? undefined : json.nextRecordsUrl,
            hasMore: !json.done,
        };
    }

    const soql = [
        "SELECT Id, FirstName, LastName, Email, Phone, MobilePhone, OwnerId, LastModifiedDate,",
        "Account.Name FROM Contact",
        p.sinceMs ? `WHERE LastModifiedDate > ${new Date(p.sinceMs).toISOString()}` : "",
        "ORDER BY LastModifiedDate ASC LIMIT 200",
    ].filter(Boolean).join(" ");

    const json = (await sfFetch(
        `/services/data/${API_VERSION}/query?q=${encodeURIComponent(soql)}`,
        { instanceUrl, accessToken, method: "GET" },
    )) as {
        records: SFContact[];
        done: boolean;
        nextRecordsUrl?: string;
    };

    return {
        items: json.records.map(toUnifiedContact),
        nextCursor: json.done ? undefined : json.nextRecordsUrl,
        hasMore: !json.done,
    };
}

interface SFOpportunity {
    Id: string;
    Name?: string | null;
    Amount?: number | null;
    CurrencyIsoCode?: string | null;
    StageName?: string | null;
    OwnerId?: string | null;
    ContactId?: string | null;
    LastModifiedDate?: string | null;
}

function toUnifiedDeal(raw: SFOpportunity): UnifiedDeal {
    return {
        externalId: raw.Id,
        title: raw.Name ?? `Opportunity ${raw.Id}`,
        contactExternalId: raw.ContactId ?? undefined,
        stage: raw.StageName ?? undefined,
        amount: raw.Amount ?? undefined,
        currency: raw.CurrencyIsoCode ?? undefined,
        ownerId: raw.OwnerId ?? undefined,
        rawSnapshot: { stageName: raw.StageName },
        externalUpdatedAtMs: raw.LastModifiedDate ? Date.parse(raw.LastModifiedDate) : undefined,
    };
}

export async function pullDealsPage(p: {
    ctx: AdapterCallCtx;
    cursor?: string;
    sinceMs?: number;
}): Promise<Page<UnifiedDeal>> {
    const accessToken = p.ctx.credentials.accessToken;
    const instanceUrl = p.ctx.credentials.instanceUrl;
    if (!accessToken || !instanceUrl) {
        throw new CRMAuthError("missing access token or instance url", { provider: "salesforce" });
    }

    if (p.cursor) {
        const json = (await sfFetch(p.cursor, { instanceUrl, accessToken, method: "GET" })) as {
            records: SFOpportunity[];
            done: boolean;
            nextRecordsUrl?: string;
        };
        return {
            items: json.records.map(toUnifiedDeal),
            nextCursor: json.done ? undefined : json.nextRecordsUrl,
            hasMore: !json.done,
        };
    }

    const soql = [
        "SELECT Id, Name, Amount, CurrencyIsoCode, StageName, OwnerId, ContactId, LastModifiedDate",
        "FROM Opportunity",
        p.sinceMs ? `WHERE LastModifiedDate > ${new Date(p.sinceMs).toISOString()}` : "",
        "ORDER BY LastModifiedDate ASC LIMIT 200",
    ].filter(Boolean).join(" ");
    const json = (await sfFetch(
        `/services/data/${API_VERSION}/query?q=${encodeURIComponent(soql)}`,
        { instanceUrl, accessToken, method: "GET" },
    )) as {
        records: SFOpportunity[];
        done: boolean;
        nextRecordsUrl?: string;
    };
    return {
        items: json.records.map(toUnifiedDeal),
        nextCursor: json.done ? undefined : json.nextRecordsUrl,
        hasMore: !json.done,
    };
}

const EVENT_LABELS: Record<string, string> = {
    conversation_opened: "Conversation WhatsApp ouverte",
    conversation_assigned: "Conversation WhatsApp assignée",
    conversation_resolved: "Conversation WhatsApp résolue",
};

function eventToTaskSubject(event: ConversationEvent): string {
    return EVENT_LABELS[event.type] ?? event.type;
}

function eventToTaskDescription(event: ConversationEvent): string {
    const when = new Date(event.occurredAtMs).toISOString();
    const meta = event.metadata
        ? "\n" + Object.entries(event.metadata).map(([k, v]) => `${k}: ${String(v)}`).join("\n")
        : "";
    return `[Jokko] ${eventToTaskSubject(event)} le ${when}${meta}`;
}

export async function pushConversationEvent(p: {
    ctx: AdapterCallCtx;
    event: ConversationEvent;
}): Promise<PushResult> {
    const accessToken = p.ctx.credentials.accessToken;
    const instanceUrl = p.ctx.credentials.instanceUrl;
    if (!accessToken || !instanceUrl) {
        throw new CRMAuthError("missing credentials", { provider: "salesforce" });
    }
    if (!p.event.contactExternalId) {
        throw new CRMValidationError(
            "event.contactExternalId required for Salesforce push",
            { provider: "salesforce" },
        );
    }
    const body = {
        Subject: eventToTaskSubject(p.event),
        Description: eventToTaskDescription(p.event),
        WhoId: p.event.contactExternalId,
        Status: "Completed",
        Priority: "Normal",
        ActivityDate: new Date(p.event.occurredAtMs).toISOString().slice(0, 10),
    };
    const json = (await sfFetch(
        `/services/data/${API_VERSION}/sobjects/Task`,
        { instanceUrl, accessToken, method: "POST", body: JSON.stringify(body) },
    )) as { id?: string; success?: boolean };
    if (!json.id) {
        throw new CRMValidationError("Salesforce Task creation returned no id", {
            provider: "salesforce",
        });
    }
    return {
        ok: true,
        providerEventId: json.id,
        providerTimestampMs: p.event.occurredAtMs,
    };
}

export async function revokeToken(p: {
    accessToken?: string;
    refreshToken?: string;
}): Promise<void> {
    const token = p.accessToken ?? p.refreshToken;
    if (!token) return;
    await fetch(`${SF_REVOKE}?token=${encodeURIComponent(token)}`, {
        method: "POST",
    }).catch(() => {
        /* best effort */
    });
}
