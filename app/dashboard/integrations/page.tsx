"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { DisconnectDialog } from "@/components/integrations/disconnect-dialog";
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

const PROVIDER_INSTANCE_HINT: Record<string, { label: string; placeholder: string } | undefined> = {
    nocrm: {
        label: "Sous-domaine noCRM.io",
        placeholder: "monentreprise (sera utilisé comme https://monentreprise.nocrm.io)",
    },
};

interface OAuthErrorMapping {
    title: string;
    description: string;
    severity: "error" | "warning" | "info";
}

const OAUTH_ERROR_MATRIX: Record<string, OAuthErrorMapping> = {
    invalid_grant: {
        title: "Autorisation expirée",
        description: "Reconnectez-vous pour continuer.",
        severity: "error",
    },
    redirect_uri_mismatch: {
        title: "Configuration incorrecte",
        description:
            "L'URI de redirection côté fournisseur ne correspond pas. Contactez le support.",
        severity: "error",
    },
    scope_denied: {
        title: "Permissions refusées",
        description: "Vous avez refusé certaines permissions nécessaires. Réessayez.",
        severity: "warning",
    },
    access_denied: {
        title: "Permissions refusées",
        description: "Vous avez refusé certaines permissions nécessaires. Réessayez.",
        severity: "warning",
    },
    user_cancelled: {
        title: "Connexion annulée",
        description: "Vous avez annulé la connexion. Réessayez quand vous êtes prêt.",
        severity: "info",
    },
    provider_down: {
        title: "Service temporairement indisponible",
        description: "Réessayez dans quelques minutes.",
        severity: "warning",
    },
    rate_limited_callback: {
        title: "Trop de tentatives",
        description: "Patientez 5 minutes avant de réessayer.",
        severity: "warning",
    },
    state_expired: {
        title: "Tentative expirée",
        description: "Votre tentative a expiré après 10 minutes. Recommencez.",
        severity: "info",
    },
    state_consumed: {
        title: "Tentative déjà utilisée",
        description: "Recommencez une nouvelle connexion.",
        severity: "info",
    },
    missing_params: {
        title: "Paramètres manquants",
        description: "La réponse du fournisseur est incomplète. Recommencez.",
        severity: "error",
    },
    server_misconfigured: {
        title: "Configuration serveur",
        description: "Contactez le support : la plateforme n'est pas correctement configurée.",
        severity: "error",
    },
    oauth_exchange_failed: {
        title: "Échec de l'échange OAuth",
        description: "La connexion n'a pas pu être finalisée. Réessayez.",
        severity: "error",
    },
};

function resolveOAuthError(code: string): OAuthErrorMapping {
    return (
        OAUTH_ERROR_MATRIX[code] ?? {
            title: "Connexion échouée",
            description: code,
            severity: "error",
        }
    );
}

