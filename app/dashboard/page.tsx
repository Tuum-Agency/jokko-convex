'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    MessageSquare,
    Users,
    TrendingUp,
    Send,
    ArrowUpRight,
    ArrowDownRight,
    CreditCard,
    MessageCircle,
    UserPlus,
    Radio,
    BarChart3,
    Workflow,
    UserCheck,
    UserX,
    FolderOpen,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useCurrentOrg } from '@/hooks/use-current-org'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
} from 'recharts'
import {
    TooltipProvider,
} from '@/components/ui/tooltip'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

// ============================================
// STAT CARD ICON GRADIENTS
// ============================================

const STAT_CARD_CONFIG = [
    { icon: MessageSquare, gradient: 'from-[#14532d] to-[#059669]' },
    { icon: Users, gradient: 'from-[#166534] to-[#0d9488]' },
    { icon: Send, gradient: 'from-[#15803d] to-[#10b981]' },
    { icon: TrendingUp, gradient: 'from-[#14532d] to-[#34d399]' },
]

// ============================================
// STAT CARD
// ============================================

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
    value: string
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
                    {trend && (
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
// LOADING SKELETON
// ============================================

function DashboardSkeleton() {
    return (
        <div className="space-y-6">
            <div>
                <Skeleton className="h-7 w-48 mb-2" />
                <Skeleton className="h-4 w-72" />
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
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-24 rounded-lg" />
                ))}
            </div>
            <div className="grid gap-6 lg:grid-cols-5">
                <Card className="lg:col-span-3 bg-white border-gray-100 shadow-sm">
                    <CardContent className="p-6"><Skeleton className="h-[260px] w-full rounded-lg" /></CardContent>
                </Card>
                <Card className="lg:col-span-2 bg-white border-gray-100 shadow-sm">
                    <CardContent className="p-6">
                        <div className="space-y-4">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <Skeleton className="h-9 w-9 rounded-full" />
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
// CUSTOM CHART TOOLTIP
// ============================================

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; fill?: string; color?: string }>; label?: string }) {
    if (!active || !payload?.length) return null
    return (
        <div className="bg-white border border-gray-200 shadow-lg rounded-lg px-3 py-2 text-xs">
            <p className="font-semibold text-gray-900 mb-1">{label}</p>
            {payload.map((p, i: number) => (
                <p key={i} className="text-gray-600">
                    <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: p.fill || p.color }} />
                    {p.name}: <span className="font-medium text-gray-900">{p.value}</span>
                </p>
            ))}
        </div>
    )
}


// ============================================
// MAIN PAGE
// ============================================

