'use client';

import { useCallback, useRef, useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useCallStore } from '@/lib/stores/call-store';
import type { Id } from '@/convex/_generated/dataModel';

/**
 * Hook managing the browser-side RTCPeerConnection for WhatsApp Business calls.
 *
 * Flow (inbound):
 * 1. Meta sends SDP offer via webhook -> stored in Convex `calls` table
 * 2. Browser picks it up via useQuery subscription (in CallNotificationProvider)
 * 3. Agent clicks "Accept" -> this hook creates RTCPeerConnection
 * 4. Sets remote description (Meta's offer), creates answer
 * 5. Sends SDP answer to Convex -> Convex action -> Meta Graph API (pre_accept)
 * 6. WebRTC ICE negotiation completes -> confirmConnected -> Meta (accept)
 * 7. Audio flows: Meta servers <-> Agent's browser
 *
 * Flow (outbound):
 * 1. Agent clicks "Call" -> requestOutboundCall -> CPR sent to contact
 * 2. Contact accepts permission -> status becomes PERMISSION_GRANTED (reactive)
 * 3. Agent clicks "Appeler maintenant" -> initiateCall creates RTCPeerConnection
 * 4. Creates SDP offer -> startOutboundCall -> Meta API sends offer
 * 5. Meta sends SDP answer via webhook -> stored in calls table (reactive)
 * 6. Browser picks up SDP answer -> setRemoteDescription -> audio flows
 */
