/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║ components/conversations/AssignmentDropdown.tsx
 * ╠═══════════════════════════════════════════════════════════════╣
 * ║                                                               ║
 * ║     Dropdown avec actions d'assignation rapides               ║
 * ║                                                               ║
 * ║     Menu:                                                     ║
 * ║       - M'assigner                                            ║
 * ║       - Assigner a...                                         ║
 * ║       - Desassigner                                           ║
 * ║                                                               ║
 * ╠═══════════════════════════════════════════════════════════════╣
 * ║ DESCRIPTION:                                                  ║
 * ║   Menu dropdown pour les actions d'assignation rapides.       ║
 * ╚═══════════════════════════════════════════════════════════════╝
 */

'use client'

import { useState } from 'react'
import { Loader2, User, Users, UserX, UserPlus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'

import { AssignToMemberModal } from './AssignToMemberModal'
import { useAssignment } from '@/hooks/useAssignment'
import type { Role } from '@/lib/team/roles'
import type { Assignee } from './AssignmentBadge'
import { cn } from '@/lib/utils'

// ============================================
// TYPES
// ============================================

interface AssignmentDropdownProps {
    conversationId: string
    currentAssignee: Assignee | null
    currentUserMemberId: string
    currentUserRole: Role
    onAssignmentChange?: () => void
    className?: string
}

export function AssignmentDropdown({
    conversationId,
    currentAssignee,
    currentUserMemberId,
    currentUserRole,
    onAssignmentChange,
    className,
}: AssignmentDropdownProps) {
    const [isModalOpen, setIsModalOpen] = useState(false)

    const { assignTo, unassign, isLoading } = useAssignment({
        onSuccess: () => {
            onAssignmentChange?.()
        },
        onError: (error) => {
            toast.error(error)
        },
    })

    const isAssignedToMe = currentAssignee?.id === currentUserMemberId
    const canAssignToOthers =
        currentUserRole === 'owner' || currentUserRole === 'admin'
    const canUnassign =
        canAssignToOthers || (currentUserRole === 'agent' && isAssignedToMe)

    const handleAssignToMe = async () => {
        await assignTo(conversationId, currentUserMemberId)
        toast.success('Cette conversation vous est maintenant assignee')
    }

    const handleUnassign = async () => {
        await unassign(conversationId)
        toast.success('Cette conversation est maintenant disponible')
    }

    // New Logic: If agent and unassigned, show direct "M'assigner" button
    if (currentUserRole === 'agent' && !currentAssignee) {
        return (
            <Button
                variant="outline"
                size="sm"
                disabled={isLoading}
                onClick={handleAssignToMe}
                className={cn("gap-1.5 text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700", className)}
            >
                {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <UserPlus className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">M'assigner</span>
            </Button>
        )
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={isLoading}
                        className={cn("gap-1.5 text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700", className)}
                    >
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <UserPlus className="h-4 w-4" />
                        )}
                        <span className="hidden sm:inline">
                            {currentAssignee ? 'Reassigner' : 'Assigner'}
                        </span>
                    </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-48">
                    {/* M'assigner - si pas deja assigne a moi */}
                    {!isAssignedToMe && (
                        <DropdownMenuItem onClick={handleAssignToMe}>
                            <User className="mr-2 h-4 w-4" />
                            M'assigner
                        </DropdownMenuItem>
                    )}

                    {/* Assigner a... - admin/owner seulement */}
                    {canAssignToOthers && (
                        <DropdownMenuItem onClick={() => setIsModalOpen(true)}>
                            <Users className="mr-2 h-4 w-4" />
                            Assigner a...
                        </DropdownMenuItem>
                    )}

                    {/* Desassigner - si assigne et permission */}
                    {currentAssignee && canUnassign && (
                        <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={handleUnassign}
                                className="text-destructive focus:text-destructive"
                            >
                                <UserX className="mr-2 h-4 w-4" />
                                Desassigner
                            </DropdownMenuItem>
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Modal pour assigner a un autre membre */}
            <AssignToMemberModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                conversationId={conversationId}
                currentAssigneeId={currentAssignee?.id}
                onSuccess={() => {
                    setIsModalOpen(false)
                    onAssignmentChange?.()
                }}
            />
        </>
    )
}
