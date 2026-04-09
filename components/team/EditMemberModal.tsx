'use client'

import { useState } from 'react'
import {
    Shield,
    MessageSquare,
    AlertTriangle,
    Loader2,
    UserCog,
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
// ROLE ICON
// ============================================

function RoleIcon({ role, className }: { role: string; className?: string }) {
    switch (role) {
        case 'admin':
            return <Shield className={className} />
        case 'agent':
            return <MessageSquare className={className} />
        default:
            return <Shield className={className} />
    }
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
                role: selectedRole.toUpperCase() as any,
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
            <DialogContent className="sm:max-w-[500px] overflow-y-auto max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserCog className="h-5 w-5 text-green-600" />
                        Modifier le role
                    </DialogTitle>
                    <DialogDescription>
                        Changez le niveau d&apos;acces de <span className="font-medium text-gray-900">{member.name}</span>.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-2 py-2">
                    {assignableRoles.map((role) => {
                        const roleConfig = ROLE_DEFINITIONS[role]
                        if (!roleConfig) return null

                        const isSelected = selectedRole === role

                        return (
                            <button
                                key={role}
                                onClick={() => !isLoading && setSelectedRole(role)}
                                className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${isSelected
                                    ? 'border-green-500 bg-green-50'
                                    : 'border-gray-200 hover:border-gray-300 bg-white'
                                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <div className={`p-2 rounded-lg ${isSelected ? 'bg-green-100' : roleConfig.bgColor}`}>
                                    <RoleIcon role={role} className={`h-5 w-5 ${isSelected ? 'text-green-600' : roleConfig.color}`} />
                                </div>
                                <div className="flex-1">
                                    <p className={`font-medium ${isSelected ? 'text-green-700' : 'text-gray-900'}`}>
                                        {roleConfig.label}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        {roleConfig.description}
                                    </p>
                                </div>
                                {isSelected && (
                                    <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center">
                                        <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                )}
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
                            className="bg-green-600 hover:bg-green-700"
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
