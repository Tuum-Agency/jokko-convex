'use client';

import { Phone, PhoneCall, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { useCallStore } from '@/lib/stores/call-store';
import { useWebRTCCall } from '@/hooks/use-webrtc-call';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { mapCallError } from './call-error-messages';

interface CallButtonProps {
    conversationId?: string;
    contactPhone?: string;
    contactName?: string;
}

export function CallButton({ conversationId, contactPhone, contactName }: CallButtonProps) {
    const { callState, activeCallId, setOutgoingCall, setError, setCallContext, setMicStream } = useCallStore();
    const { initiateCall } = useWebRTCCall();
    const requestOutboundCall = useMutation(api.calls.requestOutboundCall);

    const isInCall = callState === 'connecting' || callState === 'connected';
    const isRinging = callState === 'ringing';
    const isRequesting = callState === 'requesting_permission';
    const isDialing = callState === 'dialing';
    const isPermissionGranted = callState === 'permission_granted';
    const isError = callState === 'error';
    const isBusy = isInCall || isRinging || isRequesting || isDialing || isPermissionGranted;

    const handleClick = async () => {
        if (isBusy) return;
        if (!conversationId || !contactPhone) return;

        // Pre-record the conversation context in the store so the error bar
        // (and its "Autoriser le microphone" retry button) has the data it
        // needs to restart the call after the user fixes the issue.
        setCallContext(
            { name: contactName, phone: contactPhone },
            conversationId as Id<"conversations">,
        );

        // Trigger the native mic prompt synchronously in the click handler so
        // Chrome shows its own permission dialog immediately. Any later prompt
        // (inside an async backend round-trip) would feel disconnected from
        // the user's click.
        //
        // IMPORTANT: we keep the stream alive (do NOT stop tracks here) and
        // store it in the Zustand store. initiateCall() will run inside a
        // useEffect (outside a user gesture), where Chrome on non-HTTPS origins
        // would refuse a second getUserMedia. Reusing the pre-acquired stream
        // bypasses that restriction entirely.
        let micStream: MediaStream;
        try {
            micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            console.log('[call-flow] CallButton: getUserMedia granted, keeping stream alive for initiateCall');
            setMicStream(micStream);
        } catch (error) {
            const errName = (error as DOMException)?.name ?? String(error);
            console.warn('[call-flow] CallButton: getUserMedia failed', errName);
            setError(mapCallError(errName));
            return;
        }

        try {
            console.log('[call-flow] CallButton: calling requestOutboundCall', { conversationId });
            const result = await requestOutboundCall({
                conversationId: conversationId as Id<"conversations">,
            });

            console.log('[call-flow] CallButton: requestOutboundCall result', {
                callId: result.callId,
                permissionAlreadyGranted: result.permissionAlreadyGranted,
            });

            if (result.callId) {
                setOutgoingCall(
                    result.callId,
                    { name: contactName, phone: contactPhone },
                    conversationId as Id<"conversations">,
                );

                if (result.permissionAlreadyGranted) {
                    console.log('[call-flow] CallButton: permission already granted, calling initiateCall inline');
                    try {
                        await initiateCall(result.callId as Id<"calls">);
                    } catch (error) {
                        console.error('[call-flow] CallButton: initiateCall failed', error);
                        setError(mapCallError(String(error)));
                    }
                }
            }
        } catch (error) {
            console.error('[call-flow] CallButton: requestOutboundCall failed', error);
            setError(mapCallError(String(error)));
        }
    };

    // Icon and tooltip based on state
    let tooltip: string;
    let icon: React.ReactNode;
    let iconColor = 'text-gray-500 hover:text-gray-700';

    if (isInCall) {
        tooltip = 'Appel en cours';
        icon = <PhoneCall className="h-5 w-5" />;
        iconColor = 'text-green-600';
    } else if (isRinging) {
        tooltip = 'Appel entrant...';
        icon = <PhoneCall className="h-5 w-5 animate-pulse" />;
        iconColor = 'text-green-600';
    } else if (isRequesting || isPermissionGranted) {
        tooltip = 'Demande en cours...';
        icon = <Loader2 className="h-5 w-5 animate-spin" />;
        iconColor = 'text-yellow-600';
    } else if (isDialing) {
        tooltip = 'Appel en cours...';
        icon = <Loader2 className="h-5 w-5 animate-spin" />;
        iconColor = 'text-blue-600';
    } else if (isError) {
        tooltip = 'Reessayer l\'appel';
        icon = <AlertCircle className="h-5 w-5" />;
        iconColor = 'text-red-500 hover:text-red-700';
    } else {
        tooltip = 'Appel audio';
        icon = <Phone className="h-5 w-5" />;
    }

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className={iconColor}
                    onClick={handleClick}
                    disabled={isBusy && !isError}
                >
                    {icon}
                </Button>
            </TooltipTrigger>
            <TooltipContent>
                <p>{tooltip}</p>
            </TooltipContent>
        </Tooltip>
    );
}
