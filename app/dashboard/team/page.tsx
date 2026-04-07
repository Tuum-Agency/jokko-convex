'use client'

import { useState } from 'react'
import {
    UserPlus,
    Users,
    Mail,
    Building2,
    AlertCircle,
    Shield,
    UserCheck,
    Clock,
} from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useQuery } from "convex/react"
import { cn } from '@/lib/utils'

import { Button } from '@/components/ui/button'
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
// STAT CARD
// ============================================

function StatsCard({
    title,
    value,
    description,
    icon: Icon,
    gradient,
}: {
    title: string
    value: string
    description: string
    icon: React.ElementType
    gradient: string
}) {
    return (
        <Card className="bg-white border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <div className={cn("h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-gradient-to-br flex items-center justify-center shadow-lg shadow-green-900/20", gradient)} aria-hidden="true">
                        <Icon className="h-[18px] w-[18px] sm:h-5 sm:w-5 text-white" />
                    </div>
                </div>
                <p className="text-xs sm:text-sm font-medium text-gray-500 mb-0.5">{title}</p>
                <span className="text-xl sm:text-3xl font-bold text-gray-900 tracking-tight">{value}</span>
                <p className="text-[11px] text-gray-400 mt-0.5">{description}</p>
            </CardContent>
        </Card>
    )
}

// ============================================
// LOADING SKELETON
// ============================================

function TeamPageSkeleton() {
    return (
        <div className="space-y-6">
            <div>
                <Skeleton className="h-7 w-48 mb-2" />
                <Skeleton className="h-4 w-72" />
            </div>
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <Card key={i} className="bg-white border-gray-100 shadow-sm">
                        <CardContent className="p-5">
                            <Skeleton className="h-11 w-11 rounded-full mb-4" />
                            <Skeleton className="h-3 w-20 mb-2" />
                            <Skeleton className="h-7 w-14 mb-1" />
                            <Skeleton className="h-2.5 w-28" />
                        </CardContent>
                    </Card>
                ))}
            </div>
            <Skeleton className="h-10 w-64" />
            <Card className="bg-white border-gray-100 shadow-sm">
                <CardContent className="p-6">
                    <MemberListSkeleton count={3} />
                </CardContent>
            </Card>
        </div>
    )
}

// ============================================
// MAIN PAGE
// ============================================

