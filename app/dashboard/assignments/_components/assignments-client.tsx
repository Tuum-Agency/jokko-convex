"use client"

import {
    Mail,
    Flame,
    Timer,
    Users,
    MessageSquare,
} from 'lucide-react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

export default function AssignmentsClient() {
    // Queries
    const statsData = useQuery(api.assignments.getStats)
    const conversationsData = useQuery(api.assignments.getConversationsQueue)
    const agentsData = useQuery(api.assignments.getAgentsList)
    const autoAssign = useMutation(api.assignments.autoAssign)

    // Loading states or defaults
    const stats = [
        {
            label: 'NON ASSIGNÉES',
            value: statsData?.unassignedCount ?? '-',
            icon: Mail,
            color: 'text-blue-500',
            bg: 'bg-blue-50',
        },
        {
            label: 'URGENTES',
            value: statsData?.urgentCount ?? '-',
            icon: Flame,
            color: 'text-orange-500',
            bg: 'bg-orange-50',
        },
        {
            label: 'TEMPS MOYEN',
            value: statsData?.avgResponseTime ?? '-',
            icon: Timer,
            color: 'text-gray-500',
            bg: 'bg-gray-50',
        },
        {
            label: 'AGENTS EN LIGNE',
            value: statsData?.onlineAgentsCount ?? '-',
            icon: Users,
            color: 'text-green-600',
            bg: 'bg-green-50',
        },
    ]

    return (
        <div className="w-full h-full p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Assignments</h1>
                    <p className="text-sm text-muted-foreground">
                        Assignez les conversations WhatsApp aux agents disponibles
                    </p>
                </div>
                <Button
                    className="bg-green-600 hover:bg-green-700 text-white shadow-sm"
                    onClick={() => autoAssign()}
                >
                    Auto-assign
                </Button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, i) => (
                    <Card key={i} className="border-gray-200/80 shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-6 flex flex-col items-start justify-between min-h-[140px]">
                            <div className="flex items-start justify-between w-full">
                                <div className={cn("p-3 rounded-xl mb-4 transition-colors", stat.bg)}>
                                    <stat.icon className={cn("h-6 w-6", stat.color)} />
                                </div>
                                <span className="text-2xl font-bold text-gray-900">{stat.value}</span>
                            </div>
                            <span className="text-sm font-medium text-gray-600 tracking-wide">
                                {stat.label}
                            </span>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Conversations List */}
                <Card className="lg:col-span-2 border-gray-200/80 shadow-sm">
                    <CardContent className="p-0">
                        <div className="divide-y divide-gray-100">
                            {(!conversationsData || conversationsData.length === 0) && (
                                <div className="p-8 text-center text-muted-foreground">
                                    Aucune conversation en attente.
                                </div>
                            )}
                            {conversationsData?.map((conv: any) => (
                                <div key={conv.id} className="p-4 sm:p-6 hover:bg-gray-50/80 transition-colors group cursor-pointer">
                                    <div className="flex items-start gap-4">
                                        {/* Icon/Date */}
                                        <div className="shrink-0 mt-1">
                                            <div className="flex items-center justify-center h-10 w-10 text-gray-400 bg-gray-50 rounded-xl border border-gray-100">
                                                <MessageSquare className="h-5 w-5" />
                                            </div>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-2">
                                                <Badge
                                                    variant="secondary"
                                                    className={cn(
                                                        "font-medium capitalize px-2 py-0.5 rounded-lg",
                                                        conv.priority === 'urgent' ? "bg-red-50 text-red-700 border-red-100" : "bg-gray-100 text-gray-600 border-gray-200"
                                                    )}
                                                >
                                                    {conv.priority}
                                                </Badge>
                                                <span className="text-xs text-muted-foreground">{conv.time}</span>
                                            </div>

                                            <p className="text-gray-900 font-semibold mb-2 truncate">
                                                {conv.message}
                                            </p>

                                            <div className="flex items-center gap-3 text-sm text-gray-500">
                                                <div className={cn("h-2 w-2 rounded-full", conv.statusColor)} />
                                                <span className="font-medium text-gray-700">{conv.business}</span>
                                                <span className="text-gray-300">•</span>
                                                <span>{conv.phone}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Right Column: Agents Status */}
                <div className="space-y-6">
                    <Card className="border-gray-200/80 shadow-sm">
                        <CardContent className="p-6 space-y-6">
                            {(!agentsData || agentsData.length === 0) && (
                                <div className="text-center text-muted-foreground text-sm">
                                    Aucun agent trouvé.
                                </div>
                            )}
                            {agentsData?.map((agent: any) => (
                                <div key={agent.id} className="flex items-center gap-4">
                                    <div className="relative shrink-0">
                                        <Avatar className="h-12 w-12 rounded-full border border-gray-100 shadow-sm">
                                            <AvatarFallback className="bg-slate-800 text-white font-medium text-sm">
                                                {agent.name}
                                            </AvatarFallback>
                                        </Avatar>
                                        {agent.online && (
                                            <div className="absolute right-0 bottom-0 h-3 w-3 rounded-full border-2 border-white bg-green-500 ring-1 ring-white" />
                                        )}
                                        {agent.status === 'Occupé' && (
                                            <div className="absolute right-0 bottom-0 h-3 w-3 rounded-full border-2 border-white bg-amber-500 ring-1 ring-white" />
                                        )}
                                    </div>

                                    <div className="flex-1 space-y-2 pt-1">
                                        <div className="flex justify-end items-baseline gap-1">
                                            <span className="font-bold text-gray-900">
                                                {agent.load}/{agent.maxLoad}
                                            </span>
                                            <span className="text-xs text-muted-foreground">chats</span>
                                        </div>

                                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className={cn("h-full rounded-full transition-all duration-500", agent.color)}
                                                style={{ width: `${(agent.load / agent.maxLoad) * 100}%` }}
                                            />
                                        </div>

                                        <div>
                                            <Badge
                                                variant="secondary"
                                                className={cn(
                                                    "font-medium text-xs px-2.5 py-0.5",
                                                    agent.status === 'En ligne' && "bg-green-50 text-green-700 hover:bg-green-100",
                                                    agent.status === 'Occupé' && "bg-amber-50 text-amber-700 hover:bg-amber-100",
                                                    agent.status === 'Hors ligne' && "bg-gray-100 text-gray-500 hover:bg-gray-200"
                                                )}
                                            >
                                                {agent.status}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <div className="flex justify-end px-2">
                        <Button variant="ghost" className="text-green-600 hover:text-green-700 hover:bg-green-50">
                            Modifier les paramètres
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