export default function DashboardPage() {
    const user = useQuery(api.users.me)
    const dashboardData = useQuery(api.analytics.getAppDashboardStats)
    const overviewData = useQuery(api.analytics.getDashboardOverview)
    const { currentOrg } = useCurrentOrg()
    const creditBalance = useQuery(api.credits.getBalance)

    if (user === undefined || dashboardData === undefined) {
        return <DashboardSkeleton />
    }

    if (!dashboardData) return null

    const { stats, recentConversations, chartData } = dashboardData

    const statsWithIcons = stats.map((stat, index) => ({
        ...stat,
        icon: STAT_CARD_CONFIG[index]?.icon || MessageSquare,
        gradient: STAT_CARD_CONFIG[index]?.gradient || 'from-green-800 to-green-500',
    }))

    const formatCurrency = (n: number) => new Intl.NumberFormat('fr-SN', { style: 'currency', currency: 'XOF' }).format(n)

    const roleLabels: Record<string, string> = {
        OWNER: 'Propriétaire',
        ADMIN: 'Admin',
        AGENT: 'Agent',
    }

    return (
        <TooltipProvider delayDuration={200}>
            <div className="space-y-6">
                {/* ==================== HEADER ==================== */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                            Dashboard
                        </h1>
                        <p className="text-sm text-gray-500 mt-0.5">
                            Bienvenue, {user?.name || 'User'}
                        </p>
                    </div>

                    {currentOrg && (
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200">
                                <span className="text-xs font-semibold text-gray-700">
                                    Cr&eacute;dit Marketing
                                </span>
                                <span className="text-xs text-gray-500 font-medium tabular-nums">
                                    {creditBalance != null ? formatCurrency(creditBalance) : '...'}
                                </span>
                            </div>
                            <Link href="/dashboard/billing">
                                <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs rounded-full cursor-pointer">
                                    <CreditCard className="h-3.5 w-3.5" />
                                    <span className="hidden sm:inline">Recharger</span>
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>

                {/* ==================== STAT CARDS ==================== */}
                <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                    {statsWithIcons.map((stat) => (
                        <StatsCard key={stat.title} {...stat} />
                    ))}
                </div>

                {/* ==================== ROW: CONVERSATIONS + TEAM ==================== */}
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Conversations Breakdown */}
                    <Card className="bg-white border-gray-100 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm sm:text-base font-semibold text-gray-900">
                                Conversations
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                            {overviewData ? (
                                <div className="grid grid-cols-3 gap-3 mt-2">
                                    <div className="text-center p-3 rounded-lg bg-blue-50/50 border border-blue-100">
                                        <FolderOpen className="h-5 w-5 text-blue-600 mx-auto mb-1.5" />
                                        <p className="text-xl font-bold text-gray-900">{overviewData.contactBreakdown.open}</p>
                                        <p className="text-[11px] text-gray-500 font-medium mt-0.5">Ouvert</p>
                                    </div>
                                    <div className="text-center p-3 rounded-lg bg-green-50/50 border border-green-100">
                                        <UserCheck className="h-5 w-5 text-green-600 mx-auto mb-1.5" />
                                        <p className="text-xl font-bold text-gray-900">{overviewData.contactBreakdown.assigned}</p>
                                        <p className="text-[11px] text-gray-500 font-medium mt-0.5">Assign&eacute;</p>
                                    </div>
                                    <div className="text-center p-3 rounded-lg bg-orange-50/50 border border-orange-100">
                                        <UserX className="h-5 w-5 text-orange-500 mx-auto mb-1.5" />
                                        <p className="text-xl font-bold text-gray-900">{overviewData.contactBreakdown.unassigned}</p>
                                        <p className="text-[11px] text-gray-500 font-medium mt-0.5">Non assign&eacute;</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 gap-3 mt-2">
                                    {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Team Members */}
                    <Card className="bg-white border-gray-100 shadow-sm">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm sm:text-base font-semibold text-gray-900">
                                    Membres de l&apos;&eacute;quipe
                                </CardTitle>
                                <Link href="/dashboard/team" className="text-[11px] text-green-700 hover:text-green-800 font-medium cursor-pointer">
                                    G&eacute;rer
                                </Link>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                            {overviewData?.teamMembers ? (
                                <div className="space-y-1 mt-1">
                                    {overviewData.teamMembers.length === 0 && (
                                        <div className="flex flex-col items-center justify-center py-6 text-gray-400">
                                            <Users className="h-8 w-8 mb-2 text-gray-300" />
                                            <p className="text-sm font-medium">Aucun membre</p>
                                        </div>
                                    )}
                                    {overviewData.teamMembers.slice(0, 5).map((member) => (
                                        <div
                                            key={member.id}
                                            className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                                        >
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={member.avatar || undefined} alt={member.name} />
                                                <AvatarFallback className="bg-gradient-to-br from-[#14532d] to-[#059669] text-white text-xs font-semibold">
                                                    {member.name.substring(0, 1).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">{member.name}</p>
                                                <p className="text-[11px] text-gray-400">{roleLabels[member.role] || member.role}</p>
                                            </div>
                                            <Badge variant="secondary" className="text-[10px] bg-gray-100 text-gray-600 font-medium">
                                                {member.assignedConversations} conv.
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-3 mt-2">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <Skeleton className="h-8 w-8 rounded-full" />
                                            <div className="flex-1"><Skeleton className="h-4 w-24 mb-1" /><Skeleton className="h-3 w-16" /></div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* ==================== ROW: CHART + CONVERSATIONS ==================== */}
                <div className="grid gap-6 lg:grid-cols-5">
                    {/* Activity Chart */}
                    <Card className="lg:col-span-3 bg-white border-gray-100 shadow-sm">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm sm:text-base font-semibold text-gray-900">
                                    Activit&eacute; des Messages
                                </CardTitle>
                                <span className="text-[11px] text-gray-400 font-medium">7 derniers jours</span>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-0 pb-4">
                            {chartData?.weeklyActivity && chartData.weeklyActivity.some((d) => d.inbound > 0 || d.outbound > 0) ? (
                                <div className="h-[200px] sm:h-[260px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData.weeklyActivity} barGap={2}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                            <XAxis
                                                dataKey="day"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fontSize: 11, fill: '#94a3b8' }}
                                            />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fontSize: 11, fill: '#94a3b8' }}
                                                width={28}
                                            />
                                            <RechartsTooltip content={<ChartTooltip />} cursor={{ fill: '#f8fafc' }} />
                                            <Bar dataKey="inbound" name="Re&ccedil;us" fill="#14532d" radius={[4, 4, 0, 0]} maxBarSize={28} />
                                            <Bar dataKey="outbound" name="Envoy&eacute;s" fill="#86efac" radius={[4, 4, 0, 0]} maxBarSize={28} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="h-[200px] sm:h-[260px] flex flex-col items-center justify-center text-gray-400">
                                    <BarChart3 className="h-12 w-12 mb-3 text-gray-300" />
                                    <p className="text-sm font-medium">Aucune activit&eacute; r&eacute;cente</p>
                                    <p className="text-xs mt-1">Les donn&eacute;es appara&icirc;tront ici</p>
                                </div>
                            )}

                            {/* Legend */}
                            <div className="flex items-center gap-5 mt-3 px-1">
                                <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                                    <span className="h-2 w-2 rounded-sm bg-[#14532d]" />
                                    Re&ccedil;us
                                </div>
                                <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                                    <span className="h-2 w-2 rounded-sm bg-green-300" />
                                    Envoy&eacute;s
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recent Conversations */}
                    <Card className="lg:col-span-2 bg-white border-gray-100 shadow-sm">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm sm:text-base font-semibold text-gray-900">
                                    Conversations R&eacute;centes
                                </CardTitle>
                                <Link href="/dashboard/conversations" className="text-[11px] text-green-700 hover:text-green-800 font-medium cursor-pointer">
                                    Tout voir
                                </Link>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="space-y-0.5">
                                {recentConversations.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                                        <MessageSquare className="h-10 w-10 mb-2 text-gray-300" />
                                        <p className="text-sm font-medium">Aucune conversation</p>
                                    </div>
                                )}
                                {recentConversations.map((conv) => (
                                    <Link
                                        key={conv.id}
                                        href={`/dashboard/conversations/${conv.id}`}
                                        className="block"
                                    >
                                        <div className="flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                                            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#14532d] to-[#059669] flex items-center justify-center text-white text-sm font-semibold shrink-0 shadow-sm">
                                                {conv.contactName.substring(0, 1).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                    {conv.contactName}
                                                </p>
                                                <p className="text-[11px] text-gray-400 truncate">
                                                    {conv.lastMessageTime
                                                        ? new Date(conv.lastMessageTime).toLocaleString('fr-FR', {
                                                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                                        })
                                                        : 'Pas de message'}
                                                </p>
                                            </div>
                                            {conv.unread && (
                                                <div className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                                            )}
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* ==================== QUICK ACTIONS ==================== */}
                <div>
                    <Card className="bg-white border-gray-100 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm sm:text-base font-semibold text-gray-900">
                                Actions Rapides
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-2 pb-6">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {[
                                    { icon: MessageCircle, label: 'Conversations', gradient: 'from-[#14532d] to-[#059669]', link: '/dashboard/conversations' },
                                    { icon: UserPlus, label: 'Nouveau Contact', gradient: 'from-[#166534] to-[#0d9488]', link: '/dashboard/contacts' },
                                    { icon: Radio, label: 'Campagnes', gradient: 'from-[#15803d] to-[#10b981]', link: '/dashboard/campagnes' },
                                    { icon: Workflow, label: 'Automatisation', gradient: 'from-[#14532d] to-[#34d399]', link: '/dashboard/flows' },
                                ].map((action) => (
                                    <Link
                                        key={action.label}
                                        href={action.link}
                                        className="flex flex-col items-center gap-2.5 p-4 rounded-xl border border-gray-100 hover:border-green-200 hover:bg-green-50/30 transition-all group cursor-pointer"
                                    >
                                        <div className={cn("h-10 w-10 rounded-xl bg-gradient-to-br flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm", action.gradient)} aria-hidden="true">
                                            <action.icon className="h-5 w-5 text-white" />
                                        </div>
                                        <span className="text-xs font-medium text-gray-600 text-center">
                                            {action.label}
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </TooltipProvider>
    )
}
