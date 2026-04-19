// @vitest-environment node
import { describe, it, expect } from "vitest";
import { parseWebhookEvent, verifyWebhookSignature } from "./rest";

describe("axonaut.parseWebhookEvent", () => {
    it("parses employee event", async () => {
        const raw = JSON.stringify({
            event: "created",
            event_id: "evt-123",
            entity: "employee",
            entity_id: 42,
            occurred_at: 1700000000,
        });
        const out = await parseWebhookEvent({ rawBody: raw, headers: {} });
        expect(out).toHaveLength(1);
        expect(out[0].entityType).toBe("contact");
        expect(out[0].entityExternalId).toBe("42");
        expect(out[0].eventKey).toBe("axonaut:evt-123");
    });

    it("parses opportunity event", async () => {
        const raw = JSON.stringify({
            event: "updated",
            entity: "opportunity",
            entity_id: 99,
        });
        const out = await parseWebhookEvent({ rawBody: raw, headers: {} });
        expect(out[0].entityType).toBe("deal");
        expect(out[0].entityExternalId).toBe("99");
        expect(out[0].eventKey).toContain("axonaut:updated:99:");
    });

    it("returns empty on invalid JSON", async () => {
        const out = await parseWebhookEvent({ rawBody: "nope", headers: {} });
        expect(out).toEqual([]);
    });

    it("returns empty when entity_id missing", async () => {
        const raw = JSON.stringify({ event: "created", entity: "employee" });
        const out = await parseWebhookEvent({ rawBody: raw, headers: {} });
        expect(out).toEqual([]);
    });
});

describe("axonaut.verifyWebhookSignature", () => {
    it("accepts matching shared token", async () => {
        const ok = await verifyWebhookSignature({
            rawBody: "{}",
            headers: { "x-axonaut-token": "s3cret" },
            secret: "s3cret",
        });
        expect(ok).toBe(true);
    });

    it("rejects mismatched token", async () => {
        const ok = await verifyWebhookSignature({
            rawBody: "{}",
            headers: { "x-axonaut-token": "wrong" },
            secret: "s3cret",
        });
        expect(ok).toBe(false);
    });

    it("rejects missing header", async () => {
        const ok = await verifyWebhookSignature({
            rawBody: "{}",
            headers: {},
            secret: "s3cret",
        });
        expect(ok).toBe(false);
    });
});
