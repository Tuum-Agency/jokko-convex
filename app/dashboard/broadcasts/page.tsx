"use client";

import { BroadcastList } from '@/components/broadcasts/BroadcastList';
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function BroadcastsPage() {
    const role = useQuery(api.users.currentUserRole);

    if (role === undefined) {
        return (
            <div className="p-6 space-y-6">
                <Skeleton className="h-10 w-48" />
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

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Campagnes WhatsApp</h1>
                    <p className="text-muted-foreground">
                        Gérez vos diffusions de messages en masse.
                    </p>
                </div>
            </div>
            <BroadcastList />
        </div>
    );
}
