'use client'

import { useState, useCallback, useEffect } from 'react'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useChannels } from '@/hooks/useChannels'
import { useCurrentOrg } from '@/hooks/use-current-org'
import { usePermission } from '@/hooks/use-permission'
import { useFacebookSDK } from '@/hooks/useFacebookSDK'
import { Id } from '@/convex/_generated/dataModel'
import { usePlanLimits } from '@/hooks/usePlans'
import { isUnlimited } from '@/lib/plan-utils'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
    Phone, Star, StarOff, Loader2, Ban, Settings2, Signal, SignalZero,
    Users, Plus, ArrowUpRight, ChevronDown, Send, RefreshCw, Hash, Globe,
    CheckCircle2, AlertCircle, AlertTriangle, PlugZap,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Signal }> = {
    active: { label: 'Actif', color: 'bg-green-50 text-green-700 border-green-200', icon: Signal },
    pending_setup: { label: 'En attente', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Settings2 },
    disconnected: { label: 'Déconnecté', color: 'bg-gray-50 text-gray-600 border-gray-200', icon: SignalZero },
    error: { label: 'Erreur', color: 'bg-red-50 text-red-700 border-red-200', icon: SignalZero },
    disabled: { label: 'Désactivé', color: 'bg-gray-50 text-gray-500 border-gray-200', icon: Ban },
    banned: { label: 'Banni', color: 'bg-red-50 text-red-700 border-red-200', icon: Ban },
}

interface WhatsAppNumber {
    id: string
    display_phone_number: string
    verified_name: string
    quality_rating: string
    wabaId: string
}

function formatRelativeTime(timestamp: number | undefined): string {
    if (!timestamp) return 'Jamais'
    const diff = Date.now() - timestamp
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return "À l'instant"
    if (minutes < 60) return `Il y a ${minutes} min`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `Il y a ${hours}h`
    const days = Math.floor(hours / 24)
    return `Il y a ${days}j`
}

