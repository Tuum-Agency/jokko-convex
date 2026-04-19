/**
 * Typed CRM errors. Drives retry / backoff / circuit breaker logic deterministically.
 */

import type { CRMProvider } from "./types";

export interface CRMErrorMeta {
    provider: CRMProvider;
    statusCode?: number;
    providerCode?: string;
    retryAfterMs?: number;
    retryable: boolean;
    correlationId?: string;
}

export class CRMError extends Error {
    readonly meta: CRMErrorMeta;
    constructor(message: string, meta: CRMErrorMeta) {
        super(message);
        this.name = "CRMError";
        this.meta = meta;
    }
}

export class CRMAuthError extends CRMError {
    constructor(message: string, meta: Omit<CRMErrorMeta, "retryable">) {
        super(message, { ...meta, retryable: false });
        this.name = "CRMAuthError";
    }
}

export class CRMRateLimitError extends CRMError {
    constructor(message: string, meta: Omit<CRMErrorMeta, "retryable">) {
        super(message, { ...meta, retryable: true });
        this.name = "CRMRateLimitError";
    }
}

export class CRMTransientError extends CRMError {
    constructor(message: string, meta: Omit<CRMErrorMeta, "retryable">) {
        super(message, { ...meta, retryable: true });
        this.name = "CRMTransientError";
    }
}

export class CRMValidationError extends CRMError {
    constructor(message: string, meta: Omit<CRMErrorMeta, "retryable">) {
        super(message, { ...meta, retryable: false });
        this.name = "CRMValidationError";
    }
}

export class CRMNotFoundError extends CRMError {
    constructor(message: string, meta: Omit<CRMErrorMeta, "retryable">) {
        super(message, { ...meta, retryable: false });
        this.name = "CRMNotFoundError";
    }
}

export function isCRMError(err: unknown): err is CRMError {
    return err instanceof CRMError;
}
