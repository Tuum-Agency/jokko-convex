'use client'

import { useState } from 'react'
import { useChannels } from '@/hooks/useChannels'
import { useTeams } from '@/hooks/useTeams'
import { useCurrentOrg } from '@/hooks/use-current-org'
import { usePermission } from '@/hooks/use-permission'
import { Id } from '@/convex/_generated/dataModel'
import { toast } from 'sonner'
import { Phone, Star, StarOff, Loader2, Ban, Settings2, Signal, SignalZero, Users } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Signal }> = {
    active: { label: 'Actif', color: 'bg-green-100 text-green-700 border-green-200', icon: Signal },
    pending_setup: { label: 'En attente', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Settings2 },
    disconnected: { label: 'Déconnecté', color: 'bg-gray-100 text-gray-700 border-gray-200', icon: SignalZero },
    error: { label: 'Erreur', color: 'bg-red-100 text-red-700 border-red-200', icon: SignalZero },
    disabled: { label: 'Désactivé', color: 'bg-gray-100 text-gray-500 border-gray-200', icon: Ban },
    banned: { label: 'Banni', color: 'bg-red-100 text-red-700 border-red-200', icon: Ban },
}

export function ChannelsSettings() {
    const { currentOrg } = useCurrentOrg()
    const { channels, isLoading, updateChannel, disableChannel, setOrgDefault } = useChannels()
    const { teams } = useTeams()
    const canUpdate = usePermission('channels:update')
    const canDelete = usePermission('channels:delete')

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

    const handleAssignTeam = async (channelId: string, teamId: string) => {
        try {
            await updateChannel({
                id: channelId as Id<"whatsappChannels">,
                primaryTeamId: teamId as Id<"teams">,
            })
            toast.success('Équipe assignée au canal')
        } catch (e: any) {
            toast.error(e.message || 'Erreur')
        }
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Phone className="h-5 w-5 text-green-600" />
                        Canaux WhatsApp
                    </CardTitle>
                    <CardDescription>
                        Gérez vos numéros WhatsApp connectés. Chaque canal peut être associé à une équipe.
                        {currentOrg && (
                            <span className="block mt-1 text-xs">
                                Plan {currentOrg.plan} — {channels.length} canal(aux) actif(s)
                            </span>
                        )}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {channels.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <Phone className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                            <p className="font-medium">Aucun canal WhatsApp</p>
                            <p className="text-sm">
                                Connectez un numéro WhatsApp dans l'onglet WhatsApp ou lancez la migration depuis l'ancien système.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {channels.map((channel: any) => {
                                const statusConfig = STATUS_CONFIG[channel.status] || STATUS_CONFIG.disconnected
                                const StatusIcon = statusConfig.icon

                                return (
                                    <div key={channel._id} className="border rounded-lg p-4 hover:border-gray-300 transition-colors">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-green-50 rounded-full">
                                                    <Phone className="h-4 w-4 text-green-600" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-medium text-gray-900">{channel.label}</h4>
                                                        {channel.isOrgDefault && (
                                                            <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px]">
                                                                <Star className="h-3 w-3 mr-0.5" /> Par défaut
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-500">{channel.displayPhoneNumber}</p>
                                                    {channel.verifiedName && (
                                                        <p className="text-xs text-gray-400">{channel.verifiedName}</p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                {/* Status badge */}
                                                <Badge variant="outline" className={statusConfig.color}>
                                                    <StatusIcon className="h-3 w-3 mr-1" />
                                                    {statusConfig.label}
                                                </Badge>

                                                {/* Team assignment */}
                                                {canUpdate && (
                                                    <div className="w-40">
                                                        <Select
                                                            value={channel.primaryTeamId || 'none'}
                                                            onValueChange={(v) => {
                                                                if (v !== 'none') handleAssignTeam(channel._id, v)
                                                            }}
                                                        >
                                                            <SelectTrigger className="h-8 text-xs">
                                                                <Users className="h-3 w-3 mr-1" />
                                                                <SelectValue placeholder="Équipe..." />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="none">Aucune équipe</SelectItem>
                                                                {teams.map((team: any) => (
                                                                    <SelectItem key={team._id} value={team._id}>
                                                                        <div className="flex items-center gap-2">
                                                                            <div
                                                                                className="h-2 w-2 rounded-full"
                                                                                style={{ backgroundColor: team.color || '#6B7280' }}
                                                                            />
                                                                            {team.name}
                                                                        </div>
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                )}

                                                {/* Actions */}
                                                {canUpdate && !channel.isOrgDefault && channel.status === 'active' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8"
                                                        onClick={() => handleSetDefault(channel._id)}
                                                        title="Définir comme canal par défaut"
                                                    >
                                                        <StarOff className="h-4 w-4" />
                                                    </Button>
                                                )}

                                                {canDelete && !channel.isOrgDefault && channel.status !== 'disabled' && (
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="ghost" size="sm" className="h-8 text-red-500 hover:text-red-700">
                                                                <Ban className="h-4 w-4" />
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Désactiver le canal "{channel.label}" ?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Ce canal ne recevra plus de messages. Les conversations existantes seront conservées.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    onClick={() => handleDisable(channel._id)}
                                                                    className="bg-red-600 hover:bg-red-700"
                                                                >
                                                                    Désactiver
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                )}
                                            </div>
                                        </div>

                                        {/* WABA info */}
                                        {channel.waba && (
                                            <div className="mt-2 flex items-center gap-4 text-xs text-gray-400">
                                                <span>WABA: {channel.waba.metaBusinessAccountId}</span>
                                                {channel.waba.label && <span>({channel.waba.label})</span>}
                                                {channel.primaryTeam && (
                                                    <span className="flex items-center gap-1">
                                                        <div
                                                            className="h-2 w-2 rounded-full"
                                                            style={{ backgroundColor: channel.primaryTeam.color || '#6B7280' }}
                                                        />
                                                        {channel.primaryTeam.name}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
