/**
 * HubSpot REST adapter — pure fetch-based implementation.
 * No Convex imports; testable in isolation with mocked fetch.
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

const HUBSPOT_API = "https://api.hubapi.com";
const HUBSPOT_AUTH = "https://app.hubspot.com/oauth/authorize";
const HUBSPOT_TOKEN = "https://api.hubapi.com/oauth/v1/token";

const DEFAULT_SCOPES = [
    "crm.objects.contacts.read",
    "crm.objects.contacts.write",
    "crm.objects.deals.read",
    "crm.objects.deals.write",
    "oauth",
];

function env(name: string): string {
    const v = process.env[name];
    if (!v) throw new CRMValidationError(`Missing env var ${name}`, { provider: "hubspot" });
    return v;
}

function statusToError(status: number, body: string, providerCode?: string): never {
    const meta = { provider: "hubspot" as const, statusCode: status, providerCode };
    if (status === 401 || status === 403) {
        throw new CRMAuthError(`HubSpot auth failed: ${body}`, meta);
    }
    if (status === 404) {
        throw new CRMNotFoundError(`HubSpot not found: ${body}`, meta);
    }
    if (status === 429) {
        throw new CRMRateLimitError(`HubSpot rate limit: ${body}`, meta);
    }
    if (status >= 500 || status === 408 || status === 0) {
        throw new CRMTransientError(`HubSpot transient ${status}: ${body}`, meta);
    }
    if (status === 400 || status === 422) {
        throw new CRMValidationError(`HubSpot validation: ${body}`, meta);
    }
    throw new CRMTransientError(`HubSpot unexpected ${status}: ${body}`, meta);
}

async function hubspotFetch(
    path: string,
    init: RequestInit & { accessToken: string },
): Promise<unknown> {
    const { accessToken, headers, ...rest } = init;
    const url = path.startsWith("http") ? path : `${HUBSPOT_API}${path}`;
    const res = await fetch(url, {
        ...rest,
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            Accept: "application/json",
            ...(headers ?? {}),
        },
    });
    const text = await res.text();
    if (!res.ok) {
        let code: string | undefined;
        try {
            const j = JSON.parse(text);
            code = typeof j.category === "string" ? j.category : undefined;
        } catch {
            /* ignore */
        }
        statusToError(res.status, text.slice(0, 500), code);
    }
    return text ? JSON.parse(text) : {};
}

export function buildAuthorizeUrl(p: {
    state: string;
    redirectUri: string;
    codeChallenge?: string;
}): string {
    const clientId = env("HUBSPOT_CLIENT_ID");
    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: p.redirectUri,
        scope: DEFAULT_SCOPES.join(" "),
        state: p.state,
    });
    if (p.codeChallenge) {
        params.set("code_challenge", p.codeChallenge);
        params.set("code_challenge_method", "S256");
    }
    return `${HUBSPOT_AUTH}?${params.toString()}`;
}

