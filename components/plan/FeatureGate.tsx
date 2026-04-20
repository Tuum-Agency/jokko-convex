/**
 * Verrou UI par plan : wrappe du contenu et le masque si le plan de l'org
 * ne débloque pas la feature. Affiche un paywall avec CTA vers /dashboard/billing.
 *
 * Design aligné avec le dashboard Jokko :
 *   - Dégradé emerald de marque `from-[#14532d] to-[#059669]`
 *   - Card blanche `border-gray-100 shadow-sm` + pill buttons `rounded-full`
 *   - Hiérarchie typo gray-900 / gray-500 / gray-400
 *
 * Usage :
 *   <FeatureGate feature="flows">
 *     <AutomationBuilder />
 *   </FeatureGate>
 *
 * Mode inline (petit badge dans une toolbar) :
 *   <FeatureGate feature="flows" mode="inline">
 *     <Button>Créer un flow</Button>
 *   </FeatureGate>
 */

"use client";

import Link from "next/link";
import { CheckCircle2, Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { usePlanFeature } from "@/hooks/use-plan-feature";
import type { PlanFeature, PlanKey } from "@/lib/planFeatures";

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

const PLAN_LABELS: Record<PlanKey, string> = {
    FREE: "Gratuit",
    STARTER: "Starter",
    BUSINESS: "Business",
    PRO: "Pro",
    ENTERPRISE: "Enterprise",
};

const FEATURE_BENEFITS: Record<PlanFeature, string[]> = {
    flows: [
        "Automatisez vos réponses WhatsApp avec des scénarios visuels",
        "Qualifiez et routez les conversations sans intervention humaine",
        "Intégrez IA, webhooks et actions conditionnelles",
    ],
    broadcasts: [
        "Envoyez des campagnes marketing à des milliers de contacts",
        "Ciblage par segments et planification avancée",
        "Suivi des taux de délivrance, lecture et conversion",
    ],
    segments: [
        "Regroupez vos contacts par critères dynamiques",
        "Lancez des campagnes ultra-ciblées",
        "Mettez à jour les segments en temps réel",
    ],
    webhooks: [
        "Connectez Jokko à vos outils internes",
        "Recevez les événements conversationnels en temps réel",
        "Déclenchez des actions depuis vos systèmes",
    ],
    integrations_crm: [
        "Synchronisez contacts et événements avec votre CRM",
        "HubSpot, Pipedrive, Salesforce, Axonaut et plus",
        "Centralisez l'historique client sans double saisie",
    ],
    ai: [
        "Générez des automatisations à partir d'une description",
        "Suggestions IA pour réponses et templates",
        "Accélérez la création de scénarios complexes",
    ],
    analytics_advanced: [
        "Tableaux de bord détaillés par campagne, agent, segment",
        "Exports CSV et rapports programmés",
        "Suivi des KPIs clés en temps réel",
    ],
};

export function FeatureGate({ feature, children, mode = "block", fallback, title, description }: Props) {
    const { allowed, minPlan, featureLabel, isLoading } = usePlanFeature(feature);

    if (isLoading) {
        if (mode === "inline") return <Skeleton className="h-8 w-32 rounded-full" />;
        return (
            <Card className="bg-white border-gray-100 shadow-sm max-w-xl mx-auto">
                <CardContent className="p-6 sm:p-8 flex flex-col items-center gap-4">
                    <Skeleton className="h-14 w-14 rounded-full" />
                    <Skeleton className="h-5 w-32 rounded-full" />
                    <Skeleton className="h-6 w-64" />
                    <Skeleton className="h-4 w-80" />
                    <div className="w-full max-w-sm space-y-2 mt-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-5/6" />
                        <Skeleton className="h-4 w-4/6" />
                    </div>
                    <div className="flex gap-2 mt-2">
                        <Skeleton className="h-9 w-40 rounded-full" />
                        <Skeleton className="h-9 w-32 rounded-full" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (allowed) return <>{children}</>;

    if (fallback !== undefined) return <>{fallback}</>;

    const planLabel = PLAN_LABELS[minPlan];

    if (mode === "inline") {
        return (
            <Button
                asChild
                size="sm"
                className="h-8 rounded-full text-xs font-medium gap-1.5 px-3 text-white shadow-sm cursor-pointer bg-gradient-to-r from-[#14532d] to-[#059669] hover:from-[#14532d] hover:to-[#047857]"
            >
                <Link href="/dashboard/billing">
                    <Lock className="h-3.5 w-3.5" />
                    Plan {planLabel}
                </Link>
            </Button>
        );
    }

    const benefits = FEATURE_BENEFITS[feature] ?? [];

    return (
        <Card className="bg-white border-gray-100 shadow-sm max-w-xl mx-auto relative overflow-hidden">
            <div
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#14532d] via-[#059669] to-[#10b981]"
            />
            <CardContent className="p-6 sm:p-8 text-center">
                <div
                    aria-hidden="true"
                    className="mx-auto h-14 w-14 rounded-full bg-gradient-to-br from-[#14532d] to-[#059669] flex items-center justify-center shadow-lg shadow-green-900/20 mb-5"
                >
                    <Lock className="h-6 w-6 text-white" />
                </div>

                <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-700 mb-3">
                    <Sparkles className="h-3 w-3" />
                    Plan {planLabel} requis
                </div>

                <h3 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight mb-1.5">
                    {title ?? `Débloquez ${featureLabel}`}
                </h3>
                <p className="text-sm text-gray-500 max-w-md mx-auto">
                    {description ??
                        `Cette fonctionnalité est incluse dans le plan ${planLabel} et supérieurs.`}
                </p>

                {benefits.length > 0 && (
                    <ul className="mt-6 space-y-2.5 text-left max-w-sm mx-auto">
                        {benefits.map((b) => (
                            <li key={b} className="flex items-start gap-2.5 text-sm text-gray-700">
                                <CheckCircle2
                                    className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5"
                                    aria-hidden="true"
                                />
                                <span>{b}</span>
                            </li>
                        ))}
                    </ul>
                )}

                <div className="mt-7 flex flex-col sm:flex-row gap-2 justify-center">
                    <Button
                        asChild
                        className="h-9 rounded-full text-xs font-medium shadow-sm text-white cursor-pointer bg-gradient-to-r from-[#14532d] to-[#059669] hover:from-[#14532d] hover:to-[#047857] px-5"
                    >
                        <Link href="/dashboard/billing">Passer au plan {planLabel}</Link>
                    </Button>
                    <Button
                        asChild
                        variant="outline"
                        className="h-9 rounded-full text-xs cursor-pointer"
                    >
                        <Link href="/dashboard/billing">Comparer les plans</Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
