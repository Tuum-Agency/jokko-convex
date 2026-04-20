// @vitest-environment node
/**
 * Tests for sanitizeError — condition P0 C1.
 * Ensures no token fragments leak through logs / DLQ / audit.
 */

import { describe, it, expect } from "vitest";
import { sanitizeError, sanitizeMetadata } from "./logger";

describe("sanitizeError", () => {
    it("masks Bearer tokens in plain strings", () => {
        const out = sanitizeError(
            "Request failed: Authorization: Bearer sk_live_abc123xyz456def",
        );
        expect(out.message).not.toContain("sk_live_abc123xyz456def");
        expect(out.message).toContain("Bearer ***");
    });

    it("masks access_token inside OAuth error body strings", () => {
        const out = sanitizeError(
            'oauth error {"access_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.abc"}',
        );
        expect(out.message).not.toContain("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9");
        expect(out.message).toContain("access_token=***");
    });

    it("masks refresh_token key/value pairs", () => {
        const out = sanitizeError(
            "grant_type=refresh_token&refresh_token=rft_abcdef123456",
        );
        expect(out.message).not.toContain("rft_abcdef123456");
    });

    it("masks api_key and client_secret", () => {
        const out = sanitizeError(
            "api_key=xyz_9876543210 client_secret=secret_value_long_enough",
        );
        expect(out.message).not.toContain("xyz_9876543210");
        expect(out.message).not.toContain("secret_value_long_enough");
    });

    it("masks OAuth code query parameter", () => {
        const out = sanitizeError(
            "Callback URL: https://app.jokko.co/callback?code=abc123def456ghi&state=xyz",
        );
        expect(out.message).not.toContain("abc123def456ghi");
        expect(out.message).toContain("code=***");
    });

    it("preserves statusCode from Error meta", () => {
        const err: Error & { statusCode?: number; code?: string } = new Error(
            "Forbidden",
        );
        err.statusCode = 403;
        err.code = "HUBSPOT_403";
        const out = sanitizeError(err);
        expect(out.statusCode).toBe(403);
        expect(out.code).toBe("HUBSPOT_403");
        expect(out.message).toBe("Forbidden");
    });

    it("handles null/undefined gracefully", () => {
        expect(sanitizeError(null).message).toBe("unknown error");
        expect(sanitizeError(undefined).message).toBe("unknown error");
    });

    it("truncates long payloads to 500 chars", () => {
        const huge = { message: "x".repeat(5_000) };
        const out = sanitizeError(huge);
        expect(out.message.length).toBeLessThanOrEqual(500);
    });

    it("masks sensitive object keys recursively", () => {
        const input = {
            message: "validation failed",
            headers: {
                authorization: "Bearer shh_do_not_leak",
                cookie: "session=leakable",
            },
            body: {
                access_token: "eyJ.real.token",
                nested: { refresh_token: "rt_123456789" },
            },
        };
        const out = sanitizeError(input);
        const json = JSON.stringify(out);
        expect(json).not.toContain("shh_do_not_leak");
        expect(json).not.toContain("eyJ.real.token");
        expect(json).not.toContain("rt_123456789");
    });

    it("keeps provider context when supplied", () => {
        const out = sanitizeError("generic boom", { provider: "hubspot" });
        expect(out.provider).toBe("hubspot");
    });
});

describe("sanitizeMetadata", () => {
    it("masks top-level sensitive keys", () => {
        const out = sanitizeMetadata({
            ok: true,
            apiKey: "k_actual_secret",
            nested: { clientSecret: "s_actual_secret" },
        });
        const json = JSON.stringify(out);
        expect(json).not.toContain("k_actual_secret");
        expect(json).not.toContain("s_actual_secret");
    });

    it("preserves non-sensitive structure", () => {
        const out = sanitizeMetadata({
            connectionId: "conn_123",
            provider: "hubspot",
            contactCount: 42,
        });
        expect(out.connectionId).toBe("conn_123");
        expect(out.contactCount).toBe(42);
    });
});
