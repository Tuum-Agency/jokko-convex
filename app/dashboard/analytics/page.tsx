"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
    MessageSquare,
    Users,
    Clock,
    Activity,
    ArrowUpRight,
    ArrowDownRight,
    Download,
    AlertCircle,
    BarChart3,
    Mail,
    Send,
    CalendarIcon,
    Megaphone,
    MessagesSquare,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { FeatureGate } from "@/components/billing/feature-gate";
import { PlanTierBadge } from "@/components/billing/plan-tier-badge";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
} from "recharts";
import {
    format,
    subDays,
    startOfDay,
    endOfDay,
    startOfMonth,
    endOfMonth,
    subMonths,
} from "date-fns";
import { fr } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import Papa from "papaparse";

// ============================================
// TYPES
// ============================================

interface DatePreset {
    label: string;
    getValue: () => { from: Date; to: Date };
}

// ============================================
// DATE PRESETS
// ============================================

const DATE_PRESETS: DatePreset[] = [
    {
        label: "Aujourd\u2019hui",
        getValue: () => ({
            from: startOfDay(new Date()),
            to: endOfDay(new Date()),
        }),
    },
    {
        label: "Hier",
        getValue: () => ({
            from: startOfDay(subDays(new Date(), 1)),
            to: endOfDay(subDays(new Date(), 1)),
        }),
    },
    {
        label: "Les 7 derniers jours",
        getValue: () => ({
            from: startOfDay(subDays(new Date(), 6)),
            to: endOfDay(new Date()),
        }),
    },
    {
        label: "Les 14 derniers jours",
        getValue: () => ({
            from: startOfDay(subDays(new Date(), 13)),
            to: endOfDay(new Date()),
        }),
    },
    {
        label: "Les 30 derniers jours",
        getValue: () => ({
            from: startOfDay(subDays(new Date(), 29)),
            to: endOfDay(new Date()),
        }),
    },
    {
        label: "Ce mois-ci",
        getValue: () => ({
            from: startOfMonth(new Date()),
            to: endOfDay(new Date()),
        }),
    },
    {
        label: "Le mois dernier",
        getValue: () => ({
            from: startOfMonth(subMonths(new Date(), 1)),
            to: endOfMonth(subMonths(new Date(), 1)),
        }),
    },
];

// ============================================
// STAT CARD CONFIG
// ============================================

const STAT_CARD_CONFIG = [
    { icon: MessageSquare, gradient: "from-[#14532d] to-[#059669]" },
    { icon: Activity, gradient: "from-[#166534] to-[#0d9488]" },
    { icon: Users, gradient: "from-[#15803d] to-[#10b981]" },
    { icon: Clock, gradient: "from-[#14532d] to-[#34d399]" },
];

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
    title: string;
    value: string;
    description: string;
    icon: React.ElementType;
    trend?: "up" | "down";
    trendValue?: string;
    gradient: string;
}) {
    return (
        <Card className="bg-white border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <div
                        className={cn(
                            "h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-gradient-to-br flex items-center justify-center shadow-lg shadow-green-900/20",
                            gradient
                        )}
                    >
                        <Icon className="h-[18px] w-[18px] sm:h-5 sm:w-5 text-white" />
                    </div>
                    {trend && trendValue && (
                        <span
                            className={cn(
                                "flex items-center gap-0.5 text-[11px] font-semibold px-2 py-0.5 rounded-full",
                                trend === "up"
                                    ? "text-green-700 bg-green-50"
                                    : "text-red-600 bg-red-50"
                            )}
                        >
                            {trend === "up" ? (
                                <ArrowUpRight className="h-3 w-3" />
                            ) : (
                                <ArrowDownRight className="h-3 w-3" />
                            )}
                            {trendValue}
                        </span>
                    )}
                </div>
                <p className="text-xs sm:text-sm font-medium text-gray-500 mb-0.5">
                    {title}
                </p>
                <span className="text-xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                    {value}
                </span>
                <p className="text-[11px] text-gray-400 mt-0.5">{description}</p>
            </CardContent>
        </Card>
    );
}

// ============================================
// DATE RANGE PICKER
// ============================================

