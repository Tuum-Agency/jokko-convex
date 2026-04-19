"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel";

type ConnectionStatus = "active" | "degraded" | "reconnect_required" | "disconnected";

const STATUS_VARIANT: Record<ConnectionStatus, "default" | "secondary" | "destructive" | "outline"> = {
    active: "default",
    degraded: "secondary",
    reconnect_required: "destructive",
    disconnected: "outline",
};

const STATUS_LABEL: Record<ConnectionStatus, string> = {
    active: "Actif",
    degraded: "Dégradé",
    reconnect_required: "Reconnexion requise",
    disconnected: "Déconnecté",
};

export default function IntegrationsPage() {
    const providers = useQuery(api.crm.connections.listAvailableProviders);
    const connections = useQuery(api.crm.connections.listForCurrentOrganization);
    const startOAuth = useAction(api.crm.oauth.start);
    const disconnect = useMutation(api.crm.connections.disconnect);

    const router = useRouter();
    const searchParams = useSearchParams();
    const [starting, setStarting] = useState<string | null>(null);

    useEffect(() => {
        const err = searchParams.get("error");
        const connected = searchParams.get("connected");
        if (err) {
            const detail = searchParams.get("detail");
            toast.error(
                detail ? `Connexion échouée (${err}) : ${detail}` : `Connexion échouée : ${err}`,
            );
            router.replace("/dashboard/integrations");
        } else if (connected) {
            toast.success(`Connecté avec succès à ${connected}`);
            router.replace("/dashboard/integrations");
        }
    }, [searchParams, router]);

    type ConnectionRow = NonNullable<typeof connections>[number];
    const connectionByProvider = useMemo(() => {
        const map = new Map<string, ConnectionRow>();
        if (!connections) return map;
        for (const c of connections) {
            if (!map.has(c.provider) || c.status === "active") {
                map.set(c.provider, c);
            }
        }
        return map;
    }, [connections]);

    async function handleConnect(provider: string) {
        setStarting(provider);
        try {
            const { authorizeUrl } = await startOAuth({ provider, scalingMode: "standard" });
            window.location.assign(authorizeUrl);
        } catch (e) {
            const msg = e instanceof Error ? e.message : "Erreur inconnue";
            toast.error(`Impossible de démarrer la connexion : ${msg}`);
            setStarting(null);
        }
    }

    async function handleDisconnect(connectionId: Id<"crmConnections">, provider: string) {
        const confirmed = window.confirm(
            `Déconnecter ${provider} ? Les tokens seront immédiatement supprimés.`,
        );
        if (!confirmed) return;
        try {
            await disconnect({ connectionId });
            toast.success(`${provider} déconnecté`);
        } catch (e) {
            const msg = e instanceof Error ? e.message : "Erreur inconnue";
            toast.error(`Échec de la déconnexion : ${msg}`);
        }
    }

    if (!providers) {
        return (
            <div className="p-6 space-y-4">
                <Skeleton className="h-8 w-64" />
                <div className="grid gap-4 md:grid-cols-2">
                    <Skeleton className="h-40" />
                    <Skeleton className="h-40" />
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-semibold">Intégrations CRM</h1>
                <p className="text-muted-foreground">
                    Connectez votre CRM pour synchroniser les contacts et enregistrer automatiquement
                    les événements de conversation.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                {providers.map((p) => {
                    const existing = connectionByProvider.get(p.key);
                    const isAvailable = p.availability === "available";
                    const isBusy = starting === p.key;
                    return (
                        <Card key={p.key}>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <CardTitle>{p.displayName}</CardTitle>
                                        <CardDescription>
                                            Mode : {p.authMode === "oauth2" ? "OAuth 2.0" : "Clé API"}
                                            {p.supportsDeals ? " · Deals" : ""}
                                            {p.supportsWebhooks ? " · Webhooks" : ""}
                                        </CardDescription>
                                    </div>
                                    {!isAvailable && (
                                        <Badge variant="outline">
                                            {p.availability === "coming_soon" ? "Bientôt" : "Roadmap"}
                                        </Badge>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {existing && (
                                    <div className="flex items-center justify-between rounded-md border p-3">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <Badge variant={STATUS_VARIANT[existing.status as ConnectionStatus]}>
                                                    {STATUS_LABEL[existing.status as ConnectionStatus]}
                                                </Badge>
                                                {existing.remoteAccountLabel && (
                                                    <span className="text-sm">{existing.remoteAccountLabel}</span>
                                                )}
                                            </div>
                                            {existing.lastErrorMessageSanitized && (
                                                <p className="text-xs text-muted-foreground">
                                                    Dernière erreur : {existing.lastErrorMessageSanitized}
                                                </p>
                                            )}
                                        </div>
                                        {existing.status !== "disconnected" && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDisconnect(existing._id, p.displayName)}
                                            >
                                                Déconnecter
                                            </Button>
                                        )}
                                    </div>
                                )}

                                <div className="flex items-center gap-2">
                                    <Button
                                        onClick={() => handleConnect(p.key)}
                                        disabled={!isAvailable || isBusy}
                                    >
                                        {isBusy
                                            ? "Redirection…"
                                            : existing && existing.status !== "disconnected"
                                                ? "Reconnecter"
                                                : "Connecter"}
                                    </Button>
                                    {p.docsUrl && (
                                        <a
                                            href={p.docsUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-muted-foreground hover:underline"
                                        >
                                            Documentation
                                        </a>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
