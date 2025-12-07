'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface ContactCardSkeletonProps {
    className?: string
}

export function ContactCardSkeleton({ className }: ContactCardSkeletonProps) {
    return (
        <Card className={cn('', className)}>
            <CardContent className="p-4">
                <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <Skeleton className="h-12 w-12 rounded-full" />

                    {/* Info */}
                    <div className="flex-1 min-w-0 space-y-2">
                        {/* Name */}
                        <Skeleton className="h-5 w-32" />

                        {/* Phone */}
                        <Skeleton className="h-4 w-28" />

                        {/* Email */}
                        <Skeleton className="h-4 w-40" />

                        {/* Tags */}
                        <div className="flex gap-1 pt-1">
                            <Skeleton className="h-5 w-16 rounded-full" />
                            <Skeleton className="h-5 w-12 rounded-full" />
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