export function ChannelsSettings() {
    const { currentOrg } = useCurrentOrg()
    const {
        channels, isLoading, updateChannel, disableChannel, setOrgDefault,
        addChannel, fetchPhoneNumbers, getChannelStatus, sendTestMessage,
    } = useChannels()
    const polesData = useQuery(api.poles.list, currentOrg ? { organizationId: currentOrg._id } : "skip")
    const poles = polesData?.poles ?? []
    const canCreate = usePermission('channels:create')
    const canUpdate = usePermission('channels:update')
    const canDelete = usePermission('channels:delete')
    const { currentPlan } = usePlanLimits()

    const [expandedId, setExpandedId] = useState<string | null>(null)
    const [channelStatuses, setChannelStatuses] = useState<Record<string, Record<string, string>>>({})
    const [loadingStatusId, setLoadingStatusId] = useState<string | null>(null)
    const [testDialogChannelId, setTestDialogChannelId] = useState<string | null>(null)
    const [testPhone, setTestPhone] = useState('')
    const [sendingTest, setSendingTest] = useState(false)
    const [tokenErrors, setTokenErrors] = useState<Record<string, string>>({})
    const [checkingTokens, setCheckingTokens] = useState(false)

    // Real signal: read the calls history. Meta's read-scope health probe
    // (getChannelStatus) can return "OK" when calling-specific scopes are
    // already broken — so we also look at recent FAILED outbound calls with
    // code 190 / OAuthException to surface the expired-token state that the
    // probe misses.
    const callsTokenIssues = useQuery(
        api.calls.getChannelsWithTokenError,
        currentOrg ? { organizationId: currentOrg._id } : "skip",
    )

    useEffect(() => {
        if (!callsTokenIssues || callsTokenIssues.length === 0) return
        setTokenErrors(prev => {
            const next = { ...prev }
            for (const issue of callsTokenIssues) {
                next[issue.channelId as unknown as string] = issue.reason
            }
            return next
        })
    }, [callsTokenIssues])

    // Auto-check token health for all active channels on mount
    useEffect(() => {
        if (!channels.length || checkingTokens) return
        const active = channels.filter((c: any) => c.status === 'active')
        if (!active.length) return

        let cancelled = false
        setCheckingTokens(true)

        Promise.allSettled(
            active.map(async (ch: any) => {
                try {
                    const status = await getChannelStatus({ channelId: ch._id as Id<"whatsappChannels"> })
                    if (status) {
                        setChannelStatuses(prev => ({ ...prev, [ch._id]: status }))
                        if (status.error && /access token|expired|session/i.test(status.error)) {
                            if (!cancelled) setTokenErrors(prev => ({ ...prev, [ch._id]: status.error }))
                        }
                    }
                } catch { /* ignore */ }
            })
        ).finally(() => {
            if (!cancelled) setCheckingTokens(false)
        })

        return () => { cancelled = true }
    }, [channels.length]) // eslint-disable-line react-hooks/exhaustive-deps

    const activeChannels = channels.filter((c: any) => c.status !== 'disabled')
    const channelsWithTokenError = channels.filter((c: any) => tokenErrors[c._id])
    const downgradedChannels = channels.filter(
        (c: any) => c.status === 'disabled' && c.disabledReason === 'plan_downgrade',
    )
    const maxChannels = currentPlan?.maxWhatsappChannels ?? 1
    const canAddMore = isUnlimited(maxChannels) || activeChannels.length < maxChannels
    const usagePercent = isUnlimited(maxChannels) ? 0 : Math.round((activeChannels.length / maxChannels) * 100)

    const handleExpand = useCallback(async (channelId: string) => {
        if (expandedId === channelId) {
            setExpandedId(null)
            return
        }
        setExpandedId(channelId)

        if (!channelStatuses[channelId]) {
            setLoadingStatusId(channelId)
            try {
                const status = await getChannelStatus({ channelId: channelId as Id<"whatsappChannels"> })
                if (status) {
                    setChannelStatuses(prev => ({ ...prev, [channelId]: status }))
                }
            } catch {
                // Status is optional
            } finally {
                setLoadingStatusId(null)
            }
        }
    }, [expandedId, channelStatuses, getChannelStatus])

    const handleRefreshStatus = useCallback(async (channelId: string) => {
        setLoadingStatusId(channelId)
        try {
            const status = await getChannelStatus({ channelId: channelId as Id<"whatsappChannels"> })
            if (status) {
                setChannelStatuses(prev => ({ ...prev, [channelId]: status }))
            }
            toast.success('Statut actualisé')
        } catch {
            toast.error('Impossible de récupérer le statut')
        } finally {
            setLoadingStatusId(null)
        }
    }, [getChannelStatus])

    const handleSendTest = useCallback(async () => {
        if (!testDialogChannelId || !testPhone.trim()) return
        setSendingTest(true)
        try {
            await sendTestMessage({
                channelId: testDialogChannelId as Id<"whatsappChannels">,
                to: testPhone,
            })
            toast.success('Message test envoyé')
            setTestDialogChannelId(null)
            setTestPhone('')
        } catch (e: any) {
            toast.error(e.message || "Échec de l'envoi")
        } finally {
            setSendingTest(false)
        }
    }, [testDialogChannelId, testPhone, sendTestMessage])

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="h-6 w-6 animate-spin text-green-600" />
            </div>
        )
    }

    const handleSetDefault = async (channelId: string) => {
        try {
            await setOrgDefault({ id: channelId as Id<"whatsappChannels"> })
            toast.success('Canal par défaut mis à jour')
        } catch (e: any) {
            toast.error(e.message || 'Erreur')
        }
    }

    const handleDisable = async (channelId: string) => {
        try {
            await disableChannel({ id: channelId as Id<"whatsappChannels"> })
            toast.success('Canal désactivé')
        } catch (e: any) {
            toast.error(e.message || 'Erreur')
        }
    }

    const handleAssignPole = async (channelId: string, poleId: string) => {
        try {
            await updateChannel({
                id: channelId as Id<"whatsappChannels">,
                poleId: poleId as Id<"poles">,
            })
            toast.success('Pôle assigné au canal')
        } catch (e: any) {
            toast.error(e.message || 'Erreur')
        }
    }

    return (
        <div className="space-y-6">
            <Card className="bg-white border-gray-100 shadow-sm">
                <CardHeader className="p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#14532d] to-[#059669] flex items-center justify-center shadow-lg shadow-green-900/20">
                                <Phone className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <CardTitle className="text-base font-semibold text-gray-900">
                                    Canaux WhatsApp
                                </CardTitle>
                                <CardDescription className="text-xs text-gray-500">
                                    Gérez vos numéros WhatsApp connectés et assignez-les à vos équipes.
                                </CardDescription>
                            </div>
                        </div>
                        {canCreate && (
                            canAddMore ? (
                                <AddChannelDialog
                                    addChannel={addChannel}
                                    fetchPhoneNumbers={fetchPhoneNumbers}
                                />
                            ) : (
                                <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs rounded-full cursor-pointer" disabled>
                                    <ArrowUpRight className="h-3.5 w-3.5" />
                                    Passer au plan supérieur
                                </Button>
                            )
                        )}
                    </div>

                    {/* Plan usage */}
                    {currentOrg && (
                        <div className="mt-4 space-y-1.5">
                            <div className="flex items-center justify-between text-xs text-gray-500">
                                <span>
                                    {activeChannels.length}/{isUnlimited(maxChannels) ? '\u221E' : maxChannels} canal(aux) utilisé(s)
                                </span>
                                <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                                    Plan {currentPlan?.name ?? currentOrg?.plan}
                                </span>
                            </div>
                            {!isUnlimited(maxChannels) && (
                                <Progress value={usagePercent} className="h-1.5" />
                            )}
                            {!canAddMore && (
                                <div className="rounded-lg border px-3 py-2.5 bg-amber-50 border-amber-100">
                                    <p className="text-xs text-amber-700 flex items-center gap-1.5">
                                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                        Limite atteinte. Passez au plan supérieur pour ajouter plus de canaux.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </CardHeader>

                {/* Plan downgrade banner */}
                {downgradedChannels.length > 0 && (
                    <div className="mx-6 mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
                        <div className="flex items-start gap-3">
                            <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                                <AlertTriangle className="h-4 w-4 text-amber-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-amber-800">
                                    {downgradedChannels.length === 1
                                        ? `Le canal "${downgradedChannels[0].label}" a été désactivé après un changement de plan`
                                        : `${downgradedChannels.length} canaux ont été désactivés après un changement de plan`}
                                </p>
                                <p className="text-xs text-amber-700 mt-0.5">
                                    Votre plan actuel {currentPlan?.name ? `(${currentPlan.name})` : ''} autorise
                                    {' '}{isUnlimited(maxChannels) ? '\u221E' : maxChannels} canal{maxChannels > 1 ? 'aux' : ''} actif{maxChannels > 1 ? 's' : ''}.
                                    Passez à un plan supérieur pour les réactiver.
                                </p>
                            </div>
                            <Button
                                size="sm"
                                className="h-8 text-xs gap-1.5 rounded-full cursor-pointer bg-amber-600 hover:bg-amber-700 text-white shrink-0"
                                onClick={() => { window.location.href = '/dashboard/billing' }}
                            >
                                <ArrowUpRight className="h-3.5 w-3.5" />
                                Mettre à niveau
                            </Button>
                        </div>
                    </div>
                )}

                {/* Token expiration banner */}
                {channelsWithTokenError.length > 0 && (
                    <div className="mx-6 mb-4 rounded-lg border border-red-200 bg-red-50 p-3">
                        <div className="flex items-start gap-3">
                            <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                                <AlertTriangle className="h-4 w-4 text-red-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-red-800">
                                    {channelsWithTokenError.length === 1
                                        ? `Le canal "${channelsWithTokenError[0].label}" a un token expiré`
                                        : `${channelsWithTokenError.length} canaux ont un token expiré`
                                    }
                                </p>
                                <p className="text-xs text-red-600 mt-0.5">
                                    L&apos;envoi et la réception de messages sont bloqués. Cliquez sur &quot;Reconnecter&quot; pour renouveler le token.
                                </p>
                            </div>
                            {canCreate && canAddMore && (
                                <AddChannelDialog
                                    addChannel={addChannel}
                                    fetchPhoneNumbers={fetchPhoneNumbers}
                                    trigger={
                                        <Button size="sm" className="h-8 text-xs gap-1.5 rounded-full cursor-pointer bg-red-600 hover:bg-red-700 text-white shrink-0">
                                            <PlugZap className="h-3.5 w-3.5" />
                                            Reconnecter
                                        </Button>
                                    }
                                />
                            )}
                        </div>
                    </div>
                )}

                <CardContent className="p-6 pt-0">
                    {channels.length === 0 ? (
                        <div className="text-center py-10">
                            <div className="h-14 w-14 rounded-full bg-gradient-to-br from-[#14532d] to-[#059669] flex items-center justify-center shadow-lg shadow-green-900/20 mx-auto mb-4">
                                <Phone className="h-7 w-7 text-white" />
                            </div>
                            <p className="font-semibold text-gray-900">Aucun canal WhatsApp</p>
                            <p className="text-sm text-gray-500 mt-1 mb-5">
                                Connectez un numéro WhatsApp Business pour commencer.
                            </p>
                            {canCreate && canAddMore && (
                                <AddChannelDialog
                                    addChannel={addChannel}
                                    fetchPhoneNumbers={fetchPhoneNumbers}
                                />
                            )}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {channels.map((channel: any) => {
                                const statusConfig = STATUS_CONFIG[channel.status] || STATUS_CONFIG.disconnected
                                const StatusIcon = statusConfig.icon
                                const isExpanded = expandedId === channel._id
                                const liveStatus = channelStatuses[channel._id]
                                const isLoadingStatus = loadingStatusId === channel._id

                                return (
                                    <div
                                        key={channel._id}
                                        className={cn(
                                            "border rounded-lg transition-all",
                                            tokenErrors[channel._id]
                                                ? 'border-red-200 bg-red-50/40 shadow-sm hover:shadow-md hover:border-red-300'
                                                : isExpanded
                                                    ? 'border-green-200 shadow-md bg-white'
                                                    : 'border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 bg-white'
                                        )}
                                    >
                                        {/* Compact row */}
                                        <div
                                            className="flex items-center justify-between p-4 cursor-pointer"
                                            onClick={() => handleExpand(channel._id)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "h-9 w-9 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0 shadow-sm",
                                                    tokenErrors[channel._id]
                                                        ? "bg-gradient-to-br from-red-500 to-red-600"
                                                        : "bg-gradient-to-br from-[#166534] to-[#0d9488]"
                                                )}>
                                                    {tokenErrors[channel._id]
                                                        ? <AlertTriangle className="h-4 w-4" />
                                                        : <Phone className="h-4 w-4" />
                                                    }
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                                                            {channel.label}
                                                        </p>
                                                        {channel.isOrgDefault && (
                                                            <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-semibold">
                                                                <Star className="h-2.5 w-2.5 mr-0.5" /> Par défaut
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-[11px] text-gray-400 truncate max-w-[200px]">
                                                        {channel.displayPhoneNumber}
                                                        {channel.verifiedName && ` — ${channel.verifiedName}`}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                {tokenErrors[channel._id] ? (
                                                    <Badge variant="outline" className="text-[10px] font-medium bg-red-50 text-red-700 border-red-200 animate-pulse">
                                                        <AlertTriangle className="h-3 w-3 mr-1" />
                                                        Token expiré
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className={cn("text-[10px] font-medium", statusConfig.color)}>
                                                        <StatusIcon className="h-3 w-3 mr-1" />
                                                        {statusConfig.label}
                                                    </Badge>
                                                )}

                                                {/* Pole badge */}
                                                {channel.pole && (
                                                    <Badge variant="outline" className="text-[10px] font-medium bg-white border-gray-200 text-gray-600 hidden sm:flex">
                                                        <div
                                                            className="h-2 w-2 rounded-full mr-1"
                                                            style={{ backgroundColor: channel.pole.color || '#6B7280' }}
                                                        />
                                                        {channel.pole.name}
                                                    </Badge>
                                                )}

                                                <ChevronDown className={cn(
                                                    "h-4 w-4 text-gray-400 transition-transform",
                                                    isExpanded && "rotate-180"
                                                )} />
                                            </div>
                                        </div>

                                        {/* Expanded detail panel */}
                                        {isExpanded && (
                                            <div className="border-t border-gray-100 p-4 bg-gray-50/30 space-y-4">
                                                {/* Connection details grid */}
                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                    <div className="p-3 rounded-lg bg-white border border-gray-100">
                                                        <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wider flex items-center gap-1">
                                                            <Phone className="h-3 w-3" /> Numéro
                                                        </span>
                                                        <p className="text-sm font-mono text-gray-900 mt-1">{channel.displayPhoneNumber}</p>
                                                    </div>
                                                    <div className="p-3 rounded-lg bg-white border border-gray-100">
                                                        <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">Nom vérifié</span>
                                                        <p className="text-sm font-mono text-gray-900 mt-1">{channel.verifiedName || 'N/A'}</p>
                                                    </div>
                                                    <div className="p-3 rounded-lg bg-white border border-gray-100">
                                                        <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wider flex items-center gap-1">
                                                            <Hash className="h-3 w-3" /> Phone ID
                                                        </span>
                                                        <p className="text-xs font-mono text-gray-900 mt-1 break-all">{channel.phoneNumberId}</p>
                                                    </div>
                                                    <div className="p-3 rounded-lg bg-white border border-gray-100">
                                                        <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wider flex items-center gap-1">
                                                            <Globe className="h-3 w-3" /> WABA ID
                                                        </span>
                                                        <p className="text-xs font-mono text-gray-900 mt-1 break-all">
                                                            {channel.waba?.metaBusinessAccountId || 'N/A'}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Live status badges */}
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    {isLoadingStatus ? (
                                                        <div className="flex items-center gap-2 text-xs text-gray-400">
                                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                            Chargement du statut Meta...
                                                        </div>
                                                    ) : liveStatus && !liveStatus.error ? (
                                                        <>
                                                            <Badge variant="secondary" className={cn("text-[10px] font-medium", {
                                                                'bg-green-50 text-green-700': liveStatus.quality_rating === 'GREEN',
                                                                'bg-yellow-50 text-yellow-700': liveStatus.quality_rating === 'YELLOW',
                                                                'bg-red-50 text-red-700': liveStatus.quality_rating === 'RED',
                                                                'bg-gray-100 text-gray-500': !liveStatus.quality_rating,
                                                            })}>
                                                                Qualité : {liveStatus.quality_rating || 'N/A'}
                                                            </Badge>
                                                            <Badge variant="secondary" className={cn("text-[10px] font-medium", {
                                                                'bg-green-50 text-green-700': liveStatus.status === 'CONNECTED',
                                                                'bg-amber-50 text-amber-700': liveStatus.status === 'PENDING',
                                                                'bg-gray-100 text-gray-500': !liveStatus.status,
                                                            })}>
                                                                {liveStatus.status || 'N/A'}
                                                            </Badge>
                                                            <Badge variant="secondary" className={cn("text-[10px] font-medium", {
                                                                'bg-blue-50 text-blue-700': liveStatus.platform_type === 'CLOUD_API',
                                                                'bg-orange-50 text-orange-600': liveStatus.platform_type && liveStatus.platform_type !== 'CLOUD_API',
                                                                'bg-gray-100 text-gray-500': !liveStatus.platform_type,
                                                            })}>
                                                                {liveStatus.platform_type === 'CLOUD_API' ? 'Cloud API' : liveStatus.platform_type || 'N/A'}
                                                            </Badge>
                                                            {liveStatus.messaging_limit_tier && (
                                                                <Badge variant="secondary" className="text-[10px] font-medium bg-purple-50 text-purple-700">
                                                                    Tier : {liveStatus.messaging_limit_tier}
                                                                </Badge>
                                                            )}
                                                        </>
                                                    ) : liveStatus?.error ? (
                                                        <span className="text-xs text-red-500">{liveStatus.error}</span>
                                                    ) : null}

                                                    <span className="text-[11px] text-gray-400 ml-auto">
                                                        Dernier webhook : {formatRelativeTime(channel.lastWebhookAt)}
                                                    </span>
                                                </div>

                                                {/* Pole assignment */}
                                                <div className="rounded-lg border border-gray-100 p-3 bg-white">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <Users className="h-4 w-4 text-gray-400" />
                                                            <span className="text-sm font-medium text-gray-700">Pôle assigné</span>
                                                        </div>
                                                        {canUpdate && (
                                                            <Select
                                                                value={channel.poleId || 'none'}
                                                                onValueChange={(v) => {
                                                                    if (v !== 'none') handleAssignPole(channel._id, v)
                                                                }}
                                                            >
                                                                <SelectTrigger className="h-8 w-48 text-xs border-gray-200">
                                                                    <SelectValue placeholder="Sélectionner..." />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="none">Aucun pôle</SelectItem>
                                                                    {poles.map((pole: any) => (
                                                                        <SelectItem key={pole._id} value={pole._id}>
                                                                            <div className="flex items-center gap-2">
                                                                                <div
                                                                                    className="h-2 w-2 rounded-full"
                                                                                    style={{ backgroundColor: pole.color || '#6B7280' }}
                                                                                />
                                                                                {pole.name}
                                                                            </div>
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        )}
                                                    </div>
                                                    {channel.pole && (
                                                        <p className="text-[11px] text-gray-400 mt-1.5 ml-6">
                                                            Les conversations entrantes sur ce canal seront automatiquement assignées à ce pôle.
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Actions row */}
                                                <div className="flex items-center gap-2 pt-1">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-8 text-xs gap-1.5 rounded-full cursor-pointer"
                                                        onClick={() => handleRefreshStatus(channel._id)}
                                                        disabled={isLoadingStatus}
                                                    >
                                                        <RefreshCw className={cn("h-3.5 w-3.5", isLoadingStatus && "animate-spin")} />
                                                        Actualiser
                                                    </Button>

                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-8 text-xs gap-1.5 rounded-full cursor-pointer"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            setTestDialogChannelId(channel._id)
                                                        }}
                                                    >
                                                        <Send className="h-3.5 w-3.5" />
                                                        Envoyer un test
                                                    </Button>

                                                    {canUpdate && !channel.isOrgDefault && channel.status === 'active' && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-8 text-xs gap-1.5 rounded-full cursor-pointer"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleSetDefault(channel._id)
                                                            }}
                                                        >
                                                            <StarOff className="h-3.5 w-3.5" />
                                                            Définir par défaut
                                                        </Button>
                                                    )}

                                                    {canDelete && !channel.isOrgDefault && channel.status !== 'disabled' && (
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="h-8 text-xs gap-1.5 rounded-full cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50 ml-auto"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    <Ban className="h-3.5 w-3.5" />
                                                                    Désactiver
                                                                </Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent className="bg-white">
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle className="text-gray-900">
                                                                        Désactiver le canal &quot;{channel.label}&quot; ?
                                                                    </AlertDialogTitle>
                                                                    <AlertDialogDescription className="text-gray-500">
                                                                        Ce canal ne recevra plus de messages. Les conversations existantes seront conservées.
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel className="cursor-pointer">Annuler</AlertDialogCancel>
                                                                    <AlertDialogAction
                                                                        onClick={() => handleDisable(channel._id)}
                                                                        className="bg-red-600 text-white hover:bg-red-700 cursor-pointer"
                                                                    >
                                                                        Désactiver
                                                                    </AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Test Message Dialog */}
            <Dialog open={!!testDialogChannelId} onOpenChange={(open) => {
                if (!open) { setTestDialogChannelId(null); setTestPhone(''); }
            }}>
                <DialogContent className="sm:max-w-sm bg-white">
                    <DialogHeader>
                        <DialogTitle className="text-base font-semibold text-gray-900">Envoyer un message test</DialogTitle>
                        <DialogDescription className="text-xs text-gray-500">
                            Un message de test sera envoyé via ce canal pour vérifier que l&apos;intégration fonctionne.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="test-phone" className="text-sm font-medium text-gray-700">
                                Numéro destinataire
                            </Label>
                            <Input
                                id="test-phone"
                                placeholder="+221 77 123 45 67"
                                value={testPhone}
                                onChange={(e) => setTestPhone(e.target.value)}
                                className="h-10 border-gray-200 focus:border-green-500 focus:ring-green-500/20"
                            />
                        </div>
                        <Button
                            onClick={handleSendTest}
                            disabled={sendingTest || !testPhone.trim()}
                            className="w-full h-10 rounded-full cursor-pointer bg-green-600 hover:bg-green-700 text-white"
                        >
                            {sendingTest ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Envoi...</>
                            ) : (
                                <><Send className="w-4 h-4 mr-2" /> Envoyer le test</>
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

// ============================================
// Add Channel Dialog (multi-WABA aware)
// ============================================

interface AddChannelDialogProps {
    addChannel: (args: {
        accessToken: string
        wabaId: string
        phoneNumberId: string
        displayPhoneNumber?: string
        verifiedName?: string
        label?: string
    }) => Promise<{ success: boolean; channelId: string }>
    fetchPhoneNumbers: (args: { accessToken: string }) => Promise<{
        wabaId: string | null
        wabaIds?: string[]
        phoneNumbers: WhatsAppNumber[]
    }>
    trigger?: React.ReactNode
}

function AddChannelDialog({ addChannel, fetchPhoneNumbers, trigger }: AddChannelDialogProps) {
    const { isReady: fbReady, login: fbLogin } = useFacebookSDK()
    const [open, setOpen] = useState(false)
    const [step, setStep] = useState<'idle' | 'fetching' | 'selecting' | 'saving'>('idle')
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [accessToken, setAccessToken] = useState<string | null>(null)
    const [phoneNumbers, setPhoneNumbers] = useState<WhatsAppNumber[]>([])
    const [selectedPhoneId, setSelectedPhoneId] = useState<string | null>(null)
    const [channelLabel, setChannelLabel] = useState('')

    const resetState = () => {
        setStep('idle')
        setErrorMessage(null)
        setAccessToken(null)
        setPhoneNumbers([])
        setSelectedPhoneId(null)
        setChannelLabel('')
    }

    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen)
        if (!newOpen) resetState()
    }

    const launchFBSignup = async () => {
        setErrorMessage(null)
        try {
            const { accessToken: token } = await fbLogin()
            setAccessToken(token)
            setStep('fetching')

            const data = await fetchPhoneNumbers({ accessToken: token })
            setPhoneNumbers(data.phoneNumbers)

            if (data.phoneNumbers.length > 0) {
                setSelectedPhoneId(data.phoneNumbers[0].id)
                setStep('selecting')
            } else {
                setErrorMessage('Aucun numéro WhatsApp trouvé sur ce compte.')
                setStep('idle')
            }
        } catch (err: any) {
            setErrorMessage(err.message || 'Connexion annulée ou non autorisée.')
            setStep('idle')
        }
    }

    const handleConfirm = async () => {
        if (!accessToken || !selectedPhoneId) return

        const selectedPhone = phoneNumbers.find(p => p.id === selectedPhoneId)
        if (!selectedPhone) return

        setStep('saving')

        try {
            await addChannel({
                accessToken,
                wabaId: selectedPhone.wabaId,
                phoneNumberId: selectedPhoneId,
                displayPhoneNumber: selectedPhone.display_phone_number,
                verifiedName: selectedPhone.verified_name,
                label: channelLabel || selectedPhone.verified_name || selectedPhone.display_phone_number,
            })
            toast.success('Canal WhatsApp ajouté', {
                description: selectedPhone.display_phone_number || 'Nouveau canal actif',
            })
            handleOpenChange(false)
        } catch (err: any) {
            setErrorMessage(err.message || 'Erreur lors de la création du canal.')
            setStep('selecting')
        }
    }

    const selectedPhone = phoneNumbers.find(p => p.id === selectedPhoneId)

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button size="sm" className="h-8 gap-1.5 text-xs rounded-full cursor-pointer bg-green-600 hover:bg-green-700 text-white">
                        <Plus className="h-3.5 w-3.5" />
                        Ajouter un canal
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto bg-white">
                <DialogHeader>
                    <DialogTitle className="text-base font-semibold text-gray-900">
                        Ajouter un canal WhatsApp
                    </DialogTitle>
                    <DialogDescription className="text-xs text-gray-500">
                        Connectez un nouveau numéro WhatsApp Business via votre compte Facebook.
                    </DialogDescription>
                </DialogHeader>

                {errorMessage && (
                    <div className="rounded-lg border px-3 py-2.5 bg-red-50 border-red-200">
                        <p className="text-sm text-red-700 flex items-center gap-1.5">
                            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                            {errorMessage}
                        </p>
                    </div>
                )}

                {step === 'idle' && (
                    <div className="space-y-4 py-2">
                        <div className="rounded-lg border border-gray-100 p-4 bg-gray-50/50 text-center">
                            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#14532d] to-[#059669] flex items-center justify-center shadow-lg shadow-green-900/20 mx-auto mb-3">
                                <Phone className="h-6 w-6 text-white" />
                            </div>
                            <p className="text-sm text-gray-600">
                                Une fenêtre popup va s&apos;ouvrir pour vous connecter à Facebook et sélectionner vos numéros WhatsApp Business.
                            </p>
                        </div>
                        <Button
                            onClick={launchFBSignup}
                            disabled={!fbReady}
                            className="w-full h-11 rounded-full cursor-pointer bg-gradient-to-r from-[#1877F2] to-[#166fe5] hover:from-[#166fe5] hover:to-[#1565d8] text-white font-semibold"
                        >
                            {!fbReady ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                                <svg className="w-4 h-4 fill-current mr-2" viewBox="0 0 24 24">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                </svg>
                            )}
                            Connecter WhatsApp Business
                        </Button>
                    </div>
                )}

                {step === 'fetching' && (
                    <div className="flex flex-col items-center justify-center py-10 gap-3">
                        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
                        <p className="text-sm text-gray-500">Récupération de tous vos numéros...</p>
                    </div>
                )}

                {(step === 'selecting' || step === 'saving') && (
                    <div className="space-y-4 py-2">
                        {/* Phone number count */}
                        <div className="rounded-lg border px-3 py-2.5 bg-green-50 border-green-100">
                            <p className="text-xs text-green-700 flex items-center gap-1.5">
                                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                                {phoneNumbers.length} numéro{phoneNumbers.length > 1 ? 's' : ''} trouvé{phoneNumbers.length > 1 ? 's' : ''} sur votre compte
                            </p>
                        </div>

                        {/* Phone number cards */}
                        <div className="max-h-[300px] overflow-y-auto space-y-2">
                            {phoneNumbers.map((phone) => {
                                const isSelected = selectedPhoneId === phone.id
                                return (
                                    <div
                                        key={phone.id}
                                        onClick={() => setSelectedPhoneId(phone.id)}
                                        className={cn(
                                            "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                                            isSelected
                                                ? "bg-green-50 border-green-200 shadow-sm"
                                                : "bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm"
                                        )}
                                    >
                                        <div className={cn(
                                            "h-9 w-9 rounded-full flex items-center justify-center shrink-0 transition-colors",
                                            isSelected
                                                ? "bg-gradient-to-br from-[#14532d] to-[#059669] text-white shadow-sm"
                                                : "bg-gray-100 text-gray-400"
                                        )}>
                                            <Phone className="h-4 w-4" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className={cn(
                                                "text-sm font-medium truncate",
                                                isSelected ? "text-green-900" : "text-gray-900"
                                            )}>
                                                {phone.verified_name || 'Numéro sans nom'}
                                            </p>
                                            <p className="text-[11px] text-gray-400 truncate">
                                                {phone.display_phone_number}
                                            </p>
                                        </div>
                                        <Badge
                                            variant="outline"
                                            className={cn("text-[10px] font-medium shrink-0", {
                                                'bg-green-50 text-green-700 border-green-200': phone.quality_rating === 'GREEN',
                                                'bg-yellow-50 text-yellow-700 border-yellow-200': phone.quality_rating === 'YELLOW',
                                                'bg-red-50 text-red-700 border-red-200': phone.quality_rating === 'RED',
                                                'bg-gray-50 text-gray-500 border-gray-200': !phone.quality_rating,
                                            })}
                                        >
                                            {phone.quality_rating || 'N/A'}
                                        </Badge>
                                        {isSelected && (
                                            <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                                        )}
                                    </div>
                                )
                            })}
                        </div>

                        {/* Channel label input */}
                        <div className="space-y-1.5">
                            <Label htmlFor="channel-label" className="text-sm font-medium text-gray-700">
                                Nom du canal (optionnel)
                            </Label>
                            <Input
                                id="channel-label"
                                placeholder="Ex : Support, Commercial, Marketing..."
                                value={channelLabel}
                                onChange={(e) => setChannelLabel(e.target.value)}
                                className="h-10 border-gray-200 focus:border-green-500 focus:ring-green-500/20"
                            />
                            <p className="text-[11px] text-gray-400">
                                Ce nom vous aidera à identifier le canal dans votre tableau de bord.
                            </p>
                        </div>

                        {/* Selected phone summary */}
                        {selectedPhone && (
                            <div className="rounded-lg border border-gray-100 p-3 bg-gray-50/50">
                                <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider mb-1">
                                    Numéro sélectionné
                                </p>
                                <p className="text-sm font-medium text-gray-900">
                                    {selectedPhone.verified_name || selectedPhone.display_phone_number}
                                </p>
                                <p className="text-[11px] text-gray-400">{selectedPhone.display_phone_number}</p>
                            </div>
                        )}

                        <Button
                            onClick={handleConfirm}
                            disabled={step === 'saving' || !selectedPhoneId}
                            className="w-full h-10 rounded-full cursor-pointer bg-green-600 hover:bg-green-700 text-white"
                        >
                            {step === 'saving' ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Ajout en cours...
                                </>
                            ) : (
                                <>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Ajouter ce canal
                                </>
                            )}
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
