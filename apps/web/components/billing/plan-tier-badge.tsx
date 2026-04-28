"use client";

import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useFeatureAccess } from "@/hooks/usePlans";
import type { FeatureKey } from "@jokko/core/planFeatures";
import { cn } from "@/lib/utils";

type PlanTierBadgeProps = {
    feature: FeatureKey;
    className?: string;
    compact?: boolean;
};

/**
 * Affiche un badge indiquant l'état d'accès d'une feature :
 * - "Inclus" (vert) si incluse dans le plan actif
 * - "Essai · <Plan>" (ambre) si débloquée uniquement grâce au trial
 * - "<Plan> requis" (gris) si verrouillée
 *
 * Tooltip détaille la raison et le plan requis.
 */
export function PlanTierBadge({ feature, className, compact = false }: PlanTierBadgeProps) {
    const access = useFeatureAccess(feature);
    if (access.isLoading) return null;

    let label: string;
    let tooltip: string;
    let colorClass: string;

    if (access.includedInPlan) {
        label = compact ? access.requiredPlanLabel : `Inclus · ${access.requiredPlanLabel}`;
        tooltip = `${access.label} est incluse dans votre plan ${access.requiredPlanLabel}.`;
        colorClass = "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300";
    } else if (access.isTrialUnlock) {
        label = compact ? "Essai" : `Essai · ${access.requiredPlanLabel}`;
        tooltip = `Débloquée pendant votre essai. À la fin de la période d'essai, passez au plan ${access.requiredPlanLabel} pour continuer à utiliser « ${access.label} ».`;
        colorClass = "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300";
    } else {
        label = compact ? access.requiredPlanLabel : `${access.requiredPlanLabel} requis`;
        tooltip = `« ${access.label} » est réservée au plan ${access.requiredPlanLabel}. Passez au plan supérieur pour la débloquer.`;
        colorClass = "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400";
    }

    return (
        <TooltipProvider delayDuration={150}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Badge
                        variant="outline"
                        className={cn(
                            "text-[11px] font-medium uppercase tracking-wide",
                            colorClass,
                            className,
                        )}
                    >
                        {label}
                    </Badge>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-xs">{tooltip}</TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
