/**
 * Verrou UI par plan : wrappe du contenu et le masque si le plan de l'org
 * ne débloque pas la feature. Affiche un paywall avec CTA vers /dashboard/billing.
 *
 * Usage :
 *   <FeatureGate feature="flows">
 *     <AutomationBuilder />
 *   </FeatureGate>
 *
 * Ou en mode inline (badge de verrouillage sans masquer) :
 *   <FeatureGate feature="flows" mode="inline">
 *     <Button>Créer un flow</Button>
 *   </FeatureGate>
 */

"use client";

import Link from "next/link";
import { Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { usePlanFeature } from "@/hooks/use-plan-feature";
import type { PlanFeature } from "@/lib/planFeatures";

type Props = {
    feature: PlanFeature;
    children: React.ReactNode;
    mode?: "block" | "inline";
    /** Contenu custom à afficher en fallback. Override le paywall par défaut. */
    fallback?: React.ReactNode;
    /** Titre affiché sur le paywall par défaut (sinon dérivé du label). */
    title?: string;
    /** Description affichée sur le paywall par défaut. */
    description?: string;
};

export function FeatureGate({ feature, children, mode = "block", fallback, title, description }: Props) {
    const { allowed, minPlan, featureLabel, isLoading } = usePlanFeature(feature);

    if (isLoading) {
        if (mode === "inline") return <Skeleton className="h-9 w-32" />;
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-72 mt-2" />
                </CardHeader>
            </Card>
        );
    }

    if (allowed) return <>{children}</>;

    if (fallback !== undefined) return <>{fallback}</>;

    if (mode === "inline") {
        return (
            <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/billing" className="gap-2">
                    <Lock className="h-4 w-4" />
                    Plan {minPlan} requis
                </Link>
            </Button>
        );
    }

    return (
        <Card className="border-dashed">
            <CardHeader className="items-center text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="mt-2">
                    {title ?? `${featureLabel} — Plan ${minPlan} requis`}
                </CardTitle>
                <CardDescription className="max-w-md">
                    {description ??
                        `Cette fonctionnalité est réservée au plan ${minPlan} ou supérieur. Mettez à niveau votre abonnement pour y accéder.`}
                </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
                <Button asChild>
                    <Link href="/dashboard/billing">Voir les plans</Link>
                </Button>
            </CardContent>
        </Card>
    );
}
