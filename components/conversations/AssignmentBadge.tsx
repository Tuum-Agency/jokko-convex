/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║ components/conversations/AssignmentBadge.tsx
 * ╠═══════════════════════════════════════════════════════════════╣
 * ║                                                               ║
 * ║     Badge affichant le statut d'assignation                   ║
 * ║                                                               ║
 * ║     [Avatar Amadou]  ou  [Non assigne]                        ║
 * ║                                                               ║
 * ╠═══════════════════════════════════════════════════════════════╣
 * ║ DESCRIPTION:                                                  ║
 * ║   Badge pour afficher qui est assigne a une conversation.     ║
 * ╚═══════════════════════════════════════════════════════════════╝
 */

'use client'

import { User, UserX } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

// ============================================
// TYPES
// ============================================

export interface Assignee {
    id: string
    name: string | null
    email: string
    avatar: string | null
}

interface AssignmentBadgeProps {
    assignedTo: Assignee | null
    assignedAt?: Date | string | null
    showAvatar?: boolean
    size?: 'sm' | 'md'
    className?: string
}

// ============================================
// COMPONENT
// ============================================

export function AssignmentBadge({
    assignedTo,
    assignedAt,
    showAvatar = true,
    size = 'md',
    className,
}: AssignmentBadgeProps) {
    if (!assignedTo) {
        return (
            <Badge
                variant="outline"
                className={cn(
                    'gap-1 text-muted-foreground',
                    size === 'sm' && 'text-xs py-0',
                    className
                )}
            >
                <UserX className={cn('h-3 w-3', size === 'sm' && 'h-2.5 w-2.5')} />
                Non assigne
            </Badge>
        )
    }

    const displayName = assignedTo.name || assignedTo.email.split('@')[0]
    const initials = getInitials(displayName)

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Badge
                        variant="secondary"
                        className={cn(
                            'gap-1.5 bg-green-50 text-green-700 hover:bg-green-100 border-green-200',
                            size === 'sm' && 'text-xs py-0',
                            className
                        )}
                    >
                        {showAvatar ? (
                            <Avatar className={cn('h-4 w-4', size === 'sm' && 'h-3 w-3')}>
                                <AvatarImage src={assignedTo.avatar || undefined} />
                                <AvatarFallback className="text-[8px] bg-green-200 text-green-800">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                        ) : (
                            <User className={cn('h-3 w-3', size === 'sm' && 'h-2.5 w-2.5')} />
                        )}
                        <span className="max-w-[100px] truncate">{displayName}</span>
                    </Badge>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Assigne a {displayName}</p>
                    {assignedAt && (
                        <p className="text-xs text-muted-foreground">
                            {formatRelativeDate(assignedAt)}
                        </p>
                    )}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
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

function formatRelativeDate(date: Date | string): string {
    const d = new Date(date)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "A l'instant"
    if (diffMins < 60) return `Il y a ${diffMins} min`
    if (diffHours < 24) return `Il y a ${diffHours}h`
    if (diffDays < 7) return `Il y a ${diffDays}j`

    return d.toLocaleDateString('fr-SN', { day: 'numeric', month: 'short' })
}
