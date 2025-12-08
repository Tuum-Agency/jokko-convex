/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║ components/conversations/AssignmentFilters.tsx
 * ╠═══════════════════════════════════════════════════════════════╣
 * ║                                                               ║
 * ║     Filtres d'assignation pour l'inbox                        ║
 * ║                                                               ║
 * ║     [Toutes (25)] [Miennes (5)] [Non assignees 8]             ║
 * ║                                                               ║
 * ╠═══════════════════════════════════════════════════════════════╣
 * ║ DESCRIPTION:                                                  ║
 * ║   Boutons de filtre par assignation avec compteurs.           ║
 * ║   Utilise le meme style ButtonGroup que les filtres de statut.║
 * ╚═══════════════════════════════════════════════════════════════╝
 */

'use client'

import { User, Users, UserX } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import { cn } from '@/lib/utils'

// ============================================
// TYPES
// ============================================

export type AssignmentFilter = 'all' | 'me' | 'unassigned'

interface AssignmentFiltersProps {
    value: AssignmentFilter
    onChange: (value: AssignmentFilter) => void
    counts: {
        total: number
        myConversations: number
        unassigned: number
        unread: number
    }
    className?: string
}

// ============================================
// FILTER TABS
// ============================================

const filterTabs: {
    value: AssignmentFilter
    label: string
    icon: React.ElementType
    countKey: 'total' | 'myConversations' | 'unassigned'
}[] = [
        { value: 'all', label: 'Toutes', icon: Users, countKey: 'total' },
        { value: 'me', label: 'Miennes', icon: User, countKey: 'myConversations' },
        { value: 'unassigned', label: 'Non assignees', icon: UserX, countKey: 'unassigned' },
    ]

// ============================================
// COMPONENT
// ============================================

export function AssignmentFilters({
    value,
    onChange,
    counts,
    className,
}: AssignmentFiltersProps) {
    return (
        <ButtonGroup className={cn('w-full', className)}>
            {filterTabs.map((tab) => {
                const Icon = tab.icon
                const isActive = value === tab.value
                const count = counts[tab.countKey]

                return (
                    <Button
                        key={tab.value}
                        variant={isActive ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => onChange(tab.value)}
                        className={cn(
                            'flex-1 gap-1.5 text-xs',
                            isActive && 'bg-green-500 hover:bg-green-600 border-green-500'
                        )}
                    >
                        <Icon className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">{tab.label}</span>
                        {count > 0 && (
                            <span className={cn(
                                'text-[10px] font-medium',
                                isActive ? 'text-white/80' : 'text-muted-foreground'
                            )}>
                                ({count})
                            </span>
                        )}
                    </Button>
                )
            })}
        </ButtonGroup>
    )
}
