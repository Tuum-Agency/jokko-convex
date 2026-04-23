/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║             components/team/TeamSkeletons.tsx                 ║
 * ╠═══════════════════════════════════════════════════════════════╣
 * ║ DESCRIPTION:                                                  ║
 * ║   Composants skeleton pour le chargement de la page equipe.   ║
 * ╚═══════════════════════════════════════════════════════════════╝
 */

import { Skeleton } from '@/components/ui/skeleton'

// ============================================
// MEMBER ROW SKELETON
// ============================================

export function MemberRowSkeleton() {
    return (
        <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 animate-pulse">
            {/* Avatar */}
            <div className="h-11 w-11 rounded-full bg-gray-200" />

            {/* Member Info */}
            <div className="flex-1 min-w-0 space-y-2">
                <div className="h-4 w-32 bg-gray-200 rounded" />
                <div className="h-3 w-48 bg-gray-200 rounded" />
            </div>

            {/* Role Badge */}
            <div className="h-8 w-28 bg-gray-200 rounded-lg" />

            {/* Join Date */}
            <div className="hidden sm:block h-4 w-24 bg-gray-200 rounded" />

            {/* Action Menu Placeholder */}
            <div className="w-9" />
        </div>
    )
}

// ============================================
// MEMBER LIST SKELETON
// ============================================

interface MemberListSkeletonProps {
    count?: number
}

export function MemberListSkeleton({ count = 3 }: MemberListSkeletonProps) {
    return (
        <div className="space-y-3">
            {Array.from({ length: count }).map((_, i) => (
                <MemberRowSkeleton key={i} />
            ))}
        </div>
    )
}

// ============================================
// INVITATION ROW SKELETON
// ============================================

export function InvitationRowSkeleton() {
    return (
        <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 animate-pulse">
            {/* Email Icon */}
            <div className="h-11 w-11 rounded-xl bg-gray-200" />

            {/* Invitation Info */}
            <div className="flex-1 min-w-0 space-y-2">
                <div className="h-4 w-48 bg-gray-200 rounded" />
                <div className="h-3 w-36 bg-gray-200 rounded" />
            </div>

            {/* Role Badge */}
            <div className="h-8 w-24 bg-gray-200 rounded-lg" />

            {/* Cancel Button Placeholder */}
            <div className="h-8 w-8 bg-gray-200 rounded" />
        </div>
    )
}

// ============================================
// PENDING INVITATIONS SKELETON
// ============================================

interface PendingInvitationsSkeletonProps {
    count?: number
}

export function PendingInvitationsSkeleton({
    count = 2,
}: PendingInvitationsSkeletonProps) {
    return (
        <div className="space-y-3">
            {Array.from({ length: count }).map((_, i) => (
                <InvitationRowSkeleton key={i} />
            ))}
        </div>
    )
}

// ============================================
// TEAM STATS SKELETON
// ============================================

export function TeamStatsSkeleton() {
    return (
        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl animate-pulse">
            <div className="flex justify-between w-full">
                <div className="space-y-2">
                    <div className="h-4 w-24 bg-gray-200 rounded" />
                    <div className="h-3 w-16 bg-gray-200 rounded" />
                </div>
                <div className="h-2 w-32 bg-gray-200 rounded-full self-end" />
            </div>
        </div>
    )
}

// ============================================
// FULL PAGE SKELETON
// ============================================

export function TeamPageSkeleton() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <div className="flex items-center gap-2">
                    <Skeleton className="h-9 w-24" />
                    <Skeleton className="h-9 w-36" />
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
                <Skeleton className="h-10 w-32 rounded-md" />
                <Skeleton className="h-10 w-32 rounded-md" />
            </div>

            {/* Content Card */}
            <div className="bg-white border border-gray-200/80 rounded-xl shadow-sm">
                <div className="p-6 pb-3">
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-4 w-56 mt-2" />
                </div>
                <div className="p-6 pt-0">
                    <MemberListSkeleton count={3} />
                </div>
            </div>
        </div>
    )
}
