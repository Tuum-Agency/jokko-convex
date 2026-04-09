'use client'

import { useState, useMemo } from 'react'
import {
    UserPlus,
    Users,
    Mail,
    Building2,
    AlertCircle,
    Shield,
    Search,
    X,
    Clock,
    ChevronDown,
    ChevronUp,
    UserCheck,
    Send,
    Download,
} from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useQuery } from "convex/react"
import { cn } from '@/lib/utils'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

import {
    MemberList,
    RoleDistributionChart,
    InviteMemberModal,
    InvitationLinkDialog,
    PendingInvitations,
    TeamLimitBanner,
    MemberListSkeleton,
    PendingInvitationsSkeleton,
    PolesSection,
    PoleModal,
    type Member,
    type MemberStatus,
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
// SEARCH & FILTER BAR
// ============================================

interface MemberFiltersProps {
    searchQuery: string
    onSearchChange: (value: string) => void
    roleFilter: string
    onRoleFilterChange: (value: string) => void
    statusFilter: string
    onStatusFilterChange: (value: string) => void
    poleFilter: string
    onPoleFilterChange: (value: string) => void
    uniquePoles: string[]
    resultCount: number
    totalCount: number
}

function MemberFilters({
    searchQuery,
    onSearchChange,
    roleFilter,
    onRoleFilterChange,
    statusFilter,
    onStatusFilterChange,
    poleFilter,
    onPoleFilterChange,
    uniquePoles,
    resultCount,
    totalCount,
}: MemberFiltersProps) {
    const hasActiveFilters = searchQuery || roleFilter !== 'all' || statusFilter !== 'all' || poleFilter !== 'all'

    function clearFilters() {
        onSearchChange('')
        onRoleFilterChange('all')
        onStatusFilterChange('all')
        onPoleFilterChange('all')
    }

    return (
        <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
                {/* Search Input */}
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Rechercher un membre..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="pl-9 h-9 text-sm bg-white"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => onSearchChange('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>

                {/* Role Filter */}
                <Select value={roleFilter} onValueChange={onRoleFilterChange}>
                    <SelectTrigger className="w-full sm:w-[160px] h-9 text-sm bg-white">
                        <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tous les roles</SelectItem>
                        <SelectItem value="owner">Proprietaire</SelectItem>
                        <SelectItem value="admin">Administrateur</SelectItem>
                        <SelectItem value="agent">Agent</SelectItem>
                    </SelectContent>
                </Select>

                {/* Status Filter */}
                <Select value={statusFilter} onValueChange={onStatusFilterChange}>
                    <SelectTrigger className="w-full sm:w-[160px] h-9 text-sm bg-white">
                        <SelectValue placeholder="Statut" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tous les statuts</SelectItem>
                        <SelectItem value="ONLINE">En ligne</SelectItem>
                        <SelectItem value="BUSY">Occupe</SelectItem>
                        <SelectItem value="AWAY">Absent</SelectItem>
                        <SelectItem value="OFFLINE">Hors ligne</SelectItem>
                    </SelectContent>
                </Select>

                {/* Pole Filter */}
                {uniquePoles.length > 0 && (
                    <Select value={poleFilter} onValueChange={onPoleFilterChange}>
                        <SelectTrigger className="w-full sm:w-[160px] h-9 text-sm bg-white">
                            <SelectValue placeholder="Pole" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tous les poles</SelectItem>
                            <SelectItem value="none">Sans pole</SelectItem>
                            {uniquePoles.map((pole) => (
                                <SelectItem key={pole} value={pole}>
                                    {pole}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
            </div>

            {/* Active filters indicator */}
            {hasActiveFilters && (
                <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                        {resultCount} sur {totalCount} membres
                    </span>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="h-6 px-2 text-xs text-gray-500 hover:text-gray-700"
                    >
                        <X className="h-3 w-3 mr-1" />
                        Effacer les filtres
                    </Button>
                </div>
            )}
        </div>
    )
}

// ============================================
// ACTIVITY ITEM
// ============================================

function ActivityItem({ activity }: {
    activity: {
        type: string
        message: string
        timestamp: number
        userName?: string
        userEmail?: string
    }
}) {
    const iconMap: Record<string, React.ElementType> = {
        member_joined: UserCheck,
        invitation_sent: Send,
    }
    const Icon = iconMap[activity.type] || Clock

    const timeAgo = formatActivityTime(activity.timestamp)

    return (
        <div className="flex items-start gap-3 py-2 px-1 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                <Icon className="h-4 w-4 text-gray-500" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700 leading-snug">
                    {activity.message}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{timeAgo}</p>
            </div>
        </div>
    )
}

function formatActivityTime(timestamp: number): string {
    const now = Date.now()
    const diffMs = now - timestamp
    const diffMin = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMin < 1) return "A l'instant"
    if (diffMin < 60) return `Il y a ${diffMin}min`
    if (diffHours < 24) return `Il y a ${diffHours}h`
    if (diffDays < 30) return `Il y a ${diffDays}j`
    return new Date(timestamp).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

// ============================================
// MAIN PAGE
// ============================================

export default function TeamPage() {
    const [inviteModalOpen, setInviteModalOpen] = useState(false)
    const [createPoleModalOpen, setCreatePoleModalOpen] = useState(false)

    // Invitation link dialog state (Feature 4)
    const [invitationLinkData, setInvitationLinkData] = useState<{ token: string; email: string } | null>(null)

    // Filter state
    const [searchQuery, setSearchQuery] = useState('')
    const [roleFilter, setRoleFilter] = useState('all')
    const [statusFilter, setStatusFilter] = useState('all')
    const [poleFilter, setPoleFilter] = useState('all')

    const role = useQuery(api.users.currentUserRole);

    // Activity panel state
    const [activityOpen, setActivityOpen] = useState(true)

    // Convex Queries
    const membersData = useQuery(api.team.listMembers, {})
    const invitationsData = useQuery(api.invitations.list, {})
    const polesData = useQuery(api.poles.list, {})
    const activityData = useQuery(api.team.getTeamActivity, {})

    // Derived data (must be computed before early returns that use them)
    const currentUserRole = (membersData?.currentUserRole as Role) || 'agent'
    const members = (membersData?.members ?? []) as Member[]
    const invitations = (invitationsData?.invitations ?? []) as Invitation[]
    const poles = (polesData?.poles ?? []) as Pole[]

    // Extract unique pole names for filter dropdown
    const uniquePoles = useMemo(() => {
        const poleNames = new Set<string>()
        for (const m of members) {
            if (m.poleName) poleNames.add(m.poleName)
        }
        return Array.from(poleNames).sort()
    }, [members])

    // Client-side filtering
    const filteredMembers = useMemo(() => {
        let result = members

        // Search by name or email
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim()
            result = result.filter((m) => {
                const name = (m.user.name || '').toLowerCase()
                const email = m.user.email.toLowerCase()
                return name.includes(query) || email.includes(query)
            })
        }

        // Role filter
        if (roleFilter !== 'all') {
            result = result.filter((m) => m.role === roleFilter)
        }

        // Status filter
        if (statusFilter !== 'all') {
            result = result.filter((m) => m.status === statusFilter)
        }

        // Pole filter
        if (poleFilter !== 'all') {
            if (poleFilter === 'none') {
                result = result.filter((m) => !m.poleName)
            } else {
                result = result.filter((m) => m.poleName === poleFilter)
            }
        }

        return result
    }, [members, searchQuery, roleFilter, statusFilter, poleFilter])

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
                        Vous n&apos;avez pas les autorisations necessaires pour acceder a cette page.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    // Loading states
    const invitationsLoading = invitationsData === undefined
    const polesLoading = polesData === undefined

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
    const onlineCount = members.filter(m => m.status === 'ONLINE').length

    // CSV export (Feature 3)
    const roleLabelsMap: Record<string, string> = {
        owner: 'Proprietaire',
        admin: 'Administrateur',
        agent: 'Agent',
    }

    const statusLabelsMap: Record<string, string> = {
        ONLINE: 'En ligne',
        BUSY: 'Occupe',
        AWAY: 'Absent',
        OFFLINE: 'Hors ligne',
    }

    const handleExportCSV = () => {
        const headers = ['Nom', 'Email', 'Role', 'Pole', 'Statut', 'Conversations actives', 'Date d\'inscription']
        const rows = members.map((m) => [
            m.user.name || '',
            m.user.email,
            roleLabelsMap[m.role] || m.role,
            m.poleName || '',
            statusLabelsMap[m.status] || m.status,
            String(m.activeConversations || 0),
            m.joinedAt ? new Date(m.joinedAt).toLocaleDateString('fr-FR') : '',
        ])

        const csvContent = [
            headers.join(','),
            ...rows.map(r => r.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
        ].join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.setAttribute('href', url)
        link.setAttribute('download', `equipe_export_${new Date().toISOString().slice(0, 10)}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

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
                        onClick={handleExportCSV}
                        className="h-8 gap-1.5 text-xs rounded-full cursor-pointer"
                        disabled={members.length === 0}
                    >
                        <Download className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Exporter</span>
                    </Button>
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
                    title="En ligne"
                    value={String(onlineCount)}
                    description={`${onlineCount} sur ${totalMembers} membres actifs`}
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
                <TabsContent value="members" className="mt-4 space-y-4">
                    {/* Role Distribution Chart (Feature 1) */}
                    {members.length > 0 && (
                        <Card className="bg-white border-gray-100 shadow-sm">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-semibold text-gray-900">
                                    Repartition des roles
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <RoleDistributionChart members={members} />
                            </CardContent>
                        </Card>
                    )}

                    {/* Search & Filters */}
                    <MemberFilters
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        roleFilter={roleFilter}
                        onRoleFilterChange={setRoleFilter}
                        statusFilter={statusFilter}
                        onStatusFilterChange={setStatusFilter}
                        poleFilter={poleFilter}
                        onPoleFilterChange={setPoleFilter}
                        uniquePoles={uniquePoles}
                        resultCount={filteredMembers.length}
                        totalCount={members.length}
                    />

                    <Card className="bg-white border-gray-100 shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm sm:text-base font-semibold text-gray-900">
                                Membres de l&apos;equipe
                            </CardTitle>
                            <CardDescription>
                                Personnes ayant acces a votre organisation
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="animate-in fade-in duration-300">
                                <MemberList
                                    members={filteredMembers}
                                    currentUserRole={currentUserRole}
                                    poles={poles}
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
                                Invitations envoyees en attente d&apos;acceptation
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

            {/* Activity Timeline */}
            <Card className="bg-white border-gray-100 shadow-sm" data-testid="activity-section">
                <CardHeader className="pb-3">
                    <button
                        onClick={() => setActivityOpen(!activityOpen)}
                        className="flex items-center justify-between w-full cursor-pointer"
                    >
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-500" />
                            <CardTitle className="text-sm sm:text-base font-semibold text-gray-900">
                                Activite de l&apos;equipe
                            </CardTitle>
                            {activityData?.activities && activityData.activities.length > 0 && (
                                <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                                    {activityData.activities.length}
                                </Badge>
                            )}
                        </div>
                        {activityOpen ? (
                            <ChevronUp className="h-4 w-4 text-gray-400" />
                        ) : (
                            <ChevronDown className="h-4 w-4 text-gray-400" />
                        )}
                    </button>
                    <CardDescription>
                        Historique recent des evenements de l&apos;equipe
                    </CardDescription>
                </CardHeader>
                {activityOpen && (
                    <CardContent>
                        {!activityData ? (
                            <div className="space-y-3">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                                        <div className="flex-1">
                                            <Skeleton className="h-4 w-3/4 mb-1" />
                                            <Skeleton className="h-3 w-24" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : activityData.activities.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-4">
                                Aucune activite recente
                            </p>
                        ) : (
                            <div className="space-y-1">
                                {activityData.activities.map((activity, index) => (
                                    <ActivityItem key={`${activity.type}-${activity.timestamp}-${index}`} activity={activity} />
                                ))}
                            </div>
                        )}
                    </CardContent>
                )}
            </Card>

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
