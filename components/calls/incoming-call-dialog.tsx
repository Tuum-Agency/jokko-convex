'use client';

import { Phone, PhoneOff, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCallStore } from '@/lib/stores/call-store';
import { useWebRTCCall } from '@/hooks/use-webrtc-call';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useState } from 'react';

interface IncomingCallDialogProps {
    sdpOffer: string;
}

export function IncomingCallDialog({ sdpOffer }: IncomingCallDialogProps) {
    const { activeCallId, callState, contactName, contactPhone } = useCallStore();
    const { answerCall, remoteAudioRef } = useWebRTCCall();
    const rejectCallMutation = useMutation(api.calls.rejectCall);
    const [isAccepting, setIsAccepting] = useState(false);

    if (callState !== 'ringing' || !activeCallId) return null;

    const displayName = contactName || contactPhone || 'Inconnu';

    const handleAccept = async () => {
        if (!activeCallId || isAccepting) return;
        setIsAccepting(true);
        try {
            await answerCall(activeCallId, sdpOffer);
        } catch (error) {
            console.error('Failed to accept call:', error);
            setIsAccepting(false);
        }
    };

    const handleReject = async () => {
        if (!activeCallId) return;
        try {
            await rejectCallMutation({ callId: activeCallId });
        } catch (error) {
            console.error('Failed to reject call:', error);
        }
    };

    return (
        <>
            {/* Hidden audio element for remote audio playback */}
            <audio ref={remoteAudioRef} autoPlay playsInline />

            {/* Full-screen overlay */}
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                <div className="flex w-80 flex-col items-center gap-6 rounded-2xl bg-white p-8 shadow-2xl dark:bg-zinc-900">
                    {/* Caller avatar */}
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                        <User className="h-10 w-10 text-green-600 dark:text-green-400" />
                    </div>

                    {/* Caller info */}
                    <div className="text-center">
                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                            {displayName}
                        </h3>
                        {contactName && contactPhone && (
                            <p className="text-sm text-zinc-500">{contactPhone}</p>
                        )}
                        <p className="mt-1 animate-pulse text-sm text-green-600 dark:text-green-400">
                            Appel entrant...
                        </p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-6">
                        <Button
                            variant="destructive"
                            size="lg"
                            className="h-14 w-14 rounded-full p-0"
                            onClick={handleReject}
                        >
                            <PhoneOff className="h-6 w-6" />
                        </Button>

                        <Button
                            size="lg"
                            className="h-14 w-14 rounded-full bg-green-600 p-0 hover:bg-green-700"
                            onClick={handleAccept}
                            disabled={isAccepting}
                        >
                            <Phone className="h-6 w-6" />
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
}
