'use client'

import React, { useState } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
    ArrowLeft, Send, CheckCircle, Eye, MessageSquare, Play, Calendar, Copy, XCircle,
    Plus, RefreshCw, GitCompare
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Pie, PieChart, Cell, Legend } from "recharts";
import { cn } from '@/lib/utils';

const STAT_GRADIENTS = [
    'from-[#14532d] to-[#059669]',
    'from-[#166534] to-[#0d9488]',
    'from-[#15803d] to-[#10b981]',
    'from-[#14532d] to-[#34d399]',
];

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; fill?: string; color?: string }>; label?: string }) {
    if (!active || !payload?.length) return null;
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
    );
}

const ACTIVITY_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
    created: Plus,
    scheduled: Calendar,
    sending_started: Play,
    completed: CheckCircle,
    failures: XCircle,
    cancelled: XCircle,
    retry: RefreshCw,
};

const ACTIVITY_COLOR_MAP: Record<string, string> = {
    created: 'bg-green-500',
    scheduled: 'bg-amber-500',
    sending_started: 'bg-blue-500',
    completed: 'bg-green-500',
    failures: 'bg-red-500',
    cancelled: 'bg-gray-500',
    retry: 'bg-blue-500',
};

export default function BroadcastDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const broadcastId = params.broadcastId as Id<"broadcasts">;

    const broadcast = useQuery(api.broadcasts.get, { id: broadcastId });
    const updateBroadcast = useMutation(api.broadcasts.update);
    const duplicateBroadcast = useMutation(api.broadcasts.duplicate);
    const retryFailedMutation = useMutation(api.broadcasts.retryFailed);

    // Feature 2: Activity timeline
    const activityData = useQuery(api.broadcasts.getActivity, { broadcastId });

    // Feature 3: Confirmation dialog state
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

    // Feature 4: Retry loading state
    const [retryLoading, setRetryLoading] = useState(false);

    // Feature 6: Campaign comparison
    const [showCompareDialog, setShowCompareDialog] = useState(false);
    const [compareId, setCompareId] = useState<string | null>(null);
    const allBroadcasts = useQuery(api.broadcasts.list, {});
    const compareBroadcast = useQuery(
        api.broadcasts.get,
        compareId ? { id: compareId as Id<"broadcasts"> } : "skip"
    );

    const handleActivate = async () => {
        if (!broadcast) return;

        const isScheduled = !!broadcast.scheduledAt;
        const newStatus = isScheduled ? 'SCHEDULED' : 'SENDING';

        try {
            await updateBroadcast({
                id: broadcastId,
                status: newStatus,
            });
            toast.success(isScheduled ? "Campagne planifiée avec succès" : "Envoi de la campagne en cours...");
        } catch {
            toast.error("Erreur lors de l'activation");
        }
    };

    const handleCancel = async () => {
        if (!confirm("Voulez-vous vraiment annuler cette campagne ?")) return;
        try {
            await updateBroadcast({ id: broadcastId, status: 'CANCELLED' });
            toast.success("Campagne annulée");
        } catch {
            toast.error("Erreur lors de l'annulation");
        }
    };

    const handleDuplicate = async () => {
        try {
            const newId = await duplicateBroadcast({ id: broadcastId });
            toast.success("Campagne dupliquée");
            router.push(`/dashboard/campagnes/${newId}`);
        } catch {
            toast.error("Erreur lors de la duplication");
        }
    };

    // Feature 4: Retry failed handler
    const handleRetryFailed = async () => {
        if (!broadcast) return;
        setRetryLoading(true);
        try {
            const result = await retryFailedMutation({ broadcastId });
            toast.success(`${result.retriedCount} messages relancés`);
        } catch {
            toast.error("Erreur lors de la relance");
        } finally {
            setRetryLoading(false);
        }
    };

    if (broadcast === undefined) {
        return (
            <div className="space-y-6 p-4 sm:p-6">
                <div className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-lg" />
                    <div>
                        <Skeleton className="h-7 w-48 mb-2" />
                        <Skeleton className="h-4 w-72" />
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
                        <CardContent className="p-6"><Skeleton className="h-[250px] w-full rounded-lg" /></CardContent>
                    </Card>
                    <Card className="lg:col-span-2 bg-white border-gray-100 shadow-sm">
                        <CardContent className="p-6"><Skeleton className="h-[250px] w-full rounded-lg" /></CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    if (broadcast === null) {
        return (
            <div className="p-4 sm:p-6 flex flex-col items-center justify-center py-20">
                <div className="h-14 w-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                    <XCircle className="h-7 w-7 text-gray-400" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Campagne introuvable</h2>
                <p className="text-sm text-gray-500 mt-1 mb-4">Cette campagne n&apos;existe pas ou a été supprimée.</p>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push('/dashboard/campagnes')}
                    className="h-8 gap-1.5 text-xs rounded-full cursor-pointer"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Retour aux campagnes
                </Button>
            </div>
        );
    }

    const deliveryRate = broadcast.sentCount > 0 ? Math.round((broadcast.deliveredCount / broadcast.sentCount) * 100) : 0;
    const openRate = broadcast.deliveredCount > 0 ? Math.round((broadcast.readCount / broadcast.deliveredCount) * 100) : 0;
    const replyRate = broadcast.readCount > 0 ? Math.round((broadcast.repliedCount / broadcast.readCount) * 100) : 0;

    // Feature 1: Progress calculation
    const progress = broadcast.totalAudience > 0 ? Math.round((broadcast.sentCount / broadcast.totalAudience) * 100) : 0;

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'COMPLETED': return { label: 'Terminée', className: 'bg-green-50 text-green-700 border-green-200' };
            case 'FAILED': return { label: 'Échouée', className: 'bg-red-50 text-red-700 border-red-200' };
            case 'SENDING': return { label: 'En cours', className: 'bg-blue-50 text-blue-700 border-blue-200' };
            case 'SCHEDULED': return { label: 'Planifiée', className: 'bg-amber-50 text-amber-700 border-amber-200' };
            case 'DRAFT': return { label: 'Brouillon', className: 'bg-gray-50 text-gray-600 border-gray-200' };
            case 'CANCELLED': return { label: 'Annulée', className: 'bg-gray-50 text-gray-500 border-gray-200' };
            default: return { label: status, className: 'bg-gray-50 text-gray-600 border-gray-200' };
        }
    };

    const statusConfig = getStatusConfig(broadcast.status);

    const metricCards = [
        { title: 'Envoyés', value: broadcast.sentCount, desc: 'Messages envoyés', icon: Send, gradient: STAT_GRADIENTS[0] },
        { title: 'Délivrés', value: broadcast.deliveredCount, desc: `${deliveryRate}% de taux de délivrabilité`, icon: CheckCircle, gradient: STAT_GRADIENTS[1] },
        { title: 'Lus', value: broadcast.readCount, desc: `${openRate}% de taux d'ouverture`, icon: Eye, gradient: STAT_GRADIENTS[2] },
        { title: 'Réponses', value: broadcast.repliedCount, desc: `${replyRate}% de taux de réponse`, icon: MessageSquare, gradient: STAT_GRADIENTS[3] },
    ];

    const funnelData = [
        { name: 'Envoyés', value: broadcast.sentCount },
        { name: 'Délivrés', value: broadcast.deliveredCount },
        { name: 'Lus', value: broadcast.readCount },
        { name: 'Réponses', value: broadcast.repliedCount },
    ];

    const funnelColors = ['#14532d', '#059669', '#10b981', '#34d399'];

    const outcomeData = [
        { name: 'Délivrés', value: broadcast.deliveredCount, color: '#059669' },
        { name: 'Échecs', value: broadcast.failedCount, color: '#ef4444' },
    ].filter(d => d.value > 0);

    const pending = Math.max(0, broadcast.sentCount - broadcast.deliveredCount - broadcast.failedCount);
    if (pending > 0) {
        outcomeData.push({ name: 'En cours', value: pending, color: '#fbbf24' });
    }

    return (
        <div className="space-y-6 p-4 sm:p-6">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <Button
                    variant="ghost"
                    className="w-fit pl-0 hover:pl-2 transition-all text-gray-400 hover:text-gray-600 cursor-pointer"
                    onClick={() => router.push('/dashboard/campagnes')}
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    <span className="text-sm">Retour aux campagnes</span>
                </Button>

                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="font-display text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                                {broadcast.name}
                            </h1>
                            <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border", statusConfig.className)}>
                                {statusConfig.label}
                            </span>
                        </div>
                        {/* Feature 5: Show channel used */}
                        <p className="text-sm text-gray-500 mt-0.5">
                            Template: <span className="font-medium text-gray-700">{broadcast.template?.name || 'Inconnu'}</span>
                            {' '}&middot;{' '}
                            Créée le {format(new Date(broadcast.createdAt), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                            {broadcast.channelName && (
                                <>
                                    {' '}&middot;{' '}
                                    Canal: <span className="font-medium text-gray-700">{broadcast.channelName}</span>
                                </>
                            )}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Feature 6: Compare button */}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowCompareDialog(true)}
                            className="h-8 gap-1.5 text-xs rounded-full cursor-pointer"
                        >
                            <GitCompare className="h-3.5 w-3.5" />
                            Comparer
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleDuplicate} className="h-8 gap-1.5 text-xs rounded-full cursor-pointer">
                            <Copy className="h-3.5 w-3.5" />
                            Dupliquer
                        </Button>
                        {/* Feature 4: Retry failed button */}
                        {broadcast.failedCount > 0 && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleRetryFailed}
                                disabled={retryLoading}
                                className="h-8 gap-1.5 text-xs rounded-full cursor-pointer text-orange-600 border-orange-200 hover:bg-orange-50 hover:text-orange-700"
                            >
                                <RefreshCw className={cn("h-3.5 w-3.5", retryLoading && "animate-spin")} />
                                {retryLoading ? 'Relance...' : 'Relancer les échecs'}
                            </Button>
                        )}
                        {/* Feature 3: Confirmation dialog before sending */}
                        {broadcast.status === 'DRAFT' && (
                            <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        size="sm"
                                        className="h-8 gap-1.5 text-xs rounded-full cursor-pointer"
                                    >
                                        {broadcast.scheduledAt ? (
                                            <>
                                                <Calendar className="h-3.5 w-3.5" /> Activer la planification
                                            </>
                                        ) : (
                                            <>
                                                <Play className="h-3.5 w-3.5" /> Envoyer maintenant
                                            </>
                                        )}
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Confirmer l&apos;envoi</AlertDialogTitle>
                                        <AlertDialogDescription asChild>
                                            <div className="space-y-2 text-sm text-gray-600">
                                                <p>Vous allez lancer cette campagne :</p>
                                                <ul className="space-y-1.5 ml-1">
                                                    <li><span className="font-medium text-gray-800">Campagne :</span> {broadcast.name}</li>
                                                    <li><span className="font-medium text-gray-800">Template :</span> {broadcast.template?.name || 'Inconnu'}</li>
                                                    <li><span className="font-medium text-gray-800">Audience estimée :</span> {broadcast.totalAudience} contacts</li>
                                                    <li><span className="font-medium text-gray-800">Canal :</span> {broadcast.channelName || 'Par défaut'}</li>
                                                </ul>
                                            </div>
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel className="cursor-pointer">Annuler</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={() => {
                                                setShowConfirmDialog(false);
                                                handleActivate();
                                            }}
                                            className="bg-green-600 hover:bg-green-700 cursor-pointer"
                                        >
                                            Envoyer maintenant
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                        {(broadcast.status === 'SCHEDULED' || broadcast.status === 'DRAFT') && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleCancel}
                                className="h-8 gap-1.5 text-xs rounded-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 cursor-pointer"
                            >
                                Annuler
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Feature 1: Real-time Progress Bar */}
            {broadcast.status === 'SENDING' && (
                <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
                        </span>
                        <span className="text-sm font-medium text-gray-700">
                            Envoi en cours... {broadcast.sentCount}/{broadcast.totalAudience} ({progress}%)
                        </span>
                    </div>
                    <Progress
                        value={progress}
                        className="h-3 bg-gray-100"
                    />
                </div>
            )}

            {/* Metric Cards */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                {metricCards.map((metric) => {
                    const Icon = metric.icon;
                    return (
                        <Card key={metric.title} className="bg-white border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                            <CardContent className="p-4 sm:p-5">
                                <div className="flex items-center justify-between mb-3 sm:mb-4">
                                    <div className={cn("h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-gradient-to-br flex items-center justify-center shadow-lg shadow-green-900/20", metric.gradient)}>
                                        <Icon className="h-[18px] w-[18px] sm:h-5 sm:w-5 text-white" />
                                    </div>
                                </div>
                                <p className="text-xs sm:text-sm font-medium text-gray-500 mb-0.5">{metric.title}</p>
                                <span className="text-xl sm:text-3xl font-bold text-gray-900 tracking-tight">{metric.value}</span>
                                <p className="text-[11px] text-gray-400 mt-0.5">{metric.desc}</p>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Charts */}
            <div className="grid gap-6 lg:grid-cols-5">
                {/* Funnel Chart */}
                <Card className="lg:col-span-3 bg-white border-gray-100 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm sm:text-base font-semibold text-gray-900">
                            Entonnoir de conversion
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 pb-4">
                        {funnelData.some(d => d.value > 0) ? (
                            <div className="h-[220px] sm:h-[260px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={funnelData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                        <XAxis type="number" hide />
                                        <YAxis
                                            dataKey="name"
                                            type="category"
                                            width={80}
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 11, fill: '#94a3b8' }}
                                        />
                                        <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f8fafc' }} />
                                        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={28}>
                                            {funnelData.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={funnelColors[index]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-[220px] sm:h-[260px] flex flex-col items-center justify-center text-gray-400">
                                <Send className="h-10 w-10 mb-3 text-gray-300" />
                                <p className="text-sm font-medium">Aucune donnée disponible</p>
                                <p className="text-xs mt-1">Les données apparaîtront après l&apos;envoi</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Distribution Chart */}
                <Card className="lg:col-span-2 bg-white border-gray-100 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm sm:text-base font-semibold text-gray-900">
                            Distribution
                        </CardTitle>
                        <CardDescription className="text-[11px] text-gray-400">
                            État des envois
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="h-[220px] sm:h-[260px] flex items-center justify-center">
                            {outcomeData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={outcomeData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={55}
                                            outerRadius={75}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {outcomeData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<ChartTooltip />} />
                                        <Legend
                                            verticalAlign="bottom"
                                            height={36}
                                            formatter={(value) => (
                                                <span className="text-[11px] text-gray-500">{value}</span>
                                            )}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="text-center text-gray-400">
                                    <Eye className="h-10 w-10 mb-3 text-gray-300 mx-auto" />
                                    <p className="text-sm font-medium">Aucune donnée d&apos;envoi</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Feature 2: Activity Timeline */}
            {activityData && activityData.activities.length > 0 && (
                <Card className="bg-white border-gray-100 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm sm:text-base font-semibold text-gray-900">
                            Historique d&apos;activité
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-2 pb-4">
                        <div className="relative">
                            {/* Vertical line */}
                            <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gray-200" />
                            <div className="space-y-4">
                                {activityData.activities.map((activity, index) => {
                                    const IconComp = ACTIVITY_ICON_MAP[activity.type] || Plus;
                                    const dotColor = ACTIVITY_COLOR_MAP[activity.type] || 'bg-gray-400';
                                    return (
                                        <div key={`${activity.type}-${index}`} className="flex items-start gap-3 relative">
                                            <div className={cn("relative z-10 flex items-center justify-center h-6 w-6 rounded-full shrink-0", dotColor)}>
                                                <IconComp className="h-3 w-3 text-white" />
                                            </div>
                                            <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                                                <p className="text-sm text-gray-700 truncate">{activity.message}</p>
                                                <time className="text-[11px] text-gray-400 whitespace-nowrap shrink-0">
                                                    {format(new Date(activity.timestamp), "dd MMM yyyy 'à' HH:mm", { locale: fr })}
                                                </time>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Feature 6: Campaign Comparison Dialog */}
            <Dialog open={showCompareDialog} onOpenChange={setShowCompareDialog}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Comparer les campagnes</DialogTitle>
                        <DialogDescription>
                            Sélectionnez une campagne pour comparer les performances
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <Select
                            value={compareId ?? ""}
                            onValueChange={(val) => setCompareId(val || null)}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Choisir une campagne..." />
                            </SelectTrigger>
                            <SelectContent>
                                {allBroadcasts?.filter(b => b._id !== broadcastId).map((b) => (
                                    <SelectItem key={b._id} value={b._id}>
                                        {b.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {compareId && compareBroadcast && (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-200">
                                            <th className="text-left py-2 px-3 font-medium text-gray-500">Métrique</th>
                                            <th className="text-center py-2 px-3 font-medium text-gray-700">{broadcast.name}</th>
                                            <th className="text-center py-2 px-3 font-medium text-gray-700">{compareBroadcast.name}</th>
                                            <th className="text-center py-2 px-3 font-medium text-gray-500">Diff</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[
                                            { label: 'Envoyés', a: broadcast.sentCount, b: compareBroadcast.sentCount, higherIsBetter: true },
                                            { label: 'Délivrés', a: broadcast.deliveredCount, b: compareBroadcast.deliveredCount, higherIsBetter: true },
                                            { label: 'Lus', a: broadcast.readCount, b: compareBroadcast.readCount, higherIsBetter: true },
                                            { label: 'Réponses', a: broadcast.repliedCount, b: compareBroadcast.repliedCount, higherIsBetter: true },
                                            { label: 'Échecs', a: broadcast.failedCount, b: compareBroadcast.failedCount, higherIsBetter: false },
                                        ].map((row) => {
                                            const diff = row.a - row.b;
                                            const isBetter = row.higherIsBetter ? diff > 0 : diff < 0;
                                            const isWorse = row.higherIsBetter ? diff < 0 : diff > 0;
                                            return (
                                                <tr key={row.label} className="border-b border-gray-100">
                                                    <td className="py-2.5 px-3 text-gray-600 font-medium">{row.label}</td>
                                                    <td className="py-2.5 px-3 text-center font-semibold text-gray-900">{row.a}</td>
                                                    <td className="py-2.5 px-3 text-center font-semibold text-gray-900">{row.b}</td>
                                                    <td className={cn(
                                                        "py-2.5 px-3 text-center font-semibold",
                                                        isBetter && "text-green-600",
                                                        isWorse && "text-red-600",
                                                        diff === 0 && "text-gray-400"
                                                    )}>
                                                        {diff > 0 ? '+' : ''}{diff}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {compareId && compareBroadcast === undefined && (
                            <div className="flex justify-center py-8">
                                <Skeleton className="h-40 w-full rounded-lg" />
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
