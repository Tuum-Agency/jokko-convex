/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║             components/team/MemberList.tsx                    ║
 * ╠═══════════════════════════════════════════════════════════════╣
 * ║                                                               ║
 * ║     Liste des membres de l'equipe avec actions.               ║
 * ║                                                               ║
 * ║     Features:                                                 ║
 * ║     - Statut de presence en temps reel (dot + label)          ║
 * ║     - Charge de travail par agent (progress bar)              ║
 * ║     - Derniere activite (temps relatif)                       ║
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
import { useRouter } from 'next/navigation'
import {
    MoreHorizontal,
    Shield,
    Trash2,
    Crown,
    MessageSquare,
    User,
    Building2,
    ArrowRightLeft,
    X,
    UserX,
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
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Empty,
    EmptyHeader,
    EmptyTitle,
    EmptyDescription,
    EmptyMedia
} from '@/components/ui/empty'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

import { cn } from '@/lib/utils'
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { EditMemberModal } from './EditMemberModal'
import { RemoveMemberDialog } from './RemoveMemberDialog'
import { type Role, ROLE_DEFINITIONS, canManageRole, isValidRole, getAssignableRoles } from '@/lib/team/roles'
import { Id } from "@/convex/_generated/dataModel"
import { type Pole } from './PolesSection'

// ============================================
// TYPES
// ============================================

export type MemberStatus = 'ONLINE' | 'BUSY' | 'AWAY' | 'OFFLINE'

export interface Member {
    id: string
    userId: string
    role: string
    poleId?: string
    poleName?: string
    // Presence
    status: MemberStatus
    // Workload
    activeConversations: number
    maxConversations: number
    // Last activity
    lastSeenAt: number
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
    poles?: Pole[]
    onMemberUpdated?: () => void
}

// ============================================
// STATUS CONFIG
// ============================================

const STATUS_CONFIG: Record<MemberStatus, {
    label: string
    dotColor: string
    textColor: string
}> = {
    ONLINE: {
        label: 'En ligne',
        dotColor: 'bg-green-500',
        textColor: 'text-green-600',
    },
    BUSY: {
        label: 'Occupe',
        dotColor: 'bg-amber-500',
        textColor: 'text-amber-600',
    },
    AWAY: {
        label: 'Absent',
        dotColor: 'bg-gray-400',
        textColor: 'text-gray-500',
    },
    OFFLINE: {
        label: 'Hors ligne',
        dotColor: 'bg-red-500',
        textColor: 'text-red-500',
    },
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
// STATUS DOT COMPONENT
// ============================================

function StatusDot({ status }: { status: MemberStatus }) {
    const config = STATUS_CONFIG[status]
    return (
        <span
            className={cn(
                'absolute bottom-0 right-0 h-3 w-3 rounded-full ring-2 ring-white',
                config.dotColor,
                status === 'ONLINE' && 'animate-pulse'
            )}
            aria-label={config.label}
        />
    )
}

// ============================================
// WORKLOAD BAR COMPONENT
// ============================================

function WorkloadBar({ active, max }: { active: number; max: number }) {
    const ratio = max > 0 ? active / max : 0
    const percent = Math.min(Math.round(ratio * 100), 100)

    let barColor = 'bg-green-500'
    if (ratio >= 0.8) barColor = 'bg-red-500'
    else if (ratio >= 0.5) barColor = 'bg-amber-500'

    return (
        <div className="flex items-center gap-2 min-w-[120px]">
            <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                    className={cn('h-full rounded-full transition-all duration-300', barColor)}
                    style={{ width: `${percent}%` }}
                />
            </div>
            <span className="text-xs text-gray-500 whitespace-nowrap">
                {active}/{max}
            </span>
        </div>
    )
}

// ============================================
// RELATIVE TIME HELPER
// ============================================

function formatRelativeTime(timestamp: number): { text: string; isActive: boolean } {
    const now = Date.now()
    const diffMs = now - timestamp
    const diffMin = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMin < 5) {
        return { text: 'Actif maintenant', isActive: true }
    }
    if (diffMin < 60) {
        return { text: `Il y a ${diffMin}min`, isActive: false }
    }
    if (diffHours < 24) {
        return { text: `Il y a ${diffHours}h`, isActive: false }
    }
    return { text: `Il y a ${diffDays}j`, isActive: false }
}

// ============================================
// ROLE DISPLAY HELPERS
// ============================================

const ROLE_DISPLAY: Record<string, { label: string; color: string; bgColor: string }> = {
    owner: { label: 'Proprietaire', color: 'text-amber-600', bgColor: 'bg-amber-50' },
    admin: { label: 'Administrateur', color: 'text-purple-600', bgColor: 'bg-purple-50' },
    agent: { label: 'Agent', color: 'text-green-600', bgColor: 'bg-green-50' },
}

