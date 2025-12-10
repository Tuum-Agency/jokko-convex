'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
    MessageSquare,
    Users,
    TrendingUp,
    Send,
    ArrowUpRight,
    ArrowDownRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'


function StatsCard({
    title,
    value,
    description,
    icon: Icon,
    trend,
    trendValue,
    iconColor,
    iconBg,
}: {
    title: string
    value: string
    description: string
    icon: React.ElementType
    trend?: 'up' | 'down'
    trendValue?: string
    iconColor?: string
    iconBg?: string
}) {
    return (
        <Card className="bg-white border-gray-200/80 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
                <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center", iconBg || "bg-green-50")} aria-hidden="true">
                    <Icon className={cn("h-5 w-5", iconColor || "text-green-600")} />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-gray-900">{value}</div>
                <div className="flex items-center gap-1 mt-1">
                    {trend && (
                        <span className={`flex items-center text-xs font-medium ${trend === 'up' ? 'text-green-600' : 'text-red-600'
                            }`}>
                            {trend === 'up' ? (
                                <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                            ) : (
                                <ArrowDownRight className="h-3 w-3" aria-hidden="true" />
                            )}
                            {trendValue}
                        </span>
                    )}
                    <CardDescription className="text-xs">{description}</CardDescription>
                </div>
            </CardContent>
        </Card>
    )
}

export default function DashboardPage() {
    const user = useQuery(api.users.me);
    const dashboardData = useQuery(api.analytics.getAppDashboardStats);

    // Loading Skeleton state
    if (user === undefined || dashboardData === undefined) {
        return (
            <div className="space-y-6">
                {/* Page Header Skeleton */}
                <div>
                    <Skeleton className="h-8 w-64 mb-2" />
                    <Skeleton className="h-4 w-96" />
                </div>

                {/* Stats Grid Skeleton */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Card key={i} className="bg-white border-gray-200/80 shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-9 w-9 rounded-xl" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-8 w-16 mb-2" />
                                <div className="flex items-center gap-2">
                                    <Skeleton className="h-3 w-12" />
                                    <Skeleton className="h-3 w-32" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Main Content Grid Skeleton */}
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Recent Conversations Skeleton */}
                    <Card className="bg-white border-gray-200/80 shadow-sm">
                        <CardHeader>
                            <Skeleton className="h-6 w-48 mb-2" />
                            <Skeleton className="h-4 w-72" />
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="flex items-center gap-4 p-3">
                                        <Skeleton className="h-10 w-10 rounded-full" />
                                        <div className="flex-1 space-y-2">
                                            <Skeleton className="h-4 w-32" />
                                            <Skeleton className="h-3 w-24" />
                                        </div>
                                        <Skeleton className="h-2 w-2 rounded-full" />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Actions Skeleton */}
                    <Card className="bg-white border-gray-200/80 shadow-sm">
                        <CardHeader>
                            <Skeleton className="h-6 w-32 mb-2" />
                            <Skeleton className="h-4 w-48" />
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-3">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-100/50">
                                        <Skeleton className="h-10 w-10 rounded-xl" />
                                        <Skeleton className="h-3 w-24" />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    if (!dashboardData) return null; // Should not happen if undefined check passed, but handy for types

    const { stats, recentConversations } = dashboardData;

    // Map icons to stats (order must match backend response array)
    // Backend returns: [Total Convs, Active Contacts, Messages Sent, Response Rate]
    const statsWithIcons = stats.map((stat, index) => {
        let icon = MessageSquare;
        if (index === 1) icon = Users;
        if (index === 2) icon = Send;
        if (index === 3) icon = TrendingUp;

        return { ...stat, icon };
    });

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">
                    Bienvenue, {user?.name || 'User'}!
                </h1>
                <p className="text-gray-500 mt-1">
                    Voici un aperçu de votre activité sur votre organisation.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {statsWithIcons.map((stat) => (
                    <StatsCard key={stat.title} {...stat} />
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Recent Conversations */}
                <Card className="bg-white border-gray-200/80 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-gray-900">
                            Conversations récentes
                        </CardTitle>
                        <CardDescription>
                            Les dernières conversations de votre équipe
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentConversations.length === 0 && (
                                <p className="text-sm text-gray-500 text-center py-4">Aucune conversation récente.</p>
                            )}
                            {recentConversations.map((conv, i) => (
                                <Link
                                    key={conv.id}
                                    href={`/dashboard/conversations/${conv.id}`}
                                    className="block"
                                >
                                    <div
                                        className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                                    >
                                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white font-semibold shadow-sm">
                                            {conv.contactName.substring(0, 1).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                {conv.contactName}
                                            </p>
                                            <p className="text-xs text-gray-500 truncate">
                                                {conv.lastMessageTime
                                                    ? new Date(conv.lastMessageTime).toLocaleString('fr-FR', {
                                                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                                    })
                                                    : 'Jamais'}
                                            </p>
                                        </div>
                                        {conv.unread && (
                                            <div className="h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white" />
                                        )}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="bg-white border-gray-200/80 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-gray-900">
                            Actions rapides
                        </CardTitle>
                        <CardDescription>
                            Accès rapide aux fonctionnalités principales
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { icon: MessageSquare, label: 'Nouvelle conversation', color: 'bg-blue-50 text-blue-600', link: '/dashboard/conversations' },
                                { icon: Users, label: 'Ajouter un contact', color: 'bg-green-50 text-green-600', link: '/dashboard/contacts' },
                                { icon: Send, label: 'Envoyer un broadcast', color: 'bg-purple-50 text-purple-600', link: '/dashboard/broadcasts' },
                                { icon: TrendingUp, label: 'Voir les analytics', color: 'bg-orange-50 text-orange-600', link: '/dashboard/analytics' },
                            ].map((action) => (
                                <Link
                                    key={action.label}
                                    href={action.link}
                                    className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group cursor-pointer"
                                >
                                    <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform", action.color)} aria-hidden="true">
                                        <action.icon className="h-5 w-5" />
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
    )
}
