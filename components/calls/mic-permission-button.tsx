'use client';

import { useState } from 'react';
import { Mic, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCallStore } from '@/lib/stores/call-store';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { useWebRTCCall } from '@/hooks/use-webrtc-call';
import { mapCallError } from './call-error-messages';

/**
 * One-click action: ask the browser for the microphone and, on success,
 * immediately re-start the call so the user doesn't have to click again.
 * If the browser has durably blocked the permission, surfaces a concrete
 * error back to the user via the store (so the message & action update).
 */
export function MicPermissionButton() {
    const conversationId = useCallStore((s) => s.conversationId);
    const contactName = useCallStore((s) => s.contactName);
    const contactPhone = useCallStore((s) => s.contactPhone);
    const clearCall = useCallStore((s) => s.clearCall);
    const setError = useCallStore((s) => s.setError);
    const setMicStream = useCallStore((s) => s.setMicStream);
    const setOutgoingCall = useCallStore((s) => s.setOutgoingCall);
    const requestOutboundCall = useMutation(api.calls.requestOutboundCall);
    const { initiateCall } = useWebRTCCall();
    const [requesting, setRequesting] = useState(false);

    async function handleClick() {
        setRequesting(true);

        const savedConversationId = conversationId;
        const savedContactName = contactName;
        const savedContactPhone = contactPhone;

        let micStream: MediaStream;
        try {
            // Trigger the native browser prompt. Keep the stream alive so that
            // initiateCall (running in a useEffect, not a user gesture) can reuse
            // it without a second getUserMedia on non-HTTPS origins.
            micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            console.log('[call-flow] MicPermissionButton: getUserMedia granted, storing stream');
        } catch (err) {
            console.error('[MicPermissionButton] getUserMedia failed:', err);
            setRequesting(false);

            // If the permission is durably denied, query the Permissions API
            // to confirm and surface a clearer error ("mic blocked by browser")
            // rather than leaving the button looking inert.
            try {
                const status = await navigator.permissions.query({
                    name: 'microphone' as PermissionName,
                });
                if (status.state === 'denied') {
                    setError({
                        message:
                            "Votre navigateur a bloque le microphone pour ce site. Cliquez sur l'icone cadenas a gauche de l'URL pour l'autoriser.",
                    });
                    return;
                }
            } catch {
                // Permissions API unavailable — fall through.
            }

            setError(mapCallError(String((err as Error)?.name ?? err)));
            return;
        }

        // Mic granted — clear the stale error state FIRST (which stops any
        // previous stream), THEN store the fresh live stream. Reversing the
        // order would cause clearCall to immediately stop the tracks and null
        // the ref we just set, leading initiateCall to fall back to a second
        // getUserMedia outside the user gesture (NotAllowedError on http://).
        clearCall();
        setMicStream(micStream);

        if (!savedConversationId || !savedContactPhone) {
            // No context to restart — discard the stream and bail out.
            console.warn('[call-flow] MicPermissionButton: missing conversationId or contactPhone after clearCall');
            micStream.getTracks().forEach((t) => t.stop());
            setMicStream(null);
            setRequesting(false);
            return;
        }

        try {
            console.log('[call-flow] MicPermissionButton: calling requestOutboundCall', { savedConversationId });
            const result = await requestOutboundCall({
                conversationId: savedConversationId as Id<'conversations'>,
            });
            console.log('[call-flow] MicPermissionButton: requestOutboundCall result', {
                callId: result.callId,
                permissionAlreadyGranted: result.permissionAlreadyGranted,
            });
            if (result.callId) {
                setOutgoingCall(
                    result.callId,
                    { name: savedContactName ?? undefined, phone: savedContactPhone },
                    savedConversationId as Id<'conversations'>,
                );
                if (result.permissionAlreadyGranted) {
                    console.log('[call-flow] MicPermissionButton: permission already granted, calling initiateCall inline');
                    try {
                        await initiateCall(result.callId as Id<'calls'>);
                    } catch (err) {
                        console.error('[call-flow] MicPermissionButton: initiateCall failed', err);
                        setError(mapCallError(String(err)));
                    }
                }
            }
        } catch (err) {
            console.error('[call-flow] MicPermissionButton: requestOutboundCall failed', err);
            setError(mapCallError(String(err)));
        } finally {
            setRequesting(false);
        }
    }

    return (
        <Button
            variant="outline"
            size="sm"
            className="gap-1 border-red-300 bg-white text-red-700 hover:bg-red-100"
            onClick={handleClick}
            disabled={requesting}
        >
            {requesting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
                <Mic className="h-4 w-4" />
            )}
            Autoriser le microphone
        </Button>
    );
}
