'use client';

import { Phone, PhoneOff, PhoneOutgoing, Mic, MicOff, Loader2, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCallStore } from '@/lib/stores/call-store';
import { useWebRTCCall } from '@/hooks/use-webrtc-call';
import { useState, useEffect } from 'react';
import { CallErrorActionButton } from './call-error-action-button';

export function ActiveCallBar() {
    const { activeCallId, callState, contactName, contactPhone, callStartedAt, callDirection, errorMessage, clearCall } = useCallStore();
    const { hangUp, toggleMute, isMuted, remoteAudioRef } = useWebRTCCall();
    const [elapsed, setElapsed] = useState(0);

    const isActive = callState === 'connecting' || callState === 'connected' || callState === 'dialing';
    const isOutboundPending = callState === 'requesting_permission' || callState === 'permission_granted';
    const isError = callState === 'error';
    const showBar = isActive || isOutboundPending || isError;

    // Timer
    useEffect(() => {
        if (callState !== 'connected' || !callStartedAt) {
            setElapsed(0);
            return;
        }

        const interval = setInterval(() => {
            setElapsed(Math.floor((Date.now() - callStartedAt) / 1000));
        }, 1000);

        return () => clearInterval(interval);
    }, [callState, callStartedAt]);

    if (!showBar) return null;
    if (!activeCallId && !isError) return null;

    const displayName = contactName || contactPhone || 'Inconnu';
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    const timeStr = `${minutes}:${String(seconds).padStart(2, '0')}`;

    const handleHangUp = async () => {
        if (activeCallId) {
            await hangUp(activeCallId);
        }
    };

    // Determine status text and bar color
    let statusText: string;
    let barColorClass: string;

    if (callState === 'requesting_permission') {
        statusText = 'Demande de permission envoyee...';
        barColorClass = 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/30';
    } else if (callState === 'permission_granted') {
        statusText = 'Permission accordee - Lancement de l\'appel...';
        barColorClass = 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30';
    } else if (callState === 'dialing') {
        statusText = 'Appel en cours...';
        barColorClass = 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30';
    } else if (callState === 'connecting') {
        statusText = 'Connexion...';
        barColorClass = 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30';
    } else if (callState === 'error') {
        statusText = errorMessage || 'Erreur d\'appel';
        barColorClass = 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30';
    } else {
        statusText = timeStr;
        barColorClass = 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30';
    }

    return (
        <>
            <audio ref={remoteAudioRef} autoPlay playsInline />

            <div className={`flex items-center justify-between border-b px-4 py-2 ${barColorClass}`}>
                <div className="flex items-center gap-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full ${isError ? 'bg-red-600' : 'bg-green-600'}`}>
                        {isError ? (
                            <AlertCircle className="h-4 w-4 text-white" />
                        ) : callState === 'requesting_permission' ? (
                            <Loader2 className="h-4 w-4 animate-spin text-white" />
                        ) : callDirection === 'OUTBOUND' ? (
                            <PhoneOutgoing className="h-4 w-4 text-white" />
                        ) : (
                            <Phone className="h-4 w-4 text-white" />
                        )}
                    </div>
                    <div>
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                            {displayName}
                        </p>
                        <p className="text-xs text-zinc-500">
                            {statusText}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Contextual fix-it button based on the error type */}
                    {isError && <CallErrorActionButton />}

                    {/* Cancel/Close for pending outbound or error */}
                    {(isOutboundPending || isError) && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-zinc-500 hover:text-zinc-700"
                            onClick={clearCall}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    )}

                    {/* Mute button (only during active call) */}
                    {isActive && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className={isMuted ? 'text-red-500' : 'text-zinc-600'}
                            onClick={toggleMute}
                        >
                            {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                        </Button>
                    )}

                    {/* Hang up (during active call or dialing) */}
                    {isActive && (
                        <Button
                            variant="destructive"
                            size="sm"
                            className="gap-1"
                            onClick={handleHangUp}
                        >
                            <PhoneOff className="h-4 w-4" />
                            Raccrocher
                        </Button>
                    )}
                </div>
            </div>
        </>
    );
}