export default function TeamPage() {
    const [inviteModalOpen, setInviteModalOpen] = useState(false)
    const [createPoleModalOpen, setCreatePoleModalOpen] = useState(false)

    const role = useQuery(api.users.currentUserRole);

    // Convex Queries
    const membersData = useQuery(api.team.listMembers, {})
    const invitationsData = useQuery(api.invitations.list, {})
    const polesData = useQuery(api.poles.list, {})

    if (role === undefined || membersData === undefined) {
        return <TeamPageSkeleton />
    }

    if (role === 'AGENT') {
        return (
            <div className="p-6">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Acces refuse</AlertTitle>
                    <AlertDescription>
                        Vous n'avez pas les autorisations necessaires pour acceder a cette page.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    // Loading states
    const invitationsLoading = invitationsData === undefined
    const polesLoading = polesData === undefined

    // Derived data
    const currentUserRole = (membersData?.currentUserRole as Role) || 'agent'
    const members = membersData?.members as Member[] || []
    const invitations = invitationsData?.invitations as Invitation[] || []
    const poles = polesData?.poles as Pole[] || []

    const totalMembers = membersData?.total || 0
    const nonOwnerCount = membersData?.nonOwnerCount || 0
    const memberLimit = membersData?.limit || 1
    const planName = membersData?.planName || 'FREE'

    // Plan display name
    const planDisplayNames: Record<string, string> = {
        FREE: 'Free',
        STARTER: 'Starter',
        BUSINESS: 'Business',
        PRO: 'Pro',
        ENTERPRISE: 'Enterprise',
    }

    // Stats for cards
    const pendingInvitations = invitationsData?.total || 0
    const totalPoles = polesData?.total || 0

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                        Equipe
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Gerez les membres, roles et services de votre organisation.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCreatePoleModalOpen(true)}
                        className="h-8 gap-1.5 text-xs rounded-full cursor-pointer"
                    >
                        <Building2 className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Nouveau Pole</span>
                    </Button>
                    <Button
                        size="sm"
                        onClick={() => setInviteModalOpen(true)}
                        className="h-8 gap-1.5 text-xs rounded-full bg-gradient-to-r from-[#14532d] to-[#059669] hover:from-[#14532d] hover:to-[#047857] text-white shadow-sm cursor-pointer"
                    >
                        <UserPlus className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Inviter un membre</span>
                    </Button>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                <StatsCard
                    title="Membres"
                    value={String(totalMembers)}
                    description={`${nonOwnerCount}/${memberLimit} places utilisees`}
                    icon={Users}
                    gradient="from-[#14532d] to-[#059669]"
                />
                <StatsCard
                    title="Admins"
                    value={String(members.filter(m => m.role === 'admin' || m.role === 'owner').length)}
                    description="Proprietaires et administrateurs"
                    icon={Shield}
                    gradient="from-[#166534] to-[#0d9488]"
                />
                <StatsCard
                    title="Invitations"
                    value={String(pendingInvitations)}
                    description="En attente d'acceptation"
                    icon={Mail}
                    gradient="from-[#15803d] to-[#10b981]"
                />
                <StatsCard
                    title="Poles"
                    value={String(totalPoles)}
                    description="Services et departements"
                    icon={Building2}
                    gradient="from-[#14532d] to-[#34d399]"
                />
            </div>

            {/* Limit Banner - uses nonOwnerCount vs limit (owner excluded) */}
            <TeamLimitBanner
                current={nonOwnerCount}
                limit={memberLimit}
                planName={planDisplayNames[planName] || planName}
            />

            {/* Tabs */}
            <Tabs defaultValue="members" className="w-full">
                <TabsList className="flex w-full overflow-x-auto no-scrollbar sm:inline-flex sm:w-auto bg-gray-100/50 p-1 border border-gray-200/50">
                    <TabsTrigger value="members" className="gap-1.5 sm:gap-2 data-[state=active]:bg-white shrink-0">
                        <Users className="h-4 w-4" />
                        <span className="hidden sm:inline">Membres</span>
                        {totalMembers > 0 && (
                            <Badge variant="secondary" className="ml-0.5 sm:ml-1 bg-emerald-500 text-white">
                                {totalMembers}
                            </Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="poles" className="gap-1.5 sm:gap-2 data-[state=active]:bg-white shrink-0">
                        <Building2 className="h-4 w-4" />
                        <span className="hidden sm:inline">Poles</span>
                        {totalPoles > 0 && (
                            <Badge variant="secondary" className="ml-0.5 sm:ml-1 bg-emerald-500 text-white">
                                {totalPoles}
                            </Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="invitations" className="gap-1.5 sm:gap-2 data-[state=active]:bg-white shrink-0">
                        <Mail className="h-4 w-4" />
                        <span className="hidden sm:inline">Invitations</span>
                        {pendingInvitations > 0 && (
                            <Badge variant="secondary" className="ml-0.5 sm:ml-1 bg-emerald-500 text-white">
                                {pendingInvitations}
                            </Badge>
                        )}
                    </TabsTrigger>
                </TabsList>

                {/* Members Tab */}
                <TabsContent value="members" className="mt-4">
                    <Card className="bg-white border-gray-100 shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm sm:text-base font-semibold text-gray-900">
                                Membres de l'equipe
                            </CardTitle>
                            <CardDescription>
                                Personnes ayant acces a votre organisation
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="animate-in fade-in duration-300">
                                <MemberList
                                    members={members}
                                    currentUserRole={currentUserRole}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Poles Tab */}
                <TabsContent value="poles" className="mt-4">
                    <Card className="bg-white border-gray-100 shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm sm:text-base font-semibold text-gray-900">
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
                                    />
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Invitations Tab */}
                <TabsContent value="invitations" className="mt-4">
                    <Card className="bg-white border-gray-100 shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm sm:text-base font-semibold text-gray-900">
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
                teamUsage={{ current: nonOwnerCount, limit: memberLimit }}
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
