'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface ContactCardSkeletonProps {
    className?: string
}

export function ContactCardSkeleton({ className }: ContactCardSkeletonProps) {
    return (
        <Card className={cn('bg-white border-gray-100 shadow-sm', className)}>
            <CardContent className="p-4 sm:p-5">
                <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <Skeleton className="h-10 w-10 sm:h-11 sm:w-11 rounded-full shrink-0" />

                    {/* Info */}
                    <div className="flex-1 min-w-0 space-y-2">
                        {/* Name */}
                        <Skeleton className="h-4 w-28" />

                        {/* Phone */}
                        <Skeleton className="h-3 w-24" />

                        {/* Email */}
                        <Skeleton className="h-3 w-36" />

                        {/* Tags */}
                        <div className="flex gap-1 pt-0.5">
                            <Skeleton className="h-4 w-14 rounded-full" />
                            <Skeleton className="h-4 w-10 rounded-full" />
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export function ContactListSkeleton({ count = 6 }: { count?: number }) {
    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: count }).map((_, i) => (
                <ContactCardSkeleton key={i} />
            ))}
        </div>
    )
}

export default ContactCardSkeleton
