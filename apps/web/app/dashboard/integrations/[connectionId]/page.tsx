"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { CrmLogo } from "@/components/integrations/crm-logo";
import {
    ArrowLeft,
    CheckCircle2,
    AlertTriangle,
    XCircle,
    Bug,
    AlertCircle,
    Activity,
    FileClock,
    RotateCw,
    Calendar,
    KeyRound,
    Link2,
    Info,
} from "lucide-react";

type ConnectionStatus = "active" | "degraded" | "reconnect_required" | "disconnected";

const STATUS_CONFIG: Record<
    ConnectionStatus,
    {
        label: string;
        icon: React.ElementType;
        className: string;
    }
> = {
    active: {
        label: "Actif",
        icon: CheckCircle2,
        className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    degraded: {
        label: "Dégradé",
        icon: AlertTriangle,
        className: "bg-amber-50 text-amber-700 border-amber-200",
    },
    reconnect_required: {
        label: "Reconnexion requise",
        icon: AlertTriangle,
        className: "bg-red-50 text-red-700 border-red-200",
    },
    disconnected: {
        label: "Déconnecté",
        icon: XCircle,
        className: "bg-gray-50 text-gray-600 border-gray-200",
    },
};

const SEVERITY_CONFIG: Record<
    string,
    { icon: React.ElementType; className: string; label: string }
> = {
    info: {
        icon: Info,
        className: "bg-blue-50 text-blue-700 border-blue-200",
        label: "Info",
    },
    warning: {
        icon: AlertTriangle,
        className: "bg-amber-50 text-amber-700 border-amber-200",
        label: "Warning",
    },
    error: {
        icon: AlertCircle,
        className: "bg-red-50 text-red-700 border-red-200",
        label: "Error",
    },
};

function formatDate(ms: number | undefined) {
    if (!ms) return "—";
    return new Date(ms).toLocaleString("fr-FR", {
        dateStyle: "short",
        timeStyle: "medium",
    });
}

function InfoRow({
    label,
    value,
    icon: Icon,
}: {
    label: string;
    value: React.ReactNode;
    icon?: React.ElementType;
}) {
    return (
        <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
            <div className="flex items-center gap-2 text-sm text-gray-500">
                {Icon && <Icon className="h-3.5 w-3.5" />}
                <span>{label}</span>
            </div>
            <span className="text-sm font-medium text-gray-900">{value}</span>
        </div>
    );
}

export default function ConnectionDetailsPage({
    params,
}: {
    params: Promise<{ connectionId: string }>;
}) {
    const { connectionId } = use(params);
    const id = connectionId as Id<"crmConnections">;

    const connection = useQuery(api.crm.connections.getConnection, { connectionId: id });
    const auditLog = useQuery(api.crm.admin.listAuditLog, { connectionId: id, limit: 50 });
    const dlqItems = useQuery(api.crm.admin.listDLQItems, { connectionId: id, limit: 50 });

    const setDebugMode = useMutation(api.crm.admin.setDebugMode);
    const replayItem = useMutation(api.crm.admin.replayDLQItem);

    const [togglingDebug, setTogglingDebug] = useState(false);
    const [replayingId, setReplayingId] = useState<string | null>(null);

    async function handleToggleDebug(enabled: boolean) {
        setTogglingDebug(true);
        try {
            await setDebugMode({ connectionId: id, enabled });
            toast.success(
                enabled
                    ? "Debug mode activé (expire dans 24h)"
                    : "Debug mode désactivé",
            );
        } catch (e) {
            toast.error(
                `Échec du changement de debug mode : ${e instanceof Error ? e.message : "inconnu"}`,
            );
        } finally {
            setTogglingDebug(false);
        }
    }

    async function handleReplay(queueItemId: Id<"crmSyncQueue">) {
        setReplayingId(queueItemId);
        try {
            await replayItem({ queueItemId });
            toast.success("Élément remis en file d'attente");
        } catch (e) {
            toast.error(
                `Échec du replay : ${e instanceof Error ? e.message : "inconnu"}`,
            );
        } finally {
            setReplayingId(null);
        }
    }

    if (connection === undefined) {
        return (
            <div className="space-y-6">
                <div>
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-8 w-64" />
                </div>
                <Skeleton className="h-48 rounded-xl" />
                <Skeleton className="h-48 rounded-xl" />
                <Skeleton className="h-48 rounded-xl" />
            </div>
        );
    }

    if (connection === null) {
        return (
            <div className="space-y-4">
                <Card className="bg-white border-gray-100 shadow-sm">
                    <CardContent className="p-8 text-center">
                        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 mb-4">
                            <XCircle className="h-6 w-6 text-gray-400" />
                        </div>
                        <h3 className="text-base font-semibold text-gray-900 mb-1">
                            Connexion introuvable
                        </h3>
                        <p className="text-sm text-gray-500 mb-4">
                            Cette connexion n&apos;existe plus ou vous n&apos;y avez pas accès.
                        </p>
                        <Link href="/dashboard/integrations">
                            <Button
                                variant="outline"
                                size="sm"
                                className="rounded-full cursor-pointer"
                            >
                                <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                                Retour aux intégrations
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const statusConfig = STATUS_CONFIG[connection.status as ConnectionStatus];
    const StatusIcon = statusConfig?.icon ?? CheckCircle2;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="space-y-2">
                <Link
                    href="/dashboard/integrations"
                    className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                >
                    <ArrowLeft className="h-3 w-3" />
                    Intégrations
                </Link>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-xl bg-white border border-gray-100 shadow-sm flex items-center justify-center p-2">
                            <CrmLogo
                                provider={connection.provider}
                                className="h-full w-full"
                            />
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight capitalize">
                                {connection.provider}
                            </h1>
                            <p className="text-sm text-gray-500 mt-0.5">
                                {connection.remoteAccountLabel ??
                                    `Connexion #${connection._id.slice(0, 12)}`}
                            </p>
                        </div>
                    </div>
                    {statusConfig && (
                        <Badge
                            variant="outline"
                            className={cn("gap-1 font-medium", statusConfig.className)}
                        >
                            <StatusIcon className="h-3 w-3" />
                            {statusConfig.label}
                        </Badge>
                    )}
                </div>
            </div>

            {/* Settings Card */}
            <Card className="bg-white border-gray-100 shadow-sm">
                <CardContent className="p-5 sm:p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Activity className="h-4 w-4 text-gray-500" />
                        <h2 className="text-sm sm:text-base font-semibold text-gray-900">
                            Paramètres de connexion
                        </h2>
                    </div>
                    <div className="space-y-0">
                        <InfoRow
                            label="Mode d'authentification"
                            icon={connection.authMode === "oauth2" ? Link2 : KeyRound}
                            value={connection.authMode === "oauth2" ? "OAuth 2.0" : "Clé API"}
                        />
                        <InfoRow
                            label="Mode d'échelle"
                            value={connection.scalingMode === "large" ? "Large" : "Standard"}
                        />
                        <InfoRow
                            icon={Calendar}
                            label="Connecté le"
                            value={formatDate(connection.connectedAt)}
                        />
                        <InfoRow
                            icon={RotateCw}
                            label="Dernière synchronisation"
                            value={formatDate(connection.lastSyncAt)}
                        />
                        <InfoRow
                            label="Dernier polling"
                            value={formatDate(connection.lastPollAt)}
                        />
                        {connection.tokenExpiresAt && (
                            <InfoRow
                                label="Expiration du token"
                                value={formatDate(connection.tokenExpiresAt)}
                            />
                        )}
                    </div>

                    {connection.lastErrorMessageSanitized && (
                        <div className="mt-4 rounded-lg bg-red-50 border border-red-200 p-3">
                            <div className="flex items-start gap-2">
                                <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs font-semibold text-red-900">
                                        Dernière erreur
                                    </div>
                                    <div className="text-xs text-red-700 mt-0.5">
                                        [{connection.lastErrorCode}]{" "}
                                        {connection.lastErrorMessageSanitized}
                                    </div>
                                    <div className="text-[11px] text-red-500 mt-1">
                                        {formatDate(connection.lastErrorAt)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between gap-4">
                        <div className="flex items-start gap-2.5">
                            <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                                <Bug className="h-4 w-4 text-gray-500" />
                            </div>
                            <div>
                                <div className="text-sm font-medium text-gray-900">
                                    Mode débogage
                                </div>
                                <div className="text-xs text-gray-500">
                                    Logs détaillés pendant 24h. Expire automatiquement.
                                </div>
                            </div>
                        </div>
                        <Switch
                            checked={Boolean(connection.debugMode)}
                            onCheckedChange={handleToggleDebug}
                            disabled={togglingDebug}
                            className="data-[state=checked]:bg-emerald-600"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* DLQ Card */}
            <Card className="bg-white border-gray-100 shadow-sm">
                <CardContent className="p-5 sm:p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-gray-500" />
                            <h2 className="text-sm sm:text-base font-semibold text-gray-900">
                                File d&apos;attente en échec (DLQ)
                            </h2>
                        </div>
                        {dlqItems && dlqItems.length > 0 && (
                            <Badge
                                variant="secondary"
                                className="bg-red-50 text-red-700 border-0"
                            >
                                {dlqItems.length}
                            </Badge>
                        )}
                    </div>

                    {dlqItems === undefined ? (
                        <Skeleton className="h-20 rounded-lg" />
                    ) : dlqItems.length === 0 ? (
                        <div className="rounded-lg bg-gray-50 border border-gray-100 p-6 text-center">
                            <CheckCircle2 className="h-6 w-6 text-emerald-600 mx-auto mb-2" />
                            <p className="text-sm font-medium text-gray-900">
                                Aucun élément en échec
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                                La file de synchronisation fonctionne correctement.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {dlqItems.map((item) => (
                                <div
                                    key={item._id}
                                    className="flex items-start justify-between gap-3 rounded-lg border border-gray-100 bg-gray-50/50 p-3 hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex-1 space-y-1 min-w-0">
                                        <div className="flex items-center gap-2 text-sm flex-wrap">
                                            <Badge
                                                variant="outline"
                                                className={cn(
                                                    "text-[11px]",
                                                    item.status === "dead_letter"
                                                        ? "bg-red-50 text-red-700 border-red-200"
                                                        : "bg-amber-50 text-amber-700 border-amber-200",
                                                )}
                                            >
                                                {item.status}
                                            </Badge>
                                            <span className="font-medium text-gray-900">
                                                {item.eventType}
                                            </span>
                                            <span className="text-xs text-gray-500 font-mono">
                                                {item.entityType ?? "?"}#{item.entityId ?? "?"}
                                            </span>
                                        </div>
                                        {item.lastError && (
                                            <div className="text-xs text-red-600 truncate">
                                                {item.lastError}
                                            </div>
                                        )}
                                        <div className="text-[11px] text-gray-400">
                                            {item.retryCount} tentative(s) · Dernière :{" "}
                                            {formatDate(item.lastAttemptAt)}
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleReplay(item._id)}
                                        disabled={replayingId === item._id}
                                        className="h-8 rounded-full text-xs shrink-0 cursor-pointer"
                                    >
                                        <RotateCw
                                            className={cn(
                                                "h-3 w-3 mr-1",
                                                replayingId === item._id && "animate-spin",
                                            )}
                                        />
                                        {replayingId === item._id ? "En cours…" : "Rejouer"}
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Audit Log Card */}
            <Card className="bg-white border-gray-100 shadow-sm">
                <CardContent className="p-5 sm:p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <FileClock className="h-4 w-4 text-gray-500" />
                            <h2 className="text-sm sm:text-base font-semibold text-gray-900">
                                Journal d&apos;audit
                            </h2>
                        </div>
                        {auditLog && auditLog.length > 0 && (
                            <span className="text-xs text-gray-500">
                                {auditLog.length} événements
                            </span>
                        )}
                    </div>

                    {auditLog === undefined ? (
                        <Skeleton className="h-24 rounded-lg" />
                    ) : auditLog.length === 0 ? (
                        <div className="rounded-lg bg-gray-50 border border-gray-100 p-6 text-center">
                            <FileClock className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">
                                Aucune entrée dans le journal.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {auditLog.map((entry) => {
                                const severity =
                                    SEVERITY_CONFIG[entry.severity] ?? SEVERITY_CONFIG.info;
                                const SeverityIcon = severity.icon;
                                return (
                                    <div
                                        key={entry._id}
                                        className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0"
                                    >
                                        <Badge
                                            variant="outline"
                                            className={cn(
                                                "gap-1 text-[11px] shrink-0",
                                                severity.className,
                                            )}
                                        >
                                            <SeverityIcon className="h-2.5 w-2.5" />
                                            {severity.label}
                                        </Badge>
                                        <span className="font-mono text-xs text-gray-700 truncate">
                                            {entry.action}
                                        </span>
                                        {entry.entityType && (
                                            <span className="text-[11px] text-gray-400 font-mono truncate">
                                                {entry.entityType}#{entry.entityId ?? "?"}
                                            </span>
                                        )}
                                        <span className="ml-auto text-[11px] text-gray-400 whitespace-nowrap">
                                            {formatDate(entry.createdAt)}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
