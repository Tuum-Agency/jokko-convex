"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

const SEVERITY_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    info: "secondary",
    warning: "default",
    error: "destructive",
};

function formatDate(ms: number | undefined) {
    if (!ms) return "—";
    return new Date(ms).toLocaleString("fr-FR", {
        dateStyle: "short",
        timeStyle: "medium",
    });
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
            <div className="p-6 space-y-4">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-40" />
                <Skeleton className="h-40" />
            </div>
        );
    }

    if (connection === null) {
        return (
            <div className="p-6 space-y-4">
                <p>Connexion introuvable ou accès refusé.</p>
                <Link href="/dashboard/integrations" className="text-sm underline">
                    ← Retour
                </Link>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <Link
                        href="/dashboard/integrations"
                        className="text-sm text-muted-foreground hover:underline"
                    >
                        ← Intégrations
                    </Link>
                    <h1 className="text-2xl font-semibold mt-1">
                        {connection.provider} · {connection.remoteAccountLabel ?? connection._id.slice(0, 12)}
                    </h1>
                </div>
                <Badge variant="outline">{connection.status}</Badge>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Paramètres</CardTitle>
                    <CardDescription>Connexion #{connection._id.slice(0, 12)}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Mode d&apos;authentification</span>
                        <span>{connection.authMode === "oauth2" ? "OAuth 2.0" : "Clé API"}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Mode d&apos;échelle</span>
                        <span>{connection.scalingMode === "large" ? "Large" : "Standard"}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Connecté le</span>
                        <span>{formatDate(connection.connectedAt)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Dernier pull</span>
                        <span>{formatDate(connection.lastSyncAt)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Dernier polling</span>
                        <span>{formatDate(connection.lastPollAt)}</span>
                    </div>
                    {connection.tokenExpiresAt && (
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Token expire</span>
                            <span>{formatDate(connection.tokenExpiresAt)}</span>
                        </div>
                    )}
                    {connection.lastErrorMessageSanitized && (
                        <div className="pt-2 border-t">
                            <div className="text-xs text-muted-foreground">Dernière erreur</div>
                            <div className="text-xs">
                                [{connection.lastErrorCode}] {connection.lastErrorMessageSanitized}
                                {" · "}
                                {formatDate(connection.lastErrorAt)}
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t">
                        <div>
                            <div className="font-medium">Debug mode</div>
                            <div className="text-xs text-muted-foreground">
                                Logs détaillés pendant 24h. S&apos;expire automatiquement.
                            </div>
                        </div>
                        <Switch
                            checked={Boolean(connection.debugMode)}
                            onCheckedChange={handleToggleDebug}
                            disabled={togglingDebug}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>File d&apos;attente en échec (DLQ)</CardTitle>
                    <CardDescription>
                        {dlqItems === undefined
                            ? "Chargement…"
                            : dlqItems.length === 0
                                ? "Aucun élément en échec."
                                : `${dlqItems.length} élément(s) en échec`}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {dlqItems && dlqItems.length > 0 && (
                        <div className="space-y-2">
                            {dlqItems.map((item) => (
                                <div
                                    key={item._id}
                                    className="flex items-start justify-between gap-2 rounded-md border p-3"
                                >
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center gap-2 text-sm">
                                            <Badge
                                                variant={
                                                    item.status === "dead_letter"
                                                        ? "destructive"
                                                        : "secondary"
                                                }
                                            >
                                                {item.status}
                                            </Badge>
                                            <span className="font-medium">{item.eventType}</span>
                                            <span className="text-muted-foreground">
                                                · {item.entityType ?? "?"}#{item.entityId ?? "?"}
                                            </span>
                                        </div>
                                        {item.lastError && (
                                            <div className="text-xs text-muted-foreground">
                                                {item.lastError}
                                            </div>
                                        )}
                                        <div className="text-xs text-muted-foreground">
                                            {item.retryCount} tentative(s) · Dernière :{" "}
                                            {formatDate(item.lastAttemptAt)}
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleReplay(item._id)}
                                        disabled={replayingId === item._id}
                                    >
                                        {replayingId === item._id ? "Replay…" : "Rejouer"}
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Journal d&apos;audit</CardTitle>
                    <CardDescription>50 événements les plus récents</CardDescription>
                </CardHeader>
                <CardContent>
                    {auditLog === undefined ? (
                        <Skeleton className="h-20" />
                    ) : auditLog.length === 0 ? (
                        <div className="text-sm text-muted-foreground">Aucune entrée.</div>
                    ) : (
                        <div className="space-y-2">
                            {auditLog.map((entry) => (
                                <div
                                    key={entry._id}
                                    className="flex items-center gap-3 text-sm border-b pb-2 last:border-b-0"
                                >
                                    <Badge variant={SEVERITY_VARIANT[entry.severity] ?? "secondary"}>
                                        {entry.severity}
                                    </Badge>
                                    <span className="font-mono text-xs">{entry.action}</span>
                                    {entry.entityType && (
                                        <span className="text-xs text-muted-foreground">
                                            {entry.entityType}#{entry.entityId ?? "?"}
                                        </span>
                                    )}
                                    <span className="ml-auto text-xs text-muted-foreground">
                                        {formatDate(entry.createdAt)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
