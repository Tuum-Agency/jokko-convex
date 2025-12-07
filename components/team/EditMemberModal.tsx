'use client'

import { useState } from 'react'
import {
    Shield,
    MessageSquare,
    CheckCircle2,
    AlertTriangle,
    Loader2,
} from 'lucide-react'
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'

import { type Role, ROLE_DEFINITIONS, getAssignableRoles } from '@/lib/team/roles'

// ============================================
// TYPES
// ============================================

interface Member {
    id: Id<"memberships">
    userId: Id<"users">
    name: string
    email: string
    role: Role
    poleId?: Id<"poles">
}

interface EditMemberModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    member: Member | null
    currentUserRole: Role
    onSuccess: () => void
}

// ============================================
// COMPONENT
// ============================================

export function EditMemberModal({
    open,
    onOpenChange,
    member,
    currentUserRole,
    onSuccess,
}: EditMemberModalProps) {
    const [selectedRole, setSelectedRole] = useState<Role | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    const updateRole = useMutation(api.team.updateRole)

    // Set initial role when modal opens
    if (open && member && selectedRole === null) {
        setSelectedRole(member.role)
    }

    // Reset when closing
    if (!open && selectedRole !== null) {
        setSelectedRole(null)
        setError(null)
    }

    if (!member) return null

    const assignableRoles = getAssignableRoles(currentUserRole)

    const handleSave = async () => {
        if (!selectedRole || selectedRole === member.role) return

        setIsLoading(true)
        setError(null)

        try {
            await updateRole({
                membershipId: member.id,
                role: selectedRole.toUpperCase() as any, // Cast to uppercase for backend enum
            })

            onSuccess()
            onOpenChange(false)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Une erreur est survenue')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={isLoading ? undefined : onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Modifier le role</DialogTitle>
                    <DialogDescription>
                        Changez le niveau d'acces de <span className="font-medium text-gray-900">{member.name}</span>.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="grid gap-3">
                        {assignableRoles.map((role) => {
                            const roleConfig = ROLE_DEFINITIONS[role]
                            if (!roleConfig) return null

                            const isSelected = selectedRole === role
                            const Icon = role === 'admin' ? Shield : MessageSquare

                            return (
                                <button
                                    key={role}
                                    // Allow clicking if not loading
                                    onClick={() => !isLoading && setSelectedRole(role)}
                                    className={`flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all ${isSelected
                                        ? 'border-indigo-600 bg-indigo-50'
                                        : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                                        } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <div
                                        className={`p-2 rounded-lg ${isSelected ? 'bg-indigo-100' : 'bg-gray-100'
                                            }`}
                                    >
                                        <Icon
                                            className={`h-5 w-5 ${isSelected ? 'text-indigo-600' : 'text-gray-500'
                                                }`}
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <p
                                                className={`font-semibold ${isSelected ? 'text-indigo-900' : 'text-gray-900'
                                                    }`}
                                            >
                                                {roleConfig.label}
                                            </p>
                                            {isSelected && (
                                                <CheckCircle2 className="h-5 w-5 text-indigo-600" />
                                            )}
                                        </div>
                                        <p
                                            className={`text-sm mt-1 ${isSelected ? 'text-indigo-700' : 'text-gray-500'
                                                }`}
                                        >
                                            {roleConfig.description}
                                        </p>
                                    </div>
                                </button>
                            )
                        })}
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                            {error}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <ButtonGroup>
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isLoading}
                        >
                            Annuler
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={isLoading || !selectedRole || selectedRole === member.role}
                            className="bg-indigo-600 hover:bg-indigo-700"
                        >
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Enregistrer
                        </Button>
                    </ButtonGroup>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
