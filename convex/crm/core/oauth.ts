/**
 * OAuth2 helpers: HMAC-signed state, PKCE challenge/verifier, redirect URI builder.
 * Uses Web Crypto API — compatible with Convex default runtime (no "use node").
 *
 * Condition P0 C1: no token fragments touch logs — helpers return opaque strings.
 */

const STATE_SEP = ".";

function toBase64Url(buf: ArrayBuffer | Uint8Array): string {
    const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
    let bin = "";
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): Uint8Array {
    const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (s.length % 4)) % 4);
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
}

function getStateSecret(): string {
    const secret = process.env.OAUTH_STATE_HMAC_SECRET;
    if (!secret || secret.length < 32) {
        throw new Error(
            "OAUTH_STATE_HMAC_SECRET must be set to a 32+ char secret",
        );
    }
    return secret;
}

async function hmacSha256(secret: string, data: string): Promise<string> {
    const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign", "verify"],
    );
    const sig = await crypto.subtle.sign(
        "HMAC",
        key,
        new TextEncoder().encode(data),
    );
    return toBase64Url(sig);
}

export interface OAuthStatePayload {
    nonce: string;
    provider: string;
    organizationId: string;
    userId: string;
    createdAtMs: number;
}

/**
 * Builds a signed state string: base64url(payload).base64url(hmac).
 * Verified later by verifyState(). The state is opaque to the provider.
 */
export async function signState(payload: OAuthStatePayload): Promise<string> {
    const json = JSON.stringify(payload);
    const encoded = toBase64Url(new TextEncoder().encode(json));
    const sig = await hmacSha256(getStateSecret(), encoded);
    return `${encoded}${STATE_SEP}${sig}`;
}

export async function verifyState(
    state: string,
): Promise<OAuthStatePayload | null> {
    if (!state.includes(STATE_SEP)) return null;
    const [encoded, sig] = state.split(STATE_SEP);
    if (!encoded || !sig) return null;
    const expected = await hmacSha256(getStateSecret(), encoded);
    if (expected.length !== sig.length) return null;

    let diff = 0;
    for (let i = 0; i < expected.length; i++) {
        diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
    }
    if (diff !== 0) return null;

    try {
        const json = new TextDecoder().decode(fromBase64Url(encoded));
        const parsed = JSON.parse(json) as OAuthStatePayload;
        if (
            typeof parsed.nonce !== "string" ||
            typeof parsed.provider !== "string" ||
            typeof parsed.organizationId !== "string" ||
            typeof parsed.userId !== "string" ||
            typeof parsed.createdAtMs !== "number"
        ) {
            return null;
        }
        return parsed;
    } catch {
        return null;
    }
}

/**
 * PKCE helpers — RFC 7636.
 * Generates a cryptographically random verifier (43+ chars) and its SHA-256 challenge.
 */
export function generatePkceVerifier(): string {
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    return toBase64Url(bytes);
}

export async function pkceChallengeFromVerifier(verifier: string): Promise<string> {
    const digest = await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(verifier),
    );
    return toBase64Url(digest);
}

export function generateNonce(): string {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    return toBase64Url(bytes);
}
