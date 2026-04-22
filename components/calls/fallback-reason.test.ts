import { describe, it, expect } from 'vitest';
import { resolveFallbackReason } from './fallback-reason';
import { mapCallError } from './call-error-messages';

// Regression target: the fallback timer in CallNotificationProvider used to
// unconditionally call setError(mapCallError(null)) after 5s. When the real
// Meta reason (e.g. "CPR failed: 401 - code 190") happened to land in the
// same React batch, the generic error won and the user saw "L'appel a
// echoue" instead of "Votre connexion WhatsApp a expire" + a Reconnecter
// WhatsApp button. These tests lock the race-resolution contract.

describe('resolveFallbackReason()', () => {
    it('returns null when the tracked snapshot has not resolved yet', () => {
        expect(resolveFallbackReason(null)).toBeNull();
        expect(resolveFallbackReason(undefined)).toBeNull();
    });

    it('returns null when the status is non-terminal (still pending)', () => {
        expect(
            resolveFallbackReason({ status: 'REQUESTING_PERMISSION', terminationReason: null }),
        ).toBeNull();
        expect(
            resolveFallbackReason({ status: 'PERMISSION_GRANTED', terminationReason: null }),
        ).toBeNull();
        expect(
            resolveFallbackReason({ status: 'RINGING', terminationReason: 'ignored' }),
        ).toBeNull();
    });

    it('returns the terminationReason when the status is FAILED', () => {
        const reason = `CPR failed: 401 - {"error":{"message":"Authentication Error","code":190,"type":"OAuthException"}}`;
        expect(
            resolveFallbackReason({ status: 'FAILED', terminationReason: reason }),
        ).toBe(reason);
    });

    it('returns the terminationReason for TERMINATED / REJECTED / MISSED', () => {
        expect(
            resolveFallbackReason({ status: 'TERMINATED', terminationReason: 'agent_hangup' }),
        ).toBe('agent_hangup');
        expect(
            resolveFallbackReason({ status: 'REJECTED', terminationReason: 'rejected' }),
        ).toBe('rejected');
        expect(
            resolveFallbackReason({ status: 'MISSED', terminationReason: 'missed' }),
        ).toBe('missed');
    });

    it('returns null when the terminal status has no terminationReason', () => {
        expect(resolveFallbackReason({ status: 'FAILED' })).toBeNull();
        expect(
            resolveFallbackReason({ status: 'FAILED', terminationReason: null }),
        ).toBeNull();
    });

    // End-to-end: the resolved reason, piped through mapCallError, must
    // produce the reconnect-whatsapp action for a token-expired payload.
    it('composed with mapCallError -> reconnect-whatsapp for code 190 payload', () => {
        const tracked = {
            status: 'FAILED',
            terminationReason: `CPR failed: 401 - {"error":{"message":"Authentication Error","code":190,"type":"OAuthException","fbtrace_id":"Abc123"}}`,
        };
        const reason = resolveFallbackReason(tracked);
        const mapped = mapCallError(reason);
        expect(mapped.action).toEqual({ type: 'reconnect-whatsapp' });
    });

    // End-to-end: a pending (non-terminal) tracked snapshot yields the
    // generic retry message (not a specific one) — correct behavior.
    it('composed with mapCallError -> retry fallback when tracked is pending', () => {
        const tracked = { status: 'REQUESTING_PERMISSION', terminationReason: null };
        const reason = resolveFallbackReason(tracked);
        const mapped = mapCallError(reason);
        expect(mapped.action).toEqual({ type: 'retry' });
    });
});