export async function exchangeCode(p: {
    code: string;
    redirectUri: string;
    codeVerifier?: string;
}): Promise<AuthTokens> {
    const body = new URLSearchParams({
        grant_type: "authorization_code",
        client_id: env("HUBSPOT_CLIENT_ID"),
        client_secret: env("HUBSPOT_CLIENT_SECRET"),
        redirect_uri: p.redirectUri,
        code: p.code,
    });
    if (p.codeVerifier) body.set("code_verifier", p.codeVerifier);

    const res = await fetch(HUBSPOT_TOKEN, {
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
        hub_id?: number;
        hub_domain?: string;
    };

    let hubId: string | undefined = token.hub_id ? String(token.hub_id) : undefined;
    let hubDomain: string | undefined = token.hub_domain;
    if (!hubId) {
        try {
            const info = (await hubspotFetch(
                `/oauth/v1/access-tokens/${token.access_token}`,
                { accessToken: token.access_token, method: "GET" },
            )) as { hub_id?: number; hub_domain?: string };
            if (info.hub_id) hubId = String(info.hub_id);
            if (info.hub_domain) hubDomain = info.hub_domain;
        } catch {
            /* best effort */
        }
    }

    return {
        accessToken: token.access_token,
        refreshToken: token.refresh_token,
        expiresAtMs: Date.now() + token.expires_in * 1000,
        scopes: DEFAULT_SCOPES,
        remoteAccountId: hubId ?? "unknown",
        remoteAccountLabel: hubDomain,
    };
}

export async function refreshToken(p: { refreshToken: string }): Promise<AuthTokens> {
    const body = new URLSearchParams({
        grant_type: "refresh_token",
        client_id: env("HUBSPOT_CLIENT_ID"),
        client_secret: env("HUBSPOT_CLIENT_SECRET"),
        refresh_token: p.refreshToken,
    });
    const res = await fetch(HUBSPOT_TOKEN, {
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

function toUnifiedContact(raw: {
    id: string;
    properties: Record<string, string | null>;
    updatedAt?: string;
}): UnifiedContact {
    const p = raw.properties ?? {};
    const emails = [p.email, p.work_email].filter(
        (e): e is string => typeof e === "string" && e.length > 0,
    );
    const phones: Array<{ raw: string; type?: string }> = [];
    if (p.phone) phones.push({ raw: p.phone, type: "primary" });
    if (p.mobilephone) phones.push({ raw: p.mobilephone, type: "mobile" });

    return {
        externalId: raw.id,
        firstName: p.firstname ?? undefined,
        lastName: p.lastname ?? undefined,
        emails,
        phones,
        company: p.company ?? undefined,
        jobTitle: p.jobtitle ?? undefined,
        externalOwnerId: p.hubspot_owner_id ?? undefined,
        externalLifecycleStage: p.lifecyclestage ?? undefined,
        externalUpdatedAtMs: raw.updatedAt ? Date.parse(raw.updatedAt) : undefined,
    };
}

const CONTACT_PROPERTIES = [
    "firstname",
    "lastname",
    "email",
    "work_email",
    "phone",
    "mobilephone",
    "company",
    "jobtitle",
    "hubspot_owner_id",
    "lifecyclestage",
    "lastmodifieddate",
];

export async function pullContactsPage(p: {
    ctx: AdapterCallCtx;
    cursor?: string;
    sinceMs?: number;
}): Promise<Page<UnifiedContact>> {
    const accessToken = p.ctx.credentials.accessToken;
    if (!accessToken) throw new CRMAuthError("missing access token", { provider: "hubspot" });
    const params = new URLSearchParams({
        limit: "100",
        properties: CONTACT_PROPERTIES.join(","),
        archived: "false",
    });
    if (p.cursor) params.set("after", p.cursor);

    const json = (await hubspotFetch(
        `/crm/v3/objects/contacts?${params.toString()}`,
        { accessToken, method: "GET" },
    )) as {
        results: Array<{ id: string; properties: Record<string, string | null>; updatedAt?: string }>;
        paging?: { next?: { after: string } };
    };

    return {
        items: json.results.map(toUnifiedContact),
        nextCursor: json.paging?.next?.after,
        hasMore: Boolean(json.paging?.next?.after),
    };
}

const DEAL_PROPERTIES = [
    "dealname",
    "amount",
    "dealstage",
    "pipeline",
    "closedate",
    "dealtype",
    "hubspot_owner_id",
    "deal_currency_code",
    "hs_lastmodifieddate",
];

function toUnifiedDeal(raw: {
    id: string;
    properties: Record<string, string | null>;
    updatedAt?: string;
    associations?: {
        contacts?: { results: Array<{ id: string }> };
    };
}): UnifiedDeal {
    const p = raw.properties ?? {};
    const amt = p.amount ? Number(p.amount) : undefined;
    const contactExt = raw.associations?.contacts?.results?.[0]?.id;
    return {
        externalId: raw.id,
        title: p.dealname ?? `Deal ${raw.id}`,
        contactExternalId: contactExt,
        pipeline: p.pipeline ?? undefined,
        stage: p.dealstage ?? undefined,
        status: p.dealtype ?? undefined,
        ownerId: p.hubspot_owner_id ?? undefined,
        amount: amt && !Number.isNaN(amt) ? amt : undefined,
        currency: p.deal_currency_code ?? undefined,
        rawSnapshot: { properties: p },
        externalUpdatedAtMs: raw.updatedAt ? Date.parse(raw.updatedAt) : undefined,
    };
}

export async function pullDealsPage(p: {
    ctx: AdapterCallCtx;
    cursor?: string;
    sinceMs?: number;
}): Promise<Page<UnifiedDeal>> {
    const accessToken = p.ctx.credentials.accessToken;
    if (!accessToken) throw new CRMAuthError("missing access token", { provider: "hubspot" });
    const params = new URLSearchParams({
        limit: "100",
        properties: DEAL_PROPERTIES.join(","),
        associations: "contacts",
        archived: "false",
    });
    if (p.cursor) params.set("after", p.cursor);

    const json = (await hubspotFetch(
        `/crm/v3/objects/deals?${params.toString()}`,
        { accessToken, method: "GET" },
    )) as {
        results: Array<Parameters<typeof toUnifiedDeal>[0]>;
        paging?: { next?: { after: string } };
    };

    return {
        items: json.results.map(toUnifiedDeal),
        nextCursor: json.paging?.next?.after,
        hasMore: Boolean(json.paging?.next?.after),
    };
}

export async function findContactByEmail(p: {
    ctx: AdapterCallCtx;
    email: string;
}): Promise<UnifiedContact | null> {
    const accessToken = p.ctx.credentials.accessToken;
    if (!accessToken) throw new CRMAuthError("missing access token", { provider: "hubspot" });
    const body = {
        filterGroups: [
            { filters: [{ propertyName: "email", operator: "EQ", value: p.email }] },
        ],
        properties: CONTACT_PROPERTIES,
        limit: 1,
    };
    const json = (await hubspotFetch(`/crm/v3/objects/contacts/search`, {
        accessToken,
        method: "POST",
        body: JSON.stringify(body),
    })) as {
        results: Array<{ id: string; properties: Record<string, string | null>; updatedAt?: string }>;
    };
    return json.results[0] ? toUnifiedContact(json.results[0]) : null;
}

export async function findContactByPhone(p: {
    ctx: AdapterCallCtx;
    phoneE164: string;
}): Promise<UnifiedContact | null> {
    const accessToken = p.ctx.credentials.accessToken;
    if (!accessToken) throw new CRMAuthError("missing access token", { provider: "hubspot" });

    for (const property of ["phone", "mobilephone"]) {
        const body = {
            filterGroups: [
                { filters: [{ propertyName: property, operator: "EQ", value: p.phoneE164 }] },
            ],
            properties: CONTACT_PROPERTIES,
            limit: 1,
        };
        const json = (await hubspotFetch(`/crm/v3/objects/contacts/search`, {
            accessToken,
            method: "POST",
            body: JSON.stringify(body),
        })) as {
            results: Array<{ id: string; properties: Record<string, string | null>; updatedAt?: string }>;
        };
        if (json.results[0]) return toUnifiedContact(json.results[0]);
    }
    return null;
}

export type SeedContactInput = {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    company?: string;
    jobTitle?: string;
    city?: string;
    country?: string;
    lifecycleStage?: string;
};

export type SeedContactResult = {
    input: SeedContactInput;
    status: "created" | "existing" | "failed";
    externalId?: string;
    error?: string;
};

function toHubspotProps(c: SeedContactInput): Record<string, string> {
    const props: Record<string, string> = {};
    if (c.firstName) props.firstname = c.firstName;
    if (c.lastName) props.lastname = c.lastName;
    if (c.email) props.email = c.email;
    if (c.phone) props.phone = c.phone;
    if (c.company) props.company = c.company;
    if (c.jobTitle) props.jobtitle = c.jobTitle;
    if (c.city) props.city = c.city;
    if (c.country) props.country = c.country;
    if (c.lifecycleStage) props.lifecyclestage = c.lifecycleStage;
    return props;
}

export async function createContactsBatch(p: {
    ctx: AdapterCallCtx;
    contacts: SeedContactInput[];
}): Promise<SeedContactResult[]> {
    const accessToken = p.ctx.credentials.accessToken;
    if (!accessToken) throw new CRMAuthError("missing access token", { provider: "hubspot" });
    if (p.contacts.length === 0) return [];

    const results: SeedContactResult[] = [];

    for (let i = 0; i < p.contacts.length; i += 100) {
        const batch = p.contacts.slice(i, i + 100);
        const inputs = batch.map((c) => ({ properties: toHubspotProps(c) }));

        try {
            const json = (await hubspotFetch(`/crm/v3/objects/contacts/batch/create`, {
                accessToken,
                method: "POST",
                body: JSON.stringify({ inputs }),
            })) as {
                results: Array<{ id: string; properties: Record<string, string | null> }>;
            };

            for (let j = 0; j < batch.length; j++) {
                results.push({
                    input: batch[j],
                    status: "created",
                    externalId: json.results[j]?.id,
                });
            }
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            const isDuplicate = /CONFLICT|already exists|duplicate/i.test(msg);

            for (const c of batch) {
                if (isDuplicate && c.email) {
                    try {
                        const existing = await findContactByEmail({ ctx: p.ctx, email: c.email });
                        if (existing?.externalId) {
                            results.push({ input: c, status: "existing", externalId: existing.externalId });
                            continue;
                        }
                    } catch {
                        /* fallthrough */
                    }
                }
                results.push({ input: c, status: "failed", error: msg });
            }
        }
    }

    return results;
}

const EVENT_LABELS: Record<string, string> = {
    conversation_opened: "Conversation WhatsApp ouverte",
    conversation_assigned: "Conversation WhatsApp assignée",
    conversation_resolved: "Conversation WhatsApp résolue",
};

function escapeHtml(s: string): string {
    return s.replace(/[&<>"']/g, (c) => (
        { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] ?? c
    ));
}

function eventToNoteHtml(event: ConversationEvent): string {
    const when = new Date(event.occurredAtMs).toISOString();
    const title = EVENT_LABELS[event.type] ?? event.type;
    const meta = event.metadata
        ? `<p>${Object.entries(event.metadata)
            .map(([k, v]) => `<strong>${escapeHtml(k)}:</strong> ${escapeHtml(String(v))}`)
            .join("<br/>")}</p>`
        : "";
    return `<p><em>Jokko</em> — ${escapeHtml(title)} le ${when}</p>${meta}`;
}

export async function pushConversationEvent(p: {
    ctx: AdapterCallCtx;
    event: ConversationEvent;
}): Promise<PushResult> {
    const accessToken = p.ctx.credentials.accessToken;
    if (!accessToken) throw new CRMAuthError("missing access token", { provider: "hubspot" });
    if (!p.event.contactExternalId) {
        throw new CRMValidationError(
            "event.contactExternalId required for HubSpot push",
            { provider: "hubspot" },
        );
    }

    const body = {
        properties: {
            hs_note_body: eventToNoteHtml(p.event),
            hs_timestamp: String(p.event.occurredAtMs),
        },
        associations: [
            {
                to: { id: p.event.contactExternalId },
                types: [
                    {
                        associationCategory: "HUBSPOT_DEFINED",
                        associationTypeId: 202,
                    },
                ],
            },
        ],
    };

    const json = (await hubspotFetch(`/crm/v3/objects/notes`, {
        accessToken,
        method: "POST",
        body: JSON.stringify(body),
    })) as { id: string };

    return {
        ok: true,
        providerEventId: json.id,
        providerTimestampMs: p.event.occurredAtMs,
    };
}

export async function revokeToken(_p: {
    accessToken?: string;
    refreshToken?: string;
}): Promise<void> {
    // HubSpot does not offer a token revocation endpoint per spec — deletion of integration
    // must be done in HubSpot UI by the user. Jokko erases local tokens on disconnect.
}

export async function verifyWebhookSignature(p: {
    rawBody: string;
    headers: Record<string, string | undefined>;
    secret: string;
}): Promise<boolean> {
    const signature = p.headers["x-hubspot-signature-v3"];
    const timestamp = p.headers["x-hubspot-request-timestamp"];
    if (!signature || !timestamp) return false;
    const now = Date.now();
    const ts = Number(timestamp);
    if (!Number.isFinite(ts) || Math.abs(now - ts) > 5 * 60 * 1000) return false;

    const proto = p.headers["x-forwarded-proto"] ?? "https";
    const host = p.headers["host"] ?? p.headers["x-forwarded-host"] ?? "";
    const uriPath = p.headers["x-forwarded-uri"] ?? p.headers["x-original-uri"] ?? "/webhooks/crm/hubspot";
    const uri = `${proto}://${host}${uriPath}`;
    const base = `POST${uri}${p.rawBody}${timestamp}`;

    const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(p.secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"],
    );
    const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(base));
    const bytes = new Uint8Array(sig);
    let bin = "";
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    const computed = btoa(bin);
    return computed === signature;
}

export async function parseWebhookEvent(p: {
    rawBody: string;
    headers: Record<string, string | undefined>;
}): Promise<ParsedWebhookEvent[]> {
    let events: Array<{
        eventId?: number;
        subscriptionType?: string;
        objectId?: number;
        portalId?: number;
        occurredAt?: number;
        changeSource?: string;
    }>;
    try {
        const parsed = JSON.parse(p.rawBody);
        events = Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }

    return events.map((e) => {
        const entityType: ParsedWebhookEvent["entityType"] = e.subscriptionType?.startsWith(
            "contact",
        )
            ? "contact"
            : e.subscriptionType?.startsWith("deal")
                ? "deal"
                : "unknown";
        const eventKey = e.eventId
            ? `hubspot:${e.eventId}`
            : `hubspot:${e.subscriptionType ?? "?"}:${e.objectId ?? "?"}:${e.occurredAt ?? Date.now()}`;
        return {
            eventKey,
            eventType: e.subscriptionType ?? "unknown",
            entityType,
            entityExternalId: e.objectId ? String(e.objectId) : undefined,
            remoteAccountId: e.portalId ? String(e.portalId) : undefined,
            occurredAtMs: e.occurredAt,
            externalUpdatedAtMs: e.occurredAt,
            payload: e as Record<string, unknown>,
        };
    });
}
