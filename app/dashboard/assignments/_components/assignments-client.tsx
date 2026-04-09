"use client"

import {
    Mail,
    Flame,
    Timer,
    Users,
    UserPlus,
    Loader2,
    AlertCircle,
    ArrowUpRight,
    ArrowDownRight,
    Search,
    CheckSquare,
    Square,
    Clock,
    History,
    X,
    Filter,
    ExternalLink,
} from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { AssignmentSettingsDialog } from './assignments-settings-dialog'
import {
    Empty,
    EmptyContent,
    EmptyDescription,
    EmptyHeader,
    EmptyTitle,
    EmptyMedia,
} from '@/components/ui/empty'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { Id } from '@/convex/_generated/dataModel'
import {
    TooltipProvider,
    Tooltip,
    TooltipTrigger,
    TooltipContent,
} from '@/components/ui/tooltip'
import { useRouter } from 'next/navigation'

// ============================================
// HELPERS
// ============================================

function formatWaitTime(lastMessageAt: number): { text: string; color: string } {
    const diffMs = Date.now() - lastMessageAt
    const diffMin = Math.floor(diffMs / 60000)

    if (diffMin < 5) return { text: `${diffMin}min`, color: "text-green-600 bg-green-50" }
    if (diffMin < 15) return { text: `${diffMin}min`, color: "text-amber-600 bg-amber-50" }
    if (diffMin < 60) return { text: `${diffMin}min`, color: "text-orange-600 bg-orange-50" }
    const hours = Math.floor(diffMin / 60)
    if (hours < 24) return { text: `${hours}h`, color: "text-red-600 bg-red-50" }
    const days = Math.floor(hours / 24)
    return { text: `${days}j`, color: "text-red-700 bg-red-100" }
}

// ============================================
// STAT CARD
// ============================================

const STAT_CARD_CONFIG = [
    { icon: Mail, gradient: 'from-[#14532d] to-[#059669]' },
    { icon: Flame, gradient: 'from-[#166534] to-[#0d9488]' },
    { icon: Timer, gradient: 'from-[#15803d] to-[#10b981]' },
    { icon: Users, gradient: 'from-[#14532d] to-[#34d399]' },
]

function StatsCard({
    title,
    value,
    description,
    icon: Icon,
    trend,
    trendValue,
    gradient,
}: {
    title: string
    value: string | number
    description: string
    icon: React.ElementType
    trend?: 'up' | 'down'
    trendValue?: string
    gradient: string
}) {
    return (
        <Card className="bg-white border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <div className={cn("h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-gradient-to-br flex items-center justify-center shadow-lg shadow-green-900/20", gradient)} aria-hidden="true">
                        <Icon className="h-[18px] w-[18px] sm:h-5 sm:w-5 text-white" />
                    </div>
                    {trend && trendValue && (
                        <span className={cn(
                            "flex items-center gap-0.5 text-[11px] font-semibold px-2 py-0.5 rounded-full",
                            trend === 'up' ? 'text-green-700 bg-green-50' : 'text-red-600 bg-red-50'
                        )}>
                            {trend === 'up' ? (
                                <ArrowUpRight className="h-3 w-3" />
                            ) : (
                                <ArrowDownRight className="h-3 w-3" />
                            )}
                            {trendValue}
                        </span>
                    )}
                </div>
                <p className="text-xs sm:text-sm font-medium text-gray-500 mb-0.5">{title}</p>
                <span className="text-xl sm:text-3xl font-bold text-gray-900 tracking-tight">{value}</span>
                <p className="text-[11px] text-gray-400 mt-0.5">{description}</p>
            </CardContent>
        </Card>
    )
}

// ============================================
// ASSIGNMENT HISTORY POPOVER (#33)
// ============================================

