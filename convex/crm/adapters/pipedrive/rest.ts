/**
 * Pipedrive REST adapter.
 * API reference: https://developers.pipedrive.com/docs/api/v1
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
    ParsedWebhookEvent,
    PushResult,
    UnifiedContact,
    UnifiedDeal,
} from "../../core/types";

const PIPEDRIVE_AUTH = "https://oauth.pipedrive.com/oauth/authorize";
const PIPEDRIVE_TOKEN = "https://oauth.pipedrive.com/oauth/token";
const DEFAULT_SCOPES = ["base", "contacts:full", "deals:full", "activities:full"];

function env(name: string): string {
    const v = process.env[name];
    if (!v) throw new CRMValidationError(`Missing env var ${name}`, { provider: "pipedrive" });
    return v;
}

function statusToError(status: number, body: string): never {
    const meta = { provider: "pipedrive" as const, statusCode: status };
    if (status === 401 || status === 403) {
        throw new CRMAuthError(`Pipedrive auth failed: ${body}`, meta);
    }
    if (status === 404) throw new CRMNotFoundError(`Pipedrive not found: ${body}`, meta);
    if (status === 429) throw new CRMRateLimitError(`Pipedrive rate limit: ${body}`, meta);
    if (status >= 500) throw new CRMTransientError(`Pipedrive 5xx: ${body}`, meta);
    if (status >= 400) throw new CRMValidationError(`Pipedrive 4xx: ${body}`, meta);
    throw new CRMTransientError(`Pipedrive unexpected ${status}: ${body}`, meta);
}

async function pipedriveFetch(
    path: string,
    opts: { apiDomain: string; accessToken: string; method: "GET" | "POST"; body?: string },
): Promise<unknown> {
    const res = await fetch(`${opts.apiDomain.replace(/\/$/, "")}${path}`, {
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
        throw new CRMValidationError(`Pipedrive returned invalid JSON`, { provider: "pipedrive" });
    }
}

export function buildAuthorizeUrl(p: {
    state: string;
    redirectUri: string;
    codeChallenge?: string;
}): string {
    const params = new URLSearchParams({
        client_id: env("PIPEDRIVE_CLIENT_ID"),
        redirect_uri: p.redirectUri,
        state: p.state,
    });
    if (p.codeChallenge) {
        params.set("code_challenge", p.codeChallenge);
        params.set("code_challenge_method", "S256");
    }
    return `${PIPEDRIVE_AUTH}?${params.toString()}`;
}

export async function exchangeCode(p: {
    code: string;
    redirectUri: string;
    codeVerifier?: string;
}): Promise<AuthTokens> {
    const credentials = `${env("PIPEDRIVE_CLIENT_ID")}:${env("PIPEDRIVE_CLIENT_SECRET")}`;
    const body = new URLSearchParams({
        grant_type: "authorization_code",
        code: p.code,
        redirect_uri: p.redirectUri,
    });
    if (p.codeVerifier) body.set("code_verifier", p.codeVerifier);

    const res = await fetch(PIPEDRIVE_TOKEN, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${btoa(credentials)}`,
        },
        body: body.toString(),
    });
    const text = await res.text();
    if (!res.ok) statusToError(res.status, text.slice(0, 500));
    const token = JSON.parse(text) as {
        access_token: string;
        refresh_token: string;
        expires_in: number;
        api_domain?: string;
    };

    return {
        accessToken: token.access_token,
        refreshToken: token.refresh_token,
        expiresAtMs: Date.now() + token.expires_in * 1000,
        scopes: DEFAULT_SCOPES,
        remoteAccountId: token.api_domain ?? "unknown",
        remoteAccountLabel: token.api_domain,
        instanceUrl: token.api_domain,
    };
}

export async function refreshToken(p: { refreshToken: string }): Promise<AuthTokens> {
    const credentials = `${env("PIPEDRIVE_CLIENT_ID")}:${env("PIPEDRIVE_CLIENT_SECRET")}`;
    const body = new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: p.refreshToken,
    });
    const res = await fetch(PIPEDRIVE_TOKEN, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${btoa(credentials)}`,
        },
        body: body.toString(),
    });
    const text = await res.text();
    if (!res.ok) statusToError(res.status, text.slice(0, 500));
    const token = JSON.parse(text) as {
        access_token: string;
        refresh_token?: string;
        expires_in: number;
        api_domain?: string;
    };
    return {
        accessToken: token.access_token,
        refreshToken: token.refresh_token ?? p.refreshToken,
        expiresAtMs: Date.now() + token.expires_in * 1000,
        remoteAccountId: token.api_domain ?? "unknown",
        instanceUrl: token.api_domain,
    };
}

interface PipedrivePerson {
    id: number;
    name?: string;
    first_name?: string;
    last_name?: string;
    email?: Array<{ value: string; primary?: boolean }>;
    phone?: Array<{ value: string; label?: string; primary?: boolean }>;
    org_name?: string;
    owner_id?: { id: number } | number;
    update_time?: string;
}

function toUnifiedContact(raw: PipedrivePerson): UnifiedContact {
    const ownerId = typeof raw.owner_id === "object" ? raw.owner_id?.id : raw.owner_id;
    return {
        externalId: String(raw.id),
        firstName: raw.first_name,
        lastName: raw.last_name,
        emails: (raw.email ?? []).map((e) => e.value).filter(Boolean),
        phones: (raw.phone ?? []).map((p) => ({
            raw: p.value,
            type: p.label,
        })).filter((p) => p.raw),
        company: raw.org_name ?? undefined,
        externalOwnerId: ownerId ? String(ownerId) : undefined,
        externalUpdatedAtMs: raw.update_time ? Date.parse(raw.update_time) : undefined,
    };
}

export async function pullContactsPage(p: {
    ctx: AdapterCallCtx;
    cursor?: string;
    sinceMs?: number;
}): Promise<Page<UnifiedContact>> {
    const accessToken = p.ctx.credentials.accessToken;
    const apiDomain = p.ctx.credentials.instanceUrl;
    if (!accessToken) throw new CRMAuthError("missing access token", { provider: "pipedrive" });
    if (!apiDomain) throw new CRMValidationError("missing api_domain", { provider: "pipedrive" });

    const start = p.cursor ? Number(p.cursor) : 0;
    const limit = 100;
    const params = new URLSearchParams({ start: String(start), limit: String(limit) });
    const json = (await pipedriveFetch(
        `/api/v1/persons?${params.toString()}`,
        { apiDomain, accessToken, method: "GET" },
    )) as {
        data: PipedrivePerson[] | null;
        additional_data?: {
            pagination?: {
                more_items_in_collection?: boolean;
                next_start?: number;
            };
        };
    };

    const items = (json.data ?? []).map(toUnifiedContact);
    const nextStart = json.additional_data?.pagination?.next_start;
    const hasMore = Boolean(json.additional_data?.pagination?.more_items_in_collection);
    return {
        items,
        nextCursor: hasMore && nextStart !== undefined ? String(nextStart) : undefined,
        hasMore,
    };
}

interface PipedriveDeal {
    id: number;
    title?: string;
    value?: number;
    currency?: string;
    status?: string;
    stage_id?: number;
    pipeline_id?: number;
    person_id?: { value: number } | number;
    owner_id?: { id: number } | number;
    update_time?: string;
}

function toUnifiedDeal(raw: PipedriveDeal): UnifiedDeal {
    const contactExt = typeof raw.person_id === "object" ? raw.person_id?.value : raw.person_id;
    const ownerId = typeof raw.owner_id === "object" ? raw.owner_id?.id : raw.owner_id;
    return {
        externalId: String(raw.id),
        title: raw.title ?? `Deal ${raw.id}`,
        contactExternalId: contactExt ? String(contactExt) : undefined,
        pipeline: raw.pipeline_id ? String(raw.pipeline_id) : undefined,
        stage: raw.stage_id ? String(raw.stage_id) : undefined,
        status: raw.status ?? undefined,
        amount: raw.value ?? undefined,
        currency: raw.currency ?? undefined,
        ownerId: ownerId ? String(ownerId) : undefined,
        rawSnapshot: { status: raw.status },
        externalUpdatedAtMs: raw.update_time ? Date.parse(raw.update_time) : undefined,
    };
}

export async function pullDealsPage(p: {
    ctx: AdapterCallCtx;
    cursor?: string;
    sinceMs?: number;
}): Promise<Page<UnifiedDeal>> {
    const accessToken = p.ctx.credentials.accessToken;
    const apiDomain = p.ctx.credentials.instanceUrl;
    if (!accessToken) throw new CRMAuthError("missing access token", { provider: "pipedrive" });
    if (!apiDomain) throw new CRMValidationError("missing api_domain", { provider: "pipedrive" });

    const start = p.cursor ? Number(p.cursor) : 0;
    const params = new URLSearchParams({ start: String(start), limit: "100" });
    const json = (await pipedriveFetch(
        `/api/v1/deals?${params.toString()}`,
        { apiDomain, accessToken, method: "GET" },
    )) as {
        data: PipedriveDeal[] | null;
        additional_data?: {
            pagination?: {
                more_items_in_collection?: boolean;
                next_start?: number;
            };
        };
    };

    const items = (json.data ?? []).map(toUnifiedDeal);
    const nextStart = json.additional_data?.pagination?.next_start;
    const hasMore = Boolean(json.additional_data?.pagination?.more_items_in_collection);
    return {
        items,
        nextCursor: hasMore && nextStart !== undefined ? String(nextStart) : undefined,
        hasMore,
    };
}

export async function findContactByEmail(p: {
    ctx: AdapterCallCtx;
    email: string;
}): Promise<UnifiedContact | null> {
    const accessToken = p.ctx.credentials.accessToken;
    const apiDomain = p.ctx.credentials.instanceUrl;
    if (!accessToken || !apiDomain) return null;
    const params = new URLSearchParams({
        term: p.email,
        fields: "email",
        exact_match: "true",
        limit: "1",
    });
    const json = (await pipedriveFetch(
        `/api/v1/persons/search?${params.toString()}`,
        { apiDomain, accessToken, method: "GET" },
    )) as { data?: { items?: Array<{ item: PipedrivePerson }> } };
    const first = json.data?.items?.[0]?.item;
    return first ? toUnifiedContact(first) : null;
}

export async function findContactByPhone(p: {
    ctx: AdapterCallCtx;
    phoneE164: string;
}): Promise<UnifiedContact | null> {
    const accessToken = p.ctx.credentials.accessToken;
    const apiDomain = p.ctx.credentials.instanceUrl;
    if (!accessToken || !apiDomain) return null;
    const params = new URLSearchParams({
        term: p.phoneE164,
        fields: "phone",
        exact_match: "true",
        limit: "1",
    });
    const json = (await pipedriveFetch(
        `/api/v1/persons/search?${params.toString()}`,
        { apiDomain, accessToken, method: "GET" },
    )) as { data?: { items?: Array<{ item: PipedrivePerson }> } };
    const first = json.data?.items?.[0]?.item;
    return first ? toUnifiedContact(first) : null;
}

const EVENT_LABELS: Record<string, string> = {
    conversation_opened: "Conversation WhatsApp ouverte",
    conversation_assigned: "Conversation WhatsApp assignée",
    conversation_resolved: "Conversation WhatsApp résolue",
};

function eventToNoteContent(event: ConversationEvent): string {
    const title = EVENT_LABELS[event.type] ?? event.type;
    const when = new Date(event.occurredAtMs).toISOString();
    const meta = event.metadata
        ? "\n" + Object.entries(event.metadata).map(([k, v]) => `${k}: ${String(v)}`).join("\n")
        : "";
    return `[Jokko] ${title} le ${when}${meta}`;
}

export async function pushConversationEvent(p: {
    ctx: AdapterCallCtx;
    event: ConversationEvent;
}): Promise<PushResult> {
    const accessToken = p.ctx.credentials.accessToken;
    const apiDomain = p.ctx.credentials.instanceUrl;
    if (!accessToken || !apiDomain) {
        throw new CRMAuthError("missing access token or api_domain", { provider: "pipedrive" });
    }
    if (!p.event.contactExternalId) {
        throw new CRMValidationError(
            "event.contactExternalId required for Pipedrive push",
            { provider: "pipedrive" },
        );
    }

    const body = {
        content: eventToNoteContent(p.event),
        person_id: Number(p.event.contactExternalId),
    };
    const json = (await pipedriveFetch(`/api/v1/notes`, {
        apiDomain,
        accessToken,
        method: "POST",
        body: JSON.stringify(body),
    })) as { data?: { id: number } };
    const id = json.data?.id;
    if (!id) {
        throw new CRMValidationError("Pipedrive note creation returned no id", { provider: "pipedrive" });
    }
    return {
        ok: true,
        providerEventId: String(id),
        providerTimestampMs: p.event.occurredAtMs,
    };
}

export async function revokeToken(_p: {
    accessToken?: string;
    refreshToken?: string;
}): Promise<void> {
    // Pipedrive does not expose a public revocation endpoint — disconnect is done in UI.
    // Jokko erases local tokens on disconnect.
}

export async function verifyWebhookSignature(p: {
    rawBody: string;
    headers: Record<string, string | undefined>;
    secret: string;
}): Promise<boolean> {
    // Pipedrive uses HTTP Basic auth on webhook delivery (not HMAC).
    // The "secret" is encoded as "user:password".
    const expected = `Basic ${btoa(p.secret)}`;
    const received = p.headers["authorization"];
    if (!received) return false;
    return received === expected;
}

export async function parseWebhookEvent(p: {
    rawBody: string;
    headers: Record<string, string | undefined>;
}): Promise<ParsedWebhookEvent[]> {
    let body: {
        event?: string;
        meta?: { id?: number; action?: string; object?: string; company_id?: number; timestamp?: number };
        current?: { id?: number };
        previous?: { id?: number };
    };
    try {
        body = JSON.parse(p.rawBody);
    } catch {
        return [];
    }
    const objectType = body.meta?.object;
    const action = body.meta?.action ?? "updated";
    const entityType: ParsedWebhookEvent["entityType"] =
        objectType === "person" ? "contact" : objectType === "deal" ? "deal" : "unknown";
    const id = body.current?.id ?? body.previous?.id;
    if (!id) return [];
    const timestamp = body.meta?.timestamp ? body.meta.timestamp * 1000 : Date.now();
    const companyId = body.meta?.company_id ? String(body.meta.company_id) : undefined;
    return [
        {
            eventKey: `pipedrive:${objectType}:${id}:${action}:${timestamp}`,
            eventType: `${objectType}.${action}`,
            entityType,
            entityExternalId: String(id),
            remoteAccountId: companyId,
            occurredAtMs: timestamp,
            externalUpdatedAtMs: timestamp,
            payload: body as Record<string, unknown>,
        },
    ];
}
