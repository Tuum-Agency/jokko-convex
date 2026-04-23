import { create } from 'zustand';
import type { Id } from '@/convex/_generated/dataModel';
import type { CallErrorAction, CallErrorMessage } from '@/components/calls/call-error-messages';

export type CallState =
    | 'idle'
    | 'ringing'
    | 'connecting'
    | 'connected'
    | 'ended'
    | 'requesting_permission'
    | 'permission_granted'
    | 'dialing'
    | 'error';

interface CallStore {
    activeCallId: Id<"calls"> | null;
    callState: CallState;
    contactName: string | null;
    contactPhone: string | null;
    callDirection: 'INBOUND' | 'OUTBOUND';
    callStartedAt: number | null;
    isMuted: boolean;
    conversationId: Id<"conversations"> | null;
    errorMessage: string | null;
    errorAction: CallErrorAction | null;
    /**
     * Pre-acquired MediaStream kept alive from the click handler so that
     * initiateCall (which runs in a useEffect, outside a user gesture) can
     * reuse it without triggering a new getUserMedia prompt.
     * Cleared on clearCall or after it is consumed by initiateCall.
     */
    micStream: MediaStream | null;

    setIncomingCall: (callId: Id<"calls">, contact: { name?: string; phone: string }) => void;
    setOutgoingCall: (callId: Id<"calls">, contact: { name?: string; phone: string }, conversationId: Id<"conversations">) => void;
    setCallContext: (contact: { name?: string; phone: string }, conversationId: Id<"conversations">) => void;
    setCallState: (state: CallState) => void;
    setError: (error: string | CallErrorMessage) => void;
    setMicStream: (stream: MediaStream | null) => void;
    toggleMute: () => void;
    clearCall: () => void;
}

export const useCallStore = create<CallStore>((set) => ({
    activeCallId: null,
    callState: 'idle',
    contactName: null,
    contactPhone: null,
    callDirection: 'INBOUND',
    callStartedAt: null,
    isMuted: false,
    conversationId: null,
    errorMessage: null,
    errorAction: null,
    micStream: null,

    setIncomingCall: (callId, contact) => set({
        activeCallId: callId,
        callState: 'ringing',
        contactName: contact.name || null,
        contactPhone: contact.phone,
        callDirection: 'INBOUND',
        callStartedAt: Date.now(),
        errorMessage: null,
        errorAction: null,
    }),

    setOutgoingCall: (callId, contact, conversationId) => set({
        activeCallId: callId,
        callState: 'requesting_permission',
        contactName: contact.name || null,
        contactPhone: contact.phone,
        callDirection: 'OUTBOUND',
        callStartedAt: Date.now(),
        conversationId,
        errorMessage: null,
        errorAction: null,
    }),

    setCallContext: (contact, conversationId) => set({
        contactName: contact.name || null,
        contactPhone: contact.phone,
        conversationId,
        callDirection: 'OUTBOUND',
    }),

    setCallState: (state) => set({ callState: state, errorMessage: null, errorAction: null }),

    setError: (error) => {
        // Stop any live mic stream before entering error state so that the
        // device is released and a subsequent getUserMedia (e.g. "Autoriser le
        // microphone" retry) is not refused with NotAllowedError because the
        // browser still sees the track as in-use by this tab.
        set((s) => {
            if (s.micStream) {
                s.micStream.getTracks().forEach((t) => t.stop());
            }
            if (typeof error === 'string') {
                return { callState: 'error', errorMessage: error, errorAction: null, micStream: null };
            }
            return { callState: 'error', errorMessage: error.message, errorAction: error.action ?? null, micStream: null };
        });
    },

    setMicStream: (stream) => set({ micStream: stream }),

    toggleMute: () => set((s) => ({ isMuted: !s.isMuted })),

    clearCall: () => set((s) => {
        // Stop and release any pre-acquired mic stream before clearing state.
        if (s.micStream) {
            s.micStream.getTracks().forEach((t) => t.stop());
        }
        return {
            activeCallId: null,
            callState: 'idle',
            contactName: null,
            contactPhone: null,
            callStartedAt: null,
            isMuted: false,
            conversationId: null,
            errorMessage: null,
            errorAction: null,
            micStream: null,
        };
    }),
}));
