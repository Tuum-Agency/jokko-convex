'use client'

import React from 'react';
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Clock, Send, CheckCircle, Eye, AlertCircle, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function BroadcastDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const broadcastId = params.broadcastId as Id<"broadcasts">;

    const broadcast = useQuery(api.broadcasts.get, { id: broadcastId });

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
                    {/* Access Actions like Edit/Duplicate here if needed */}
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
                        <CardTitle>Aperçu</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        {/* Placeholder for future Chart or detailed list */}
                        <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                            Graphique d'évolution (Bientôt disponible)
                        </div>
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Echecs</CardTitle>
                        <CardDescription>Messages non délivrés</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-4">
                            <AlertCircle className="h-8 w-8 text-destructive" />
                            <div>
                                <div className="text-2xl font-bold">{broadcast.failedCount}</div>
                                <p className="text-xs text-muted-foreground">Echecs d'envoi</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