function AssignmentHistoryPopover({ conversationId }: { conversationId: Id<"conversations"> }) {
    const history = useQuery(api.assignments.getAssignmentHistory, { conversationId })

    return (
        <Popover>
            <PopoverTrigger asChild>
                <button
                    className="p-1 rounded hover:bg-gray-100 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                >
                    <History className="h-3.5 w-3.5 text-gray-400" />
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-3" align="end" onClick={(e) => e.stopPropagation()}>
                <p className="text-xs font-semibold text-gray-700 mb-2">Historique d&apos;attribution</p>
                {!history || history.length === 0 ? (
                    <p className="text-xs text-gray-400">Aucun historique</p>
                ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                        {history.map((h) => (
                            <div key={h.id} className="flex items-start gap-2 text-xs">
                                <div className={cn(
                                    "mt-0.5 h-2 w-2 rounded-full shrink-0",
                                    h.status === "ACTIVE" ? "bg-green-500" :
                                    h.status === "TRANSFERRED" ? "bg-amber-500" : "bg-gray-300"
                                )} />
                                <div className="flex-1 min-w-0">
                                    <p className="text-gray-700">
                                        <span className="font-medium">{h.assignedByName}</span>
                                        {" "}
                                        <span className="text-gray-400">
                                            ({h.assignedBy === "SYSTEM" ? "auto" : "manuel"})
                                        </span>
                                    </p>
                                    <p className="text-gray-400">
                                        {new Date(h.assignedAt).toLocaleDateString('fr-FR', {
                                            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                                        })}
                                    </p>
                                    {h.note && <p className="text-gray-500 italic mt-0.5">{h.note}</p>}
                                </div>
                                <Badge variant="secondary" className="text-[9px] px-1 py-0 shrink-0">
                                    {h.status}
                                </Badge>
                            </div>
                        ))}
                    </div>
                )}
            </PopoverContent>
        </Popover>
    )
}

// ============================================
// LOADING SKELETON
// ============================================