function DateRangePicker({
    dateRange,
    onDateRangeChange,
}: {
    dateRange: { from: Date; to: Date };
    onDateRangeChange: (range: { from: Date; to: Date }) => void;
}) {
    const [open, setOpen] = useState(false);
    const [activePreset, setActivePreset] = useState("Les 30 derniers jours");

    const handlePresetClick = (preset: DatePreset) => {
        const range = preset.getValue();
        onDateRangeChange(range);
        setActivePreset(preset.label);
        setOpen(false);
    };

    const handleCalendarSelect = (range: DateRange | undefined) => {
        if (range?.from) {
            onDateRangeChange({
                from: startOfDay(range.from),
                to: range.to ? endOfDay(range.to) : endOfDay(range.from),
            });
            setActivePreset("");
            if (range.to) {
                setOpen(false);
            }
        }
    };

    const formatLabel = () => {
        return `${format(dateRange.from, "d MMM yyyy", { locale: fr })} - ${format(dateRange.to, "d MMM yyyy", { locale: fr })}`;
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 text-xs rounded-full cursor-pointer font-medium"
                >
                    <CalendarIcon className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{formatLabel()}</span>
                    <span className="sm:hidden">
                        {format(dateRange.from, "d MMM", { locale: fr })} -{" "}
                        {format(dateRange.to, "d MMM", { locale: fr })}
                    </span>
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-auto p-0 flex flex-col sm:flex-row"
                align="end"
                sideOffset={8}
            >
                {/* Presets */}
                <div className="border-b sm:border-b-0 sm:border-r border-gray-100 p-3 sm:w-44">
                    <div className="space-y-0.5">
                        {DATE_PRESETS.map((preset) => (
                            <button
                                key={preset.label}
                                onClick={() => handlePresetClick(preset)}
                                className={cn(
                                    "w-full text-left text-xs px-3 py-2 rounded-md transition-colors cursor-pointer",
                                    activePreset === preset.label
                                        ? "bg-green-50 text-green-800 font-semibold"
                                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                )}
                            >
                                {preset.label}
                            </button>
                        ))}
                    </div>
                </div>
                {/* Calendar */}
                <div className="p-2">
                    <Calendar
                        mode="range"
                        selected={{
                            from: dateRange.from,
                            to: dateRange.to,
                        }}
                        onSelect={handleCalendarSelect}
                        locale={fr}
                        disabled={{ after: new Date() }}
                        captionLayout="dropdown"
                        defaultMonth={dateRange.from}
                    />
                </div>
            </PopoverContent>
        </Popover>
    );
}

// ============================================
// LOADING SKELETON
// ============================================

function AnalyticsSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <Skeleton className="h-7 w-36 mb-2" />
                    <Skeleton className="h-4 w-72" />
                </div>
                <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-48 rounded-full" />
                    <Skeleton className="h-8 w-24 rounded-full" />
                </div>
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
            <div className="grid gap-6 lg:grid-cols-5">
                <Card className="lg:col-span-3 bg-white border-gray-100 shadow-sm">
                    <CardContent className="p-6">
                        <Skeleton className="h-[260px] w-full rounded-lg" />
                    </CardContent>
                </Card>
                <Card className="lg:col-span-2 bg-white border-gray-100 shadow-sm">
                    <CardContent className="p-6">
                        <div className="grid grid-cols-1 gap-3">
                            {[1, 2, 3].map((i) => (
                                <Skeleton key={i} className="h-20 rounded-lg" />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
            <Card className="bg-white border-gray-100 shadow-sm">
                <CardContent className="p-6">
                    <Skeleton className="h-[300px] w-full rounded-lg" />
                </CardContent>
            </Card>
        </div>
    );
}

// ============================================
// CUSTOM CHART TOOLTIP
// ============================================

function ChartTooltip({
    active,
    payload,
    label,
}: {
    active?: boolean;
    payload?: Array<{
        name: string;
        value: number;
        fill?: string;
        color?: string;
    }>;
    label?: string;
}) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white border border-gray-200 shadow-lg rounded-lg px-3 py-2 text-xs">
            <p className="font-semibold text-gray-900 mb-1">{label}</p>
            {payload.map((p, i: number) => (
                <p key={i} className="text-gray-600">
                    <span
                        className="inline-block w-2 h-2 rounded-full mr-1.5"
                        style={{ backgroundColor: p.fill || p.color }}
                    />
                    {p.name}:{" "}
                    <span className="font-medium text-gray-900">{p.value}</span>
                </p>
            ))}
        </div>
    );
}

// ============================================
// ROLE LABELS
// ============================================

const roleLabels: Record<string, string> = {
    OWNER: "Propri\u00e9taire",
    ADMIN: "Admin",
    AGENT: "Agent",
};

// ============================================
// MAIN PAGE
// ============================================

