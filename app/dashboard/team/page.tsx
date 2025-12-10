/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║              app/(dashboard)/team/page.tsx                    ║
 * ╠═══════════════════════════════════════════════════════════════╣
 * ║                                                               ║
 * ║     PAGE GESTION D'EQUIPE                                     ║
 * ║                                                               ║
 * ║     - Banniere de limite si necessaire                        ║
 * ║     - Liste des membres avec actions                          ║
 * ║     - Onglet invitations en attente                           ║
 * ║     - Bouton d'invitation avec ButtonGroup                    ║
 * ║                                                               ║
 * ║     Design coherent avec le dashboard:                        ║
 * ║     - Couleurs vertes (green-500, green-600)                  ║
 * ║     - Cards avec bg-white, border-gray-200/80                 ║
 * ║     - Arrondis (rounded-xl)                                   ║
 * ║     - ButtonGroup pour actions groupees                       ║
 * ║                                                               ║
 * ╚═══════════════════════════════════════════════════════════════╝
 */

'use client'

import { useState } from 'react'
import { UserPlus, Users, Mail, Building2, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useQuery } from "convex/react"

import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

import {
    MemberList,
    InviteMemberModal,
    PendingInvitations,
    TeamLimitBanner,
    MemberListSkeleton,
    PendingInvitationsSkeleton,
    PolesSection,
    PoleModal,
    type Member,
    type Invitation,
    type Pole,
} from '@/components/team'

import { api } from "@/convex/_generated/api"
import { type Role } from '@/lib/team/roles'

// ============================================
// COMPONENT
// ============================================

export default function TeamPage() {
    const [inviteModalOpen, setInviteModalOpen] = useState(false)
    const [createPoleModalOpen, setCreatePoleModalOpen] = useState(false)

    const role = useQuery(api.users.currentUserRole);

    // Convex Queries
    const membersData = useQuery(api.team.listMembers, {})
    const invitationsData = useQuery(api.invitations.list, {})
    const polesData = useQuery(api.poles.list, {})

    if (role === undefined) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-24 w-full" />
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



    // Loading states
    const membersLoading = membersData === undefined
    const invitationsLoading = invitationsData === undefined
    const polesLoading = polesData === undefined

    // Derived data
    const currentUserRole = (membersData?.currentUserRole as Role) || 'agent'
    const members = membersData?.members as Member[] || []
    const invitations = invitationsData?.invitations as Invitation[] || []
    const poles = polesData?.poles as Pole[] || []

    const totalMembers = membersData?.total || 0
    const teamLimit = {
        current: totalMembers,
        limit: membersData?.limit || 3,
    }

    // Can invite?
    const canInvite = ['owner', 'admin', 'OWNER', 'ADMIN'].includes(currentUserRole)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-gray-900">
                        Equipe et Roles
                    </h2>
                    <p className="text-gray-500">
                        Gerez les membres de votre equipe, leurs roles et leurs acces.
                    </p>
                </div>

                <ButtonGroup>
                    <Button
                        onClick={() => setCreatePoleModalOpen(true)}
                        variant="outline"
                    >
                        <Building2 className="mr-2 h-4 w-4" />
                        Nouveau Pôle
                    </Button>
                    <Button
                        onClick={() => setInviteModalOpen(true)}
                    >
                        <UserPlus className="mr-2 h-4 w-4" />
                        Inviter un membre
                    </Button>
                </ButtonGroup>
            </div>

            {/* Limit Banner */}
            {membersLoading ? (
                <Skeleton className="h-24 w-full rounded-xl" />
            ) : (
                <TeamLimitBanner
                    current={teamLimit.current}
                    limit={teamLimit.limit}
                    planName="Starter"
                />
            )}

            {/* Tabs */}
            <Tabs defaultValue="members" className="w-full">
                <TabsList className="bg-gray-100/50 p-1 border border-gray-200/50">
                    <TabsTrigger value="members" className="gap-2 data-[state=active]:bg-white">
                        <Users className="h-4 w-4" />
                        Membres
                        {totalMembers > 0 && (
                            <Badge variant="secondary" className="ml-1 bg-green-100 text-green-700">
                                {totalMembers}
                            </Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="poles" className="gap-2 data-[state=active]:bg-white">
                        <Building2 className="h-4 w-4" />
                        Poles
                        {polesData?.total ? (
                            <Badge variant="secondary" className="ml-1 bg-indigo-100 text-indigo-700">
                                {polesData.total}
                            </Badge>
                        ) : null}
                    </TabsTrigger>
                    <TabsTrigger value="invitations" className="gap-2 data-[state=active]:bg-white">
                        <Mail className="h-4 w-4" />
                        Invitations
                        {invitationsData?.total ? (
                            <Badge variant="secondary" className="ml-1 bg-blue-100 text-blue-700">
                                {invitationsData.total}
                            </Badge>
                        ) : null}
                    </TabsTrigger>
                </TabsList>

                {/* Members Tab */}
                <TabsContent value="members" className="mt-4">
                    <Card className="bg-white border-gray-200/80 shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg font-semibold text-gray-900">
                                Membres de l'equipe
                            </CardTitle>
                            <CardDescription>
                                Personnes ayant acces a votre organisation
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {membersLoading ? (
                                <MemberListSkeleton count={3} />
                            ) : (
                                <div className="animate-in fade-in duration-300">
                                    <MemberList
                                        members={members}
                                        currentUserRole={currentUserRole}
                                    // No need for onMemberUpdated as real-time updates are handled by Convex
                                    />
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Poles Tab */}
                <TabsContent value="poles" className="mt-4">
                    <Card className="bg-white border-gray-200/80 shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg font-semibold text-gray-900">
                                Poles / Services
                            </CardTitle>
                            <CardDescription>
                                Organisez vos agents par departement ou service
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {polesLoading ? (
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {[1, 2, 3].map((i) => (
                                        <Skeleton key={i} className="h-32 rounded-xl" />
                                    ))}
                                </div>
                            ) : (
                                <div className="animate-in fade-in duration-300">
                                    <PolesSection
                                        poles={poles}
                                        currentUserRole={currentUserRole}
                                    // onDelete/Create are handled inside or we can pass handlers if we want visual feedback
                                    // But Convex updates are automatic.
                                    />
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Invitations Tab */}
                <TabsContent value="invitations" className="mt-4">
                    <Card className="bg-white border-gray-200/80 shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg font-semibold text-gray-900">
                                Invitations en attente
                            </CardTitle>
                            <CardDescription>
                                Invitations envoyees en attente d'acceptation
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {invitationsLoading ? (
                                <PendingInvitationsSkeleton count={2} />
                            ) : (
                                <div className="animate-in fade-in duration-300">
                                    <PendingInvitations
                                        invitations={invitations}
                                    />
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Invite Modal */}
            <InviteMemberModal
                open={inviteModalOpen}
                onOpenChange={setInviteModalOpen}
                onSuccess={() => setInviteModalOpen(false)}
                currentUserRole={currentUserRole}
                teamUsage={teamLimit}
            />

            {/* Create Pole Modal */}
            <PoleModal
                open={createPoleModalOpen}
                onOpenChange={setCreatePoleModalOpen}
                onSuccess={() => { }}
            />
        </div>
    )
}
