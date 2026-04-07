"use client";

import { BroadcastList } from '@/components/broadcasts/BroadcastList';
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function BroadcastsPage() {
    const role = useQuery(api.users.currentUserRole);

    if (role === undefined) {
        return (
            <div className="space-y-6 p-4 sm:p-6">
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
                <Skeleton className="h-96 w-full rounded-lg" />
            </div>
        );
    }

    if (role === 'AGENT') {
        return (
            <div className="p-4 sm:p-6">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Accès refusé</AlertTitle>
                    <AlertDescription>
                        Vous n&apos;avez pas les autorisations nécessaires pour accéder à cette page.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                        Campagnes
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Gérez vos diffusions de messages en masse
                    </p>
                </div>
            </div>
            <BroadcastList />
        </div>
    );
}
