/**
 * noCRM.io REST adapter — API key (header X-API-KEY).
 * API reference: https://nocrm.io/help/api/
 *
 * noCRM uses "leads" as primary entity. We map leads → contacts (one lead per contact).
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
    ConversationEvent,
    Page,
    PushResult,
    UnifiedContact,
    UnifiedDeal,
} from "../../core/types";

const NOCRM_API_ENV = "NOCRM_SUBDOMAIN";

function statusToError(status: number, body: string): never {
    const meta = { provider: "nocrm" as const, statusCode: status };
    if (status === 401 || status === 403) throw new CRMAuthError(`noCRM auth: ${body}`, meta);
    if (status === 404) throw new CRMNotFoundError(`noCRM not found: ${body}`, meta);
    if (status === 429) throw new CRMRateLimitError(`noCRM rate limit: ${body}`, meta);
    if (status >= 500) throw new CRMTransientError(`noCRM 5xx: ${body}`, meta);
    if (status >= 400) throw new CRMValidationError(`noCRM 4xx: ${body}`, meta);
    throw new CRMTransientError(`noCRM unexpected ${status}: ${body}`, meta);
}

function resolveBaseUrl(ctx: AdapterCallCtx): string {
    const host = ctx.credentials.instanceUrl ?? process.env[NOCRM_API_ENV];
    if (!host) {
        throw new CRMValidationError(
            "Missing noCRM subdomain (set instanceUrl or NOCRM_SUBDOMAIN env)",
            { provider: "nocrm" },
        );
    }
    const base = host.startsWith("http") ? host : `https://${host}.nocrm.io`;
    return base.replace(/\/$/, "");
}

async function nocrmFetch(
    path: string,
    opts: { apiKey: string; baseUrl: string; method: "GET" | "POST"; body?: string },
): Promise<unknown> {
    const res = await fetch(`${opts.baseUrl}${path}`, {
        method: opts.method,
        headers: {
            "X-API-KEY": opts.apiKey,
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
        throw new CRMValidationError("noCRM invalid JSON", { provider: "nocrm" });
    }
}

export async function validateApiKey(p: {
    apiKey: string;
    instanceUrl?: string;
}): Promise<{
    ok: boolean;
    accountInfo?: { remoteAccountId: string; remoteAccountLabel?: string };
}> {
    const host = p.instanceUrl ?? process.env[NOCRM_API_ENV];
    if (!host) return { ok: false };
    const baseUrl = host.startsWith("http")
        ? host.replace(/\/$/, "")
        : `https://${host}.nocrm.io`;
    try {
        const json = (await nocrmFetch("/api/v2/me", {
            apiKey: p.apiKey,
            baseUrl,
            method: "GET",
        })) as { id?: number | string; email?: string; account_id?: number | string };
        if (!json || json.id === undefined) return { ok: false };
        return {
            ok: true,
            accountInfo: {
                remoteAccountId: String(json.account_id ?? json.id),
                remoteAccountLabel: json.email ?? undefined,
            },
        };
    } catch {
        return { ok: false };
    }
}

interface NoCRMLead {
    id: number;
    title?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    mobile?: string;
    company?: string;
    amount?: number;
    currency?: string;
    status?: string;
    step?: string;
    user_id?: number;
    updated_at?: string;
}

function toUnifiedContact(raw: NoCRMLead): UnifiedContact {
    const phones: Array<{ raw: string; type?: string }> = [];
    if (raw.phone) phones.push({ raw: raw.phone, type: "primary" });
    if (raw.mobile) phones.push({ raw: raw.mobile, type: "mobile" });
    return {
        externalId: String(raw.id),
        firstName: raw.first_name,
        lastName: raw.last_name,
        emails: raw.email ? [raw.email] : [],
        phones,
        company: raw.company,
        externalOwnerId: raw.user_id ? String(raw.user_id) : undefined,
        externalUpdatedAtMs: raw.updated_at ? Date.parse(raw.updated_at) : undefined,
    };
}

export async function pullContactsPage(p: {
    ctx: AdapterCallCtx;
    cursor?: string;
    sinceMs?: number;
}): Promise<Page<UnifiedContact>> {
    const apiKey = p.ctx.credentials.apiKey;
    if (!apiKey) throw new CRMAuthError("missing api key", { provider: "nocrm" });
    const baseUrl = resolveBaseUrl(p.ctx);
    const perPage = 50;
    const page = p.cursor ? Number(p.cursor) : 1;
    const params = new URLSearchParams({
        page: String(page),
        per_page: String(perPage),
    });
    const json = (await nocrmFetch(`/api/v2/leads?${params.toString()}`, {
        apiKey,
        baseUrl,
        method: "GET",
    })) as NoCRMLead[];
    const items = (json ?? []).map(toUnifiedContact);
    const hasMore = items.length === perPage;
    return {
        items,
        nextCursor: hasMore ? String(page + 1) : undefined,
        hasMore,
    };
}

/**
 * noCRM does not have a distinct "deal" entity — leads have amounts and steps.
 * Per PROVIDER_INFO.nocrm.supportsDeals = false, this is a no-op.
 */
export async function pullDealsPage(_p: {
    ctx: AdapterCallCtx;
    cursor?: string;
    sinceMs?: number;
}): Promise<Page<UnifiedDeal>> {
    return { items: [], nextCursor: undefined, hasMore: false };
}

const EVENT_LABELS: Record<string, string> = {
    conversation_opened: "Conversation WhatsApp ouverte",
    conversation_assigned: "Conversation WhatsApp assignée",
    conversation_resolved: "Conversation WhatsApp résolue",
};

function eventToCommentBody(event: ConversationEvent): string {
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
    const apiKey = p.ctx.credentials.apiKey;
    if (!apiKey) throw new CRMAuthError("missing api key", { provider: "nocrm" });
    const baseUrl = resolveBaseUrl(p.ctx);
    if (!p.event.contactExternalId) {
        throw new CRMValidationError(
            "event.contactExternalId required for noCRM push",
            { provider: "nocrm" },
        );
    }
    const body = {
        description: eventToCommentBody(p.event),
    };
    const json = (await nocrmFetch(
        `/api/v2/leads/${p.event.contactExternalId}/comments`,
        { apiKey, baseUrl, method: "POST", body: JSON.stringify(body) },
    )) as { id?: number | string };
    if (!json.id) {
        throw new CRMValidationError("noCRM comment creation returned no id", {
            provider: "nocrm",
        });
    }
    return {
        ok: true,
        providerEventId: String(json.id),
        providerTimestampMs: p.event.occurredAtMs,
    };
}
