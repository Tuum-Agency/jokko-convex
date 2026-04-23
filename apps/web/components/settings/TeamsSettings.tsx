'use client'

import { useState } from 'react'
import { useTeams } from '@/hooks/useTeams'
import { useCurrentOrg } from '@/hooks/use-current-org'
import { usePermission } from '@/hooks/use-permission'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'
import { toast } from 'sonner'
import { Plus, Users, Trash2, UserPlus, Crown, Loader2, Pencil } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

export function TeamsSettings() {
    const { currentOrg } = useCurrentOrg()
    const { teams, isLoading, createTeam, updateTeam, archiveTeam, addMember, removeMember, updateMemberRole } = useTeams()
    const canCreate = usePermission('teams:create')
    const canManageMembers = usePermission('teams:manage_members')

    const [showCreate, setShowCreate] = useState(false)
    const [newName, setNewName] = useState('')
    const [newDescription, setNewDescription] = useState('')
    const [newColor, setNewColor] = useState('#3B82F6')
    const [creating, setCreating] = useState(false)

    const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)

    const handleCreate = async () => {
        if (!currentOrg || !newName.trim()) return
        setCreating(true)
        try {
            await createTeam({
                organizationId: currentOrg._id as Id<"organizations">,
                name: newName.trim(),
                description: newDescription.trim() || undefined,
                color: newColor,
            })
            toast.success('Équipe créée')
            setNewName('')
            setNewDescription('')
            setShowCreate(false)
        } catch (e: any) {
            toast.error(e.message || 'Erreur lors de la création')
        } finally {
            setCreating(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="h-6 w-6 animate-spin text-green-600" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-green-600" />
                            Équipes
                        </CardTitle>
                        <CardDescription>
                            Organisez vos agents par département ou équipe. Chaque équipe peut être associée à un canal WhatsApp.
                        </CardDescription>
                    </div>
                    {canCreate && (
                        <Button
                            onClick={() => setShowCreate(!showCreate)}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                        >
                            <Plus className="h-4 w-4 mr-1" />
                            Nouvelle équipe
                        </Button>
                    )}
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Create form */}
                    {showCreate && (
                        <div className="border rounded-lg p-4 bg-gray-50/50 space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label>Nom</Label>
                                    <Input
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        placeholder="ex: Support Client"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label>Couleur</Label>
                                    <div className="flex gap-2 items-center">
                                        <input
                                            type="color"
                                            value={newColor}
                                            onChange={(e) => setNewColor(e.target.value)}
                                            className="h-9 w-12 rounded border cursor-pointer"
                                        />
                                        <span className="text-sm text-gray-500">{newColor}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label>Description (optionnel)</Label>
                                <Input
                                    value={newDescription}
                                    onChange={(e) => setNewDescription(e.target.value)}
                                    placeholder="Décrivez le rôle de cette équipe..."
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button variant="outline" size="sm" onClick={() => setShowCreate(false)}>Annuler</Button>
                                <Button size="sm" onClick={handleCreate} disabled={creating || !newName.trim()}>
                                    {creating && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                                    Créer
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Teams list */}
                    {teams.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                            <p className="font-medium">Aucune équipe</p>
                            <p className="text-sm">Créez votre première équipe pour organiser vos agents.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {teams.map((team: any) => (
                                <TeamCard
                                    key={team._id}
                                    team={team}
                                    isExpanded={selectedTeamId === team._id}
                                    onToggle={() => setSelectedTeamId(selectedTeamId === team._id ? null : team._id)}
                                    canManageMembers={canManageMembers}
                                    onArchive={archiveTeam}
                                    onAddMember={addMember}
                                    onRemoveMember={removeMember}
                                    onUpdateRole={updateMemberRole}
                                />
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

function TeamCard({ team, isExpanded, onToggle, canManageMembers, onArchive, onAddMember, onRemoveMember, onUpdateRole }: any) {
    const teamDetail = useQuery(api.teams.getById, isExpanded ? { id: team._id } : "skip")
    const { currentOrg } = useCurrentOrg()
    const membersData = useQuery(
        api.team.listMembers,
        currentOrg ? { organizationId: currentOrg._id as Id<"organizations"> } : "skip"
    )
    const members = membersData?.members || []

    const [addingMember, setAddingMember] = useState(false)
    const [selectedUserId, setSelectedUserId] = useState('')
    const [selectedRole, setSelectedRole] = useState<'lead' | 'member'>('member')

    const handleAddMember = async () => {
        if (!selectedUserId) return
        try {
            await onAddMember({
                teamId: team._id,
                userId: selectedUserId as Id<"users">,
                role: selectedRole,
            })
            toast.success('Membre ajouté')
            setAddingMember(false)
            setSelectedUserId('')
        } catch (e: any) {
            toast.error(e.message || 'Erreur')
        }
    }

    const handleArchive = async () => {
        try {
            await onArchive({ id: team._id })
            toast.success('Équipe archivée')
        } catch (e: any) {
            toast.error(e.message || 'Erreur')
        }
    }

    // Get team member user IDs to filter them out from add list
    const teamMemberIds = new Set(teamDetail?.members?.map((m: any) => m.userId) || [])

    // Available org members not already in team
    const availableMembers = (members || []).filter((m: any) => !teamMemberIds.has(m.userId))

    return (
        <div className="border rounded-lg overflow-hidden">
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left"
            >
                <div className="flex items-center gap-3">
                    <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: team.color || '#6B7280' }}
                    />
                    <div>
                        <h4 className="font-medium text-gray-900">{team.name}</h4>
                        {team.description && (
                            <p className="text-sm text-gray-500">{team.description}</p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                        {team.memberCount} membre{team.memberCount !== 1 ? 's' : ''}
                    </Badge>
                </div>
            </button>

            {isExpanded && teamDetail && (
                <div className="border-t bg-gray-50/50 p-4 space-y-3">
                    {/* Members list */}
                    {teamDetail.members?.length > 0 ? (
                        <div className="space-y-2">
                            {teamDetail.members.map((member: any) => (
                                <div key={member._id} className="flex items-center justify-between bg-white rounded-lg p-3 border">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8">
                                            {member.user?.image && <AvatarImage src={member.user.image} />}
                                            <AvatarFallback className="text-xs bg-green-100 text-green-700">
                                                {member.user?.name?.charAt(0)?.toUpperCase() || '?'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="text-sm font-medium">{member.user?.name || member.user?.email}</p>
                                            <p className="text-xs text-gray-500">{member.user?.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {member.role === 'lead' ? (
                                            <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                                                <Crown className="h-3 w-3 mr-1" /> Lead
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-xs">Membre</Badge>
                                        )}
                                        {canManageMembers && (
                                            <>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 w-7 p-0"
                                                    onClick={() => onUpdateRole({
                                                        teamId: team._id,
                                                        userId: member.userId,
                                                        role: member.role === 'lead' ? 'member' : 'lead',
                                                    })}
                                                >
                                                    <Pencil className="h-3 w-3" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                                                    onClick={() => onRemoveMember({ teamId: team._id, userId: member.userId })}
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500 text-center py-2">Aucun membre dans cette équipe</p>
                    )}

                    {/* Add member */}
                    {canManageMembers && (
                        <div>
                            {addingMember ? (
                                <div className="flex gap-2 items-end">
                                    <div className="flex-1">
                                        <Label className="text-xs">Membre</Label>
                                        <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                                            <SelectTrigger className="h-9">
                                                <SelectValue placeholder="Choisir un membre..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {availableMembers.map((m: any) => (
                                                    <SelectItem key={m.userId} value={m.userId}>
                                                        {m.user?.name || m.user?.email}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="w-28">
                                        <Label className="text-xs">Rôle</Label>
                                        <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as 'lead' | 'member')}>
                                            <SelectTrigger className="h-9">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="member">Membre</SelectItem>
                                                <SelectItem value="lead">Lead</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Button size="sm" className="h-9" onClick={handleAddMember} disabled={!selectedUserId}>
                                        Ajouter
                                    </Button>
                                    <Button size="sm" variant="outline" className="h-9" onClick={() => setAddingMember(false)}>
                                        Annuler
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={() => setAddingMember(true)}>
                                        <UserPlus className="h-4 w-4 mr-1" />
                                        Ajouter un membre
                                    </Button>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="outline" size="sm" className="text-red-500 hover:text-red-700">
                                                <Trash2 className="h-4 w-4 mr-1" />
                                                Archiver
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Archiver l'équipe "{team.name}" ?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    L'équipe sera masquée mais les données seront conservées.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                                <AlertDialogAction onClick={handleArchive} className="bg-red-600 hover:bg-red-700">
                                                    Archiver
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