export default function AnalyticsPage() {
    const [dateRange, setDateRange] = useState(() => ({
        from: startOfDay(subDays(new Date(), 29)),
        to: endOfDay(new Date()),
    }));

    const role = useQuery(api.users.currentUserRole);
    const stats = useQuery(api.analytics.getDashboardStats, {
        startDate: dateRange.from.getTime(),
        endDate: dateRange.to.getTime(),
    });

    if (role === undefined) {
        return <AnalyticsSkeleton />;
    }

    if (role === "AGENT") {
        return (
            <div className="p-6">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Acc&egrave;s refus&eacute;</AlertTitle>
                    <AlertDescription>
                        Vous n&apos;avez pas les autorisations n&eacute;cessaires
                        pour acc&eacute;der &agrave; cette page.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    if (!stats) {
        return <AnalyticsSkeleton />;
    }

    const { global, agents, dailyActivity, trends } = stats;

    // Chart: limit labels for readability (show every Nth label if too many)
    const chartData = dailyActivity ?? [];
    const labelInterval =
        chartData.length > 15 ? Math.ceil(chartData.length / 10) : 0;

    const handleExport = () => {
        if (!agents || agents.length === 0) return;

        const csvData = agents.map((agent: any) => ({
            Nom: agent.name,
            "R\u00f4le": roleLabels[agent.role] || agent.role,
            "Messages envoy\u00e9s": agent.messagesCount,
            "Conv. trait\u00e9es": agent.handledConversations ?? 0,
            "Attributions en cours": agent.conversationsCount,
            "R\u00e9ponses": agent.responseCount ?? 0,
            "Temps de r\u00e9ponse moy.": agent.avgResponseTime,
        }));

        const csv = Papa.unparse(csvData);
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute(
            "download",
            `analytics_agents_${format(dateRange.from, "yyyy-MM-dd")}_${format(dateRange.to, "yyyy-MM-dd")}.csv`
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <FeatureGate feature="advancedStats">
        <div className="space-y-6">
            {/* ==================== HEADER ==================== */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                            Analytique
                        </h1>
                        <PlanTierBadge feature="advancedStats" />
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Performances de l&apos;application et des agents
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <DateRangePicker
                        dateRange={dateRange}
                        onDateRangeChange={setDateRange}
                    />
                    <Button
                        onClick={handleExport}
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1.5 text-xs rounded-full cursor-pointer"
                    >
                        <Download className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Exporter</span>
                    </Button>
                </div>
            </div>

            {/* ==================== STAT CARDS ==================== */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                {[
                    {
                        title: "Messages Totaux",
                        value: global.totalMessages.toLocaleString(),
                        description: `${(global.conversationInbound ?? 0) + (global.conversationOutbound ?? 0)} conv. \u00b7 ${global.marketingOutbound ?? 0} marketing`,
                        trend: trends?.messages.trend as "up" | "down" | undefined,
                        trendValue: trends?.messages.value,
                    },
                    {
                        title: "Conversations Actives",
                        value: global.openConversations.toLocaleString(),
                        description: `${global.closedConversations} ferm\u00e9es sur la p\u00e9riode`,
                        trend: trends?.conversations.trend as
                            | "up"
                            | "down"
                            | undefined,
                        trendValue: trends?.conversations.value,
                    },
                    {
                        title: "Agents Actifs",
                        value: agents.length.toLocaleString(),
                        description: "membres de l\u2019\u00e9quipe",
                    },
                    {
                        title: "Temps de R\u00e9ponse",
                        value: global.avgResponseTime || "N/A",
                        description: "moyenne globale",
                    },
                ].map((stat, index) => (
                    <StatsCard
                        key={stat.title}
                        {...stat}
                        icon={STAT_CARD_CONFIG[index].icon}
                        gradient={STAT_CARD_CONFIG[index].gradient}
                    />
                ))}
            </div>

            {/* ==================== ROW: CHART + BREAKDOWN ==================== */}
            <div className="grid gap-6 lg:grid-cols-5">
                {/* Activity Chart */}
                <Card className="lg:col-span-3 bg-white border-gray-100 shadow-sm">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm sm:text-base font-semibold text-gray-900">
                                Activit&eacute; des Messages
                            </CardTitle>
                            <span className="text-[11px] text-gray-400 font-medium">
                                {format(dateRange.from, "d MMM", {
                                    locale: fr,
                                })}{" "}
                                -{" "}
                                {format(dateRange.to, "d MMM yyyy", {
                                    locale: fr,
                                })}
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-0 pb-4">
                        {chartData.length > 0 &&
                        chartData.some(
                            (d) => d.inbound > 0 || d.outbound > 0 || d.marketing > 0
                        ) ? (
                            <div className="h-[200px] sm:h-[260px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData} barGap={2}>
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            stroke="#f1f5f9"
                                            vertical={false}
                                        />
                                        <XAxis
                                            dataKey="label"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{
                                                fontSize: 11,
                                                fill: "#94a3b8",
                                            }}
                                            interval={labelInterval}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{
                                                fontSize: 11,
                                                fill: "#94a3b8",
                                            }}
                                            width={28}
                                        />
                                        <RechartsTooltip
                                            content={<ChartTooltip />}
                                            cursor={{ fill: "#f8fafc" }}
                                        />
                                        <Bar
                                            dataKey="inbound"
                                            name="Re\u00e7us"
                                            fill="#14532d"
                                            radius={[4, 4, 0, 0]}
                                            maxBarSize={24}
                                        />
                                        <Bar
                                            dataKey="outbound"
                                            name="Envoy\u00e9s (conv.)"
                                            fill="#86efac"
                                            radius={[4, 4, 0, 0]}
                                            maxBarSize={24}
                                        />
                                        <Bar
                                            dataKey="marketing"
                                            name="Marketing"
                                            fill="#6366f1"
                                            radius={[4, 4, 0, 0]}
                                            maxBarSize={24}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-[200px] sm:h-[260px] flex flex-col items-center justify-center text-gray-400">
                                <BarChart3 className="h-12 w-12 mb-3 text-gray-300" />
                                <p className="text-sm font-medium">
                                    Aucune activit&eacute; sur cette p&eacute;riode
                                </p>
                                <p className="text-xs mt-1">
                                    S&eacute;lectionnez une autre plage de dates
                                </p>
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
                                Envoy&eacute;s (conv.)
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                                <span className="h-2 w-2 rounded-sm bg-indigo-500" />
                                Marketing
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Message Breakdown */}
                <Card className="lg:col-span-2 bg-white border-gray-100 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm sm:text-base font-semibold text-gray-900">
                            R&eacute;partition des Messages
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="space-y-3 mt-2">
                            {/* Conversation Messages */}
                            <div className="p-4 rounded-lg bg-emerald-50/50 border border-emerald-100">
                                <div className="flex items-center gap-3 mb-2.5">
                                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#14532d] to-[#059669] flex items-center justify-center shadow-sm">
                                        <MessagesSquare className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[11px] text-gray-500 font-medium">
                                            Messages Conversation
                                        </p>
                                        <p className="text-xl font-bold text-gray-900">
                                            {((global.conversationInbound ?? 0) + (global.conversationOutbound ?? 0)).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 pl-12 text-[11px]">
                                    <span className="flex items-center gap-1 text-gray-500">
                                        <Mail className="h-3 w-3" />
                                        {(global.conversationInbound ?? 0).toLocaleString()} re&ccedil;us
                                    </span>
                                    <span className="text-gray-300">&middot;</span>
                                    <span className="flex items-center gap-1 text-gray-500">
                                        <Send className="h-3 w-3" />
                                        {(global.conversationOutbound ?? 0).toLocaleString()} envoy&eacute;s
                                    </span>
                                </div>
                            </div>

                            {/* Marketing Messages */}
                            <div className="p-4 rounded-lg bg-indigo-50/50 border border-indigo-100">
                                <div className="flex items-center gap-3">
                                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-600 to-indigo-400 flex items-center justify-center shadow-sm">
                                        <Megaphone className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[11px] text-gray-500 font-medium">
                                            Messages Marketing
                                        </p>
                                        <p className="text-xl font-bold text-gray-900">
                                            {(global.marketingOutbound ?? 0).toLocaleString()}
                                        </p>
                                    </div>
                                    <span className="text-xs font-semibold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                                        {global.totalMessages > 0
                                            ? Math.round(
                                                  ((global.marketingOutbound ?? 0) /
                                                      global.totalMessages) *
                                                      100
                                              )
                                            : 0}
                                        %
                                    </span>
                                </div>
                            </div>

                            {/* Response Rate */}
                            <div className="p-4 rounded-lg bg-gray-50/50 border border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#15803d] to-[#10b981] flex items-center justify-center shadow-sm">
                                        <Activity className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[11px] text-gray-500 font-medium">
                                            Taux de r&eacute;ponse (conv.)
                                        </p>
                                        <p className="text-xl font-bold text-gray-900">
                                            {global.responseRate != null
                                                ? `${global.responseRate}%`
                                                : "N/A"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ==================== AGENT PERFORMANCE TABLE ==================== */}
            <Card className="bg-white border-gray-100 shadow-sm">
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-sm sm:text-base font-semibold text-gray-900">
                                Performance des Agents
                            </CardTitle>
                            <p className="text-[11px] text-gray-400 mt-0.5">
                                M&eacute;triques d&apos;activit&eacute; par
                                agent sur la p&eacute;riode s&eacute;lectionn&eacute;e
                            </p>
                        </div>
                        <Button
                            onClick={handleExport}
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1.5 text-xs rounded-full cursor-pointer hidden sm:flex"
                        >
                            <Download className="h-3.5 w-3.5" />
                            CSV
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="px-0 sm:px-6 pt-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-gray-100">
                                    <TableHead className="w-[52px]" />
                                    <TableHead className="text-xs font-medium text-gray-500">
                                        Agent
                                    </TableHead>
                                    <TableHead className="hidden sm:table-cell text-xs font-medium text-gray-500">
                                        R&ocirc;le
                                    </TableHead>
                                    <TableHead className="text-right text-xs font-medium text-gray-500">
                                        Messages envoy&eacute;s
                                    </TableHead>
                                    <TableHead className="text-right hidden md:table-cell text-xs font-medium text-gray-500">
                                        Conv. trait&eacute;es
                                    </TableHead>
                                    <TableHead className="text-right hidden md:table-cell text-xs font-medium text-gray-500">
                                        Attributions
                                    </TableHead>
                                    <TableHead className="text-right hidden lg:table-cell text-xs font-medium text-gray-500">
                                        R&eacute;ponses
                                    </TableHead>
                                    <TableHead className="text-right text-xs font-medium text-gray-500">
                                        Temps de r&eacute;ponse moy.
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {agents.map((agent: any) => (
                                    <TableRow
                                        key={agent.id}
                                        className="border-gray-50 hover:bg-gray-50/50 transition-colors"
                                    >
                                        <TableCell className="py-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarFallback className="bg-gradient-to-br from-[#14532d] to-[#059669] text-white text-xs font-semibold">
                                                    {agent.name
                                                        .substring(0, 2)
                                                        .toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                        </TableCell>
                                        <TableCell>
                                            <p className="text-sm font-medium text-gray-900">
                                                {agent.name}
                                            </p>
                                            <p className="text-[11px] text-gray-400 sm:hidden">
                                                {roleLabels[agent.role] ||
                                                    agent.role}
                                            </p>
                                        </TableCell>
                                        <TableCell className="hidden sm:table-cell">
                                            <Badge
                                                variant="secondary"
                                                className="text-[10px] bg-gray-100 text-gray-600 font-medium"
                                            >
                                                {roleLabels[agent.role] ||
                                                    agent.role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <span className="text-sm font-semibold text-gray-900 tabular-nums">
                                                {agent.messagesCount}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right hidden md:table-cell">
                                            <span className="text-sm text-gray-600 tabular-nums">
                                                {agent.handledConversations ?? 0}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right hidden md:table-cell">
                                            <span className="text-sm text-gray-600 tabular-nums">
                                                {agent.conversationsCount}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right hidden lg:table-cell">
                                            <span className="text-sm text-gray-600 tabular-nums">
                                                {agent.responseCount ?? 0}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <span
                                                className={cn(
                                                    "text-sm font-medium tabular-nums",
                                                    agent.avgResponseTime !== "N/A"
                                                        ? "text-gray-900"
                                                        : "text-gray-400"
                                                )}
                                            >
                                                {agent.avgResponseTime !== "N/A"
                                                    ? agent.avgResponseTime
                                                    : "-"}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {agents.length === 0 && (
                                    <TableRow>
                                        <TableCell
                                            colSpan={8}
                                            className="text-center py-12"
                                        >
                                            <div className="flex flex-col items-center text-gray-400">
                                                <Users className="h-10 w-10 mb-2 text-gray-300" />
                                                <p className="text-sm font-medium">
                                                    Aucun agent trouv&eacute;
                                                </p>
                                                <p className="text-xs mt-1">
                                                    L&apos;activit&eacute; des
                                                    agents appara&icirc;tra ici
                                                </p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
        </FeatureGate>
    );
}
