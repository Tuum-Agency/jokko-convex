import { describe, it, expect } from 'vitest';
import {
    isTokenExpiredReason,
    findChannelsWithTokenError,
    DEFAULT_TOKEN_ERROR_WINDOW_MS,
    type CallForHealthCheck,
} from './channel-health';

// Regression target: getChannelStatus reports OK (Meta's read-scope health
// probe passes) but calling-specific scopes are missing. The agent then sees
// "Quality GREEN + CONNECTED" in settings while outbound calls fail with
// 401 code 190. These tests lock in the fallback detection path that reads
// the real signal from the calls history.

describe('isTokenExpiredReason()', () => {
    it('returns false for null / undefined / empty', () => {
        expect(isTokenExpiredReason(null)).toBe(false);
        expect(isTokenExpiredReason(undefined)).toBe(false);
        expect(isTokenExpiredReason('')).toBe(false);
    });

    it('detects exact Meta 401 CPR payload (code 190)', () => {
        const raw = `CPR failed: 401 - {"error":{"message":"Authentication Error","code":190,"type":"OAuthException","fbtrace_id":"Abc123"}}`;
        expect(isTokenExpiredReason(raw)).toBe(true);
    });

    it('detects exact Meta 401 outbound offer payload', () => {
        const raw = `Outbound offer failed: Error: Meta API error: 401 - {"error":{"message":"Authentication Error","code":190,"type":"OAuthException"}}`;
        expect(isTokenExpiredReason(raw)).toBe(true);
    });

    it('detects the human-readable (#190) form', () => {
        expect(isTokenExpiredReason('Error validating access token (#190)')).toBe(true);
    });

    it('detects "access token has expired"', () => {
        expect(isTokenExpiredReason('The access token has expired.')).toBe(true);
    });

    it('detects "session has been invalidated"', () => {
        expect(isTokenExpiredReason('Session has been invalidated')).toBe(true);
    });

    it('is case-insensitive for OAuthException', () => {
        expect(isTokenExpiredReason('OAUTHEXCEPTION thrown')).toBe(true);
    });

    it('returns false for unrelated errors', () => {
        expect(isTokenExpiredReason('agent_hangup')).toBe(false);
        expect(isTokenExpiredReason('call rejected by user')).toBe(false);
        expect(isTokenExpiredReason('ICE connection failed')).toBe(false);
    });
});

describe('findChannelsWithTokenError()', () => {
    const now = 1_000_000_000_000; // deterministic
    const ch1 = 'channel_1';
    const ch2 = 'channel_2';

    function mkCall(overrides: Partial<CallForHealthCheck>): CallForHealthCheck {
        return {
            whatsappChannelId: ch1,
            status: 'FAILED',
            terminationReason:
                `CPR failed: 401 - {"error":{"message":"Authentication Error","code":190,"type":"OAuthException"}}`,
            updatedAt: now - 60_000,
            ...overrides,
        };
    }

    it('returns empty array when no calls', () => {
        expect(findChannelsWithTokenError([], now)).toEqual([]);
    });

    it('returns empty array when no calls match (no FAILED)', () => {
        const calls = [mkCall({ status: 'TERMINATED' })];
        expect(findChannelsWithTokenError(calls, now)).toEqual([]);
    });

    it('returns empty array when reason is not token-related', () => {
        const calls = [mkCall({ terminationReason: 'agent_hangup' })];
        expect(findChannelsWithTokenError(calls, now)).toEqual([]);
    });

    it('returns empty array when channel id is missing', () => {
        const calls = [mkCall({ whatsappChannelId: null })];
        expect(findChannelsWithTokenError(calls, now)).toEqual([]);
    });

    it('returns empty array when the last error is older than the window', () => {
        const calls = [
            mkCall({ updatedAt: now - DEFAULT_TOKEN_ERROR_WINDOW_MS - 1 }),
        ];
        expect(findChannelsWithTokenError(calls, now)).toEqual([]);
    });

    it('returns one entry per channel with matching FAILED call', () => {
        const calls = [mkCall({})];
        const result = findChannelsWithTokenError(calls, now);
        expect(result).toHaveLength(1);
        expect(result[0].channelId).toBe(ch1);
        expect(result[0].reason).toContain('"code":190');
    });

    it('dedupes multiple failing calls for the same channel, keeping the most recent', () => {
        const calls = [
            mkCall({ updatedAt: now - 600_000 }),
            mkCall({ updatedAt: now - 60_000 }),
            mkCall({ updatedAt: now - 6_000_000 }),
        ];
        const result = findChannelsWithTokenError(calls, now);
        expect(result).toHaveLength(1);
        expect(result[0].lastErrorAt).toBe(now - 60_000);
    });

    it('returns one entry per distinct channel', () => {
        const calls = [
            mkCall({ whatsappChannelId: ch1 }),
            mkCall({ whatsappChannelId: ch2, updatedAt: now - 10_000 }),
        ];
        const result = findChannelsWithTokenError(calls, now);
        expect(result).toHaveLength(2);
        const ids = result.map((r) => r.channelId).sort();
        expect(ids).toEqual([ch1, ch2]);
    });

    it('does not flag a channel when a non-token FAILED call is the only match', () => {
        const calls = [mkCall({ terminationReason: 'ICE failed' })];
        expect(findChannelsWithTokenError(calls, now)).toEqual([]);
    });

    it('respects a custom window', () => {
        const calls = [mkCall({ updatedAt: now - 20_000 })];
        // Custom window of 10s — the call is 20s old, so it should be excluded.
        expect(findChannelsWithTokenError(calls, now, 10_000)).toEqual([]);
        // Custom window of 30s — the call fits.
        expect(findChannelsWithTokenError(calls, now, 30_000)).toHaveLength(1);
    });
});
