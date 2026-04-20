/**
 * Sellsy REST adapter (API v2, OAuth2 authorization_code flow).
 * API reference: https://api.sellsy.com/doc/v2/
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

const SELLSY_API = "https://api.sellsy.com/v2";
const SELLSY_AUTH = "https://login.sellsy.com/oauth2/authorization";
const SELLSY_TOKEN = "https://login.sellsy.com/oauth2/access-tokens";
const DEFAULT_SCOPES = ["contacts.read", "opportunities.read", "comments.write"];

function env(name: string): string {
    const v = process.env[name];
    if (!v) throw new CRMValidationError(`Missing env var ${name}`, { provider: "sellsy" });
    return v;
}

function statusToError(status: number, body: string): never {
    const meta = { provider: "sellsy" as const, statusCode: status };
    if (status === 401 || status === 403) throw new CRMAuthError(`Sellsy auth: ${body}`, meta);
    if (status === 404) throw new CRMNotFoundError(`Sellsy not found: ${body}`, meta);
    if (status === 429) throw new CRMRateLimitError(`Sellsy rate limit: ${body}`, meta);
    if (status >= 500) throw new CRMTransientError(`Sellsy 5xx: ${body}`, meta);
    if (status >= 400) throw new CRMValidationError(`Sellsy 4xx: ${body}`, meta);
    throw new CRMTransientError(`Sellsy unexpected ${status}: ${body}`, meta);
}

async function sellsyFetch(
    path: string,
    opts: { accessToken: string; method: "GET" | "POST"; body?: string },
): Promise<unknown> {
    const res = await fetch(`${SELLSY_API}${path}`, {
        method: opts.method,
        headers: {
            Authorization: `Bearer ${opts.accessToken}`,
            "Content-Type": "application/json",
            Accept: "application/json",
        },
        body: opts.body,
    });
    const text = await res.text();
    if (!res.ok) statusToError(res.status, text.slice(0, 500));
    try {
        return JSON.parse(text);
    } catch {
        throw new CRMValidationError(`Sellsy invalid JSON`, { provider: "sellsy" });
    }
}

export function buildAuthorizeUrl(p: {
    state: string;
    redirectUri: string;
    codeChallenge?: string;
}): string {
    const params = new URLSearchParams({
        response_type: "code",
        client_id: env("SELLSY_CLIENT_ID"),
        redirect_uri: p.redirectUri,
        scope: DEFAULT_SCOPES.join(" "),
        state: p.state,
    });
    if (p.codeChallenge) {
        params.set("code_challenge", p.codeChallenge);
        params.set("code_challenge_method", "S256");
    }
    return `${SELLSY_AUTH}?${params.toString()}`;
}

export async function exchangeCode(p: {
    code: string;
    redirectUri: string;
    codeVerifier?: string;
}): Promise<AuthTokens> {
    const body = new URLSearchParams({
        grant_type: "authorization_code",
        code: p.code,
        client_id: env("SELLSY_CLIENT_ID"),
        client_secret: env("SELLSY_CLIENT_SECRET"),
        redirect_uri: p.redirectUri,
    });
    if (p.codeVerifier) body.set("code_verifier", p.codeVerifier);

    const res = await fetch(SELLSY_TOKEN, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
    });
    const text = await res.text();
    if (!res.ok) statusToError(res.status, text.slice(0, 500));
    const token = JSON.parse(text) as {
        access_token: string;
        refresh_token?: string;
        expires_in: number;
        company_id?: number | string;
    };

    return {
        accessToken: token.access_token,
        refreshToken: token.refresh_token,
        expiresAtMs: Date.now() + token.expires_in * 1000,
        scopes: DEFAULT_SCOPES,
        remoteAccountId: token.company_id ? String(token.company_id) : "unknown",
    };
}

export async function refreshToken(p: { refreshToken: string }): Promise<AuthTokens> {
    const body = new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: p.refreshToken,
        client_id: env("SELLSY_CLIENT_ID"),
        client_secret: env("SELLSY_CLIENT_SECRET"),
    });
    const res = await fetch(SELLSY_TOKEN, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
    });
    const text = await res.text();
    if (!res.ok) statusToError(res.status, text.slice(0, 500));
    const token = JSON.parse(text) as {
        access_token: string;
        refresh_token?: string;
        expires_in: number;
    };
    return {
        accessToken: token.access_token,
        refreshToken: token.refresh_token ?? p.refreshToken,
        expiresAtMs: Date.now() + token.expires_in * 1000,
        remoteAccountId: "unknown",
    };
}

interface SellsyContact {
    id: number;
    first_name?: string;
    last_name?: string;
    email?: string;
    phone_number?: string;
    mobile_number?: string;
    company?: { name?: string };
    owner?: { id?: number };
    updated?: string;
}

function toUnifiedContact(raw: SellsyContact): UnifiedContact {
    const phones: Array<{ raw: string; type?: string }> = [];
    if (raw.phone_number) phones.push({ raw: raw.phone_number, type: "primary" });
    if (raw.mobile_number) phones.push({ raw: raw.mobile_number, type: "mobile" });
    return {
        externalId: String(raw.id),
        firstName: raw.first_name,
        lastName: raw.last_name,
        emails: raw.email ? [raw.email] : [],
        phones,
        company: raw.company?.name,
        externalOwnerId: raw.owner?.id ? String(raw.owner.id) : undefined,
        externalUpdatedAtMs: raw.updated ? Date.parse(raw.updated) : undefined,
    };
}

export async function pullContactsPage(p: {
    ctx: AdapterCallCtx;
    cursor?: string;
    sinceMs?: number;
}): Promise<Page<UnifiedContact>> {
    const accessToken = p.ctx.credentials.accessToken;
    if (!accessToken) throw new CRMAuthError("missing access token", { provider: "sellsy" });
    const limit = 100;
    const offset = p.cursor ? Number(p.cursor) : 0;
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    const json = (await sellsyFetch(`/contacts?${params.toString()}`, {
        accessToken,
        method: "GET",
    })) as { data?: SellsyContact[]; pagination?: { total?: number } };

    const items = (json.data ?? []).map(toUnifiedContact);
    const hasMore = items.length === limit;
    return {
        items,
        nextCursor: hasMore ? String(offset + limit) : undefined,
        hasMore,
    };
}

interface SellsyOpportunity {
    id: number;
    name?: string;
    amount?: number;
    currency?: string;
    stage?: { name?: string; id?: number };
    pipeline?: { name?: string; id?: number };
    contact?: { id?: number };
    owner?: { id?: number };
    status?: string;
    updated?: string;
}

function toUnifiedDeal(raw: SellsyOpportunity): UnifiedDeal {
    return {
        externalId: String(raw.id),
        title: raw.name ?? `Opportunité ${raw.id}`,
        contactExternalId: raw.contact?.id ? String(raw.contact.id) : undefined,
        pipeline: raw.pipeline?.id ? String(raw.pipeline.id) : undefined,
        stage: raw.stage?.id ? String(raw.stage.id) : undefined,
        status: raw.status,
        amount: raw.amount,
        currency: raw.currency,
        ownerId: raw.owner?.id ? String(raw.owner.id) : undefined,
        rawSnapshot: {
            stageName: raw.stage?.name,
            pipelineName: raw.pipeline?.name,
        },
        externalUpdatedAtMs: raw.updated ? Date.parse(raw.updated) : undefined,
    };
}

export async function pullDealsPage(p: {
    ctx: AdapterCallCtx;
    cursor?: string;
    sinceMs?: number;
}): Promise<Page<UnifiedDeal>> {
    const accessToken = p.ctx.credentials.accessToken;
    if (!accessToken) throw new CRMAuthError("missing access token", { provider: "sellsy" });
    const limit = 100;
    const offset = p.cursor ? Number(p.cursor) : 0;
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    const json = (await sellsyFetch(`/opportunities?${params.toString()}`, {
        accessToken,
        method: "GET",
    })) as { data?: SellsyOpportunity[]; pagination?: { total?: number } };

    const items = (json.data ?? []).map(toUnifiedDeal);
    const hasMore = items.length === limit;
    return {
        items,
        nextCursor: hasMore ? String(offset + limit) : undefined,
        hasMore,
    };
}

const EVENT_LABELS: Record<string, string> = {
    conversation_opened: "Conversation WhatsApp ouverte",
    conversation_assigned: "Conversation WhatsApp assignée",
    conversation_resolved: "Conversation WhatsApp résolue",
};

function eventToComment(event: ConversationEvent): string {
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
    if (!accessToken) throw new CRMAuthError("missing access token", { provider: "sellsy" });
    if (!p.event.contactExternalId) {
        throw new CRMValidationError(
            "event.contactExternalId required for Sellsy push",
            { provider: "sellsy" },
        );
    }
    const body = {
        description: eventToComment(p.event),
        related: [{ type: "individual", id: Number(p.event.contactExternalId) }],
    };
    const json = (await sellsyFetch(`/comments`, {
        accessToken,
        method: "POST",
        body: JSON.stringify(body),
    })) as { id?: number | string };
    if (!json.id) {
        throw new CRMValidationError("Sellsy comment creation returned no id", { provider: "sellsy" });
    }
    return {
        ok: true,
        providerEventId: String(json.id),
        providerTimestampMs: p.event.occurredAtMs,
    };
}

export async function revokeToken(_p: {
    accessToken?: string;
    refreshToken?: string;
}): Promise<void> {
    // Sellsy does not expose a public revocation endpoint — disconnect done in UI.
}

export async function verifyWebhookSignature(p: {
    rawBody: string;
    headers: Record<string, string | undefined>;
    secret: string;
}): Promise<boolean> {
    // Sellsy signs webhooks with HMAC-SHA256 in header X-Sellsy-Signature.
    const signature = p.headers["x-sellsy-signature"];
    if (!signature) return false;
    const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(p.secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"],
    );
    const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(p.rawBody));
    const bytes = new Uint8Array(sig);
    let hex = "";
    for (let i = 0; i < bytes.length; i++) hex += bytes[i].toString(16).padStart(2, "0");
    return hex === signature.toLowerCase();
}

export async function parseWebhookEvent(p: {
    rawBody: string;
    headers: Record<string, string | undefined>;
}): Promise<ParsedWebhookEvent[]> {
    let body: {
        event?: string;
        event_id?: string;
        object?: { id?: number | string; type?: string };
        company_id?: number | string;
        timestamp?: number;
    };
    try {
        body = JSON.parse(p.rawBody);
    } catch {
        return [];
    }
    const objectType = body.object?.type;
    const entityType: ParsedWebhookEvent["entityType"] =
        objectType === "individual" || objectType === "contact"
            ? "contact"
            : objectType === "opportunity" ? "deal" : "unknown";
    const id = body.object?.id;
    if (!id) return [];
    const eventKey = body.event_id
        ? `sellsy:${body.event_id}`
        : `sellsy:${body.event ?? "?"}:${id}:${body.timestamp ?? Date.now()}`;
    return [
        {
            eventKey,
            eventType: body.event ?? "unknown",
            entityType,
            entityExternalId: String(id),
            remoteAccountId: body.company_id ? String(body.company_id) : undefined,
            occurredAtMs: body.timestamp ? body.timestamp * 1000 : Date.now(),
            payload: body as Record<string, unknown>,
        },
    ];
}