export default function IntegrationsPage() {
    const providers = useQuery(api.crm.connections.listAvailableProviders);
    const connections = useQuery(api.crm.connections.listForCurrentOrganization);
    const optInStats = useQuery(api.crm.optin.getImportedOptInStats);
    const startOAuth = useAction(api.crm.oauth.start);
    const connectApiKey = useAction(api.crm.apikey.connectWithApiKey);
    const disconnect = useMutation(api.crm.connections.disconnect);

    const router = useRouter();
    const searchParams = useSearchParams();
    const [starting, setStarting] = useState<string | null>(null);
    const [apiKeyDialog, setApiKeyDialog] = useState<{
        providerKey: string;
        providerLabel: string;
    } | null>(null);
    const [apiKeyInput, setApiKeyInput] = useState("");
    const [instanceInput, setInstanceInput] = useState("");
    const [submittingKey, setSubmittingKey] = useState(false);
    const [disconnectTarget, setDisconnectTarget] = useState<{
        id: Id<"crmConnections">;
        label: string;
    } | null>(null);
    const [disconnecting, setDisconnecting] = useState(false);
    const [showOptInBanner, setShowOptInBanner] = useState(false);

    useEffect(() => {
        const err = searchParams.get("error");
        const connected = searchParams.get("connected");
        const justConnected = searchParams.get("just_connected") === "1";
        if (err) {
            const mapping = resolveOAuthError(err);
            const detail = searchParams.get("detail");
            if (mapping.severity === "error") {
                toast.error(mapping.title + (detail ? ` : ${detail}` : ""), {
                    description: mapping.description,
                });
            } else {
                toast(mapping.title, { description: mapping.description });
            }
            router.replace("/dashboard/integrations");
        } else if (connected) {
            toast.success(`Connecté avec succès à ${connected}`);
            router.replace("/dashboard/integrations?just_connected=1");
        } else if (justConnected) {
            setShowOptInBanner(true);
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

    async function handleConnect(provider: { key: string; displayName: string; authMode: string }) {
        if (provider.authMode === "apiKey") {
            setApiKeyDialog({ providerKey: provider.key, providerLabel: provider.displayName });
            setApiKeyInput("");
            setInstanceInput("");
            return;
        }
        setStarting(provider.key);
        try {
            const { authorizeUrl } = await startOAuth({
                provider: provider.key,
                scalingMode: "standard",
            });
            window.location.assign(authorizeUrl);
        } catch (e) {
            const msg = e instanceof Error ? e.message : "Erreur inconnue";
            toast.error(`Impossible de démarrer la connexion : ${msg}`);
            setStarting(null);
        }
    }

    async function handleApiKeySubmit() {
        if (!apiKeyDialog) return;
        const trimmed = apiKeyInput.trim();
        if (!trimmed) {
            toast.error("Clé API requise");
            return;
        }
        const hint = PROVIDER_INSTANCE_HINT[apiKeyDialog.providerKey];
        const instanceUrl = hint ? instanceInput.trim() : undefined;
        if (hint && !instanceUrl) {
            toast.error(hint.label + " requis");
            return;
        }
        setSubmittingKey(true);
        try {
            await connectApiKey({
                provider: apiKeyDialog.providerKey,
                apiKey: trimmed,
                instanceUrl: instanceUrl || undefined,
                scalingMode: "standard",
            });
            toast.success(`Connecté avec succès à ${apiKeyDialog.providerLabel}`);
            setApiKeyDialog(null);
            setApiKeyInput("");
            setInstanceInput("");
            router.replace("/dashboard/integrations?just_connected=1");
        } catch (e) {
            const msg = e instanceof Error ? e.message : "Erreur inconnue";
            toast.error(`Connexion échouée : ${msg}`);
        } finally {
            setSubmittingKey(false);
        }
    }

    async function handleDisconnectConfirm() {
        if (!disconnectTarget) return;
        setDisconnecting(true);
        try {
            await disconnect({ connectionId: disconnectTarget.id });
            toast.success(`${disconnectTarget.label} déconnecté`);
            setDisconnectTarget(null);
        } catch (e) {
            const msg = e instanceof Error ? e.message : "Erreur inconnue";
            toast.error(`Échec de la déconnexion : ${msg}`);
        } finally {
            setDisconnecting(false);
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

    const activeHint = apiKeyDialog
        ? PROVIDER_INSTANCE_HINT[apiKeyDialog.providerKey]
        : undefined;

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-semibold">Intégrations CRM</h1>
                <p className="text-muted-foreground">
                    Connectez votre CRM pour synchroniser les contacts et enregistrer automatiquement
                    les événements de conversation.
                </p>
            </div>

            {showOptInBanner && optInStats && optInStats.imported > 0 && (
                <Alert>
                    <AlertTitle>
                        {optInStats.imported} contacts importés · {optInStats.granted} /{" "}
                        {optInStats.imported} opt-ins collectés
                    </AlertTitle>
                    <AlertDescription>
                        Tous les contacts importés sont en statut <code>unknown</code> pour respecter
                        le RGPD. Vous devez collecter les opt-ins via l&apos;une de ces méthodes :
                        <ul className="mt-2 list-disc pl-5 space-y-1 text-sm">
                            <li>
                                <strong>Réponse WhatsApp entrante</strong> — le premier message du
                                contact vaut opt-in implicite.
                            </li>
                            <li>
                                <strong>Formulaire web</strong> — intégrez un formulaire de
                                consentement sur votre site.
                            </li>
                            <li>
                                <strong>Import CSV attesté</strong> — uploadez un CSV avec colonne{" "}
                                <code>optin_date</code> et attestez les consentements.
                            </li>
                        </ul>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="mt-3"
                            onClick={() => setShowOptInBanner(false)}
                        >
                            Plus tard
                        </Button>
                    </AlertDescription>
                </Alert>
            )}

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
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                    router.push(
                                                        `/dashboard/integrations/${existing._id}`,
                                                    )
                                                }
                                            >
                                                Détails
                                            </Button>
                                            {existing.status !== "disconnected" && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        setDisconnectTarget({
                                                            id: existing._id,
                                                            label: p.displayName,
                                                        })
                                                    }
                                                >
                                                    Déconnecter
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center gap-2">
                                    <Button
                                        onClick={() => handleConnect(p)}
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

            <Dialog
                open={apiKeyDialog !== null}
                onOpenChange={(open) => {
                    if (!open && !submittingKey) {
                        setApiKeyDialog(null);
                        setApiKeyInput("");
                        setInstanceInput("");
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Connecter {apiKeyDialog?.providerLabel ?? ""}
                        </DialogTitle>
                        <DialogDescription>
                            Collez votre clé API. Elle sera chiffrée avant d&apos;être stockée.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                        {activeHint && (
                            <div className="space-y-1">
                                <Label htmlFor="crm-instance">{activeHint.label}</Label>
                                <Input
                                    id="crm-instance"
                                    value={instanceInput}
                                    onChange={(e) => setInstanceInput(e.target.value)}
                                    placeholder={activeHint.placeholder}
                                    disabled={submittingKey}
                                />
                            </div>
                        )}
                        <div className="space-y-1">
                            <Label htmlFor="crm-apikey">Clé API</Label>
                            <Input
                                id="crm-apikey"
                                type="password"
                                value={apiKeyInput}
                                onChange={(e) => setApiKeyInput(e.target.value)}
                                autoComplete="off"
                                disabled={submittingKey}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setApiKeyDialog(null);
                                setApiKeyInput("");
                                setInstanceInput("");
                            }}
                            disabled={submittingKey}
                        >
                            Annuler
                        </Button>
                        <Button onClick={handleApiKeySubmit} disabled={submittingKey}>
                            {submittingKey ? "Validation…" : "Valider"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <DisconnectDialog
                open={disconnectTarget !== null}
                providerLabel={disconnectTarget?.label ?? ""}
                busy={disconnecting}
                onCancel={() => setDisconnectTarget(null)}
                onConfirm={handleDisconnectConfirm}
            />
        </div>
    );
}
