'use client'

import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Check, CreditCard, Zap, AlertCircle, Plus, History, Crown, Loader2, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { toast } from "sonner";
import { useCurrentOrg } from "@/hooks/use-current-org";
import { cn } from "@/lib/utils";

const PLANS = [
    {
        key: "STARTER" as const,
        name: "Starter",
        priceMonthly: "10 000",
        priceYearly: "96 000",
        priceYearlyMonthly: "8 000",
        features: ["3 agents", "1 000 conversations/mois", "Support par email"],
        color: "border-blue-200 bg-blue-50/30",
        badge: "bg-blue-100 text-blue-700",
        btnColor: "bg-blue-600 hover:bg-blue-700",
    },
    {
        key: "BUSINESS" as const,
        name: "Business",
        priceMonthly: "30 000",
        priceYearly: "288 000",
        priceYearlyMonthly: "24 000",
        popular: true,
        features: ["10 agents", "5 000 conversations/mois", "Automatisation", "Support prioritaire"],
        color: "border-purple-200 bg-purple-50/30",
        badge: "bg-purple-100 text-purple-700",
        btnColor: "bg-purple-600 hover:bg-purple-700",
    },
    {
        key: "PRO" as const,
        name: "Pro",
        priceMonthly: "70 000",
        priceYearly: "672 000",
        priceYearlyMonthly: "56 000",
        features: ["Agents illimités", "Conversations illimitées", "IA avancée", "Support dédié"],
        color: "border-orange-200 bg-orange-50/30",
        badge: "bg-orange-100 text-orange-700",
        btnColor: "bg-orange-600 hover:bg-orange-700",
    },
];