function AssignmentsSkeleton() {
    return (
        <div className="space-y-6">
            <div>
                <Skeleton className="h-7 w-64 mb-2" />
                <Skeleton className="h-4 w-80" />
            </div>
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <Card key={i} className="bg-white border-gray-100 shadow-sm">
                        <CardContent className="p-5">
                            <Skeleton className="h-11 w-11 rounded-full mb-4" />
                            <Skeleton className="h-3 w-20 mb-2" />
                            <Skeleton className="h-7 w-14 mb-1" />
                            <Skeleton className="h-2.5 w-28" />
                        </CardContent>
                    </Card>
                ))}
            </div>
            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2 bg-white border-gray-100 shadow-sm">
                    <CardContent className="p-6">
                        <Skeleton className="h-[400px] w-full rounded-lg" />
                    </CardContent>
                </Card>
                <Card className="bg-white border-gray-100 shadow-sm">
                    <CardContent className="p-6">
                        <div className="space-y-4">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <Skeleton className="h-10 w-10 rounded-full" />
                                    <div className="flex-1"><Skeleton className="h-4 w-24 mb-1" /><Skeleton className="h-3 w-16" /></div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function AssignmentsClient() {
    const router = useRouter()
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)
    const [search, setSearch] = useState('')                          // #30 - Search
    const [selectedAgent, setSelectedAgent] = useState<string | null>(null) // #35 - Agent filter
    const [selectedDept, setSelectedDept] = useState<string | null>(null)   // #32 - Department filter
    const [bulkMode, setBulkMode] = useState(false)                   // #28 - Bulk mode
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set()) // #28 - Selected conversations

    const updatePresence = useMutation(api.users.updatePresence)
    const role = useQuery(api.users.currentUserRole)

    useEffect(() => {
        const timer = setInterval(() => {
            updatePresence()
        }, 60000)
        updatePresence()
        return () => clearInterval(timer)
    }, [updatePresence])

    // Queries
    const statsData = useQuery(api.assignments.getStats)
    const conversationsData = useQuery(api.assignments.getConversationsQueue)
    const agentsData = useQuery(api.assignments.getAgentsList)
    const assignMutation = useMutation(api.assignments.assign)
    const bulkAssignMutation = useMutation(api.assignments.bulkAssign)
    const settings = useQuery(api.assignments.getAssignmentSettings)

    // #32 - Unique departments
    const departments = useMemo(() => {
        if (!agentsData) return []
        const depts = new Set(agentsData.map((a: any) => a.department))
        return Array.from(depts).filter(Boolean) as string[]
    }, [agentsData])

    // #30 + #35 + #32 - Filtered conversations
    const filteredConversations = useMemo(() => {
        if (!conversationsData) return []
        let list = conversationsData

        // Search filter (#30)
        if (search.trim()) {
            const q = search.toLowerCase()
            list = list.filter((c: any) =>
                (c.business || '').toLowerCase().includes(q) ||
                (c.phone || '').toLowerCase().includes(q) ||
                (c.message || '').toLowerCase().includes(q)
            )
        }

        // Agent filter (#35)
        if (selectedAgent) {
            list = list.filter((c: any) => c.assignedTo === selectedAgent)
        }

        // Department filter (#32)
        if (selectedDept) {
            list = list.filter((c: any) => c.departmentId === selectedDept)
        }

        return list
    }, [conversationsData, search, selectedAgent, selectedDept])

    // #28 - Toggle selection
    const toggleSelection = useCallback((id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }, [])

    // #28 - Handle bulk assign
    const handleBulkAssign = useCallback(async (memberId: string) => {
        if (selectedIds.size === 0) return
        await bulkAssignMutation({
            conversationIds: Array.from(selectedIds) as Id<"conversations">[],
            memberId: memberId as Id<"users">,
        })
        setSelectedIds(new Set())
        setBulkMode(false)
    }, [selectedIds, bulkAssignMutation])

    if (role === undefined || statsData === undefined) {
        return <AssignmentsSkeleton />
    }

    if (role === 'AGENT') {
        return (
            <div className="p-6">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Acces refuse</AlertTitle>
                    <AlertDescription>
                        Vous n&apos;avez pas les autorisations necessaires pour acceder a cette page.
                    </AlertDescription>
                </Alert>
            </div>
        )
    }

    const hasOnlyOneMember = agentsData && agentsData.length <= 1

    const agentsByDept = (agentsData || []).reduce((acc: Record<string, any[]>, agent: any) => {
        const dept = agent.department || "General"
        if (!acc[dept]) acc[dept] = []
        acc[dept].push(agent)
        return acc
    }, {})

    // #34 - Team workload calculation
    const totalLoad = (agentsData || []).reduce((sum: number, a: any) => sum + a.load, 0)
    const totalCapacity = (agentsData || []).reduce((sum: number, a: any) => sum + a.maxLoad, 0)
    const workloadPercent = totalCapacity > 0 ? Math.round((totalLoad / totalCapacity) * 100) : 0

    const stats = [
        {
            title: 'Non assignees',
            value: statsData?.unassignedCount ?? '-',
            icon: Mail,
            gradient: STAT_CARD_CONFIG[0].gradient,
            trend: 'up' as const,
            trendValue: '+2',
            description: 'depuis 1h'
        },
        {
            title: 'Urgentes',
            value: statsData?.urgentCount ?? '-',
            icon: Flame,
            gradient: STAT_CARD_CONFIG[1].gradient,
            trend: 'up' as const,
            trendValue: '+12.5%',
            description: 'necessitent attention'
        },
        {
            title: 'Temps moyen',
            value: statsData?.avgResponseTime ?? '-',
            icon: Timer,
            gradient: STAT_CARD_CONFIG[2].gradient,
            trend: 'down' as const,
            trendValue: '-15%',
            description: 'amelioration'
        },
        {
            title: 'Agents en ligne',
            value: statsData?.onlineAgentsCount ?? '-',
            icon: Users,
            gradient: STAT_CARD_CONFIG[3].gradient,
            trend: 'up' as const,
            trendValue: '+1',
            description: 'connectes'
        },
    ]

    const unassignedConversations = filteredConversations.filter((c: any) => !c.assignedTo)
    const assignedConversations = filteredConversations.filter((c: any) => c.assignedTo)

    // Active filter indicators
    const hasActiveFilters = !!search || !!selectedAgent || !!selectedDept

    const ConversationList = ({ conversations, isAssigned }: { conversations: any[], isAssigned: boolean }) => (
        <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
            {conversations.length === 0 && (
                <div className="p-8 flex items-center justify-center">
                    <Empty>
                        <EmptyHeader>
                            <EmptyMedia variant="icon"><Mail className="h-6 w-6" /></EmptyMedia>
                            <EmptyTitle>Aucune conversation</EmptyTitle>
                        </EmptyHeader>
                        <EmptyContent>
                            <EmptyDescription>
                                {hasActiveFilters
                                    ? "Aucun resultat pour ces filtres."
                                    : isAssigned
                                        ? "Aucune conversation assignee pour le moment."
                                        : "Il n'y a actuellement aucune conversation en attente d'attribution."}
                            </EmptyDescription>
                        </EmptyContent>
                    </Empty>
                </div>
            )}
            {conversations.map((conv: any) => {
                const waitTime = !isAssigned && conv.lastMessageAt ? formatWaitTime(conv.lastMessageAt) : null

                return (
                    <div
                        key={conv.id}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer group"
                        onClick={() => {
                            if (bulkMode) {
                                toggleSelection(conv.id)
                            } else {
                                // #29 - Click to open conversation
                                router.push(`/dashboard/conversations/${conv.id}`)
                            }
                        }}
                    >
                        {/* #28 - Bulk checkbox */}
                        {bulkMode && (
                            <button
                                className="shrink-0"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    toggleSelection(conv.id)
                                }}
                            >
                                {selectedIds.has(conv.id) ? (
                                    <CheckSquare className="h-4 w-4 text-green-600" />
                                ) : (
                                    <Square className="h-4 w-4 text-gray-300" />
                                )}
                            </button>
                        )}

                        {/* Avatar */}
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#14532d] to-[#059669] flex items-center justify-center text-white text-sm font-semibold shrink-0 shadow-sm">
                            {(conv.business || '?').substring(0, 1).toUpperCase()}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-sm font-medium text-gray-900 truncate">{conv.business || conv.phone}</span>
                                <Badge
                                    variant="secondary"
                                    className={cn(
                                        "text-[10px] font-medium px-1.5 py-0 rounded-full",
                                        conv.priority === 'urgent' ? "bg-red-50 text-red-700 border-red-100" : "bg-gray-100 text-gray-600"
                                    )}
                                >
                                    {conv.priority}
                                </Badge>
                                {/* #31 - Wait time indicator */}
                                {waitTime && (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <span className={cn("flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0 rounded-full", waitTime.color)}>
                                                <Clock className="h-2.5 w-2.5" />
                                                {waitTime.text}
                                            </span>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            En attente depuis {waitTime.text}
                                        </TooltipContent>
                                    </Tooltip>
                                )}
                                <span className="text-[11px] text-gray-400 ml-auto shrink-0">{conv.time}</span>
                            </div>
                            <p className="text-[11px] text-gray-500 truncate">{conv.message}</p>
                            {isAssigned && conv.assigneeName && (
                                <div className="flex items-center gap-1 mt-1">
                                    <Users className="h-3 w-3 text-green-600" />
                                    <span className="text-[10px] text-green-700 font-medium">{conv.assigneeName}</span>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="shrink-0 flex items-center gap-1">
                            {/* #33 - History popover */}
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <AssignmentHistoryPopover conversationId={conv.id} />
                            </span>

                            {/* #29 - External link icon */}
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button
                                            className="p-1 rounded hover:bg-gray-100"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                router.push(`/dashboard/conversations/${conv.id}`)
                                            }}
                                        >
                                            <ExternalLink className="h-3.5 w-3.5 text-gray-400" />
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent>Ouvrir la conversation</TooltipContent>
                                </Tooltip>
                            </span>

                            {/* Assign button */}
                            {!bulkMode && (
                                hasOnlyOneMember ? (
                                    !conv.assignedTo && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-7 text-xs gap-1 text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700 cursor-pointer"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                const singleAgent = agentsData?.[0]
                                                if (singleAgent) {
                                                    assignMutation({
                                                        conversationId: conv.id as Id<"conversations">,
                                                        memberId: singleAgent.memberId
                                                    })
                                                }
                                            }}
                                        >
                                            <UserPlus className="h-3.5 w-3.5" />
                                            <span className="hidden sm:inline">M&apos;attribuer</span>
                                        </Button>
                                    )
                                ) : (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                            <Button variant="outline" size="sm" className="h-7 text-xs gap-1 text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700 cursor-pointer">
                                                <UserPlus className="h-3.5 w-3.5" />
                                                <span className="hidden sm:inline">{isAssigned ? "Reassigner" : "Assigner"}</span>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-[240px] max-h-[300px] overflow-y-auto">
                                            {Object.entries(agentsByDept).map(([dept, agents]: [string, any], index) => {
                                                const validAgents = agents.filter((a: any) => a.memberId !== conv.assignedTo)
                                                if (validAgents.length === 0) return null

                                                return (
                                                    <div key={dept}>
                                                        {index > 0 && <DropdownMenuSeparator />}
                                                        <DropdownMenuLabel className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{dept}</DropdownMenuLabel>
                                                        {validAgents.map((agent: any) => (
                                                            <DropdownMenuItem
                                                                key={agent.id}
                                                                className="cursor-pointer"
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    assignMutation({
                                                                        conversationId: conv.id as Id<"conversations">,
                                                                        memberId: agent.memberId
                                                                    })
                                                                }}
                                                            >
                                                                <div className="flex items-center gap-2 w-full">
                                                                    <div className={cn("h-2 w-2 rounded-full shrink-0", agent.online ? "bg-green-500" : "bg-gray-300")} />
                                                                    <span className="truncate text-sm">{agent.fullName}</span>
                                                                    {agent.load >= agent.maxLoad && (
                                                                        <span className="ml-auto text-[10px] text-red-500 font-medium whitespace-nowrap">(Full)</span>
                                                                    )}
                                                                </div>
                                                            </DropdownMenuItem>
                                                        ))}
                                                    </div>
                                                )
                                            })}
                                            {(!agentsData || agentsData.length === 0) && (
                                                <div className="p-2 text-xs text-gray-500 text-center">Aucun agent disponible</div>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )
                            )}
                        </div>
                    </div>
                )
            })}
        </div>
    )

    return (
        <TooltipProvider delayDuration={200}>
            <div className="space-y-6">
                {/* ==================== HEADER ==================== */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                            Attribution des conversations
                        </h1>
                        <p className="text-sm text-gray-500 mt-0.5">
                            Assignez les conversations WhatsApp aux agents disponibles
                        </p>
                    </div>
                    <Button
                        variant={settings?.autoAssignEnabled ? "default" : "secondary"}
                        size="sm"
                        className={cn(
                            "h-8 gap-1.5 text-xs rounded-full shadow-sm transition-all cursor-pointer",
                            settings?.autoAssignEnabled
                                ? "bg-emerald-500 hover:bg-emerald-400 text-white shadow-md shadow-emerald-500/25"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        )}
                        onClick={() => setIsSettingsOpen(true)}
                    >
                        {settings === undefined ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : settings?.autoAssignEnabled ? (
                            <>
                                <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                                Auto-attribution: ON
                            </>
                        ) : (
                            <>
                                <div className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                                Auto-attribution: OFF
                            </>
                        )}
                    </Button>
                </div>

                {/* ==================== STAT CARDS ==================== */}
                <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                    {stats.map((stat) => (
                        <StatsCard key={stat.title} {...stat} />
                    ))}
                </div>

                {/* ==================== #34 - TEAM WORKLOAD BAR ==================== */}
                {agentsData && agentsData.length > 0 && (
                    <Card className="bg-white border-gray-100 shadow-sm">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <div className={cn(
                                        "h-2 w-2 rounded-full",
                                        workloadPercent < 50 ? "bg-emerald-500" : workloadPercent < 80 ? "bg-amber-500" : "bg-red-500"
                                    )} />
                                    <span className="text-sm font-medium text-gray-700">Charge de l&apos;équipe</span>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <AlertCircle className="h-3.5 w-3.5 text-gray-400 cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent side="top" className="max-w-[220px] text-xs">
                                            Conversations actives par rapport à la capacité totale de vos agents
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={cn(
                                        "text-xs font-semibold px-2 py-0.5 rounded-full",
                                        workloadPercent < 50 ? "text-emerald-700 bg-emerald-50" : workloadPercent < 80 ? "text-amber-700 bg-amber-50" : "text-red-700 bg-red-50"
                                    )}>
                                        {workloadPercent}%
                                    </span>
                                    <span className="text-sm text-gray-500">
                                        {totalLoad}/{totalCapacity}
                                    </span>
                                </div>
                            </div>
                            <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
                                <div
                                    className={cn(
                                        "h-full rounded-full transition-all duration-500 ease-out",
                                        workloadPercent < 50 ? "bg-gradient-to-r from-emerald-500 to-green-400" :
                                        workloadPercent < 80 ? "bg-gradient-to-r from-amber-500 to-yellow-400" :
                                        "bg-gradient-to-r from-red-500 to-orange-400"
                                    )}
                                    style={{ width: `${workloadPercent}%` }}
                                />
                            </div>
                            {workloadPercent >= 80 && (
                                <p className="text-[11px] text-red-500 font-medium mt-1.5">
                                    Capacité presque atteinte
                                </p>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* ==================== MAIN CONTENT ==================== */}
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Left: Conversations List */}
                    <div className="lg:col-span-2">
                        <Card className="bg-white border-gray-100 shadow-sm">
                            <CardHeader className="pb-2">
                                {/* #30 - Search bar + #28 Bulk toggle + #32 Department filter */}
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                                        <Input
                                            placeholder="Rechercher par nom, telephone..."
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            className="pl-8 h-8 text-xs"
                                        />
                                        {search && (
                                            <button
                                                className="absolute right-2 top-1/2 -translate-y-1/2"
                                                onClick={() => setSearch('')}
                                            >
                                                <X className="h-3 w-3 text-gray-400" />
                                            </button>
                                        )}
                                    </div>

                                    {/* #32 - Department filter */}
                                    {departments.length > 1 && (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="outline" size="sm" className={cn(
                                                    "h-8 text-xs gap-1 cursor-pointer",
                                                    selectedDept && "border-green-300 bg-green-50 text-green-700"
                                                )}>
                                                    <Filter className="h-3 w-3" />
                                                    {selectedDept || "Pole"}
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                    className="cursor-pointer text-xs"
                                                    onClick={() => setSelectedDept(null)}
                                                >
                                                    Tous les poles
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                {departments.map(dept => (
                                                    <DropdownMenuItem
                                                        key={dept}
                                                        className="cursor-pointer text-xs"
                                                        onClick={() => setSelectedDept(dept)}
                                                    >
                                                        {dept}
                                                    </DropdownMenuItem>
                                                ))}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )}

                                    {/* #28 - Bulk mode toggle */}
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant={bulkMode ? "default" : "outline"}
                                                size="sm"
                                                className={cn(
                                                    "h-8 w-8 p-0 cursor-pointer",
                                                    bulkMode && "bg-green-600 hover:bg-green-700"
                                                )}
                                                onClick={() => {
                                                    setBulkMode(!bulkMode)
                                                    if (bulkMode) setSelectedIds(new Set())
                                                }}
                                            >
                                                <CheckSquare className="h-3.5 w-3.5" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Attribution en lot</TooltipContent>
                                    </Tooltip>
                                </div>

                                {/* #35 - Active agent filter indicator */}
                                {selectedAgent && (
                                    <div className="flex items-center gap-2 mb-2 px-1">
                                        <Badge variant="secondary" className="text-xs gap-1 bg-green-50 text-green-700">
                                            Filtre: {agentsData?.find((a: any) => a.memberId === selectedAgent)?.fullName}
                                            <button onClick={() => setSelectedAgent(null)}>
                                                <X className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    </div>
                                )}

                                {/* #28 - Bulk action bar */}
                                {bulkMode && selectedIds.size > 0 && (
                                    <div className="flex items-center gap-2 mb-2 p-2 bg-green-50 rounded-lg border border-green-100">
                                        <span className="text-xs font-medium text-green-700">
                                            {selectedIds.size} selectionnee{selectedIds.size > 1 ? 's' : ''}
                                        </span>
                                        <div className="ml-auto">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button size="sm" className="h-7 text-xs gap-1 bg-green-600 hover:bg-green-700 cursor-pointer">
                                                        <UserPlus className="h-3 w-3" />
                                                        Assigner a...
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-[240px]">
                                                    {Object.entries(agentsByDept).map(([dept, agents]: [string, any], index) => (
                                                        <div key={dept}>
                                                            {index > 0 && <DropdownMenuSeparator />}
                                                            <DropdownMenuLabel className="text-[10px] uppercase text-gray-500">{dept}</DropdownMenuLabel>
                                                            {(agents as any[]).map((agent: any) => (
                                                                <DropdownMenuItem
                                                                    key={agent.id}
                                                                    className="cursor-pointer"
                                                                    onClick={() => handleBulkAssign(agent.memberId)}
                                                                >
                                                                    <div className="flex items-center gap-2 w-full">
                                                                        <div className={cn("h-2 w-2 rounded-full", agent.online ? "bg-green-500" : "bg-gray-300")} />
                                                                        <span className="text-sm">{agent.fullName}</span>
                                                                    </div>
                                                                </DropdownMenuItem>
                                                            ))}
                                                        </div>
                                                    ))}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                )}

                                <Tabs defaultValue="unassigned" className="w-full">
                                    <TabsList className="grid w-full grid-cols-2 h-9">
                                        <TabsTrigger value="unassigned" className="text-xs">
                                            Non assignees ({unassignedConversations.length})
                                        </TabsTrigger>
                                        <TabsTrigger value="assigned" className="text-xs">
                                            Assignees ({assignedConversations.length})
                                        </TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="unassigned" className="mt-3">
                                        <ConversationList conversations={unassignedConversations} isAssigned={false} />
                                    </TabsContent>
                                    <TabsContent value="assigned" className="mt-3">
                                        <ConversationList conversations={assignedConversations} isAssigned={true} />
                                    </TabsContent>
                                </Tabs>
                            </CardHeader>
                        </Card>
                    </div>

                    {/* Right: Agents Status */}
                    <div>
                        <Card className="bg-white border-gray-100 shadow-sm">
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm sm:text-base font-semibold text-gray-900">
                                        Agents
                                    </CardTitle>
                                    <button
                                        onClick={() => setIsSettingsOpen(true)}
                                        className="text-[11px] text-green-700 hover:text-green-800 font-medium cursor-pointer"
                                    >
                                        Parametres
                                    </button>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                                {(!agentsData || agentsData.length === 0) && (
                                    <div className="flex flex-col items-center justify-center py-6 text-gray-400">
                                        <Users className="h-8 w-8 mb-2 text-gray-300" />
                                        <p className="text-sm font-medium">Aucun agent</p>
                                    </div>
                                )}
                                <div className="space-y-1 mt-1">
                                    {agentsData?.map((agent: any) => (
                                        <div
                                            key={agent.id}
                                            className={cn(
                                                "flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer",
                                                selectedAgent === agent.memberId && "bg-green-50 ring-1 ring-green-200"
                                            )}
                                            // #35 - Click agent to filter conversations
                                            onClick={() => {
                                                setSelectedAgent(prev =>
                                                    prev === agent.memberId ? null : agent.memberId
                                                )
                                            }}
                                        >
                                            <div className="relative shrink-0">
                                                <Avatar className="h-9 w-9">
                                                    <AvatarFallback className="bg-gradient-to-br from-[#14532d] to-[#059669] text-white text-xs font-semibold">
                                                        {agent.name}
                                                    </AvatarFallback>
                                                </Avatar>
                                                {agent.online && (
                                                    <div className="absolute right-0 bottom-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-green-500" />
                                                )}
                                                {agent.status === 'Occupe' && (
                                                    <div className="absolute right-0 bottom-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-amber-500" />
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">{agent.fullName}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <Badge
                                                        variant="secondary"
                                                        className={cn(
                                                            "text-[10px] font-medium px-1.5 py-0",
                                                            agent.status === 'En ligne' && "bg-green-50 text-green-700",
                                                            agent.status === 'Occupe' && "bg-amber-50 text-amber-700",
                                                            agent.status === 'Hors ligne' && "bg-gray-100 text-gray-500"
                                                        )}
                                                    >
                                                        {agent.status}
                                                    </Badge>
                                                </div>
                                            </div>

                                            <div className="text-right shrink-0">
                                                <span className="text-sm font-bold text-gray-900">
                                                    {agent.load}/{agent.maxLoad}
                                                </span>
                                                <div className="h-1.5 w-16 bg-gray-100 rounded-full overflow-hidden mt-1">
                                                    <div
                                                        className={cn("h-full rounded-full transition-all duration-500", agent.color)}
                                                        style={{ width: `${(agent.load / agent.maxLoad) * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <AssignmentSettingsDialog
                    open={isSettingsOpen}
                    onOpenChange={setIsSettingsOpen}
                />
            </div>
        </TooltipProvider>
    )
}
