// @vitest-environment node
import { describe, it, expect } from "vitest";
import { parseWebhookEvent, verifyWebhookSignature } from "./rest";

describe("pipedrive.parseWebhookEvent", () => {
    it("parses person.updated event", async () => {
        const raw = JSON.stringify({
            event: "updated.person",
            meta: {
                id: 42,
                action: "updated",
                object: "person",
                company_id: 7,
                timestamp: 1700000000,
            },
            current: { id: 42 },
            previous: { id: 42 },
        });
        const out = await parseWebhookEvent({ rawBody: raw, headers: {} });
        expect(out).toHaveLength(1);
        expect(out[0].entityType).toBe("contact");
        expect(out[0].entityExternalId).toBe("42");
        expect(out[0].remoteAccountId).toBe("7");
        expect(out[0].eventKey).toContain("pipedrive:person:42:updated");
    });

    it("parses deal.added event", async () => {
        const raw = JSON.stringify({
            event: "added.deal",
            meta: { action: "added", object: "deal", timestamp: 1700000001 },
            current: { id: 99 },
        });
        const out = await parseWebhookEvent({ rawBody: raw, headers: {} });
        expect(out[0].entityType).toBe("deal");
        expect(out[0].entityExternalId).toBe("99");
    });

    it("returns empty array on invalid JSON", async () => {
        const out = await parseWebhookEvent({ rawBody: "not json", headers: {} });
        expect(out).toEqual([]);
    });

    it("returns empty array when id is missing", async () => {
        const raw = JSON.stringify({
            event: "updated.person",
            meta: { action: "updated", object: "person" },
        });
        const out = await parseWebhookEvent({ rawBody: raw, headers: {} });
        expect(out).toEqual([]);
    });
});

describe("pipedrive.verifyWebhookSignature (Basic auth)", () => {
    it("accepts valid basic auth header", async () => {
        const secret = "user:password";
        const expected = `Basic ${btoa(secret)}`;
        const ok = await verifyWebhookSignature({
            rawBody: "{}",
            headers: { authorization: expected },
            secret,
        });
        expect(ok).toBe(true);
    });

    it("rejects mismatched basic auth header", async () => {
        const ok = await verifyWebhookSignature({
            rawBody: "{}",
            headers: { authorization: "Basic d3Jvbmc6d3Jvbmc=" },
            secret: "user:password",
        });
        expect(ok).toBe(false);
    });

    it("rejects missing header", async () => {
        const ok = await verifyWebhookSignature({
            rawBody: "{}",
            headers: {},
            secret: "user:password",
        });
        expect(ok).toBe(false);
    });
});
