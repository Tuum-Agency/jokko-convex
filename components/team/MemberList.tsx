/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║             components/team/MemberList.tsx                    ║
 * ╠═══════════════════════════════════════════════════════════════╣
 * ║                                                               ║
 * ║     Liste des membres de l'equipe avec actions.               ║
 * ║                                                               ║
 * ║     Design coherent avec l'application:                       ║
 * ║     - Couleurs vertes (green-500, green-600)                  ║
 * ║     - Arrondis (rounded-xl)                                   ║
 * ║     - Ombres douces (shadow-sm)                               ║
 * ║                                                               ║
 * ╚═══════════════════════════════════════════════════════════════╝
 */

'use client'

import { useState } from 'react'
import {
    MoreHorizontal,
    Shield,
    Trash2,
    Crown,
    MessageSquare,
    User,
} from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Empty,
    EmptyHeader,
    EmptyTitle,
    EmptyDescription,
    EmptyMedia
} from '@/components/ui/empty'

import { EditMemberModal } from './EditMemberModal'
import { RemoveMemberDialog } from './RemoveMemberDialog'
import { type Role, canManageRole, isValidRole } from '@/lib/team/roles'
import { Id } from "@/convex/_generated/dataModel"

// ============================================
// TYPES
// ============================================

export interface Member {
    id: string
    userId: string
    role: string
    roleLabel: string
    roleIcon: string
    roleColor: string
    roleBgColor: string
    user: {
        id: string
        name: string | null
        email: string
        avatar: string | null
    }
    isCurrentUser: boolean
    joinedAt: string
}

interface MemberListProps {
    members: Member[]
    currentUserRole: Role
    onMemberUpdated?: () => void
}

// ============================================
// ROLE ICON COMPONENT
// ============================================

function RoleIcon({ role, className }: { role: string; className?: string }) {
    switch (role) {
        case 'owner':
            return <Crown className={className} />
        case 'admin':
            return <Shield className={className} />
        case 'agent':
            return <MessageSquare className={className} />
        default:
            return <User className={className} />
    }
}

// ============================================
// COMPONENT
// ============================================

export function MemberList({
    members,
    currentUserRole,
    onMemberUpdated,
}: MemberListProps) {
    const [editingMember, setEditingMember] = useState<Member | null>(null)
    const [removingMember, setRemovingMember] = useState<Member | null>(null)

    // Can current user manage other members?
    const canManage = ['owner', 'admin'].includes(currentUserRole)

    if (members.length === 0) {
        return (
            <Empty>
                <EmptyMedia variant="icon">
                    <User className="size-6" />
                </EmptyMedia>
                <EmptyHeader>
                    <EmptyTitle>Aucun membre</EmptyTitle>
                    <EmptyDescription>
                        Il n'y a aucun membre dans cette équipe.
                    </EmptyDescription>
                </EmptyHeader>
            </Empty>
        )
    }

    return (
        <>
            <div className="space-y-3">
                {members.map((member) => (
                    <MemberCard
                        key={member.id}
                        member={member}
                        canManage={canManage}
                        currentUserRole={currentUserRole}
                        onEdit={() => setEditingMember(member)}
                        onRemove={() => setRemovingMember(member)}
                    />
                ))}
            </div>

            {/* Edit Modal */}
            <EditMemberModal
                member={editingMember ? {
                    id: editingMember.id as Id<"memberships">,
                    userId: editingMember.userId as Id<"users">,
                    name: editingMember.user.name || editingMember.user.email,
                    email: editingMember.user.email,
                    role: editingMember.role as Role,
                } : null}
                currentUserRole={currentUserRole}
                open={!!editingMember}
                onOpenChange={(open: boolean) => !open && setEditingMember(null)}
                onSuccess={() => {
                    setEditingMember(null)
                    onMemberUpdated?.()
                }}
            />

            {/* Remove Dialog */}
            <RemoveMemberDialog
                member={removingMember ? {
                    id: removingMember.id as Id<"memberships">,
                    userId: removingMember.userId as Id<"users">,
                    name: removingMember.user.name || removingMember.user.email,
                    email: removingMember.user.email,
                    role: removingMember.role as Role,
                } : null}
                open={!!removingMember}
                onOpenChange={(open: boolean) => !open && setRemovingMember(null)}
                onSuccess={() => {
                    setRemovingMember(null)
                    onMemberUpdated?.()
                }}
            />
        </>
    )
}

// ============================================
// MEMBER CARD
// ============================================

interface MemberCardProps {
    member: Member
    canManage: boolean
    currentUserRole: Role
    onEdit: () => void
    onRemove: () => void
}

function MemberCard({
    member,
    canManage,
    currentUserRole,
    onEdit,
    onRemove,
}: MemberCardProps) {
    const initials = getInitials(member.user.name || member.user.email)
    const memberRole = isValidRole(member.role) ? member.role : 'agent'

    // Can this specific member be managed?
    const canManageThis =
        canManage &&
        !member.isCurrentUser &&
        member.role !== 'owner' &&
        canManageRole(currentUserRole, memberRole)

    return (
        <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group">
            {/* Avatar */}
            <Avatar className="h-11 w-11 ring-2 ring-white">
                <AvatarImage src={member.user.avatar || undefined} />
                <AvatarFallback className="bg-gradient-to-br from-green-500 to-green-600 text-white font-semibold">
                    {initials}
                </AvatarFallback>
            </Avatar>

            {/* Member Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 truncate">
                        {member.user.name || member.user.email}
                    </span>
                    {member.isCurrentUser && (
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 border-0">
                            vous
                        </Badge>
                    )}
                </div>
                {member.user.name && (
                    <p className="text-sm text-gray-500 truncate">
                        {member.user.email}
                    </p>
                )}
            </div>

            {/* Role Badge */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${member.roleBgColor}`}>
                <RoleIcon role={member.role} className={`h-4 w-4 ${member.roleColor}`} />
                <span className={`text-sm font-medium ${member.roleColor}`}>
                    {member.roleLabel}
                </span>
            </div>

            {/* Joined Date */}
            <div className="hidden sm:block text-sm text-gray-500 min-w-[100px]">
                {formatDate(member.joinedAt)}
            </div>

            {/* Actions */}
            {canManage && (
                <div className="w-9">
                    {canManageThis && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={onEdit}>
                                    <Shield className="mr-2 h-4 w-4" />
                                    Modifier le role
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={onRemove}
                                    className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Retirer de l'equipe
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            )}
        </div>
    )
}

// ============================================
// HELPERS
// ============================================

function getInitials(name: string): string {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
}

function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    })
}
