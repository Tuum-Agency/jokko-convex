import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function Loading() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <Skeleton className="h-8 w-48 mb-2" />
                    <Skeleton className="h-4 w-96" />
                </div>
                {/* Button Group Skeleton */}
                <div className="flex items-center">
                    <Skeleton className="h-10 w-32 rounded-r-none border-r border-white/50" />
                    <Skeleton className="h-10 w-40 rounded-l-none" />
                </div>
            </div>

            {/* Banner Skeleton (if limit banner shown) */}
            <Skeleton className="h-24 w-full rounded-xl" />

            {/* Tabs Skeleton */}
            <div className="space-y-4">
                <div className="flex gap-2 p-1 bg-gray-100/50 w-fit rounded-lg">
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-8 w-24" />
                </div>

                <Card className="bg-white border-gray-200/80 shadow-sm">
                    <CardHeader className="pb-3">
                        <Skeleton className="h-6 w-48 mb-2" />
                        <Skeleton className="h-4 w-72" />
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                                    <div className="flex items-center gap-4">
                                        <Skeleton className="h-10 w-10 rounded-full" />
                                        <div className="space-y-2">
                                            <Skeleton className="h-4 w-32" />
                                            <Skeleton className="h-3 w-48" />
                                        </div>
                                    </div>
                                    <Skeleton className="h-8 w-8" />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
