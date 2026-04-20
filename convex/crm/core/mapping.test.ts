// @vitest-environment node
/**
 * Tests for E.164 normalization — condition P0 C3.
 * Anti-collision multi-country + no silent fallback.
 */

import { describe, it, expect } from "vitest";
import { normalizeToE164, selectBestPhone, fullNameFrom } from "./mapping";

describe("normalizeToE164", () => {
    it("parses French number with country prefix", () => {
        const r = normalizeToE164("+33612345678");
        expect(r.ok).toBe(true);
        if (r.ok) {
            expect(r.e164).toBe("+33612345678");
            expect(r.countryCode).toBe("FR");
        }
    });

    it("parses French national format with default country", () => {
        const r = normalizeToE164("06 12 34 56 78", "FR");
        expect(r.ok).toBe(true);
        if (r.ok) expect(r.e164).toBe("+33612345678");
    });

    it("returns same E.164 for French national and international formats", () => {
        const a = normalizeToE164("+33612345678");
        const b = normalizeToE164("0612345678", "FR");
        expect(a.ok && b.ok).toBe(true);
        if (a.ok && b.ok) expect(a.e164).toBe(b.e164);
    });

    it("distinguishes +221 (Senegal) from +33 (France)", () => {
        const sen = normalizeToE164("+221771234567");
        const fra = normalizeToE164("+33771234567");
        expect(sen.ok).toBe(true);
        expect(fra.ok).toBe(true);
        if (sen.ok && fra.ok) {
            expect(sen.e164).not.toBe(fra.e164);
            expect(sen.countryCode).toBe("SN");
            expect(fra.countryCode).toBe("FR");
        }
    });

    it("parses Belgian, Swiss, Moroccan, Ivorian numbers", () => {
        const cases = [
            { input: "+32470123456", country: "BE" },
            { input: "+41791234567", country: "CH" },
            { input: "+212612345678", country: "MA" },
            { input: "+2250707070707", country: "CI" },
        ];
        for (const c of cases) {
            const r = normalizeToE164(c.input);
            expect(r.ok, `${c.input} should parse`).toBe(true);
            if (r.ok) expect(r.countryCode).toBe(c.country);
        }
    });

    it("rejects empty / whitespace input", () => {
        expect(normalizeToE164("")).toEqual({ ok: false, reason: "empty" });
        expect(normalizeToE164("   ")).toEqual({ ok: false, reason: "empty" });
        expect(normalizeToE164(undefined)).toEqual({ ok: false, reason: "empty" });
    });

    it("rejects national number without default country", () => {
        const r = normalizeToE164("0612345678");
        expect(r.ok).toBe(false);
        if (!r.ok) expect(r.reason).toBe("no_country");
    });

    it("rejects malformed numbers", () => {
        const r = normalizeToE164("not-a-phone");
        expect(r.ok).toBe(false);
    });

    it("rejects obviously invalid numbers (too short)", () => {
        const r = normalizeToE164("+33123");
        expect(r.ok).toBe(false);
    });

    it("is idempotent on repeated calls", () => {
        const a = normalizeToE164("+33612345678");
        if (!a.ok) throw new Error("expected ok");
        const b = normalizeToE164(a.e164);
        expect(b.ok).toBe(true);
        if (b.ok) expect(b.e164).toBe(a.e164);
    });

    it("fuzz: 20 malformed inputs all rejected safely", () => {
        const inputs = [
            "abc", "+++", "12", "--", "000", "99999999999999999999",
            " ", "+", "phone:", "null", "undefined", "+0123",
            "00000000", "!@#", "+X12345", "9", "  +  ", "+33",
            "++33612345678", "0x33612345678",
        ];
        for (const i of inputs) {
            const r = normalizeToE164(i);
            expect(r.ok, `"${i}" should not parse`).toBe(false);
        }
    });
});

describe("selectBestPhone", () => {
    it("prefers mobile over landline", () => {
        const r = selectBestPhone([
            { raw: "+33142345678", type: "landline" },
            { raw: "+33612345678", type: "mobile" },
        ]);
        expect(r.ok).toBe(true);
        if (r.ok) expect(r.e164).toBe("+33612345678");
    });

    it("returns first ok when no type hints", () => {
        const r = selectBestPhone([{ raw: "+33612345678" }]);
        expect(r.ok).toBe(true);
    });

    it("returns not ok on empty list", () => {
        const r = selectBestPhone([]);
        expect(r.ok).toBe(false);
    });

    it("returns not ok when none parse", () => {
        const r = selectBestPhone([{ raw: "bad" }, { raw: "also bad" }]);
        expect(r.ok).toBe(false);
    });
});

describe("fullNameFrom", () => {
    it("prefers fullName when provided", () => {
        expect(fullNameFrom({ fullName: "Jean Dupont" })).toBe("Jean Dupont");
    });
    it("concatenates first+last otherwise", () => {
        expect(fullNameFrom({ firstName: "Jean", lastName: "Dupont" })).toBe(
            "Jean Dupont",
        );
    });
    it("handles missing parts", () => {
        expect(fullNameFrom({ firstName: "Jean" })).toBe("Jean");
        expect(fullNameFrom({})).toBe("Contact");
    });
});
