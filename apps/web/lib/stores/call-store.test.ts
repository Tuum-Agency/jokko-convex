import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useCallStore } from '@/lib/stores/call-store';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Reset store to initial defaults between tests. */
const initialState = {
    activeCallId: null,
    callState: 'idle' as const,
    contactName: null,
    contactPhone: null,
    callDirection: 'INBOUND' as const,
    callStartedAt: null,
    isMuted: false,
    conversationId: null,
    errorMessage: null,
    errorAction: null,
    micStream: null,
};

beforeEach(() => {
    useCallStore.setState(initialState);
});

// ---------------------------------------------------------------------------
// clearCall
// ---------------------------------------------------------------------------

describe('clearCall()', () => {
    it('resets all fields to their defaults and sets micStream to null', () => {
        // Arrange — put the store in a non-default state
        useCallStore.setState({
            callState: 'connected',
            contactName: 'Alice',
            contactPhone: '+33600000000',
            errorMessage: 'some error',
            errorAction: { type: 'retry' },
            isMuted: true,
            callStartedAt: 123456789,
        });

        // Act
        useCallStore.getState().clearCall();

        // Assert
        const state = useCallStore.getState();
        expect(state.activeCallId).toBeNull();
        expect(state.callState).toBe('idle');
        expect(state.contactName).toBeNull();
        expect(state.contactPhone).toBeNull();
        expect(state.callStartedAt).toBeNull();
        expect(state.isMuted).toBe(false);
        expect(state.conversationId).toBeNull();
        expect(state.errorMessage).toBeNull();
        expect(state.errorAction).toBeNull();
        expect(state.micStream).toBeNull();
    });

    it('calls .stop() on each track of micStream before clearing it', () => {
        // Arrange — mock a MediaStream with two tracks
        const stopA = vi.fn();
        const stopB = vi.fn();
        const mockStream = {
            getTracks: () => [{ stop: stopA }, { stop: stopB }],
        } as unknown as MediaStream;

        useCallStore.setState({ micStream: mockStream });

        // Act
        useCallStore.getState().clearCall();

        // Assert
        expect(stopA).toHaveBeenCalledOnce();
        expect(stopB).toHaveBeenCalledOnce();
        expect(useCallStore.getState().micStream).toBeNull();
    });

    it('does not throw when micStream is null', () => {
        // Ensure no micStream is set
        useCallStore.setState({ micStream: null });

        expect(() => useCallStore.getState().clearCall()).not.toThrow();
    });
});

// ---------------------------------------------------------------------------
// setMicStream
// ---------------------------------------------------------------------------

describe('setMicStream()', () => {
    it('stores the provided stream', () => {
        const mockStream = {
            getTracks: () => [],
        } as unknown as MediaStream;

        useCallStore.getState().setMicStream(mockStream);

        expect(useCallStore.getState().micStream).toBe(mockStream);
    });

    it('sets micStream back to null when called with null', () => {
        const mockStream = { getTracks: () => [] } as unknown as MediaStream;
        useCallStore.setState({ micStream: mockStream });

        useCallStore.getState().setMicStream(null);

        expect(useCallStore.getState().micStream).toBeNull();
    });

    // Regression: MicPermissionButton called setMicStream BEFORE clearCall,
    // so clearCall immediately stopped the tracks and nulled the ref we just
    // set. initiateCall then fell back to a second getUserMedia outside the
    // user gesture → NotAllowedError on http:// origins. Locking the ordering
    // contract here: clearCall() → setMicStream(fresh) must preserve fresh.
    it('clearCall() followed by setMicStream(fresh) keeps the fresh stream alive', () => {
        const stopFresh = vi.fn();
        const freshStream = {
            getTracks: () => [{ stop: stopFresh }],
        } as unknown as MediaStream;

        const stopStale = vi.fn();
        const staleStream = {
            getTracks: () => [{ stop: stopStale }],
        } as unknown as MediaStream;

        useCallStore.setState({ micStream: staleStream });

        useCallStore.getState().clearCall();
        useCallStore.getState().setMicStream(freshStream);

        expect(stopStale).toHaveBeenCalledOnce();
        expect(stopFresh).not.toHaveBeenCalled();
        expect(useCallStore.getState().micStream).toBe(freshStream);
    });
});

