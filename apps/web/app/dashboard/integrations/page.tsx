"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
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
import { CrmLogo } from "@/components/integrations/crm-logo";
import { FeatureGate } from "@/components/plan/FeatureGate";
import { usePlanFeature } from "@/hooks/use-plan-feature";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
    Plug,
    KeyRound,
    CheckCircle2,
    AlertTriangle,
    XCircle,
    Clock,
    ShieldCheck,
    Users,
    Webhook,
    Target,
    ExternalLink,
    Sparkles,
    X,
} from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";

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

const PROVIDER_LABELS: Record<string, string> = {
    hubspot: "HubSpot",
    pipedrive: "Pipedrive",
    salesforce: "Salesforce",
    sellsy: "Sellsy",
    axonaut: "Axonaut",
    nocrm: "noCRM.io",
};

const OAUTH_ERROR_MATRIX: Record<string, OAuthErrorMapping> = {
    another_provider_connected: {
        title: "Un CRM est déjà connecté",
        description:
            "Un seul CRM peut être connecté à la fois. Déconnectez le CRM actuel avant d'en ajouter un autre.",
        severity: "warning",
    },
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

function StatsCard({
    title,
    value,
    description,
    icon: Icon,
    gradient,
}: {
    title: string;
    value: string;
    description: string;
    icon: React.ElementType;
    gradient: string;
}) {
    return (
        <Card className="bg-white border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <div
                        className={cn(
                            "h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-gradient-to-br flex items-center justify-center shadow-lg shadow-green-900/20",
                            gradient,
                        )}
                        aria-hidden="true"
                    >
                        <Icon className="h-[18px] w-[18px] sm:h-5 sm:w-5 text-white" />
                    </div>
                </div>
                <p className="text-xs sm:text-sm font-medium text-gray-500 mb-0.5">{title}</p>
                <span className="text-xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                    {value}
                </span>
                <p className="text-[11px] text-gray-400 mt-0.5">{description}</p>
            </CardContent>
        </Card>
    );
}

export default function IntegrationsPage() {
    const { allowed: planAllowed, isLoading: planLoading } = usePlanFeature('integrations_crm');
    const providers = useQuery(api.crm.connections.listAvailableProviders);
    const connections = useQuery(api.crm.connections.listForCurrentOrganization);
    const optInStats = useQuery(api.crm.optin.getImportedOptInStats);
    const startOAuth = useAction(api.crm.oauth.start);
    const startOAuthLocal = useAction(api.crm.oauth.startLocal);
    const connectApiKey = useAction(api.crm.apikey.connectWithApiKey);
    const disconnect = useAction(api.crm.connections.disconnect);

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
        supportsRemoteRevoke: boolean;
    } | null>(null);
    const [disconnecting, setDisconnecting] = useState(false);
    const [showOptInBanner, setShowOptInBanner] = useState(false);

    useEffect(() => {
        const err = searchParams.get("error");
        const connected = searchParams.get("connected");
        const justConnected = searchParams.get("just_connected") === "1";
        if (err) {
            const mapping = resolveOAuthError(err);
            let title = mapping.title;
            let description = mapping.description;

            if (err === "another_provider_connected") {
                const existing = searchParams.get("existingProvider");
                const existingLabel = existing
                    ? PROVIDER_LABELS[existing] ?? existing
                    : null;
                if (existingLabel) {
                    title = `${existingLabel} est déjà connecté`;
                    description = `Un seul CRM peut être connecté à la fois. Déconnectez ${existingLabel} dans Intégrations avant d'ajouter un autre CRM.`;
                }
            } else if (mapping.severity === "error") {
                const detail = searchParams.get("detail");
                if (detail) title = `${title} : ${detail}`;
            }

            if (mapping.severity === "error") {
                toast.error(title, { description });
            } else {
                toast.warning(title, { description });
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

    const activeConnectionsCount = useMemo(() => {
        if (!connections) return 0;
        return connections.filter((c) => c.status === "active").length;
    }, [connections]);

    const activeConnection = useMemo(
        () => connections?.find((c) => c.status === "active") ?? null,
        [connections],
    );

    async function handleConnect(provider: { key: string; displayName: string; authMode: string }) {
        if (activeConnection && activeConnection.provider !== provider.key) {
            const existingLabel =
                PROVIDER_LABELS[activeConnection.provider] ?? activeConnection.provider;
            toast.warning(`${existingLabel} est déjà connecté`, {
                description: `Un seul CRM peut être connecté à la fois. Déconnectez ${existingLabel} avant d'ajouter ${provider.displayName}.`,
            });
            return;
        }
        if (provider.authMode === "apiKey") {
            setApiKeyDialog({ providerKey: provider.key, providerLabel: provider.displayName });
            setApiKeyInput("");
            setInstanceInput("");
            return;
        }
        setStarting(provider.key);
        try {
            const isLocalhost =
                typeof window !== "undefined" &&
                window.location.hostname === "localhost";
            const action = isLocalhost ? startOAuthLocal : startOAuth;
            const { authorizeUrl } = await action({
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

    if (planLoading || !providers) {
        return (
            <div className="space-y-6">
                <div>
                    <Skeleton className="h-7 w-56 mb-2" />
                    <Skeleton className="h-4 w-96" />
                </div>
                <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <Card key={i} className="bg-white border-gray-100 shadow-sm">
                            <CardContent className="p-5">
                                <Skeleton className="h-11 w-11 rounded-full mb-4" />
                                <Skeleton className="h-3 w-20 mb-2" />
                                <Skeleton className="h-7 w-14" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                    <Skeleton className="h-48 rounded-xl" />
                    <Skeleton className="h-48 rounded-xl" />
                </div>
            </div>
        );
    }

    if (!planAllowed) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="font-display text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                        Intégrations CRM
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Connectez votre CRM pour synchroniser contacts et événements.
                    </p>
                </div>
                <FeatureGate feature="integrations_crm">{null}</FeatureGate>
            </div>
        );
    }

    const activeHint = apiKeyDialog
        ? PROVIDER_INSTANCE_HINT[apiKeyDialog.providerKey]
        : undefined;

    const importedCount = optInStats?.imported ?? 0;
    const grantedCount = optInStats?.granted ?? 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="font-display text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                        Intégrations CRM
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Connectez votre CRM pour synchroniser contacts et événements de conversation.
                    </p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
                <StatsCard
                    title="Connexions actives"
                    value={String(activeConnectionsCount)}
                    description={`sur ${providers.filter((p) => p.availability === "available").length} fournisseurs disponibles`}
                    icon={Plug}
                    gradient="from-[#14532d] to-[#059669]"
                />
                <StatsCard
                    title="Contacts importés"
                    value={String(importedCount)}
                    description="Depuis vos CRM connectés"
                    icon={Users}
                    gradient="from-[#166534] to-[#0d9488]"
                />
                <StatsCard
                    title="Opt-ins collectés"
                    value={String(grantedCount)}
                    description={importedCount > 0 ? `${Math.round((grantedCount / importedCount) * 100)}% des contacts` : "Aucun contact importé"}
                    icon={ShieldCheck}
                    gradient="from-[#15803d] to-[#10b981]"
                />
            </div>

            {/* Opt-in Banner */}
            {showOptInBanner && optInStats && optInStats.imported > 0 && (
                <Alert className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200 relative">
                    <Sparkles className="h-4 w-4 text-emerald-600" />
                    <AlertTitle className="text-emerald-900 font-semibold pr-8">
                        {optInStats.imported} contacts importés · {optInStats.granted} /{" "}
                        {optInStats.imported} opt-ins collectés
                    </AlertTitle>
                    <AlertDescription className="text-emerald-800/90">
                        Tous les contacts importés sont en statut <code className="px-1 py-0.5 rounded bg-emerald-100/60 text-emerald-900 text-xs">unknown</code>{" "}
                        pour respecter le RGPD. Collectez les opt-ins via :
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
                                <code className="px-1 py-0.5 rounded bg-emerald-100/60 text-emerald-900 text-xs">optin_date</code>{" "}
                                et attestez les consentements.
                            </li>
                        </ul>
                    </AlertDescription>
                    <button
                        type="button"
                        onClick={() => setShowOptInBanner(false)}
                        className="absolute top-3 right-3 h-7 w-7 rounded-full flex items-center justify-center text-emerald-700 hover:bg-emerald-100 transition-colors"
                        aria-label="Fermer"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                </Alert>
            )}

            {/* Providers Grid */}
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {providers.map((p) => {
                    const existing = connectionByProvider.get(p.key);
                    const isAvailable = p.availability === "available";
                    const isBusy = starting === p.key;
                    const isConnected = existing && existing.status !== "disconnected";
                    const statusConfig = existing
                        ? STATUS_CONFIG[existing.status as ConnectionStatus]
                        : null;
                    const StatusIcon = statusConfig?.icon;
                    const isBlockedByOtherActive =
                        !!activeConnection &&
                        activeConnection.provider !== p.key &&
                        !isConnected;
                    const activeProviderLabel = activeConnection
                        ? PROVIDER_LABELS[activeConnection.provider] ??
                          activeConnection.provider
                        : null;

                    return (
                        <Card
                            key={p.key}
                            className={cn(
                                "bg-white border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col",
                                !isAvailable && "opacity-75",
                                isBlockedByOtherActive && "opacity-60",
                            )}
                        >
                            <CardContent className="p-5 flex-1 flex flex-col">
                                {/* Header row */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="h-12 w-12 rounded-xl bg-white border border-gray-100 shadow-sm flex items-center justify-center p-2">
                                        <CrmLogo
                                            provider={p.key}
                                            className="h-full w-full"
                                        />
                                    </div>
                                    {!isAvailable && (
                                        <Badge
                                            variant="secondary"
                                            className="bg-gray-100 text-gray-600 border-0"
                                        >
                                            {p.availability === "coming_soon"
                                                ? "Bientôt"
                                                : "Roadmap"}
                                        </Badge>
                                    )}
                                    {isConnected && statusConfig && StatusIcon && (
                                        <Badge
                                            variant="outline"
                                            className={cn(
                                                "gap-1 font-medium",
                                                statusConfig.className,
                                            )}
                                        >
                                            <StatusIcon className="h-3 w-3" />
                                            {statusConfig.label}
                                        </Badge>
                                    )}
                                </div>

                                {/* Name & auth mode */}
                                <div className="mb-3">
                                    <h3 className="text-base font-semibold text-gray-900">
                                        {p.displayName}
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        {p.authMode === "oauth2"
                                            ? "Authentification OAuth 2.0"
                                            : "Authentification par clé API"}
                                    </p>
                                </div>

                                {/* Feature badges */}
                                <div className="flex flex-wrap gap-1.5 mb-4">
                                    {p.supportsDeals && (
                                        <Badge
                                            variant="secondary"
                                            className="bg-emerald-50 text-emerald-700 border-0 gap-1 font-normal text-[11px]"
                                        >
                                            <Target className="h-2.5 w-2.5" />
                                            Deals
                                        </Badge>
                                    )}
                                    {p.supportsWebhooks && (
                                        <Badge
                                            variant="secondary"
                                            className="bg-teal-50 text-teal-700 border-0 gap-1 font-normal text-[11px]"
                                        >
                                            <Webhook className="h-2.5 w-2.5" />
                                            Webhooks
                                        </Badge>
                                    )}
                                </div>

                                {/* Existing connection details */}
                                {existing && (
                                    <div className="rounded-lg bg-gray-50 border border-gray-100 p-3 mb-4 space-y-1.5">
                                        {existing.remoteAccountLabel && (
                                            <div className="flex items-center gap-2 text-xs">
                                                <span className="text-gray-500">Compte :</span>
                                                <span className="font-medium text-gray-900 truncate">
                                                    {existing.remoteAccountLabel}
                                                </span>
                                            </div>
                                        )}
                                        {existing.lastSyncAt && (
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                <Clock className="h-3 w-3" />
                                                <span>
                                                    Dernière sync :{" "}
                                                    {new Date(existing.lastSyncAt).toLocaleString(
                                                        "fr-FR",
                                                        {
                                                            dateStyle: "short",
                                                            timeStyle: "short",
                                                        },
                                                    )}
                                                </span>
                                            </div>
                                        )}
                                        {existing.lastErrorMessageSanitized && (
                                            <div className="text-xs text-red-600 pt-1 border-t border-gray-200">
                                                <span className="font-medium">Erreur :</span>{" "}
                                                {existing.lastErrorMessageSanitized}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="mt-auto flex flex-col gap-2">
                                    <Button
                                        onClick={() => handleConnect(p)}
                                        disabled={
                                            !isAvailable ||
                                            isBusy ||
                                            isBlockedByOtherActive
                                        }
                                        size="sm"
                                        className={cn(
                                            "h-9 rounded-full text-xs font-medium shadow-sm w-full",
                                            isBlockedByOtherActive
                                                ? "bg-gray-100 text-gray-500 hover:bg-gray-100 cursor-not-allowed"
                                                : "text-white cursor-pointer bg-gradient-to-r from-[#14532d] to-[#059669] hover:from-[#14532d] hover:to-[#047857]",
                                        )}
                                    >
                                        {isBusy
                                            ? "Redirection…"
                                            : isBlockedByOtherActive
                                                ? "Indisponible"
                                                : isConnected
                                                    ? "Reconnecter"
                                                    : "Connecter"}
                                    </Button>
                                    {isBlockedByOtherActive && activeProviderLabel && (
                                        <p className="text-[11px] text-gray-500 text-center leading-snug">
                                            Déconnectez {activeProviderLabel} d'abord
                                            pour changer de CRM
                                        </p>
                                    )}

                                    {existing && (
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    router.push(
                                                        `/dashboard/integrations/${existing._id}`,
                                                    )
                                                }
                                                className="h-8 rounded-full text-xs flex-1 cursor-pointer"
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
                                                            supportsRemoteRevoke:
                                                                p.supportsRevoke,
                                                        })
                                                    }
                                                    className="h-8 rounded-full text-xs flex-1 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 cursor-pointer"
                                                >
                                                    Déconnecter
                                                </Button>
                                            )}
                                        </div>
                                    )}

                                    {p.docsUrl && (
                                        <a
                                            href={p.docsUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center justify-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors pt-1"
                                        >
                                            Documentation
                                            <ExternalLink className="h-3 w-3" />
                                        </a>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* API Key Dialog */}
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
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#14532d] to-[#059669] flex items-center justify-center shadow-lg shadow-green-900/20">
                                <KeyRound className="h-5 w-5 text-white" />
                            </div>
                            <DialogTitle className="text-lg font-semibold text-gray-900">
                                Connecter {apiKeyDialog?.providerLabel ?? ""}
                            </DialogTitle>
                        </div>
                        <DialogDescription className="text-sm text-gray-500">
                            Collez votre clé API. Elle sera chiffrée avant d&apos;être stockée.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        {activeHint && (
                            <div className="space-y-1.5">
                                <Label htmlFor="crm-instance" className="text-sm font-medium">
                                    {activeHint.label}
                                </Label>
                                <Input
                                    id="crm-instance"
                                    value={instanceInput}
                                    onChange={(e) => setInstanceInput(e.target.value)}
                                    placeholder={activeHint.placeholder}
                                    disabled={submittingKey}
                                />
                            </div>
                        )}
                        <div className="space-y-1.5">
                            <Label htmlFor="crm-apikey" className="text-sm font-medium">
                                Clé API
                            </Label>
                            <Input
                                id="crm-apikey"
                                type="password"
                                value={apiKeyInput}
                                onChange={(e) => setApiKeyInput(e.target.value)}
                                autoComplete="off"
                                disabled={submittingKey}
                                placeholder="••••••••••••••••"
                            />
                            <p className="text-[11px] text-gray-400 pt-1">
                                Chiffrement AES-256 au repos. Jamais exposée côté client.
                            </p>
                        </div>
                    </div>
                    <DialogFooter className="gap-2 sm:gap-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setApiKeyDialog(null);
                                setApiKeyInput("");
                                setInstanceInput("");
                            }}
                            disabled={submittingKey}
                            className="rounded-full cursor-pointer"
                        >
                            Annuler
                        </Button>
                        <Button
                            onClick={handleApiKeySubmit}
                            disabled={submittingKey}
                            className="rounded-full bg-gradient-to-r from-[#14532d] to-[#059669] hover:from-[#14532d] hover:to-[#047857] text-white shadow-sm cursor-pointer"
                        >
                            {submittingKey ? "Validation…" : "Valider"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <DisconnectDialog
                open={disconnectTarget !== null}
                providerLabel={disconnectTarget?.label ?? ""}
                supportsRemoteRevoke={disconnectTarget?.supportsRemoteRevoke ?? false}
                busy={disconnecting}
                onCancel={() => setDisconnectTarget(null)}
                onConfirm={handleDisconnectConfirm}
            />
        </div>
    );
}
