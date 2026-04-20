/**
 * Axonaut REST adapter — API key (header userApiKey).
 * API reference: https://axonaut.com/api/v2/doc
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
    ParsedWebhookEvent,
    PushResult,
    UnifiedContact,
    UnifiedDeal,
} from "../../core/types";

const AXONAUT_API = "https://axonaut.com/api/v2";

function statusToError(status: number, body: string): never {
    const meta = { provider: "axonaut" as const, statusCode: status };
    if (status === 401 || status === 403) throw new CRMAuthError(`Axonaut auth: ${body}`, meta);
    if (status === 404) throw new CRMNotFoundError(`Axonaut not found: ${body}`, meta);
    if (status === 429) throw new CRMRateLimitError(`Axonaut rate limit: ${body}`, meta);
    if (status >= 500) throw new CRMTransientError(`Axonaut 5xx: ${body}`, meta);
    if (status >= 400) throw new CRMValidationError(`Axonaut 4xx: ${body}`, meta);
    throw new CRMTransientError(`Axonaut unexpected ${status}: ${body}`, meta);
}

async function axonautFetch(
    path: string,
    opts: { apiKey: string; method: "GET" | "POST"; body?: string },
): Promise<unknown> {
    const res = await fetch(`${AXONAUT_API}${path}`, {
        method: opts.method,
        headers: {
            userApiKey: opts.apiKey,
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
        throw new CRMValidationError("Axonaut invalid JSON", { provider: "axonaut" });
    }
}

export async function validateApiKey(p: { apiKey: string }): Promise<{
    ok: boolean;
    accountInfo?: { remoteAccountId: string; remoteAccountLabel?: string };
}> {
    try {
        const json = (await axonautFetch("/me", {
            apiKey: p.apiKey,
            method: "GET",
        })) as { id?: number | string; name?: string; company_name?: string };
        if (!json || json.id === undefined) return { ok: false };
        return {
            ok: true,
            accountInfo: {
                remoteAccountId: String(json.id),
                remoteAccountLabel: json.company_name ?? json.name,
            },
        };
    } catch {
        return { ok: false };
    }
}

interface AxonautCompany {
    id: number;
    name?: string;
}

interface AxonautContact {
    id: number;
    firstname?: string;
    lastname?: string;
    email?: string;
    phone?: string;
    mobile?: string;
    company?: AxonautCompany;
    updated_at?: string;
}

function toUnifiedContact(raw: AxonautContact): UnifiedContact {
    const phones: Array<{ raw: string; type?: string }> = [];
    if (raw.phone) phones.push({ raw: raw.phone, type: "primary" });
    if (raw.mobile) phones.push({ raw: raw.mobile, type: "mobile" });
    return {
        externalId: String(raw.id),
        firstName: raw.firstname,
        lastName: raw.lastname,
        emails: raw.email ? [raw.email] : [],
        phones,
        company: raw.company?.name,
        externalUpdatedAtMs: raw.updated_at ? Date.parse(raw.updated_at) : undefined,
    };
}

export async function pullContactsPage(p: {
    ctx: AdapterCallCtx;
    cursor?: string;
    sinceMs?: number;
}): Promise<Page<UnifiedContact>> {
    const apiKey = p.ctx.credentials.apiKey;
    if (!apiKey) throw new CRMAuthError("missing api key", { provider: "axonaut" });
    const page = p.cursor ? Number(p.cursor) : 1;
    const params = new URLSearchParams({ page: String(page), per_page: "50" });
    const json = (await axonautFetch(`/employees?${params.toString()}`, {
        apiKey,
        method: "GET",
    })) as AxonautContact[];

    const items = (json ?? []).map(toUnifiedContact);
    const hasMore = items.length === 50;
    return {
        items,
        nextCursor: hasMore ? String(page + 1) : undefined,
        hasMore,
    };
}

interface AxonautOpportunity {
    id: number;
    name?: string;
    amount?: number;
    currency?: string;
    stage?: { id?: number; name?: string };
    status?: string;
    employee_id?: number;
    updated_at?: string;
}

function toUnifiedDeal(raw: AxonautOpportunity): UnifiedDeal {
    return {
        externalId: String(raw.id),
        title: raw.name ?? `Opportunité ${raw.id}`,
        contactExternalId: raw.employee_id ? String(raw.employee_id) : undefined,
        stage: raw.stage?.id ? String(raw.stage.id) : undefined,
        status: raw.status,
        amount: raw.amount,
        currency: raw.currency,
        rawSnapshot: { stageName: raw.stage?.name },
        externalUpdatedAtMs: raw.updated_at ? Date.parse(raw.updated_at) : undefined,
    };
}

export async function pullDealsPage(p: {
    ctx: AdapterCallCtx;
    cursor?: string;
    sinceMs?: number;
}): Promise<Page<UnifiedDeal>> {
    const apiKey = p.ctx.credentials.apiKey;
    if (!apiKey) throw new CRMAuthError("missing api key", { provider: "axonaut" });
    const page = p.cursor ? Number(p.cursor) : 1;
    const params = new URLSearchParams({ page: String(page), per_page: "50" });
    const json = (await axonautFetch(`/opportunities?${params.toString()}`, {
        apiKey,
        method: "GET",
    })) as AxonautOpportunity[];

    const items = (json ?? []).map(toUnifiedDeal);
    const hasMore = items.length === 50;
    return {
        items,
        nextCursor: hasMore ? String(page + 1) : undefined,
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
    const apiKey = p.ctx.credentials.apiKey;
    if (!apiKey) throw new CRMAuthError("missing api key", { provider: "axonaut" });
    if (!p.event.contactExternalId) {
        throw new CRMValidationError(
            "event.contactExternalId required for Axonaut push",
            { provider: "axonaut" },
        );
    }
    const body = {
        content: eventToComment(p.event),
        employee_id: Number(p.event.contactExternalId),
    };
    const json = (await axonautFetch(`/comments`, {
        apiKey,
        method: "POST",
        body: JSON.stringify(body),
    })) as { id?: number | string };
    if (!json.id) {
        throw new CRMValidationError("Axonaut comment creation returned no id", {
            provider: "axonaut",
        });
    }
    return {
        ok: true,
        providerEventId: String(json.id),
        providerTimestampMs: p.event.occurredAtMs,
    };
}

export async function verifyWebhookSignature(p: {
    rawBody: string;
    headers: Record<string, string | undefined>;
    secret: string;
}): Promise<boolean> {
    // Axonaut webhook uses a shared secret sent as header X-Axonaut-Token.
    const token = p.headers["x-axonaut-token"];
    if (!token) return false;
    return token === p.secret;
}

export async function parseWebhookEvent(p: {
    rawBody: string;
    headers: Record<string, string | undefined>;
}): Promise<ParsedWebhookEvent[]> {
    let body: {
        event?: string;
        event_id?: string | number;
        entity?: string;
        entity_id?: number | string;
        occurred_at?: number;
    };
    try {
        body = JSON.parse(p.rawBody);
    } catch {
        return [];
    }
    const entityType: ParsedWebhookEvent["entityType"] =
        body.entity === "employee" ? "contact" :
        body.entity === "opportunity" ? "deal" : "unknown";
    const id = body.entity_id;
    if (!id) return [];
    const occurredAtMs = body.occurred_at ? body.occurred_at * 1000 : Date.now();
    const eventKey = body.event_id
        ? `axonaut:${body.event_id}`
        : `axonaut:${body.event ?? "?"}:${id}:${occurredAtMs}`;
    return [
        {
            eventKey,
            eventType: body.event ?? "unknown",
            entityType,
            entityExternalId: String(id),
            occurredAtMs,
            payload: body as Record<string, unknown>,
        },
    ];
}