export default function BillingPage() {
    const role = useQuery(api.users.currentUserRole);
    const creditBalance = useQuery(api.credits.getBalance);
    const transactions = useQuery(api.credits.getTransactions, { limit: 10 });
    const { currentOrg } = useCurrentOrg();

    const addCredits = useMutation(api.credits.debugAddCredits);
    const createCheckout = useAction(api.stripe_actions.createCheckoutSession);
    const createPortal = useAction(api.stripe_actions.createPortalSession);

    const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
    const [loadingPortal, setLoadingPortal] = useState(false);
    const [billingInterval, setBillingInterval] = useState<"month" | "year">("month");

    const handleUpgrade = async (planKey: "STARTER" | "BUSINESS" | "PRO") => {
        setLoadingPlan(planKey);
        try {
            const { url } = await createCheckout({ planKey, interval: billingInterval });
            window.location.href = url;
        } catch (error: any) {
            toast.error("Erreur", { description: error.message || "Impossible de créer la session de paiement." });
            setLoadingPlan(null);
        }
    };

    const handleManageSubscription = async () => {
        setLoadingPortal(true);
        try {
            const { url } = await createPortal();
            window.location.href = url;
        } catch (error: any) {
            toast.error("Erreur", { description: error.message || "Impossible d'accéder au portail." });
            setLoadingPortal(false);
        }
    };

    const handleRecharge = () => {
        addCredits({ amount: 5000 }).then(() => {
            toast.success("5 000 FCFA ajoutés (Simulation)");
        }).catch(() => {
            toast.error("Erreur lors de la recharge");
        });
    };

    if (role === undefined || creditBalance === undefined) {
        return (
            <div className="space-y-6 max-w-5xl mx-auto pb-10 mt-10">
                <Skeleton className="h-12 w-48" />
                <Skeleton className="h-64 w-full" />
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

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('fr-SN', { style: 'currency', currency: 'XOF' }).format(amount);
    };

    const currentPlan = currentOrg?.plan || "FREE";
    const hasStripeSubscription = !!currentOrg?.stripe?.subscriptionId;
    const stripeStatus = currentOrg?.stripe?.status;

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-10">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Portefeuille & Facturation</h1>
                <p className="text-gray-500 mt-2">
                    Gérez vos crédits marketing et votre abonnement.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Crédits Marketing */}
                <Card className="border-green-100 bg-gradient-to-br from-white to-green-50/50">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Solde Marketing</CardTitle>
                            <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
                                Pay-As-You-Go
                            </Badge>
                        </div>
                        <CardDescription>
                            Utilisé pour les campagnes (Broadcasts) et l'IA avancée.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-baseline space-x-2">
                            <span className="text-4xl font-bold tracking-tight text-gray-900">
                                {formatCurrency(creditBalance || 0)}
                            </span>
                        </div>
                        <p className="text-sm text-gray-500">
                            ~ {Math.floor((creditBalance || 0) / 60)} messages marketing estimés
                        </p>
                    </CardContent>
                    <CardFooter className="gap-2">
                        <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={handleRecharge}>
                            <Plus className="mr-2 h-4 w-4" />
                            Recharger (Simuler)
                        </Button>
                    </CardFooter>
                </Card>

                {/* Abonnement actuel */}
                <Card className={cn(
                    currentPlan === 'FREE' ? 'border-gray-200' : 'border-green-200 bg-gradient-to-br from-white to-green-50/30'
                )}>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Abonnement</CardTitle>
                            <Badge variant="secondary" className={cn("text-xs", {
                                'bg-gray-100 text-gray-600': currentPlan === 'FREE',
                                'bg-blue-100 text-blue-700': currentPlan === 'STARTER',
                                'bg-purple-100 text-purple-700': currentPlan === 'BUSINESS',
                                'bg-orange-100 text-orange-700': currentPlan === 'PRO',
                                'bg-amber-100 text-amber-700': currentPlan === 'ENTERPRISE',
                            })}>
                                {currentPlan === 'FREE' ? 'Gratuit' : currentPlan}
                            </Badge>
                        </div>
                        <CardDescription>
                            {currentPlan === 'FREE'
                                ? 'Passez à un plan payant pour débloquer toutes les fonctionnalités.'
                                : 'Votre abonnement est actif.'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {currentPlan === 'FREE' ? (
                            <div className="text-center py-4">
                                <Crown className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                                <p className="text-sm text-gray-500">Aucun abonnement actif</p>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center gap-2">
                                    <div className={cn("h-2 w-2 rounded-full", {
                                        'bg-green-500': stripeStatus === 'active' || stripeStatus === 'trialing',
                                        'bg-yellow-500': stripeStatus === 'past_due',
                                        'bg-red-500': stripeStatus === 'canceled',
                                        'bg-gray-400': !stripeStatus,
                                    })} />
                                    <span className="text-sm text-gray-600">
                                        {stripeStatus === 'active' && 'Actif'}
                                        {stripeStatus === 'trialing' && 'Essai gratuit'}
                                        {stripeStatus === 'past_due' && 'Paiement en retard'}
                                        {stripeStatus === 'canceled' && 'Annulé'}
                                        {!stripeStatus && 'Actif'}
                                    </span>
                                </div>
                                {currentOrg?.stripe?.currentPeriodEnd && (
                                    <p className="text-xs text-gray-500">
                                        Prochain renouvellement : {new Date(currentOrg.stripe.currentPeriodEnd * 1000).toLocaleDateString('fr-FR', {
                                            day: 'numeric', month: 'long', year: 'numeric'
                                        })}
                                    </p>
                                )}
                            </>
                        )}
                    </CardContent>
                    {hasStripeSubscription && (
                        <CardFooter>
                            <Button
                                variant="outline"
                                className="w-full gap-2"
                                onClick={handleManageSubscription}
                                disabled={loadingPortal}
                            >
                                {loadingPortal ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <ExternalLink className="h-4 w-4" />
                                )}
                                Gérer l'abonnement
                            </Button>
                        </CardFooter>
                    )}
                </Card>
            </div>

            {/* Plans upgrade (shown only for FREE or lower plans) */}
            {(currentPlan === 'FREE' || !hasStripeSubscription) && (
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-gray-900">Choisir un plan</h2>
                        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                            <button
                                onClick={() => setBillingInterval("month")}
                                className={cn(
                                    "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                                    billingInterval === "month"
                                        ? "bg-white text-gray-900 shadow-sm"
                                        : "text-gray-500 hover:text-gray-700"
                                )}
                            >
                                Mensuel
                            </button>
                            <button
                                onClick={() => setBillingInterval("year")}
                                className={cn(
                                    "px-3 py-1.5 text-sm font-medium rounded-md transition-colors relative",
                                    billingInterval === "year"
                                        ? "bg-white text-gray-900 shadow-sm"
                                        : "text-gray-500 hover:text-gray-700"
                                )}
                            >
                                Annuel
                                <span className="ml-1.5 text-[10px] font-bold text-green-600">-20%</span>
                            </button>
                        </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                        {PLANS.map((plan) => {
                            const displayPrice = billingInterval === "month" ? plan.priceMonthly : plan.priceYearlyMonthly;
                            const totalYearly = plan.priceYearly;
                            return (
                                <Card key={plan.key} className={cn("relative transition-shadow hover:shadow-md", plan.color)}>
                                    {plan.popular && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                            <Badge className="bg-purple-600 text-white shadow-sm">Recommandé</Badge>
                                        </div>
                                    )}
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-lg">{plan.name}</CardTitle>
                                        <div className="flex items-baseline gap-1 mt-1">
                                            <span className="text-3xl font-bold text-gray-900">{displayPrice}</span>
                                            <span className="text-sm text-gray-500">F CFA /mois</span>
                                        </div>
                                        {billingInterval === "year" && (
                                            <p className="text-xs text-green-600 font-medium">
                                                {totalYearly} F CFA /an (2 mois offerts)
                                            </p>
                                        )}
                                    </CardHeader>
                                    <CardContent className="pb-3">
                                        <ul className="space-y-2">
                                            {plan.features.map((feature) => (
                                                <li key={feature} className="flex items-center text-sm text-gray-600">
                                                    <Check className="mr-2 h-4 w-4 text-green-600 shrink-0" />
                                                    {feature}
                                                </li>
                                            ))}
                                        </ul>
                                        <p className="text-xs text-gray-400 mt-3">7 jours d'essai gratuit</p>
                                    </CardContent>
                                    <CardFooter>
                                        <Button
                                            className={cn("w-full", plan.btnColor)}
                                            onClick={() => handleUpgrade(plan.key)}
                                            disabled={loadingPlan !== null || currentPlan === plan.key}
                                        >
                                            {loadingPlan === plan.key ? (
                                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Redirection...</>
                                            ) : currentPlan === plan.key ? (
                                                'Plan actuel'
                                            ) : (
                                                <><Zap className="mr-2 h-4 w-4" /> Commencer l'essai</>
                                            )}
                                        </Button>
                                    </CardFooter>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Historique des transactions */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <History className="w-5 h-5 text-gray-500" />
                        Historique des transactions
                    </CardTitle>
                    <CardDescription>Vos recharges et consommations de crédits.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead className="text-right">Montant</TableHead>
                                <TableHead className="text-right">Solde Après</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {!transactions || transactions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                                        Aucune transaction récente.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                transactions.map((tx) => (
                                    <TableRow key={tx._id}>
                                        <TableCell>
                                            {new Date(tx.createdAt).toLocaleDateString('fr-SN', {
                                                day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                                            })}
                                        </TableCell>
                                        <TableCell>{tx.description || '-'}</TableCell>
                                        <TableCell>
                                            <Badge variant={
                                                tx.type === 'RECHARGE' || tx.type === 'BONUS' ? 'default' :
                                                    tx.type === 'USAGE' ? 'secondary' : 'outline'
                                            } className={
                                                tx.type === 'RECHARGE' ? 'bg-green-100 text-green-700 hover:bg-green-200' :
                                                    tx.type === 'USAGE' ? 'bg-gray-100 text-gray-700' : ''
                                            }>
                                                {tx.type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className={`text-right font-medium ${tx.amount > 0 ? 'text-green-600' : 'text-gray-900'}`}>
                                            {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                                        </TableCell>
                                        <TableCell className="text-right text-gray-500">
                                            {formatCurrency(tx.balanceAfter)}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