export function useWebRTCCall() {
    const [isAudioReady, setIsAudioReady] = useState(false);
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

    const { setCallState, toggleMute: storeToggleMute, isMuted, clearCall, setMicStream } = useCallStore();

    const acceptCallMutation = useMutation(api.calls.acceptCall);
    const confirmConnectedMutation = useMutation(api.calls.confirmConnected);
    const terminateCallMutation = useMutation(api.calls.terminateCall);
    const startOutboundCallMutation = useMutation(api.calls.startOutboundCall);

    // ---- INBOUND: Answer an incoming call ----
    const answerCall = useCallback(async (callId: Id<"calls">, sdpOffer: string) => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            localStreamRef.current = stream;

            const pc = new RTCPeerConnection({
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' },
                ],
            });
            peerConnectionRef.current = pc;

            stream.getTracks().forEach(track => pc.addTrack(track, stream));

            pc.ontrack = (event) => {
                if (remoteAudioRef.current && event.streams[0]) {
                    remoteAudioRef.current.srcObject = event.streams[0];
                    setIsAudioReady(true);
                }
            };

            await pc.setRemoteDescription({ type: 'offer', sdp: sdpOffer });

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            const sdpAnswer = await waitForIceGathering(pc);

            await acceptCallMutation({ callId, sdpAnswer });

            setCallState('connecting');

            pc.oniceconnectionstatechange = () => {
                const state = pc.iceConnectionState;
                if (state === 'connected' || state === 'completed') {
                    setCallState('connected');
                    confirmConnectedMutation({ callId });
                }
                if (state === 'disconnected' || state === 'failed' || state === 'closed') {
                    cleanup();
                    setCallState('ended');
                }
            };

            pc.onconnectionstatechange = () => {
                if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
                    cleanup();
                    setCallState('ended');
                }
            };
        } catch (error) {
            console.error('[WebRTC] Failed to answer call:', error);
            cleanup();
            setCallState('ended');
            throw error;
        }
    }, [acceptCallMutation, confirmConnectedMutation, setCallState]);

    // ---- OUTBOUND: Initiate a call after permission granted ----
    const initiateCall = useCallback(async (callId: Id<"calls">) => {
        try {
            setCallState('dialing');
            console.log('[call-flow] initiateCall: state -> dialing, callId:', callId);

            // Reuse the pre-acquired stream stored during the click handler.
            // This avoids calling getUserMedia from inside a useEffect (non-user-gesture
            // context) which would fail with NotAllowedError on non-HTTPS origins.
            let stream: MediaStream;
            const storedStream = useCallStore.getState().micStream;
            if (storedStream && storedStream.active) {
                console.log('[call-flow] initiateCall: reusing pre-acquired mic stream from store');
                stream = storedStream;
                // Clear the store reference so we own the stream exclusively.
                setMicStream(null);
            } else {
                // Fallback: attempt getUserMedia (works on HTTPS or if already granted).
                console.log('[call-flow] initiateCall: no stored stream, calling getUserMedia');
                try {
                    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    console.log('[call-flow] initiateCall: getUserMedia succeeded');
                } catch (micErr) {
                    const e = micErr as DOMException;
                    const permState = await navigator.permissions
                        .query({ name: 'microphone' as PermissionName })
                        .then((s) => s.state)
                        .catch(() => 'unavailable');
                    console.error('[call-flow] initiateCall: getUserMedia failed', {
                        name: e.name,
                        message: e.message,
                        permissionState: permState,
                    });
                    throw micErr;
                }
            }
            localStreamRef.current = stream;

            const pc = new RTCPeerConnection({
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' },
                ],
            });
            peerConnectionRef.current = pc;

            stream.getTracks().forEach(track => pc.addTrack(track, stream));

            pc.ontrack = (event) => {
                if (remoteAudioRef.current && event.streams[0]) {
                    remoteAudioRef.current.srcObject = event.streams[0];
                    setIsAudioReady(true);
                }
            };

            // Create offer
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            const sdpOffer = await waitForIceGathering(pc);

            // Send to Convex -> Meta
            await startOutboundCallMutation({ callId, sdpOffer });

            // Monitor connection state
            pc.oniceconnectionstatechange = () => {
                const state = pc.iceConnectionState;
                if (state === 'connected' || state === 'completed') {
                    setCallState('connected');
                    confirmConnectedMutation({ callId });
                }
                if (state === 'disconnected' || state === 'failed' || state === 'closed') {
                    cleanup();
                    // Don't override error state set by the provider
                    const currentState = useCallStore.getState().callState;
                    if (currentState !== 'error') {
                        setCallState('ended');
                    }
                }
            };

            pc.onconnectionstatechange = () => {
                if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
                    cleanup();
                    const currentState = useCallStore.getState().callState;
                    if (currentState !== 'error') {
                        setCallState('ended');
                    }
                }
            };
        } catch (error) {
            console.error('[WebRTC] Failed to initiate outbound call:', error);
            cleanup();
            // Don't override error state set by the provider
            const currentState = useCallStore.getState().callState;
            if (currentState !== 'error') {
                setCallState('ended');
            }
            throw error;
        }
    }, [startOutboundCallMutation, confirmConnectedMutation, setCallState]);

    // ---- Apply remote SDP answer (for outbound calls) ----
    const applyRemoteSdpAnswer = useCallback(async (sdpAnswer: string) => {
        const pc = peerConnectionRef.current;
        if (!pc) {
            console.error('[WebRTC] No peer connection for remote SDP answer');
            return;
        }
        try {
            await pc.setRemoteDescription({ type: 'answer', sdp: sdpAnswer });
            console.log('[WebRTC] Remote SDP answer applied');
        } catch (error) {
            console.error('[WebRTC] Failed to apply remote SDP answer:', error);
        }
    }, []);

    const hangUp = useCallback(async (callId: Id<"calls">) => {
        cleanup();
        setCallState('ended');

        try {
            await terminateCallMutation({ callId });
        } catch (error) {
            console.error('[WebRTC] Failed to terminate call:', error);
        }

        setTimeout(() => clearCall(), 1500);
    }, [terminateCallMutation, setCallState, clearCall]);

    const toggleMute = useCallback(() => {
        const stream = localStreamRef.current;
        if (stream) {
            stream.getAudioTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
        }
        storeToggleMute();
    }, [storeToggleMute]);

    function cleanup() {
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(t => t.stop());
            localStreamRef.current = null;
        }
        setIsAudioReady(false);
    }

    return {
        answerCall,
        initiateCall,
        applyRemoteSdpAnswer,
        hangUp,
        toggleMute,
        isMuted,
        isAudioReady,
        remoteAudioRef,
    };
}

/**
 * Waits for ICE gathering to complete and returns the final SDP.
 * Meta expects a complete SDP (no trickle ICE).
 */
function waitForIceGathering(pc: RTCPeerConnection): Promise<string> {
    return new Promise((resolve) => {
        if (pc.iceGatheringState === 'complete') {
            resolve(pc.localDescription!.sdp);
            return;
        }

        const timeout = setTimeout(() => {
            resolve(pc.localDescription!.sdp);
        }, 3000);

        pc.onicegatheringstatechange = () => {
            if (pc.iceGatheringState === 'complete') {
                clearTimeout(timeout);
                resolve(pc.localDescription!.sdp);
            }
        };
    });
}
