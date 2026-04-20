"use client";

import { BroadcastList } from '@/components/broadcasts/BroadcastList';
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CreditCard } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FeatureGate } from "@/components/plan/FeatureGate";
import { usePlanFeature } from "@/hooks/use-plan-feature";

const formatCurrency = (n: number) => new Intl.NumberFormat('fr-SN', { style: 'currency', currency: 'XOF' }).format(n);

export default function BroadcastsPage() {
    const role = useQuery(api.users.currentUserRole);
    const creditBalance = useQuery(api.credits.getBalance);
    const { allowed: planAllowed, isLoading: planLoading } = usePlanFeature('broadcasts');

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

    if (planLoading) {
        return (
            <div className="p-4 sm:p-6">
                <Skeleton className="h-40 w-full rounded-lg" />
            </div>
        );
    }
    if (!planAllowed) {
        return (
            <div className="p-4 sm:p-6">
                <FeatureGate feature="broadcasts">{null}</FeatureGate>
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

                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200">
                        <span className="text-xs font-semibold text-gray-700">
                            Cr&eacute;dit Marketing
                        </span>
                        <span className="text-xs text-gray-500 font-medium tabular-nums">
                            {creditBalance != null ? formatCurrency(creditBalance) : '...'}
                        </span>
                    </div>
                    <Link href="/dashboard/billing">
                        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs rounded-full cursor-pointer">
                            <CreditCard className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Recharger</span>
                        </Button>
                    </Link>
                </div>
            </div>
            <BroadcastList />
        </div>
    );
}
