'use client'

import React from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Clock, Send, CheckCircle, Eye, AlertCircle, MessageSquare, Play, Calendar, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Pie, PieChart, Cell, Legend } from "recharts";

export default function BroadcastDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const broadcastId = params.broadcastId as Id<"broadcasts">;

    const broadcast = useQuery(api.broadcasts.get, { id: broadcastId });
    const updateBroadcast = useMutation(api.broadcasts.update);
    const duplicateBroadcast = useMutation(api.broadcasts.duplicate);

    const handleActivate = async () => {
        if (!broadcast) return;

        const isScheduled = !!broadcast.scheduledAt;
        const newStatus = isScheduled ? 'SCHEDULED' : 'SENDING';

        try {
            await updateBroadcast({
                id: broadcastId,
                status: newStatus,
                // If sending now, we might want to ensure scheduledAt is set to now if it was null, 
                // but usually the backend job looks for "status=SENDING" or "status=SCHEDULED and time passed"
            });
            toast.success(isScheduled ? "Campagne planifiée avec succès" : "Envoi de la campagne en cours...");
        } catch (e) {
            toast.error("Erreur lors de l'activation");
            console.error(e);
        }
    };

    const handleCancel = async () => {
        if (!confirm("Voulez-vous vraiment annuler cette campagne ?")) return;
        try {
            await updateBroadcast({ id: broadcastId, status: 'CANCELLED' });
            toast.success("Campagne annulée");
        } catch (e) {
            toast.error("Erreur lors de l'annulation");
        }
    };

    const handleDuplicate = async () => {
        try {
            const newId = await duplicateBroadcast({ id: broadcastId });
            toast.success("Campagne dupliquée");
            router.push(`/dashboard/broadcasts/${newId}`);
        } catch (e) {
            toast.error("Erreur lors de la duplication");
        }
    };

    if (broadcast === undefined) {
        return (
            <div className="p-6 space-y-6">
                <Skeleton className="h-10 w-1/3" />
                <div className="grid gap-4 md:grid-cols-4">
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                </div>
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    if (broadcast === null) {
        return (
            <div className="p-6 text-center">
                <h2 className="text-2xl font-bold">Campagne introuvable</h2>
                <Button variant="link" onClick={() => router.push('/dashboard/broadcasts')}>Retour aux campagnes</Button>
            </div>
        );
    }

    // Stats calculation
    const deliveryRate = broadcast.sentCount > 0 ? Math.round((broadcast.deliveredCount / broadcast.sentCount) * 100) : 0;
    const openRate = broadcast.deliveredCount > 0 ? Math.round((broadcast.readCount / broadcast.deliveredCount) * 100) : 0;
    const replyRate = broadcast.readCount > 0 ? Math.round((broadcast.repliedCount / broadcast.readCount) * 100) : 0;

    // Charts Data
    const funnelData = [
        { name: 'Envoyés', value: broadcast.sentCount },
        { name: 'Délivrés', value: broadcast.deliveredCount },
        { name: 'Lus', value: broadcast.readCount },
        { name: 'Réponses', value: broadcast.repliedCount },
    ];

    const outcomeData = [
        { name: 'Délivrés', value: broadcast.deliveredCount, color: '#22c55e' },
        { name: 'Echecs', value: broadcast.failedCount, color: '#ef4444' },
    ].filter(d => d.value > 0);

    // Calculate pending (Sent - Delivered - Failed) roughly. 
    // Note: This logic assumes Delivered and Failed are mutually exclusive final states.
    const pending = Math.max(0, broadcast.sentCount - broadcast.deliveredCount - broadcast.failedCount);
    if (pending > 0) {
        outcomeData.push({ name: 'En cours', value: pending, color: '#fbbf24' });
    }

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <Button variant="ghost" className="w-fit pl-0 hover:pl-2 transition-all" onClick={() => router.push('/dashboard/broadcasts')}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Retour aux campagnes
                </Button>

                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold tracking-tight">{broadcast.name}</h1>
                            <Badge variant="outline">{broadcast.status}</Badge>
                        </div>
                        <p className="text-muted-foreground mt-1">
                            Template: <span className="font-medium text-foreground">{broadcast.template?.name || 'Inconnu'}</span> • Créée le {format(new Date(broadcast.createdAt), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handleDuplicate}>
                            <Copy className="mr-2 h-4 w-4" />
                            Dupliquer
                        </Button>
                        {broadcast.status === 'DRAFT' && (
                            <Button onClick={handleActivate} className="bg-green-600 hover:bg-green-700">
                                {broadcast.scheduledAt ? (
                                    <>
                                        <Calendar className="mr-2 h-4 w-4" /> Activer la planification
                                    </>
                                ) : (
                                    <>
                                        <Play className="mr-2 h-4 w-4" /> Envoyer maintenant
                                    </>
                                )}
                            </Button>
                        )}
                        {(broadcast.status === 'SCHEDULED' || broadcast.status === 'DRAFT') && (
                            <Button variant="outline" onClick={handleCancel} className="text- destructive hover:text-destructive">
                                Annuler
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Metrics Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Envoyés</CardTitle>
                        <Send className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{broadcast.sentCount}</div>
                        <p className="text-xs text-muted-foreground">
                            Messages envoyés
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Délivrés</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{broadcast.deliveredCount}</div>
                        <p className="text-xs text-muted-foreground">
                            {deliveryRate}% de taux de délivrabilité
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Lus</CardTitle>
                        <Eye className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{broadcast.readCount}</div>
                        <p className="text-xs text-muted-foreground">
                            {openRate}% de taux d'ouverture
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Réponses</CardTitle>
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{broadcast.repliedCount}</div>
                        <p className="text-xs text-muted-foreground">
                            {replyRate}% de taux de réponse
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Entonnoir de conversion</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-0">
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={funnelData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12 }} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        cursor={{ fill: 'transparent' }}
                                    />
                                    <Bar dataKey="value" fill="#000000" radius={[0, 4, 4, 0]} barSize={32}>
                                        {
                                            funnelData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={['#3b82f6', '#22c55e', '#eab308', '#f97316'][index]} />
                                            ))
                                        }
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Distribution</CardTitle>
                        <CardDescription>État des envois</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[250px] w-full flex items-center justify-center">
                            {outcomeData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={outcomeData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {outcomeData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend verticalAlign="bottom" height={36} />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="text-center text-muted-foreground text-sm">
                                    Aucune donnée d'envoi disponible
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
