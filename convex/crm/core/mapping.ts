/**
 * E.164 phone normalization. Condition P0 C3.
 * No silent fallback. Pure functions, no Convex imports.
 */

import { parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js";

export type NormalizeReason = "empty" | "unparseable" | "invalid" | "no_country";

export type NormalizeResult =
    | {
        ok: true;
        e164: string;
        countryCode: CountryCode;
        nationalNumber: string;
    }
    | { ok: false; reason: NormalizeReason };

export function normalizeToE164(
    input: string | undefined | null,
    defaultCountry?: CountryCode
): NormalizeResult {
    if (!input || typeof input !== "string") {
        return { ok: false, reason: "empty" };
    }
    const trimmed = input.trim();
    if (trimmed.length === 0) {
        return { ok: false, reason: "empty" };
    }

    const hasPlus = trimmed.startsWith("+");
    const parsed = parsePhoneNumberFromString(
        trimmed,
        hasPlus ? undefined : defaultCountry
    );

    if (!parsed) {
        if (!hasPlus && !defaultCountry) {
            return { ok: false, reason: "no_country" };
        }
        return { ok: false, reason: "unparseable" };
    }

    if (!parsed.isValid()) {
        return { ok: false, reason: "invalid" };
    }

    return {
        ok: true,
        e164: parsed.number,
        countryCode: parsed.country as CountryCode,
        nationalNumber: parsed.nationalNumber,
    };
}

export function selectBestPhone(
    phones: Array<{ raw: string; type?: string }>,
    defaultCountry?: CountryCode
): NormalizeResult & { rawIndex?: number } {
    if (!phones || phones.length === 0) return { ok: false, reason: "empty" };

    const priority = (t?: string): number => {
        const lower = (t || "").toLowerCase();
        if (lower.includes("mobile") || lower.includes("cell")) return 0;
        if (lower.includes("whatsapp")) return 1;
        if (lower === "" || lower === "primary") return 2;
        return 3;
    };

    const sorted = phones
        .map((p, i) => ({ p, i }))
        .sort((a, b) => priority(a.p.type) - priority(b.p.type));

    for (const { p, i } of sorted) {
        const r = normalizeToE164(p.raw, defaultCountry);
        if (r.ok) return { ...r, rawIndex: i };
    }

    return { ok: false, reason: "invalid" };
}

export function fullNameFrom(parts: {
    firstName?: string;
    lastName?: string;
    fullName?: string;
}): string {
    if (parts.fullName && parts.fullName.trim()) return parts.fullName.trim();
    const joined = [parts.firstName, parts.lastName].filter(Boolean).join(" ").trim();
    return joined || "Contact";
}
