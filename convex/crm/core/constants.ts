/**
 * Centralized operational thresholds. All magic numbers live here.
 */

export const CIRCUIT_BREAKER = {
    CONSECUTIVE_ERRORS_TO_OPEN: 5,
    HALF_OPEN_AFTER_MS: 60_000,
    HALF_OPEN_PROBE_COUNT: 1,
} as const;

export const DLQ = {
    MAX_ATTEMPTS: 6,
    BACKOFF_BASE_MS: 30_000,
    BACKOFF_MAX_MS: 3_600_000,
    DLQ_THRESHOLD_COUNT: 100,
} as const;

export const CONFLICT = {
    HIGH_CONFLICT_PER_24H: 20,
} as const;

export const OAUTH = {
    STATE_TTL_MS: 10 * 60_000,
    REFRESH_LEEWAY_MS: 10 * 60_000,
    REFRESH_LOCK_TTL_MS: 90_000,
    REFRESH_BATCH_DEFAULT: 50,
} as const;

export const WEBHOOK = {
    DEFERRED_TTL_MS: 48 * 3_600_000,
    RESYNC_WINDOW_MS: 7 * 86_400_000,
    RAW_BODY_TTL_MS: 24 * 3_600_000,
    RECEIPT_RETENTION_MS: 30 * 86_400_000,
} as const;

export const RETENTION = {
    WEBHOOK_RECEIPTS_MS: 30 * 86_400_000,
    QUEUE_SUCCEEDED_MS: 7 * 86_400_000,
    QUEUE_DEADLETTER_MS: 30 * 86_400_000,
    AUDIT_LOG_MS: 90 * 86_400_000,
    OAUTH_ATTEMPTS_MS: 3_600_000,
    RETENTION_BATCH_SIZE: 500,
} as const;

export const IMPORT = {
    HEARTBEAT_TTL_MS: 5 * 60_000,
    PAGE_SIZE_STANDARD: 100,
    PAGE_SIZE_LARGE: 500,
} as const;

export const POLL = {
    INTERVAL_STANDARD_MS: 10 * 60_000,
    INTERVAL_LARGE_MS: 3 * 60_000,
    JITTER_MAX_MS: 30_000,
} as const;

export const SLO = {
    WEBHOOK_ACK_P95_MS: 2_000,
    PUSH_E2E_P95_MS: 30_000,
    STALENESS_WEBHOOK_P95_MS: 5 * 60_000,
    STALENESS_POLL_STANDARD_P95_MS: 15 * 60_000,
    UPTIME_TARGET: 0.995,
} as const;

export const RATE_LIMIT = {
    WARN_PERCENT: 0.5,
    CRITICAL_PERCENT: 0.8,
} as const;