// ---------------------------------------------------------------------------
// setCallContext
// ---------------------------------------------------------------------------

describe('setCallContext()', () => {
    it('writes contactName, contactPhone, conversationId and callDirection=OUTBOUND', () => {
        const conversationId = 'conv123' as unknown as import('@/convex/_generated/dataModel').Id<'conversations'>;

        useCallStore.getState().setCallContext(
            { name: 'Bob', phone: '+33611223344' },
            conversationId,
        );

        const state = useCallStore.getState();
        expect(state.contactName).toBe('Bob');
        expect(state.contactPhone).toBe('+33611223344');
        expect(state.conversationId).toBe(conversationId);
        expect(state.callDirection).toBe('OUTBOUND');
    });

    it('does not change callState', () => {
        useCallStore.setState({ callState: 'connected' });
        const conversationId = 'conv456' as unknown as import('@/convex/_generated/dataModel').Id<'conversations'>;

        useCallStore.getState().setCallContext({ phone: '+33600000001' }, conversationId);

        expect(useCallStore.getState().callState).toBe('connected');
    });

    it('sets contactName to null when name is omitted', () => {
        const conversationId = 'conv789' as unknown as import('@/convex/_generated/dataModel').Id<'conversations'>;

        useCallStore.getState().setCallContext({ phone: '+33600000002' }, conversationId);

        expect(useCallStore.getState().contactName).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// setError
// ---------------------------------------------------------------------------

describe('setError()', () => {
    it('with a plain string sets errorMessage and errorAction to null', () => {
        useCallStore.getState().setError('Simple error text');

        const state = useCallStore.getState();
        expect(state.callState).toBe('error');
        expect(state.errorMessage).toBe('Simple error text');
        expect(state.errorAction).toBeNull();
    });

    it('with a CallErrorMessage object preserves the action', () => {
        useCallStore.getState().setError({
            message: 'Mic not allowed',
            action: { type: 'mic' },
        });

        const state = useCallStore.getState();
        expect(state.callState).toBe('error');
        expect(state.errorMessage).toBe('Mic not allowed');
        expect(state.errorAction).toEqual({ type: 'mic' });
    });

    it('with a CallErrorMessage whose action is undefined stores null for errorAction', () => {
        useCallStore.getState().setError({ message: 'No action needed' });

        expect(useCallStore.getState().errorAction).toBeNull();
    });

    // Regression: setError() was NOT stopping micStream tracks, leaving the mic
    // device in-use. A subsequent getUserMedia call (e.g. MicPermissionButton retry)
    // would then fail with NotAllowedError: Permission denied even though Chrome
    // had granted mic permission for the site.
    it('stops and nulls a live micStream before entering error state', () => {
        const stopA = vi.fn();
        const stopB = vi.fn();
        const mockStream = {
            getTracks: () => [{ stop: stopA }, { stop: stopB }],
        } as unknown as MediaStream;

        useCallStore.setState({ micStream: mockStream, callState: 'requesting_permission' });

        useCallStore.getState().setError('Something went wrong');

        expect(stopA).toHaveBeenCalledOnce();
        expect(stopB).toHaveBeenCalledOnce();
        expect(useCallStore.getState().micStream).toBeNull();
        expect(useCallStore.getState().callState).toBe('error');
    });

    it('does not throw when micStream is null at the time of error', () => {
        useCallStore.setState({ micStream: null });

        expect(() => useCallStore.getState().setError('Error with no stream')).not.toThrow();
        expect(useCallStore.getState().callState).toBe('error');
    });
});
