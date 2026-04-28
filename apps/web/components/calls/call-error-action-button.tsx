'use client';

import Link from 'next/link';
import { ExternalLink, RotateCcw, Link as LinkIcon, LogIn, MessageSquarePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCallStore } from '@/lib/stores/call-store';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { useWebRTCCall } from '@/hooks/use-webrtc-call';
import { mapCallError } from './call-error-messages';
import { MicPermissionButton } from './mic-permission-button';

/**
 * Dispatcher: renders the right contextual action button based on the
 * `errorAction` attached to the current error. One button per error type
 * so non-technical users always have a clear next step.
 */
export function CallErrorActionButton() {
    const action = useCallStore((s) => s.errorAction);
    const conversationId = useCallStore((s) => s.conversationId);
    const contactName = useCallStore((s) => s.contactName);
    const contactPhone = useCallStore((s) => s.contactPhone);
    const setError = useCallStore((s) => s.setError);
    const setOutgoingCall = useCallStore((s) => s.setOutgoingCall);
    const clearCall = useCallStore((s) => s.clearCall);
    const { initiateCall } = useWebRTCCall();
    const requestOutboundCall = useMutation(api.calls.requestOutboundCall);

    if (!action) return null;

    if (action.type === 'mic') {
        return <MicPermissionButton />;
    }

    if (action.type === 'reconnect-whatsapp') {
        return (
            <Button
                asChild
                variant="outline"
                size="sm"
                className="gap-1 border-red-300 bg-white text-red-700 hover:bg-red-100"
            >
                <Link href="/dashboard/settings?tab=channels">
                    <LinkIcon className="h-4 w-4" />
                    Reconnecter WhatsApp
                </Link>
            </Button>
        );
    }

    if (action.type === 'signin') {
        return (
            <Button
                asChild
                variant="outline"
                size="sm"
                className="gap-1 border-red-300 bg-white text-red-700 hover:bg-red-100"
            >
                <Link href="/auth/sign-in">
                    <LogIn className="h-4 w-4" />
                    Se reconnecter
                </Link>
            </Button>
        );
    }

    if (action.type === 'external') {
        return (
            <Button
                asChild
                variant="outline"
                size="sm"
                className="gap-1 border-red-300 bg-white text-red-700 hover:bg-red-100"
            >
                <a href={action.href} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                    {action.label}
                </a>
            </Button>
        );
    }

    if (action.type === 'send-template') {
        const targetHref = conversationId
            ? `/dashboard/conversations/${conversationId}?openTemplates=1`
            : '/dashboard/conversations';
        return (
            <Button
                asChild
                variant="outline"
                size="sm"
                className="gap-1 border-red-300 bg-white text-red-700 hover:bg-red-100"
            >
                <Link href={targetHref}>
                    <MessageSquarePlus className="h-4 w-4" />
                    Envoyer un modele
                </Link>
            </Button>
        );
    }

    if (action.type === 'retry') {
        async function handleRetry() {
            const currentConversationId = conversationId;
            const currentContactName = contactName;
            const currentContactPhone = contactPhone;
            clearCall();
            if (!currentConversationId || !currentContactPhone) return;
            try {
                const result = await requestOutboundCall({
                    conversationId: currentConversationId as Id<"conversations">,
                });
                if (result.callId) {
                    setOutgoingCall(
                        result.callId,
                        { name: currentContactName ?? undefined, phone: currentContactPhone },
                        currentConversationId as Id<"conversations">,
                    );
                    if (result.permissionAlreadyGranted) {
                        try {
                            await initiateCall(result.callId as Id<"calls">);
                        } catch (err) {
                            setError(mapCallError(String(err)));
                        }
                    }
                }
            } catch (err) {
                setError(mapCallError(String(err)));
            }
        }

        return (
            <Button
                variant="outline"
                size="sm"
                className="gap-1 border-red-300 bg-white text-red-700 hover:bg-red-100"
                onClick={handleRetry}
            >
                <RotateCcw className="h-4 w-4" />
                Reessayer
            </Button>
        );
    }

    return null;
}
