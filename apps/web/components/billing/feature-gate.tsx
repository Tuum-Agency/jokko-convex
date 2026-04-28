"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useFeatureAccess } from "@/hooks/usePlans";
import type { FeatureKey } from "@jokko/core/planFeatures";

type FeatureGateProps = {
    feature: FeatureKey;
    children: React.ReactNode;
    /**
     * Contenu alternatif quand la feature est verrouillée. Par défaut on affiche
     * un écran "Passez à <Plan>".
     */
    fallback?: React.ReactNode;
};

/**
 * Wrappe une section du dashboard en fonction de l'accès à une feature.
 *
 * - Trial actif OU feature incluse dans le plan → rend `children`
 * - Feature verrouillée → rend `fallback` ou un écran d'upgrade.
 */
export function FeatureGate({ feature, children, fallback }: FeatureGateProps) {
    const access = useFeatureAccess(feature);

    if (access.isLoading) {
        return (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
                Chargement…
            </div>
        );
    }

    if (access.locked) {
        if (fallback) return <>{fallback}</>;
        return (
            <div className="flex items-center justify-center py-12">
                <Card className="max-w-md">
                    <CardHeader className="items-center text-center">
                        <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-900">
                            <Lock className="h-6 w-6 text-slate-500" />
                        </div>
                        <CardTitle>{access.label}</CardTitle>
                        <CardDescription>
                            Cette fonctionnalité est réservée au plan{" "}
                            <strong>{access.requiredPlanLabel}</strong>. Passez au plan supérieur
                            pour la débloquer.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center">
                        <Button asChild>
                            <Link href="/dashboard/billing">
                                Voir les plans
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return <>{children}</>;
}
