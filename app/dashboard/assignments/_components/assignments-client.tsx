"use client"

import {
    Mail,
    Flame,
    Timer,
    Users,
    MessageSquare,
    UserPlus,
    Loader2,
    AlertCircle,
    ArrowUpRight,
    ArrowDownRight,
} from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

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
import { useState, useEffect } from 'react'
import { Id } from '@/convex/_generated/dataModel'
import {
    TooltipProvider,
} from '@/components/ui/tooltip'

// ============================================
// STAT CARD (cohérent avec overview)
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
// LOADING SKELETON (cohérent avec overview)
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
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)
    const updatePresence = useMutation(api.users.updatePresence)
    const role = useQuery(api.users.currentUserRole);

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
    const settings = useQuery(api.assignments.getAssignmentSettings)

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
                        Vous n'avez pas les autorisations necessaires pour acceder a cette page.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    // Determine if team has only one member
    const hasOnlyOneMember = agentsData && agentsData.length <= 1

    // Group agents by department
    const agentsByDept = (agentsData || []).reduce((acc: Record<string, any[]>, agent: any) => {
        const dept = agent.department || "General";
        if (!acc[dept]) acc[dept] = [];
        acc[dept].push(agent);
        return acc;
    }, {});

    // Stats config
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

    const unassignedConversations = conversationsData?.filter((c: any) => !c.assignedTo) || []
    const assignedConversations = conversationsData?.filter((c: any) => c.assignedTo) || []

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
                                {isAssigned
                                    ? "Aucune conversation assignee pour le moment."
                                    : "Il n'y a actuellement aucune conversation en attente d'attribution."}
                            </EmptyDescription>
                        </EmptyContent>
                    </Empty>
                </div>
            )}
            {conversations.map((conv: any) => (
                <div key={conv.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer">
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

                    {/* Action Button */}
                    <div className="shrink-0">
                        {hasOnlyOneMember ? (
                            /* Single member: show self-assign button only if not already assigned */
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
                                    <span className="hidden sm:inline">M'attribuer</span>
                                </Button>
                            )
                        ) : (
                            /* Multiple members: show dropdown */
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1 text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700 cursor-pointer">
                                        <UserPlus className="h-3.5 w-3.5" />
                                        <span className="hidden sm:inline">{isAssigned ? "Reassigner" : "Assigner"}</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-[240px] max-h-[300px] overflow-y-auto">
                                    {Object.entries(agentsByDept).map(([dept, agents]: [string, any], index) => {
                                        const validAgents = agents.filter((a: any) => a.memberId !== conv.assignedTo);
                                        if (validAgents.length === 0) return null;

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
                                        );
                                    })}
                                    {(!agentsData || agentsData.length === 0) && (
                                        <div className="p-2 text-xs text-gray-500 text-center">Aucun agent disponible</div>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                </div>
            ))}
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

                {/* ==================== MAIN CONTENT ==================== */}
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Left: Conversations List */}
                    <div className="lg:col-span-2">
                        <Card className="bg-white border-gray-100 shadow-sm">
                            <CardHeader className="pb-2">
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
                                        <div key={agent.id} className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-50 transition-colors">
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
