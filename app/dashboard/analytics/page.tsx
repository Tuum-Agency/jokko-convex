"use client";

import React from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
    MessageSquare,
    Users,
    Clock,
    Activity,
    ArrowUpRight,
    Download,
    AlertCircle
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import Papa from "papaparse";

export default function AnalyticsPage() {
    const role = useQuery(api.users.currentUserRole);
    const stats = useQuery(api.analytics.getDashboardStats, {});

    if (role === undefined) {
        return (
            <div className="p-8 space-y-4">
                <Skeleton className="h-12 w-48" />
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }

    if (role === 'AGENT') {
        return (
            <div className="p-6">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Accès refusé</AlertTitle>
                    <AlertDescription>
                        Vous n'avez pas les autorisations nécessaires pour accéder à cette page.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="p-8 space-y-8">
                <div className="space-y-4">
                    <Skeleton className="h-10 w-48" />
                    <Skeleton className="h-4 w-96" />
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-32 rounded-xl" />
                    ))}
                </div>
                <Skeleton className="h-[400px] rounded-xl" />
            </div>
        );
    }

    const { global, agents } = stats;

    const handleExport = () => {
        if (!agents || agents.length === 0) return;

        // Prepare data for CSV
        const csvData = agents.map((agent: any) => ({
            Nom: agent.name,
            Role: agent.role,
            "Messages Envoyés": agent.messagesCount,
            "Conversations Assignées": agent.conversationsCount,
            "Temps de Réponse Moyen": agent.avgResponseTime
        }));

        // Convert to CSV
        const csv = Papa.unparse(csvData);

        // Download
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `analytics_agents_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="flex-1 space-y-8 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Analytique</h2>
                    <p className="text-muted-foreground">
                        Vue d'ensemble des performances de l'application et des agents.
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    {/* Date Picker could go here */}
                    <div className="px-3 py-1 bg-muted rounded-md text-sm text-muted-foreground">
                        Derniers 30 jours
                    </div>
                    <Button onClick={handleExport} variant="outline" size="sm" className="h-8 gap-2">
                        <Download className="h-4 w-4" />
                        Exporter
                    </Button>
                </div>
            </div>

            {/* Global Stats Section */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Messages Totaux
                        </CardTitle>
                        <div className="h-9 w-9 rounded-xl flex items-center justify-center bg-blue-50">
                            <MessageSquare className="h-5 w-5 text-blue-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{global.totalMessages}</div>
                        <p className="text-xs text-muted-foreground flex items-center mt-1">
                            <span className="text-emerald-500 flex items-center mr-1">
                                <ArrowUpRight className="h-3 w-3 mr-0.5" />
                                {Math.round((global.inboundCount / (global.totalMessages || 1)) * 100)}%
                            </span>
                            Entrants vs Sortants
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Conversations Actives
                        </CardTitle>
                        <div className="h-9 w-9 rounded-xl flex items-center justify-center bg-emerald-50">
                            <Activity className="h-5 w-5 text-emerald-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{global.openConversations}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {global.closedConversations} fermées sur la période
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Agents Actifs
                        </CardTitle>
                        <div className="h-9 w-9 rounded-xl flex items-center justify-center bg-violet-50">
                            <Users className="h-5 w-5 text-violet-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{agents.length}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Performance globale
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Temps de Réponse Moyen
                        </CardTitle>
                        <div className="h-9 w-9 rounded-xl flex items-center justify-center bg-orange-50">
                            <Clock className="h-5 w-5 text-orange-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{global.avgResponseTime || "N/A"}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Moyenne globale
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Agents Performance Section */}
            <div className="grid gap-4 grid-cols-1">
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Performance des Agents</CardTitle>
                        <CardDescription>
                            Détails des activités par agent. Les métriques incluent les messages envoyés et les conversations assignées.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[80px]"></TableHead>
                                    <TableHead>Agent</TableHead>
                                    <TableHead>Rôle</TableHead>
                                    <TableHead className="text-right">Messages Envoyés</TableHead>
                                    <TableHead className="text-right">Assignations</TableHead>
                                    <TableHead className="text-right">Temps Moyen (Est.)</TableHead>
                                    <TableHead className="text-right">Score</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {agents.map((agent: any) => (
                                    <TableRow key={agent.id}>
                                        <TableCell>
                                            <Avatar className="h-9 w-9">
                                                <AvatarFallback className="bg-linear-to-br from-green-500 to-green-600 text-white font-medium border border-green-600/20 shadow-sm">
                                                    {agent.name.substring(0, 2).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {agent.name}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="text-xs">
                                                {agent.role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-mono">
                                            {agent.messagesCount}
                                        </TableCell>
                                        <TableCell className="text-right font-mono">
                                            {agent.conversationsCount}
                                        </TableCell>
                                        <TableCell className="text-right text-muted-foreground">
                                            {agent.avgResponseTime !== "N/A" ? agent.avgResponseTime : "-"}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {/* Simulate a score or just hide it */}
                                            <div className="flex items-center justify-end gap-2">
                                                <div className="h-2 w-16 bg-secondary rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-primary"
                                                        style={{ width: `${Math.min((agent.messagesCount / 100) * 100, 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {agents.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                                            Aucun agent trouvé ou aucune activité récente.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
