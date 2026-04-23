import { describe, it, expect } from 'vitest';
import { mapCallError, mapCallErrorMessage } from '@/components/calls/call-error-messages';

// ---------------------------------------------------------------------------
// mapCallError — browser / WebRTC errors
// ---------------------------------------------------------------------------

describe('mapCallError() — browser / WebRTC errors', () => {
    it('NotAllowedError -> message FR + action {type: "mic"}', () => {
        const result = mapCallError('NotAllowedError');
        expect(result.action).toEqual({ type: 'mic' });
        expect(typeof result.message).toBe('string');
        expect(result.message.length).toBeGreaterThan(0);
    });

    it('case-insensitive match on NotAllowedError', () => {
        const result = mapCallError('notallowederror: The request is not allowed');
        expect(result.action).toEqual({ type: 'mic' });
    });

    it('"permission dismissed" also maps to mic action', () => {
        const result = mapCallError('permission dismissed by user');
        expect(result.action).toEqual({ type: 'mic' });
    });
});

// ---------------------------------------------------------------------------
// mapCallError — Meta OAuth errors (code 190)
// ---------------------------------------------------------------------------

describe('mapCallError() — Meta OAuth / token errors', () => {
    it('"OAuthException code:190" -> action {type: "reconnect-whatsapp"}', () => {
        const result = mapCallError('OAuthException code:190');
        expect(result.action).toEqual({ type: 'reconnect-whatsapp' });
    });

    it('"invalid oauth access token" -> reconnect-whatsapp', () => {
        const result = mapCallError('invalid oauth access token');
        expect(result.action).toEqual({ type: 'reconnect-whatsapp' });
    });

    it('"access token has expired" -> reconnect-whatsapp', () => {
        const result = mapCallError('access token has expired');
        expect(result.action).toEqual({ type: 'reconnect-whatsapp' });
    });

    it('exact Meta 401 payload as stored by backend -> reconnect-whatsapp', () => {
        // This is the literal terminationReason written by
        // convex/call_actions.ts::sendCallPermissionRequest when Meta returns
        // 401 for an expired token. The UI flow depends on this mapping.
        const raw = `CPR failed: 401 - {"error":{"message":"Authentication Error","code":190,"type":"OAuthException","fbtrace_id":"Ab12CdEf"}}`;
        const result = mapCallError(raw);
        expect(result.action).toEqual({ type: 'reconnect-whatsapp' });
        expect(result.message).toMatch(/connexion whatsapp/i);
    });

    it('exact Meta 401 payload for outbound offer -> reconnect-whatsapp', () => {
        // Same shape, different prefix (sendOutboundCallOffer path).
        const raw = `Outbound offer failed: Error: Meta API error: 401 - {"error":{"message":"Authentication Error","code":190,"type":"OAuthException","fbtrace_id":"Ab12CdEf"}}`;
        const result = mapCallError(raw);
        expect(result.action).toEqual({ type: 'reconnect-whatsapp' });
    });
});

// ---------------------------------------------------------------------------
// mapCallError — 24h messaging window (131047 / re-engagement)
// ---------------------------------------------------------------------------

describe('mapCallError() — 24h messaging window', () => {
    it('"131047 re-engagement" -> action {type: "send-template"}', () => {
        const result = mapCallError('131047 re-engagement required');
        expect(result.action).toEqual({ type: 'send-template' });
    });

    it('"131050" alone -> send-template', () => {
        const result = mapCallError('error 131050');
        expect(result.action).toEqual({ type: 'send-template' });
    });

    it('"outside of the allowed window" -> send-template', () => {
        const result = mapCallError('Message failed: outside of the allowed window');
        expect(result.action).toEqual({ type: 'send-template' });
    });
});

// ---------------------------------------------------------------------------
// mapCallError — billing (131044)
// ---------------------------------------------------------------------------

describe('mapCallError() — billing errors', () => {
    it('"131044 billing" -> action {type: "external"} pointing to Meta Business', () => {
        const result = mapCallError('131044 billing issue');
        expect(result.action).toEqual({
            type: 'external',
            href: 'https://business.facebook.com/',
            label: expect.any(String),
        });
    });

    it('"payment" keyword -> external Meta Business action', () => {
        const result = mapCallError('payment required');
        expect(result.action).toEqual(
            expect.objectContaining({ type: 'external', href: 'https://business.facebook.com/' }),
        );
    });
});

// ---------------------------------------------------------------------------
// mapCallError — null / undefined fallback
// ---------------------------------------------------------------------------

describe('mapCallError() — null / undefined fallback', () => {
    it('null -> action {type: "retry"}', () => {
        const result = mapCallError(null);
        expect(result.action).toEqual({ type: 'retry' });
        expect(typeof result.message).toBe('string');
        expect(result.message.length).toBeGreaterThan(0);
    });

    it('undefined -> action {type: "retry"}', () => {
        const result = mapCallError(undefined);
        expect(result.action).toEqual({ type: 'retry' });
    });

    it('empty string -> action {type: "retry"}', () => {
        const result = mapCallError('');
        expect(result.action).toEqual({ type: 'retry' });
    });
});

// ---------------------------------------------------------------------------
// mapCallError — unknown / generic reason
// ---------------------------------------------------------------------------

describe('mapCallError() — unknown / generic errors', () => {
    it('unknown backend error -> fallback message contains raw reason + action retry', () => {
        const raw = 'some unknown backend error XYZ-999';
        const result = mapCallError(raw);
        expect(result.action).toEqual({ type: 'retry' });
        // The raw reason (or a truncated version) should appear in the message
        expect(result.message).toContain('XYZ-999');
    });

    it('long reason is truncated to 160 chars in the fallback message', () => {
        const longReason = 'x'.repeat(200);
        const result = mapCallError(longReason);
        // Message should include the 160-char truncated form followed by "..."
        expect(result.message).toContain('...');
        // The raw portion embedded must not exceed 160 chars before the ellipsis
        const embedded = result.message.replace(/^.*?: /, '');
        expect(embedded.length).toBeLessThanOrEqual(163); // 160 + "..."
    });
});

// ---------------------------------------------------------------------------
// mapCallErrorMessage — string-only convenience wrapper
// ---------------------------------------------------------------------------

describe('mapCallErrorMessage()', () => {
    it('returns the string message for NotAllowedError', () => {
        const msg = mapCallErrorMessage('NotAllowedError');
        expect(typeof msg).toBe('string');
        expect(msg.length).toBeGreaterThan(0);
        // Must be exactly the same as what mapCallError returns
        expect(msg).toBe(mapCallError('NotAllowedError').message);
    });

    it('returns the string message for null', () => {
        const msg = mapCallErrorMessage(null);
        expect(typeof msg).toBe('string');
        expect(msg).toBe(mapCallError(null).message);
    });
});
