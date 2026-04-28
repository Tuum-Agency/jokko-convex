'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useEffect, useRef } from 'react';
import { useCurrentOrg } from '@/hooks/use-current-org';
import { useCallStore } from '@/lib/stores/call-store';
import { useWebRTCCall } from '@/hooks/use-webrtc-call';
import { IncomingCallDialog } from './incoming-call-dialog';
import { ActiveCallBar } from './active-call-bar';
import { mapCallError } from './call-error-messages';
import { resolveFallbackReason } from './fallback-reason';

/**
 * Logic-only provider that subscribes to active calls via useQuery.
 * Mounted in the dashboard layout alongside BrowserNotifications.
 *
 * Handles both inbound and outbound call state transitions:
 * - Inbound: detects RINGING -> shows IncomingCallDialog
 * - Outbound: tracks REQUESTING_PERMISSION -> PERMISSION_GRANTED -> initiates WebRTC
 */
export function CallNotificationProvider() {
    const { currentOrg } = useCurrentOrg();
    const { callState, setIncomingCall, setCallState, setError, clearCall, activeCallId } = useCallStore();
    const { applyRemoteSdpAnswer, initiateCall } = useWebRTCCall();

    // Subscribe to active ringing calls for this org (inbound)
    const activeCall = useQuery(
        api.calls.getActiveCall,
        currentOrg?._id ? { organizationId: currentOrg._id } : 'skip'
    );

    // Subscribe to the agent's own active call (PRE_ACCEPTED/CONNECTED)
    const myActiveCall = useQuery(
        api.calls.getMyActiveCall,
        currentOrg?._id ? { organizationId: currentOrg._id } : 'skip'
    );

    // Subscribe to the agent's outbound call in progress
    const myOutboundCall = useQuery(
        api.calls.getMyOutboundCall,
        currentOrg?._id ? { organizationId: currentOrg._id } : 'skip'
    );

    // Subscribe to the specific activeCallId so we can detect async failures
    // (FAILED status + terminationReason) even after the call leaves the
    // "in-progress" query result set.
    const isOutboundPending = callState === 'requesting_permission' ||
        callState === 'permission_granted' ||
        callState === 'dialing' ||
        callState === 'connecting';
    const trackedCallStatus = useQuery(
        api.calls.getCallStatusForAgent,
        activeCallId && isOutboundPending ? { callId: activeCallId } : 'skip'
    );

    const lastCallIdRef = useRef<string | null>(null);
    const lastOutboundStatusRef = useRef<string | null>(null);
    const sdpAnswerAppliedRef = useRef<string | null>(null);
    const reportedFailureRef = useRef<string | null>(null);
    // Tracks the callId for which initiateCall is currently in-flight so that
    // the PERMISSION_GRANTED+dialing re-fire guard doesn't trigger a false error.
    const initiatingCallIdRef = useRef<string | null>(null);
    // Mirror of trackedCallStatus so the fallback timer callback reads the
    // freshest value at fire time (not the stale snapshot captured at effect
    // setup). Without this, a backend-reported terminationReason (e.g.
    // "CPR failed: 401 - code 190") can be masked by a generic fallback error.
    const trackedCallStatusRef = useRef(trackedCallStatus);
    useEffect(() => {
        trackedCallStatusRef.current = trackedCallStatus;
    }, [trackedCallStatus]);

    // Detect new incoming calls
    useEffect(() => {
        if (!activeCall) {
            if (callState === 'ringing' && activeCallId) {
                clearCall();
            }
            lastCallIdRef.current = null;
            return;
        }

        if (activeCall._id !== lastCallIdRef.current && callState === 'idle') {
            lastCallIdRef.current = activeCall._id;
            setIncomingCall(activeCall._id, {
                name: activeCall.contact?.name,
                phone: activeCall.fromPhone,
            });

            if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                new Notification('Appel entrant', {
                    body: `${activeCall.contact?.name || activeCall.fromPhone} vous appelle`,
                    icon: '/favicon.ico',
                    tag: `call-${activeCall._id}`,
                });
            }
        }
    }, [activeCall, callState, activeCallId, setIncomingCall, clearCall]);

    // Detect when call was terminated remotely (webhook terminate)
    useEffect(() => {
        if (callState === 'connected' || callState === 'connecting') {
            if (!myActiveCall) {
                clearCall();
            }
        }
    }, [myActiveCall, callState, clearCall]);

    // Detect async terminal failures on the tracked call (CPR rejected, 24h window, etc.)
    // This query stays live even after the call leaves `getMyOutboundCall` (FAILED/TERMINATED).
    useEffect(() => {
        if (!trackedCallStatus || !activeCallId) return;
        if (trackedCallStatus.direction !== 'OUTBOUND') return;

        const terminalStatuses = ['FAILED', 'TERMINATED', 'REJECTED', 'MISSED'];
        if (!terminalStatuses.includes(trackedCallStatus.status)) return;

        if (reportedFailureRef.current === activeCallId) return;
        reportedFailureRef.current = activeCallId;

        console.error(
            '[call-flow] Provider: tracked call terminal status',
            trackedCallStatus.status,
            '| reason:',
            trackedCallStatus.terminationReason
        );
        setError(mapCallError(trackedCallStatus.terminationReason));
    }, [trackedCallStatus, activeCallId, setError]);

    // Fallback timer: if the call disappears from `myOutboundCall` but the
    // tracked-status effect never surfaces a terminal status within 5s, show
    // an error so the user isn't stuck in a pending state forever. At fire
    // time we re-read trackedCallStatusRef to prefer the real Meta reason
    // (e.g. "CPR failed: 401 - code 190") over a generic fallback.
    useEffect(() => {
        if (myOutboundCall) return;
        if (!activeCallId) return;
        if (reportedFailureRef.current === activeCallId) return;
        if (
            callState !== 'requesting_permission' &&
            callState !== 'permission_granted' &&
            callState !== 'dialing'
        ) {
            return;
        }

        const timer = setTimeout(() => {
            if (reportedFailureRef.current === activeCallId) return;
            reportedFailureRef.current = activeCallId;
            const reason = resolveFallbackReason(trackedCallStatusRef.current);
            console.warn(
                '[call-flow] Provider: fallback timer fired',
                '| status:',
                trackedCallStatusRef.current?.status ?? 'unknown',
                '| reason:',
                reason,
            );
            setError(mapCallError(reason));
        }, 5000);

        return () => clearTimeout(timer);
    }, [myOutboundCall, activeCallId, callState, setError]);

    // Track outbound call state transitions
    useEffect(() => {
        if (!myOutboundCall) {
            // Call left the active-outbound query set — it moved to a terminal
            // status. The tracked-status effect above surfaces the real reason;
            // the fallback timer above handles the case where the status update
            // never arrives. Don't overwrite the error here.
            lastOutboundStatusRef.current = null;
            return;
        }

        const status = myOutboundCall.status;

        // Don't re-process the same status
        if (status === lastOutboundStatusRef.current) return;
        lastOutboundStatusRef.current = status;

        if (status === 'PERMISSION_GRANTED' && callState === 'requesting_permission') {
            setCallState('permission_granted');
            console.log('[call-flow] Provider: PERMISSION_GRANTED detected, auto-initiating call', myOutboundCall._id);

            if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                new Notification('Permission accordee', {
                    body: `${myOutboundCall.contact?.name || myOutboundCall.toPhone} a accepte votre demande d'appel`,
                    icon: '/favicon.ico',
                    tag: `call-permission-${myOutboundCall._id}`,
                });
            }

            // Mark this call as in-flight before awaiting so the guard below
            // doesn't treat the callState='dialing' re-render as a failure.
            initiatingCallIdRef.current = myOutboundCall._id;

            // Auto-initiate call immediately when permission is granted
            initiateCall(myOutboundCall._id)
                .then(() => {
                    console.log('[call-flow] Provider: auto-initiateCall completed for', myOutboundCall._id);
                })
                .catch((err) => {
                    console.error('[call-flow] Provider: auto-initiateCall failed', err);
                    // If the tracked-call effect already surfaced a specific reason, don't override it.
                    if (reportedFailureRef.current === myOutboundCall._id) return;
                    setError(mapCallError(String(err)));
                })
                .finally(() => {
                    if (initiatingCallIdRef.current === myOutboundCall._id) {
                        initiatingCallIdRef.current = null;
                    }
                });
        }

        // Call failed with recoverable error → went back to PERMISSION_GRANTED while we were dialing.
        // Guard: only fire if no initiateCall is currently in-flight for this call (avoid false positive
        // caused by the setCallState('dialing') re-render triggering this branch).
        if (
            status === 'PERMISSION_GRANTED' &&
            (callState === 'dialing' || callState === 'connecting') &&
            initiatingCallIdRef.current !== myOutboundCall._id
        ) {
            console.warn('[call-flow] Provider: PERMISSION_GRANTED while dialing/connecting (no in-flight), surfacing error', (myOutboundCall as any).terminationReason);
            setError(mapCallError((myOutboundCall as any).terminationReason));
        }
    }, [myOutboundCall, callState, activeCallId, setCallState, setError, initiateCall]);

    // Reset the failure tracker whenever a fresh call is set as active
    useEffect(() => {
        if (!activeCallId) {
            reportedFailureRef.current = null;
            return;
        }
        if (reportedFailureRef.current && reportedFailureRef.current !== activeCallId) {
            reportedFailureRef.current = null;
        }
    }, [activeCallId]);

    // Apply SDP answer for outbound calls (Meta sends back answer via webhook)
    useEffect(() => {
        if (
            myOutboundCall?.sdpAnswer &&
            callState === 'dialing' &&
            myOutboundCall.sdpAnswer !== sdpAnswerAppliedRef.current
        ) {
            sdpAnswerAppliedRef.current = myOutboundCall.sdpAnswer;
            applyRemoteSdpAnswer(myOutboundCall.sdpAnswer);
        }
    }, [myOutboundCall?.sdpAnswer, callState, applyRemoteSdpAnswer]);

    return (
        <>
            {/* Incoming call dialog (ringing state) */}
            {callState === 'ringing' && activeCall?.sdpOffer && (
                <IncomingCallDialog sdpOffer={activeCall.sdpOffer} />
            )}

            {/* Active call bar (connecting/connected/dialing/requesting/error state) */}
            <ActiveCallBar />
        </>
    );
}
