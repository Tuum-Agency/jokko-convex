/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║ components/conversations/AssignToMemberModal.tsx
 * ╠═══════════════════════════════════════════════════════════════╣
 * ║                                                               ║
 * ║     Modal pour choisir un membre a assigner                   ║
 * ║                                                               ║
 * ║     - Liste des membres de l'equipe                           ║
 * ║     - Recherche par nom/email                                 ║
 * ║     - Note optionnelle                                        ║
 * ║                                                               ║
 * ╠═══════════════════════════════════════════════════════════════╣
 * ║ DESCRIPTION:                                                  ║
 * ║   Modal pour selectionner un membre et assigner une conv.     ║
 * ╚═══════════════════════════════════════════════════════════════╝
 */

'use client'

import { useState, useMemo } from 'react'
import { useQuery } from 'convex/react'
import { Loader2, Search, Check, Building2 } from 'lucide-react'

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { api } from '@/convex/_generated/api'
import { useAssignment } from '@/hooks/useAssignment'

import { cn } from '@/lib/utils'
import { useCurrentOrg } from '@/hooks/use-current-org'

// ============================================
// TYPES
// ============================================

interface Member {
    id: string
    role: string
    roleLabel: string
    roleIcon: string
    poleId?: string | null
    user: {
        id: string
        name: string | null
        email: string
        avatar: string | null
    }
}

interface Pole {
    id: string
    name: string
    color?: string | null
}

interface AssignToMemberModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    conversationId: string
    currentAssigneeId?: string
    onSuccess: () => void
}

// ============================================
// COMPONENT
// ============================================

