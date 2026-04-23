"use client";

import Link from "next/link";
import { Clock, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTrialStatus } from "@/hooks/usePlans";
import { cn } from "@/lib/utils";

type TrialBannerProps = {
    variant?: "sidebar" | "page";
    className?: string;
};

/**
 * Bandeau récapitulatif du statut d'essai.
 *
 * - Essai actif : affiche le compte à rebours (jours restants) + rappel "toutes features déverrouillées"
 * - Essai expiré + plan non choisi : affiche un message bloquant + CTA vers /dashboard/billing
 * - Plan sélectionné : n'affiche rien
 */
export function TrialBanner({ variant = "page", className }: TrialBannerProps) {
    const { isTrialing, trialDaysLeft, hasSelectedPlan, isLoading } = useTrialStatus();

    if (isLoading) return null;

    // Cas 1 : plan sélectionné → on n'affiche pas de bandeau (sauf si trial actif
    // avec plan = on reste discret, déjà géré au niveau des badges features).
    if (hasSelectedPlan) return null;

    // Cas 2 : essai actif sans plan choisi
    if (isTrialing) {
        return (
            <div
                data-testid="trial-banner"
                data-trial-state="active"
                className={cn(
                    "flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-900 dark:border-amber-900 dark:bg-amber-950/60 dark:text-amber-200",
                    variant === "sidebar" && "text-xs",
                    className,
                )}
            >
                <div className="flex-1">
                    <div className="font-semibold">
                        Essai actif · {trialDaysLeft} j restant{trialDaysLeft > 1 ? "s" : ""}
                    </div>
                    <p className={cn("opacity-80", variant === "sidebar" ? "text-[11px]" : "text-sm")}>
                        Toutes les fonctionnalités sont déverrouillées. Choisissez un plan avant la fin
                        de l'essai pour éviter le verrouillage.
                    </p>
                    <Button asChild size="sm" variant="outline" className="mt-2 h-7 border-amber-300 bg-white/60 text-amber-900 hover:bg-white dark:bg-amber-900/40 dark:text-amber-100">
                        <Link href="/dashboard/billing">Choisir un plan</Link>
                    </Button>
                </div>
            </div>
        );
    }

    // Cas 3 : essai expiré et pas de plan choisi → lock global
    return (
        <div
            data-testid="trial-banner"
            data-trial-state="expired"
            className={cn(
                "flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-rose-900 dark:border-rose-900 dark:bg-rose-950/60 dark:text-rose-200",
                variant === "sidebar" && "text-xs",
                className,
            )}
        >
            <Lock className={cn("mt-0.5 shrink-0", variant === "sidebar" ? "h-4 w-4" : "h-5 w-5")} />
            <div className="flex-1">
                <div className="font-semibold">Période d'essai terminée</div>
                <p className={cn("opacity-80", variant === "sidebar" ? "text-[11px]" : "text-sm")}>
                    Toutes les fonctionnalités sont verrouillées tant qu'aucun plan n'est sélectionné.
                </p>
                <Button asChild size="sm" className="mt-2 h-7">
                    <Link href="/dashboard/billing">Choisir un plan</Link>
                </Button>
            </div>
        </div>
    );
}

/**
 * Variante inline qui affiche simplement un texte "N j restants".
 * Utile dans la sidebar à côté du plan actuel.
 */
export function TrialCountdownPill({ className }: { className?: string }) {
    const { isTrialing, trialDaysLeft, isLoading } = useTrialStatus();
    if (isLoading || !isTrialing) return null;
    return (
        <span
            data-testid="trial-countdown"
            className={cn(
                "inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-700",
                className,
            )}
        >
            <Clock className="h-3 w-3" />
            Essai · {trialDaysLeft} j
        </span>
    );
}
