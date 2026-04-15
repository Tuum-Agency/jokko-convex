/**
 * AES-256-GCM encryption/decryption for sensitive tokens stored at-rest.
 * Uses Web Crypto API (available in Convex edge runtime).
 *
 * Format: base64(iv):base64(ciphertext+tag)
 * Graceful fallback: if input doesn't match encrypted format, returns as-is (for migration).
 */

const ALGORITHM = "AES-GCM";
const IV_LENGTH = 12; // 96-bit IV for AES-GCM
const ENCRYPTED_SEPARATOR = ":";

function hexToBytes(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
    }
    return bytes;
}

function toBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

function fromBase64(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

let _cachedKey: CryptoKey | null = null;

async function getEncryptionKey(): Promise<CryptoKey> {
    if (_cachedKey) return _cachedKey;

    const keyHex = process.env.ENCRYPTION_KEY;
    if (!keyHex || keyHex.length !== 64) {
        throw new Error("ENCRYPTION_KEY env var must be a 64-character hex string (32 bytes)");
    }

    const keyBytes = hexToBytes(keyHex);
    _cachedKey = await crypto.subtle.importKey(
        "raw",
        keyBytes.buffer as ArrayBuffer,
        { name: ALGORITHM },
        false,
        ["encrypt", "decrypt"]
    );
    return _cachedKey;
}

function isEncrypted(value: string): boolean {
    if (!value.includes(ENCRYPTED_SEPARATOR)) return false;
    const parts = value.split(ENCRYPTED_SEPARATOR);
    if (parts.length !== 2) return false;
    try {
        fromBase64(parts[0]);
        fromBase64(parts[1]);
        return true;
    } catch {
        return false;
    }
}

export async function encrypt(plaintext: string): Promise<string> {
    const key = await getEncryptionKey();
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    const encoder = new TextEncoder();
    const encoded = encoder.encode(plaintext);

    const ciphertext = await crypto.subtle.encrypt(
        { name: ALGORITHM, iv: iv.buffer as ArrayBuffer },
        key,
        encoded
    );

    return `${toBase64(iv.buffer)}${ENCRYPTED_SEPARATOR}${toBase64(ciphertext)}`;
}

export async function decrypt(encrypted: string): Promise<string> {
    // Graceful fallback: if not in encrypted format, return as-is (plaintext token)
    if (!isEncrypted(encrypted)) {
        return encrypted;
    }

    const key = await getEncryptionKey();
    const [ivBase64, ciphertextBase64] = encrypted.split(ENCRYPTED_SEPARATOR);
    const iv = fromBase64(ivBase64);
    const ciphertext = fromBase64(ciphertextBase64);

    const decrypted = await crypto.subtle.decrypt(
        { name: ALGORITHM, iv: iv.buffer as ArrayBuffer },
        key,
        ciphertext.buffer as ArrayBuffer
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
}
