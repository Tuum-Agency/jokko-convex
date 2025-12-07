'use client'

import { useState } from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

import { type Role } from '@/lib/team/roles'

// ============================================
// TYPES
// ============================================

interface Member {
    id: Id<"memberships">
    userId: Id<"users">
    name: string
    email: string
    role: Role
}

interface RemoveMemberDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    member: Member | null
    onSuccess: () => void
}

// ============================================
// COMPONENT
// ============================================

export function RemoveMemberDialog({
    open,
    onOpenChange,
    member,
    onSuccess,
}: RemoveMemberDialogProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const removeMember = useMutation(api.team.removeMember)

    const handleRemove = async () => {
        if (!member) return

        setIsLoading(true)
        setError(null)

        try {
            await removeMember({ membershipId: member.id })
            onSuccess()
            onOpenChange(false)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Une erreur est survenue')
        } finally {
            setIsLoading(false)
        }
    }

    if (!member) return null

    return (
        <Dialog open={open} onOpenChange={isLoading ? undefined : onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="text-red-600 flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        Supprimer le membre ?
                    </DialogTitle>
                    <DialogDescription className="space-y-3 pt-2">
                        <p>
                            Êtes-vous sûr de vouloir supprimer{' '}
                            <span className="font-semibold text-gray-900">
                                {member.name}
                            </span>{' '}
                            de l'organisation ?
                        </p>
                        <div className="p-3 bg-red-50 rounded-lg text-sm text-red-700">
                            <p className="font-medium">Cette action est irréversible.</p>
                            <p className="mt-1">
                                L'utilisateur perdra immédiatement accès à toutes les ressources de
                                l'équipe. Ses conversations seront archivées.
                            </p>
                        </div>
                        {error && (
                            <p className="text-sm text-red-600 font-medium">
                                Erreur: {error}
                            </p>
                        )}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                        Annuler
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleRemove}
                        disabled={isLoading}
                        className="bg-red-600 hover:bg-red-700 text-white"
                    >
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Supprimer le membre
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
