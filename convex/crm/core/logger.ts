/**
 * Structured JSON logger + sanitizeError for safe error transport across
 * logs / audit / DLQ reason / integrationAuditLog.metadataSanitized.
 *
 * Condition P0 C1: never let raw tokens leak through logs.
 */

import type { CRMProvider } from "./types";

const MASK = "***";

const TOKEN_PATTERNS: Array<[RegExp, string]> = [
    [/Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi, `Bearer ${MASK}`],
    [/access[_-]?token["':= ]+[A-Za-z0-9\-._~+/]{6,}=*/gi, `access_token=${MASK}`],
    [/refresh[_-]?token["':= ]+[A-Za-z0-9\-._~+/]{6,}=*/gi, `refresh_token=${MASK}`],
    [/api[_-]?key["':= ]+[A-Za-z0-9\-._~+/]{8,}=*/gi, `api_key=${MASK}`],
    [/\bcode["':= ]+[A-Za-z0-9\-._~+/]{8,}=*/gi, `code=${MASK}`],
    [/client[_-]?secret["':= ]+[A-Za-z0-9\-._~+/]{6,}=*/gi, `client_secret=${MASK}`],
    [/Basic\s+[A-Za-z0-9+/]+=*/gi, `Basic ${MASK}`],
];

const SENSITIVE_KEYS = new Set([
    "authorization",
    "cookie",
    "set-cookie",
    "x-api-key",
    "access_token",
    "accesstoken",
    "refresh_token",
    "refreshtoken",
    "api_key",
    "apikey",
    "client_secret",
    "clientsecret",
    "password",
    "code",
    "code_verifier",
    "codeverifier",
    "token",
]);

function maskString(input: string): string {
    let out = input;
    for (const [pattern, replacement] of TOKEN_PATTERNS) {
        out = out.replace(pattern, replacement);
    }
    return out;
}

function maskObject(obj: unknown, depth = 0): unknown {
    if (depth > 4) return "[depth-limit]";
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === "string") return maskString(obj);
    if (typeof obj === "number" || typeof obj === "boolean") return obj;
    if (Array.isArray(obj)) return obj.map((v) => maskObject(v, depth + 1));
    if (typeof obj === "object") {
        const out: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
            if (SENSITIVE_KEYS.has(key.toLowerCase())) {
                out[key] = MASK;
            } else {
                out[key] = maskObject(value, depth + 1);
            }
        }
        return out;
    }
    return String(obj);
}

export interface SanitizedError {
    message: string;
    code?: string;
    statusCode?: number;
    provider?: CRMProvider;
    correlationId?: string;
}

export function sanitizeError(
    input: unknown,
    ctx?: { provider?: CRMProvider; correlationId?: string }
): SanitizedError {
    const base: SanitizedError = {
        message: "unknown error",
        provider: ctx?.provider,
        correlationId: ctx?.correlationId,
    };

    if (input === null || input === undefined) {
        return base;
    }

    if (typeof input === "string") {
        return { ...base, message: maskString(input) };
    }

    if (input instanceof Error) {
        const anyErr = input as Error & {
            code?: string;
            statusCode?: number;
            status?: number;
            meta?: { statusCode?: number; providerCode?: string };
        };
        return {
            ...base,
            message: maskString(input.message || input.name),
            code: anyErr.code ?? anyErr.meta?.providerCode,
            statusCode: anyErr.statusCode ?? anyErr.status ?? anyErr.meta?.statusCode,
        };
    }

    if (typeof input === "object") {
        const obj = input as Record<string, unknown>;
        const rawMessage =
            typeof obj.message === "string"
                ? obj.message
                : typeof obj.error === "string"
                    ? obj.error
                    : JSON.stringify(maskObject(obj));
        return {
            ...base,
            message: maskString(rawMessage).slice(0, 500),
            code: typeof obj.code === "string" ? obj.code : undefined,
            statusCode:
                typeof obj.statusCode === "number"
                    ? obj.statusCode
                    : typeof obj.status === "number"
                        ? obj.status
                        : undefined,
        };
    }

    return { ...base, message: String(input).slice(0, 500) };
}

export function sanitizeMetadata(meta: unknown): Record<string, unknown> {
    const masked = maskObject(meta);
    if (masked && typeof masked === "object" && !Array.isArray(masked)) {
        return masked as Record<string, unknown>;
    }
    return { value: masked };
}

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogFields {
    module: string;
    provider?: CRMProvider;
    connectionId?: string;
    organizationId?: string;
    correlationId?: string;
    receiptId?: string;
    queueItemId?: string;
    jobId?: string;
    event: string;
    durationMs?: number;
    [k: string]: unknown;
}

export function logJson(level: LogLevel, fields: LogFields): void {
    const masked = maskObject(fields) as Record<string, unknown>;
    const entry: Record<string, unknown> = {
        t: Date.now(),
        lvl: level,
        ...masked,
    };
    const line = JSON.stringify(entry);
    if (level === "error") {
        console.error(line);
    } else if (level === "warn") {
        console.warn(line);
    } else {
        console.log(line);
    }
}

export function newCorrelationId(prefix = "crm"): string {
    const rand = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
    return `${prefix}_${rand}`;
}
