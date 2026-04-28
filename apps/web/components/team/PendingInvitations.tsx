'use client'

import { useState } from 'react'
import {
    Clock,
    MoreHorizontal,
    Mail,
    XCircle,
    RefreshCw,
    AlertTriangle,
    CheckCircle2,
} from 'lucide-react'
import { useMutation, useAction } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"

import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
    Empty,
    EmptyHeader,
    EmptyTitle,
    EmptyDescription,
    EmptyMedia
} from '@/components/ui/empty'

// ============================================
// TYPES
// ============================================

export interface Invitation {
    id: Id<"invitations">
    email: string
    role: string
    poleId?: Id<"poles">
    status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'CANCELLED'
    createdAt: string
    expiresAt: string
}

interface PendingInvitationsProps {
    invitations: Invitation[]
    onInvitationCanceled?: () => void
}

// ============================================
// COMPONENT
// ============================================

export function PendingInvitations({
    invitations,
    onInvitationCanceled,
}: PendingInvitationsProps) {
    const [cancelingId, setCancelingId] = useState<string | null>(null)
    const [resendingId, setResendingId] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)

    const [invitationToCancel, setInvitationToCancel] = useState<Id<"invitations"> | null>(null)

    const cancelInvitation = useMutation(api.invitations.cancel)

    const handleConfirmCancel = async () => {
        if (!invitationToCancel) return

        const id = invitationToCancel
        setCancelingId(id)
        setError(null)
        setSuccessMessage(null)

        try {
            await cancelInvitation({ id })

            setSuccessMessage('Invitation annulée avec succès')
            if (onInvitationCanceled) onInvitationCanceled()

            setTimeout(() => setSuccessMessage(null), 3000)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Une erreur est survenue')
        } finally {
            setCancelingId(null)
            setInvitationToCancel(null)
        }
    }

    const resendInvitation = useAction(api.invitations.resend)

    const handleResend = async (id: Id<"invitations">) => {
        setResendingId(id)
        setError(null)
        setSuccessMessage(null)

        try {
            await resendInvitation({ id })
            setSuccessMessage("Invitation renvoyée avec succès")
            setTimeout(() => setSuccessMessage(null), 3000)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Erreur lors du renvoi")
        } finally {
            setResendingId(null)
        }
    }

    if (invitations.length === 0) {
        return (
            <Empty>
                <EmptyMedia variant="icon">
                    <Mail className="size-6" />
                </EmptyMedia>
                <EmptyHeader>
                    <EmptyTitle>Aucune invitation</EmptyTitle>
                    <EmptyDescription>
                        Il n'y a aucune invitation en attente.
                    </EmptyDescription>
                </EmptyHeader>
            </Empty>
        )
    }

    return (
        <>
            <div className="space-y-3">
                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                        <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                        {error}
                    </div>
                )}

                {successMessage && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-600 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                        <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                        {successMessage}
                    </div>
                )}

                {invitations.map((invitation) => (
                    <div
                        key={invitation.id}
                        className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-white hover:border-gray-200 transition-colors shadow-sm"
                    >
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center">
                                <Mail className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">{invitation.email}</p>
                                <div className="flex items-center gap-2 text-sm text-gray-500 mt-0.5">
                                    <Badge variant="outline" className="text-xs font-normal border-gray-200 text-gray-500">
                                        {invitation.role}
                                    </Badge>
                                    <span>•</span>
                                    <span className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        Expire le {new Date(invitation.expiresAt).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleResend(invitation.id)}
                                disabled={resendingId === invitation.id || cancelingId === invitation.id}
                                className="text-gray-500 hover:text-blue-600 hidden sm:flex"
                            >
                                {resendingId === invitation.id ? (
                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                ) : (
                                    <RefreshCw className="h-4 w-4" />
                                )}
                                <span className="ml-2">Renvoyer</span>
                            </Button>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-600">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                        onClick={() => handleResend(invitation.id)}
                                        className="sm:hidden"
                                    >
                                        <RefreshCw className="mr-2 h-4 w-4" />
                                        Renvoyer
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                        onClick={() => setInvitationToCancel(invitation.id)}
                                        disabled={cancelingId === invitation.id}
                                    >
                                        <XCircle className="mr-2 h-4 w-4" />
                                        Annuler l'invitation
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                ))}
            </div>

            <AlertDialog open={!!invitationToCancel} onOpenChange={(open) => !open && setInvitationToCancel(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Annuler l'invitation ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Cette action est irréversible. L'utilisateur ne pourra plus utiliser le lien d'invitation pour rejoindre l'équipe.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Retour</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmCancel}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {cancelingId ? "Annulation..." : "Oui, annuler l'invitation"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
