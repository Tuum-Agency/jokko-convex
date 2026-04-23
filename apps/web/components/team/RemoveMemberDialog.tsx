'use client'

import { useState } from 'react'
import { AlertTriangle, Loader2, UserMinus } from 'lucide-react'
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
import { ButtonGroup } from '@/components/ui/button-group'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

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

    const initials = member.name
        .split(' ')
        .map(p => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()

    return (
        <Dialog open={open} onOpenChange={isLoading ? undefined : onOpenChange}>
            <DialogContent className="sm:max-w-[440px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-red-600">
                        <UserMinus className="h-5 w-5" />
                        Supprimer le membre
                    </DialogTitle>
                    <DialogDescription>
                        Cette action est irreversible.
                    </DialogDescription>
                </DialogHeader>

                {/* Member preview */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-gradient-to-br from-[#14532d] to-[#059669] text-white text-sm font-semibold">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{member.name}</p>
                        <p className="text-xs text-gray-500 truncate">{member.email}</p>
                    </div>
                </div>

                {/* Warning */}
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-red-700">
                        <p className="font-medium">Attention</p>
                        <p className="mt-1">
                            L&apos;utilisateur perdra immediatement acces a toutes les ressources de l&apos;equipe. Ses conversations seront archivees.
                        </p>
                    </div>
                </div>

                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                        {error}
                    </div>
                )}

                <DialogFooter>
                    <ButtonGroup>
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
                    </ButtonGroup>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