function getRoleDisplay(role: string) {
    return ROLE_DISPLAY[role] || ROLE_DISPLAY.agent
}

// ============================================
// ROLE DISTRIBUTION CHART
// ============================================

const ROLE_CHART_CONFIG: Record<string, { label: string; color: string; textColor: string }> = {
    owner: { label: 'Proprietaires', color: 'bg-emerald-500', textColor: 'text-emerald-600' },
    admin: { label: 'Administrateurs', color: 'bg-blue-500', textColor: 'text-blue-600' },
    agent: { label: 'Agents', color: 'bg-gray-400', textColor: 'text-gray-500' },
}

export function RoleDistributionChart({ members }: { members: Member[] }) {
    const total = members.length
    if (total === 0) return null

    const counts: Record<string, number> = { owner: 0, admin: 0, agent: 0 }
    for (const m of members) {
        const role = m.role in counts ? m.role : 'agent'
        counts[role]++
    }

    const segments = (['owner', 'admin', 'agent'] as const).filter(r => counts[r] > 0)

    return (
        <div className="space-y-3">
            {/* Stacked bar */}
            <div className="flex h-3 rounded-full overflow-hidden bg-gray-100">
                {segments.map((role) => {
                    const pct = (counts[role] / total) * 100
                    const config = ROLE_CHART_CONFIG[role]
                    return (
                        <div
                            key={role}
                            className={`${config.color} transition-all duration-500`}
                            style={{ width: `${pct}%` }}
                            title={`${config.label}: ${counts[role]} (${Math.round(pct)}%)`}
                        />
                    )
                })}
            </div>

            {/* Labels */}
            <div className="flex flex-wrap gap-4">
                {segments.map((role) => {
                    const config = ROLE_CHART_CONFIG[role]
                    const pct = Math.round((counts[role] / total) * 100)
                    return (
                        <div key={role} className="flex items-center gap-2">
                            <div className={`h-2.5 w-2.5 rounded-full ${config.color}`} />
                            <span className={`text-xs font-medium ${config.textColor}`}>
                                {config.label}
                            </span>
                            <span className="text-xs text-gray-400">
                                {counts[role]} ({pct}%)
                            </span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

// ============================================
// COMPONENT
// ============================================

export function MemberList({
    members,
    currentUserRole,
    poles = [],
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
                        Il n'y a aucun membre dans cette equipe.
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
                        poles={poles}
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
    poles?: Pole[]
    onEdit: () => void
    onRemove: () => void
}

function MemberCard({
    member,
    canManage,
    currentUserRole,
    poles = [],
    onEdit,
    onRemove,
}: MemberCardProps) {
    const router = useRouter()
    const initials = getInitials(member.user.name || member.user.email)
    const memberRole = isValidRole(member.role) ? member.role : 'agent'

    const updateRole = useMutation(api.team.updateRole)
    const changePoleMutation = useMutation(api.team.changePole)

    // Can this specific member be managed?
    const canManageThis =
        canManage &&
        !member.isCurrentUser &&
        member.role !== 'owner' &&
        canManageRole(currentUserRole, memberRole)

    // Status config
    const statusConfig = STATUS_CONFIG[member.status] || STATUS_CONFIG.OFFLINE

    // Last activity
    const lastActivity = formatRelativeTime(member.lastSeenAt)

    // Quick role change handler
    const handleQuickRoleChange = async (newRole: string) => {
        try {
            await updateRole({
                membershipId: member.id as Id<"memberships">,
                role: newRole.toUpperCase(),
            })
        } catch {
            // Error handled silently -- the EditMemberModal provides detailed error feedback
        }
    }

    // Navigate to conversation search for this member
    const handleSendMessage = () => {
        router.push(`/dashboard/conversations?search=${encodeURIComponent(member.user.email)}`)
    }

    // Change pole handler
    const handleChangePole = async (poleId: string) => {
        try {
            await changePoleMutation({
                membershipId: member.id as Id<"memberships">,
                poleId: poleId === "__none__" ? undefined : poleId as Id<"poles">,
            })
        } catch (error) {
            console.error('Change pole error:', error)
        }
    }

    // Assignable roles for quick change submenu
    const assignableRoles = getAssignableRoles(currentUserRole)

    return (
        <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group">
            {/* Avatar with Status Dot */}
            <div className="relative">
                <Avatar className="h-11 w-11 ring-2 ring-white">
                    <AvatarImage src={member.user.avatar || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-green-500 to-green-600 text-white font-semibold">
                        {initials}
                    </AvatarFallback>
                </Avatar>
                <StatusDot status={member.status} />
            </div>

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
                    {/* Status Label */}
                    <span className={cn('text-xs font-medium hidden lg:inline', statusConfig.textColor)}>
                        {statusConfig.label}
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    {member.user.name && (
                        <p className="text-sm text-gray-500 truncate">
                            {member.user.email}
                        </p>
                    )}
                </div>
            </div>

            {/* Pole Badge */}
            <div className="hidden md:flex items-center gap-1.5">
                {member.poleName ? (
                    <Badge variant="outline" className="text-xs gap-1 bg-blue-50 text-blue-700 border-blue-200">
                        <Building2 className="h-3 w-3" />
                        {member.poleName}
                    </Badge>
                ) : (
                    <Badge variant="outline" className="text-xs text-gray-400 border-gray-200">
                        Aucun pole
                    </Badge>
                )}
            </div>

            {/* Workload Bar */}
            <div className="hidden md:block">
                <WorkloadBar
                    active={member.activeConversations}
                    max={member.maxConversations}
                />
            </div>

            {/* Role Badge */}
            <div className={cn('hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg', getRoleDisplay(member.role).bgColor)}>
                <RoleIcon role={member.role} className={cn('h-4 w-4', getRoleDisplay(member.role).color)} />
                <span className={cn('text-sm font-medium', getRoleDisplay(member.role).color)}>
                    {getRoleDisplay(member.role).label}
                </span>
            </div>

            {/* Last Activity */}
            <div className="hidden sm:block text-sm min-w-[110px] text-right">
                <span className={cn(
                    lastActivity.isActive
                        ? 'text-green-600 font-medium'
                        : 'text-gray-500'
                )}>
                    {lastActivity.text}
                </span>
            </div>

            {/* Actions */}
            {canManage && (
                <div className="w-9">
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
                        <DropdownMenuContent align="end" className="w-52">
                            {/* Quick role change submenu */}
                            {canManageThis && assignableRoles.length > 0 && (
                                <DropdownMenuSub>
                                    <DropdownMenuSubTrigger>
                                        <Shield className="mr-2 h-4 w-4" />
                                        Changer le role
                                    </DropdownMenuSubTrigger>
                                    <DropdownMenuSubContent className="w-44">
                                        {assignableRoles.map((role) => {
                                            const config = ROLE_DEFINITIONS[role]
                                            if (!config) return null
                                            const isCurrentRole = member.role === role
                                            return (
                                                <DropdownMenuItem
                                                    key={role}
                                                    onClick={() => !isCurrentRole && handleQuickRoleChange(role)}
                                                    className={isCurrentRole ? 'bg-gray-50 font-medium' : ''}
                                                    disabled={isCurrentRole}
                                                >
                                                    <RoleIcon role={role} className="mr-2 h-4 w-4" />
                                                    {config.label}
                                                    {isCurrentRole && (
                                                        <span className="ml-auto text-xs text-gray-400">actuel</span>
                                                    )}
                                                </DropdownMenuItem>
                                            )
                                        })}
                                    </DropdownMenuSubContent>
                                </DropdownMenuSub>
                            )}

                            {/* Change Pole sub-menu */}
                            {canManageThis && poles.length > 0 && (
                                <DropdownMenuSub>
                                    <DropdownMenuSubTrigger>
                                        <ArrowRightLeft className="mr-2 h-4 w-4" />
                                        Changer de pole
                                    </DropdownMenuSubTrigger>
                                    <DropdownMenuSubContent className="w-48">
                                        <DropdownMenuItem
                                            onClick={() => handleChangePole("__none__")}
                                            className={cn(!member.poleId && "bg-gray-100")}
                                        >
                                            <X className="mr-2 h-4 w-4 text-gray-400" />
                                            Aucun pole
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        {poles.map((pole) => (
                                            <DropdownMenuItem
                                                key={pole.id}
                                                onClick={() => handleChangePole(pole.id)}
                                                className={cn(member.poleId === pole.id && "bg-blue-50")}
                                            >
                                                <Building2
                                                    className="mr-2 h-4 w-4"
                                                    style={{ color: pole.color || '#6366f1' }}
                                                />
                                                {pole.name}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuSubContent>
                                </DropdownMenuSub>
                            )}

                            {/* Send message */}
                            {!member.isCurrentUser && (
                                <DropdownMenuItem onClick={handleSendMessage}>
                                    <MessageSquare className="mr-2 h-4 w-4" />
                                    Envoyer un message
                                </DropdownMenuItem>
                            )}

                            {canManageThis && (
                                <>
                                    <DropdownMenuSeparator />
                                    {/* Deactivate / Remove */}
                                    <DropdownMenuItem
                                        onClick={onRemove}
                                        className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                    >
                                        <UserX className="mr-2 h-4 w-4" />
                                        Desactiver
                                    </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
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