export function AssignToMemberModal({
    open,
    onOpenChange,
    conversationId,
    currentAssigneeId,
    onSuccess,
}: AssignToMemberModalProps) {
    const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)
    const [note, setNote] = useState('')
    const [search, setSearch] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const { currentOrg } = useCurrentOrg();

    // Fetch team members via Convex
    const membersData = useQuery(api.team.listMembers, currentOrg ? { organizationId: currentOrg._id } : "skip");

    // Fetch poles via Convex
    const polesData = useQuery(api.poles.list, currentOrg ? { organizationId: currentOrg._id } : "skip");

    const { assignTo } = useAssignment({
        onSuccess: () => {
            toast.success('La conversation a ete assignee avec succes')
            onSuccess()
            onOpenChange(false)
        },
        onError: (error) => {
            toast.error(error)
        }
    });

    const isLoading = membersData === undefined || polesData === undefined;

    // Only show agents (not owner/admin)
    const agents: Member[] = useMemo(() => {
        if (!membersData) return [];
        return (membersData.members || [])
            .filter((m: any) => m.role === 'agent')
            .map((m: any) => ({
                id: m.userId, // Use User ID for assignment
                role: m.role,
                roleLabel: m.role === 'owner' ? 'Proprietaire' : m.role === 'admin' ? 'Admin' : 'Agent',
                roleIcon: '', // Not used in UI yet?
                poleId: m.poleId,
                user: {
                    id: m.userId,
                    name: m.user.name,
                    email: m.user.email,
                    avatar: m.user.avatar
                }
            }));
    }, [membersData])

    const poles: Pole[] = polesData?.poles || []

    const filteredAgents = useMemo(() => {
        if (!search) return agents
        const lowerSearch = search.toLowerCase()
        return agents.filter(
            (agent) =>
                agent.user.name?.toLowerCase().includes(lowerSearch) ||
                agent.user.email.toLowerCase().includes(lowerSearch)
        )
    }, [agents, search])

    const groupedAgents = useMemo(() => {
        const groups: Record<string, Member[]> = {}
        filteredAgents.forEach((agent) => {
            if (agent.poleId) {
                if (!groups[agent.poleId]) {
                    groups[agent.poleId] = []
                }
                groups[agent.poleId].push(agent)
            }
        })
        return groups
    }, [filteredAgents])

    const ungroupedAgents = useMemo(() => {
        return filteredAgents.filter((agent) => !agent.poleId)
    }, [filteredAgents])

    const hasAnyAgents = filteredAgents.length > 0

    const handleSubmit = async () => {
        if (!selectedMemberId) return

        setIsSubmitting(true)
        try {
            // We need to find the User ID for the selected Member (which is Membership ID currently)
            // Wait, I need User ID.
            // I'll update key mapping below.

            // Actually, let's fix the mapping in useMemo above or update listMembers.
            // For now, assume I fix listMembers to return userId.

            await assignTo(conversationId, selectedMemberId, note || undefined);
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Assigner a un membre</DialogTitle>
                    <DialogDescription>
                        Choisissez un membre de l'equipe pour gerer cette conversation.
                    </DialogDescription>
                </DialogHeader>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Rechercher un membre..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>

                {/* Members List */}
                <ScrollArea className="h-[280px] border rounded-md">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : !hasAnyAgents ? (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                            Aucun agent trouve
                        </div>
                    ) : (
                        <div className="p-2 space-y-2">
                            {/* Agents grouped by pole */}
                            {poles.map((pole) => {
                                const poleAgents = groupedAgents[pole.id]
                                if (!poleAgents || poleAgents.length === 0) return null

                                return (
                                    <div key={pole.id}>
                                        {/* Pole header */}
                                        <div className="flex items-center gap-2 px-2 py-1.5 mb-1">
                                            <div
                                                className="p-1 rounded"
                                                style={{ backgroundColor: `${pole.color}20` }}
                                            >
                                                <Building2
                                                    className="h-3 w-3"
                                                    style={{ color: pole.color || '#6366f1' }}
                                                />
                                            </div>
                                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                {pole.name}
                                            </span>
                                        </div>
                                        {/* Agents in this pole */}
                                        <div className="space-y-1">
                                            {poleAgents.map((agent) => (
                                                <AgentButton
                                                    key={agent.id}
                                                    agent={agent}
                                                    isSelected={selectedMemberId === agent.id}
                                                    isCurrent={currentAssigneeId === agent.id}
                                                    onSelect={() => setSelectedMemberId(agent.id)}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )
                            })}

                            {/* Ungrouped agents */}
                            {ungroupedAgents.length > 0 && (
                                <div>
                                    {Object.keys(groupedAgents).length > 0 && (
                                        <div className="flex items-center gap-2 px-2 py-1.5 mb-1">
                                            <div className="p-1 rounded bg-gray-100">
                                                <Building2 className="h-3 w-3 text-gray-400" />
                                            </div>
                                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                Sans pole
                                            </span>
                                        </div>
                                    )}
                                    <div className="space-y-1">
                                        {ungroupedAgents.map((agent) => (
                                            <AgentButton
                                                key={agent.id}
                                                agent={agent}
                                                isSelected={selectedMemberId === agent.id}
                                                isCurrent={currentAssigneeId === agent.id}
                                                onSelect={() => setSelectedMemberId(agent.id)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </ScrollArea>

                {/* Note */}
                <div className="space-y-2">
                    <Label htmlFor="note">Note (optionnel)</Label>
                    <Textarea
                        id="note"
                        placeholder="Contexte pour le transfert..."
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        rows={2}
                    />
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Annuler
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!selectedMemberId || isSubmitting}
                        className="bg-green-500 hover:bg-green-600"
                    >
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Assigner
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

// ============================================
// AGENT BUTTON COMPONENT
// ============================================

interface AgentButtonProps {
    agent: Member
    isSelected: boolean
    isCurrent: boolean
    onSelect: () => void
}

function AgentButton({ agent, isSelected, isCurrent, onSelect }: AgentButtonProps) {
    const displayName = agent.user.name || agent.user.email

    return (
        <button
            onClick={onSelect}
            disabled={isCurrent}
            className={cn(
                'w-full flex items-center gap-3 p-2 rounded-md text-left transition-colors',
                isSelected && 'bg-green-50 border border-green-500',
                !isSelected && !isCurrent && 'hover:bg-muted',
                isCurrent && 'opacity-50 cursor-not-allowed'
            )}
        >
            {/* Selection indicator */}
            <div
                className={cn(
                    'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                    isSelected
                        ? 'border-green-500 bg-green-500 text-white'
                        : 'border-muted-foreground/30'
                )}
            >
                {isSelected && <Check className="h-3 w-3" />}
            </div>

            {/* Avatar */}
            <Avatar className="h-8 w-8">
                <AvatarImage src={agent.user.avatar || undefined} />
                <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
            </Avatar>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{displayName}</span>
                    {isCurrent && (
                        <Badge variant="secondary" className="text-xs">
                            Actuel
                        </Badge>
                    )}
                </div>
                <div className="text-xs text-muted-foreground">
                    {agent.user.email}
                </div>
            </div>
        </button>
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
