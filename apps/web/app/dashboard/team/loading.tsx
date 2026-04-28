import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

export default function Loading() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <Skeleton className="h-7 w-32 mb-2" />
                    <Skeleton className="h-4 w-72" />
                </div>
                <div className="flex items-center gap-2">
                    <Skeleton className="h-9 w-28 rounded-md" />
                    <Skeleton className="h-9 w-24 rounded-md" />
                </div>
            </div>

            {/* Stat Cards */}
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

            {/* Tabs */}
            <div className="flex gap-2 p-1 bg-gray-100/50 w-fit rounded-lg">
                <Skeleton className="h-8 w-28" />
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-28" />
            </div>

            {/* Content Card */}
            <Card className="bg-white border-gray-100 shadow-sm">
                <CardContent className="p-6">
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 animate-pulse">
                                <div className="h-11 w-11 rounded-full bg-gray-200" />
                                <div className="flex-1 min-w-0 space-y-2">
                                    <div className="h-4 w-32 bg-gray-200 rounded" />
                                    <div className="h-3 w-48 bg-gray-200 rounded" />
                                </div>
                                <div className="h-8 w-28 bg-gray-200 rounded-lg" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
