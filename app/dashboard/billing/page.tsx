'use client'

import { useAction, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
    Check,
    CreditCard,
    Zap,
    AlertCircle,
    Plus,
    History,
    Crown,
    Loader2,
    ExternalLink,
    Wallet,
    ArrowUpRight,
    ArrowRightLeft,
    Sparkles,
    Shield,
    Building2,
    Store,
    Receipt,
    Gift,
    RotateCcw,
    Settings2,
    BarChart3,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { PLANS as PLAN_DEFS, PLAN_LIMITS, formatLimit, type PlanKey } from "@/lib/plans";
import { Progress } from "@/components/ui/progress";
import { RechargeDialog } from "./_components/recharge-dialog";

// ============================================
// PLAN CONFIG
// ============================================

const PLAN_CONFIG = {
    STARTER: {
        icon: Zap,
        gradient: 'from-[#14532d] to-[#059669]',
        accent: 'border-emerald-200',
        badgeClass: 'bg-emerald-50 text-emerald-700',
    },
    BUSINESS: {
        icon: Store,
        gradient: 'from-[#166534] to-[#0d9488]',
        accent: 'border-teal-200',
        badgeClass: 'bg-teal-50 text-teal-700',
    },
    PRO: {
        icon: Building2,
        gradient: 'from-[#15803d] to-[#10b981]',
        accent: 'border-green-200',
        badgeClass: 'bg-green-50 text-green-700',
    },
} as const;

const PLANS = PLAN_DEFS.map((p) => {
    const config = PLAN_CONFIG[p.key as keyof typeof PLAN_CONFIG];
    return {
        key: p.key as "STARTER" | "BUSINESS" | "PRO",
        name: p.name,
        description: p.description,
        priceMonthly: new Intl.NumberFormat('fr-FR').format(p.pricing.monthlyFCFA),
        priceYearly: new Intl.NumberFormat('fr-FR').format(p.pricing.yearlyFCFA),
        priceYearlyMonthly: new Intl.NumberFormat('fr-FR').format(p.pricing.yearlyMonthlyFCFA),
        popular: p.popular,
        features: [
            `${formatLimit(p.limits.agents)} agent${p.limits.agents > 1 ? 's' : ''}`,
            `${formatLimit(p.limits.whatsappChannels)} numéro${p.limits.whatsappChannels > 1 ? 's' : ''} WhatsApp`,
            `${formatLimit(p.limits.conversationsPerMonth)} conversations/mois`,
            ...p.features.filter(f => f.included).slice(0, 2).map(f => f.label),
            `Support ${p.supportLevel.toLowerCase()}`,
        ],
        ...config,
    };
});

// ============================================
// LOADING SKELETON
// ============================================

function BillingSkeleton() {
    return (
        <div className="space-y-6">
            <div>
                <Skeleton className="h-7 w-48 mb-2" />
                <Skeleton className="h-4 w-72" />
            </div>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                    <Card key={i} className="bg-white border-gray-100 shadow-sm">
                        <CardContent className="p-5">
                            <Skeleton className="h-11 w-11 rounded-full mb-4" />
                            <Skeleton className="h-3 w-20 mb-2" />
                            <Skeleton className="h-7 w-32 mb-1" />
                            <Skeleton className="h-2.5 w-28" />
                        </CardContent>
                    </Card>
                ))}
            </div>
            <Skeleton className="h-[400px] w-full rounded-lg" />
        </div>
    )
}

// ============================================
// TRANSACTION TYPE CONFIG
// ============================================

const TX_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string }> = {
    RECHARGE: { icon: Plus, color: "text-green-600 bg-green-50", label: "Recharge" },
    USAGE: { icon: ArrowRightLeft, color: "text-gray-600 bg-gray-50", label: "Utilisation" },
    BONUS: { icon: Gift, color: "text-purple-600 bg-purple-50", label: "Bonus" },
    REFUND: { icon: RotateCcw, color: "text-blue-600 bg-blue-50", label: "Remboursement" },
    ADJUSTMENT: { icon: Settings2, color: "text-orange-600 bg-orange-50", label: "Ajustement" },
};

// ============================================
// MAIN PAGE
// ============================================

export default function BillingPage() {
    const role = useQuery(api.users.currentUserRole);
    const creditBalance = useQuery(api.credits.getBalance);
    const transactions = useQuery(api.credits.getTransactions, { limit: 10 });
    const { currentOrg } = useCurrentOrg();
    const usageStats = useQuery(api.billing.getUsageStats, currentOrg?._id ? { organizationId: currentOrg._id } : "skip");

    const createCheckout = useAction(api.stripe_actions.createCheckoutSession);
    const createPortal = useAction(api.stripe_actions.createPortalSession);

    const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
    const [loadingPortal, setLoadingPortal] = useState(false);
    const [billingInterval, setBillingInterval] = useState<"month" | "year">("month");
    const [rechargeOpen, setRechargeOpen] = useState(false);

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

    if (role === undefined || creditBalance === undefined) {
        return <BillingSkeleton />;
    }

    if (role === 'AGENT') {
        return (
            <div className="p-6">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Acc&egrave;s refus&eacute;</AlertTitle>
                    <AlertDescription>
                        Vous n&apos;avez pas les autorisations n&eacute;cessaires pour acc&eacute;der &agrave; cette page.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('fr-SN', { style: 'currency', currency: 'XOF' }).format(amount);
    };

    const currentPlan = (currentOrg?.plan || "FREE") as PlanKey;
    const hasStripeSubscription = !!currentOrg?.stripe?.subscriptionId;
    const stripeStatus = currentOrg?.stripe?.status;

    // Usage calculation
    const planLimits = PLAN_LIMITS[currentPlan];
    const conversationUsage = usageStats?.serviceConversationsCount ?? 0;
    const conversationLimit = planLimits.conversationsPerMonth;
    const usagePercent = conversationLimit === Infinity ? 0 : Math.min(100, Math.round((conversationUsage / conversationLimit) * 100));

    return (
        <div className="space-y-6">
            {/* ==================== HEADER ==================== */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                        Facturation
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        G&eacute;rez vos cr&eacute;dits marketing et votre abonnement.
                    </p>
                </div>
                {hasStripeSubscription && (
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1.5 text-xs rounded-full cursor-pointer font-medium"
                        onClick={handleManageSubscription}
                        disabled={loadingPortal}
                    >
                        {loadingPortal ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                            <ExternalLink className="h-3.5 w-3.5" />
                        )}
                        G&eacute;rer l&apos;abonnement
                    </Button>
                )}
            </div>

            {/* ==================== OVERVIEW CARDS ==================== */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {/* Solde Marketing */}
                <Card className="bg-white border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4 sm:p-5">
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-gradient-to-br from-[#14532d] to-[#059669] flex items-center justify-center shadow-lg shadow-green-900/20">
                                <Wallet className="h-[18px] w-[18px] sm:h-5 sm:w-5 text-white" />
                            </div>
                            <Badge variant="secondary" className="text-[10px] bg-green-50 text-green-700 font-medium">
                                Pay-As-You-Go
                            </Badge>
                        </div>
                        <p className="text-xs sm:text-sm font-medium text-gray-500 mb-0.5">Solde Marketing</p>
                        <span className="text-xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                            {formatCurrency(creditBalance || 0)}
                        </span>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                            ~ {Math.floor((creditBalance || 0) / 60)} messages marketing estim&eacute;s
                        </p>
                        <Button
                            size="sm"
                            className="w-full mt-4 h-8 gap-1.5 text-xs bg-gradient-to-r from-[#14532d] to-[#059669] hover:from-[#14532d]/90 hover:to-[#059669]/90 cursor-pointer"
                            onClick={() => setRechargeOpen(true)}
                        >
                            <Plus className="h-3.5 w-3.5" />
                            Recharger
                        </Button>
                        <RechargeDialog open={rechargeOpen} onOpenChange={setRechargeOpen} />
                    </CardContent>
                </Card>

                {/* Abonnement */}
                <Card className="bg-white border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4 sm:p-5">
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-gradient-to-br from-[#166534] to-[#0d9488] flex items-center justify-center shadow-lg shadow-green-900/20">
                                <Shield className="h-[18px] w-[18px] sm:h-5 sm:w-5 text-white" />
                            </div>
                            <Badge variant="secondary" className={cn("text-[10px] font-medium", {
                                'bg-gray-100 text-gray-600': currentPlan === 'FREE',
                                'bg-emerald-50 text-emerald-700': currentPlan === 'STARTER',
                                'bg-teal-50 text-teal-700': currentPlan === 'BUSINESS',
                                'bg-green-50 text-green-700': currentPlan === 'PRO',
                                'bg-amber-50 text-amber-700': currentPlan === 'ENTERPRISE',
                            })}>
                                {currentPlan === 'FREE' ? 'Gratuit' : currentPlan}
                            </Badge>
                        </div>
                        <p className="text-xs sm:text-sm font-medium text-gray-500 mb-0.5">Abonnement</p>
                        {currentPlan === 'FREE' ? (
                            <>
                                <span className="text-xl sm:text-3xl font-bold text-gray-900 tracking-tight">Gratuit</span>
                                <p className="text-[11px] text-gray-400 mt-0.5">Passez &agrave; un plan payant pour d&eacute;bloquer plus</p>
                            </>
                        ) : (
                            <>
                                <span className="text-xl sm:text-3xl font-bold text-gray-900 tracking-tight">{currentPlan}</span>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <div className={cn("h-1.5 w-1.5 rounded-full", {
                                        'bg-green-500': stripeStatus === 'active' || stripeStatus === 'trialing',
                                        'bg-yellow-500': stripeStatus === 'past_due',
                                        'bg-red-500': stripeStatus === 'canceled',
                                        'bg-gray-400': !stripeStatus,
                                    })} />
                                    <span className="text-[11px] text-gray-400">
                                        {stripeStatus === 'active' && 'Actif'}
                                        {stripeStatus === 'trialing' && 'Essai gratuit'}
                                        {stripeStatus === 'past_due' && 'Paiement en retard'}
                                        {stripeStatus === 'canceled' && 'Annulé'}
                                        {!stripeStatus && 'Actif'}
                                    </span>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Usage du mois */}
                <Card className="bg-white border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4 sm:p-5">
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-gradient-to-br from-[#15803d] to-[#10b981] flex items-center justify-center shadow-lg shadow-green-900/20">
                                <BarChart3 className="h-[18px] w-[18px] sm:h-5 sm:w-5 text-white" />
                            </div>
                            {conversationLimit !== Infinity && (
                                <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", {
                                    'text-green-700 bg-green-50': usagePercent < 75,
                                    'text-yellow-700 bg-yellow-50': usagePercent >= 75 && usagePercent < 90,
                                    'text-red-700 bg-red-50': usagePercent >= 90,
                                })}>
                                    {usagePercent}%
                                </span>
                            )}
                        </div>
                        <p className="text-xs sm:text-sm font-medium text-gray-500 mb-0.5">Usage du mois</p>
                        <span className="text-xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                            {conversationLimit === Infinity
                                ? conversationUsage.toLocaleString('fr-FR')
                                : `${conversationUsage.toLocaleString('fr-FR')} / ${formatLimit(conversationLimit)}`
                            }
                        </span>
                        <p className="text-[11px] text-gray-400 mt-0.5">Conversations de service</p>
                        {conversationLimit !== Infinity && (
                            <div className="mt-3">
                                <Progress
                                    value={usagePercent}
                                    className={cn("h-1.5", {
                                        '[&>[data-slot=progress-indicator]]:bg-green-500': usagePercent < 75,
                                        '[&>[data-slot=progress-indicator]]:bg-yellow-500': usagePercent >= 75 && usagePercent < 90,
                                        '[&>[data-slot=progress-indicator]]:bg-red-500': usagePercent >= 90,
                                    })}
                                />
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* ==================== PLANS ==================== */}
            {(currentPlan === 'FREE' || !hasStripeSubscription) && (
                <Card className="bg-white border-gray-100 shadow-sm">
                    <CardHeader className="pb-2">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div>
                                <CardTitle className="text-sm sm:text-base font-semibold text-gray-900">
                                    Choisir un plan
                                </CardTitle>
                                <p className="text-[11px] text-gray-400 mt-0.5">7 jours d&apos;essai gratuit sur tous les plans</p>
                            </div>
                            <div className="flex items-center gap-1 bg-gray-100 rounded-full p-1">
                                <button
                                    onClick={() => setBillingInterval("month")}
                                    className={cn(
                                        "px-3 py-1.5 text-xs font-medium rounded-full transition-colors cursor-pointer",
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
                                        "px-3 py-1.5 text-xs font-medium rounded-full transition-colors cursor-pointer",
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
                    </CardHeader>
                    <CardContent className="pt-2 pb-6">
                        <div className="grid gap-4 md:grid-cols-3">
                            {PLANS.map((plan) => {
                                const displayPrice = billingInterval === "month" ? plan.priceMonthly : plan.priceYearlyMonthly;
                                const totalYearly = plan.priceYearly;
                                const Icon = plan.icon;
                                const isCurrentPlan = currentPlan === plan.key;

                                return (
                                    <div
                                        key={plan.key}
                                        className={cn(
                                            "relative rounded-xl border p-5 transition-all hover:shadow-md",
                                            plan.popular
                                                ? "border-green-300 ring-2 ring-green-500/10 bg-green-50/30"
                                                : "border-gray-100 bg-white hover:border-gray-200",
                                        )}
                                    >
                                        {plan.popular && (
                                            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                                                <span className="flex items-center gap-1 text-[10px] font-bold text-white bg-gradient-to-r from-[#14532d] to-[#059669] px-3 py-0.5 rounded-full shadow-sm">
                                                    <Sparkles className="h-3 w-3" />
                                                    Recommand&eacute;
                                                </span>
                                            </div>
                                        )}

                                        {/* Plan Header */}
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className={cn("h-10 w-10 rounded-full bg-gradient-to-br flex items-center justify-center shadow-sm", plan.gradient)}>
                                                <Icon className="h-[18px] w-[18px] text-white" />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-semibold text-gray-900">{plan.name}</h3>
                                                <p className="text-[11px] text-gray-400">{plan.description}</p>
                                            </div>
                                        </div>

                                        {/* Price */}
                                        <div className="mb-4">
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">{displayPrice}</span>
                                                <span className="text-xs text-gray-400">F CFA /mois</span>
                                            </div>
                                            {billingInterval === "year" && (
                                                <p className="text-[11px] text-green-600 font-medium mt-0.5">
                                                    {totalYearly} F CFA /an (2 mois offerts)
                                                </p>
                                            )}
                                        </div>

                                        {/* Features */}
                                        <ul className="space-y-2 mb-5">
                                            {plan.features.map((feature) => (
                                                <li key={feature} className="flex items-start gap-2 text-xs text-gray-600">
                                                    <Check className="h-3.5 w-3.5 text-green-600 shrink-0 mt-0.5" />
                                                    {feature}
                                                </li>
                                            ))}
                                        </ul>

                                        {/* CTA */}
                                        <Button
                                            className={cn(
                                                "w-full h-9 text-xs font-medium cursor-pointer",
                                                plan.popular
                                                    ? "bg-gradient-to-r from-[#14532d] to-[#059669] hover:from-[#14532d]/90 hover:to-[#059669]/90"
                                                    : "bg-gray-900 hover:bg-gray-800"
                                            )}
                                            onClick={() => handleUpgrade(plan.key)}
                                            disabled={loadingPlan !== null || isCurrentPlan}
                                        >
                                            {loadingPlan === plan.key ? (
                                                <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Redirection...</>
                                            ) : isCurrentPlan ? (
                                                'Plan actuel'
                                            ) : (
                                                <><ArrowUpRight className="mr-1.5 h-3.5 w-3.5" /> Commencer l&apos;essai</>
                                            )}
                                        </Button>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* ==================== SUBSCRIPTION DETAILS (active subscribers) ==================== */}
            {hasStripeSubscription && currentPlan !== 'FREE' && (
                <Card className="bg-white border-gray-100 shadow-sm">
                    <CardContent className="p-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#14532d] to-[#059669] flex items-center justify-center shadow-lg shadow-green-900/20">
                                    <Crown className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-gray-900">
                                        Plan {currentPlan}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className={cn("inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full", {
                                            'bg-green-50 text-green-700': stripeStatus === 'active' || stripeStatus === 'trialing',
                                            'bg-yellow-50 text-yellow-700': stripeStatus === 'past_due',
                                            'bg-red-50 text-red-700': stripeStatus === 'canceled',
                                        })}>
                                            <span className={cn("h-1.5 w-1.5 rounded-full", {
                                                'bg-green-500': stripeStatus === 'active' || stripeStatus === 'trialing',
                                                'bg-yellow-500': stripeStatus === 'past_due',
                                                'bg-red-500': stripeStatus === 'canceled',
                                            })} />
                                            {stripeStatus === 'active' && 'Actif'}
                                            {stripeStatus === 'trialing' && 'Essai gratuit'}
                                            {stripeStatus === 'past_due' && 'Paiement en retard'}
                                            {stripeStatus === 'canceled' && 'Annulé'}
                                        </span>
                                        {currentOrg?.stripe?.currentPeriodEnd && (
                                            <span className="text-[11px] text-gray-400">
                                                · Renouvellement le {new Date(currentOrg.stripe.currentPeriodEnd * 1000).toLocaleDateString('fr-FR', {
                                                    day: 'numeric', month: 'long', year: 'numeric'
                                                })}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Plan limits overview */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-gray-100">
                            <div className="text-center p-3 rounded-lg bg-gray-50/80">
                                <p className="text-lg font-bold text-gray-900">{formatLimit(planLimits.agents)}</p>
                                <p className="text-[11px] text-gray-500 font-medium">Agents</p>
                            </div>
                            <div className="text-center p-3 rounded-lg bg-gray-50/80">
                                <p className="text-lg font-bold text-gray-900">{formatLimit(planLimits.whatsappChannels)}</p>
                                <p className="text-[11px] text-gray-500 font-medium">Numéros WhatsApp</p>
                            </div>
                            <div className="text-center p-3 rounded-lg bg-gray-50/80">
                                <p className="text-lg font-bold text-gray-900">{formatLimit(planLimits.conversationsPerMonth)}</p>
                                <p className="text-[11px] text-gray-500 font-medium">Conversations/mois</p>
                            </div>
                            <div className="text-center p-3 rounded-lg bg-gray-50/80">
                                <p className="text-lg font-bold text-gray-900">{formatLimit(planLimits.templates)}</p>
                                <p className="text-[11px] text-gray-500 font-medium">Modèles</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* ==================== TRANSACTIONS ==================== */}
            <Card className="bg-white border-gray-100 shadow-sm">
                <CardHeader className="pb-2">
                    <div>
                        <CardTitle className="text-sm sm:text-base font-semibold text-gray-900">
                            Historique des transactions
                        </CardTitle>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                            Vos recharges et consommations de cr&eacute;dits
                        </p>
                    </div>
                </CardHeader>
                <CardContent className="px-0 sm:px-6 pt-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-gray-100">
                                    <TableHead className="text-xs font-medium text-gray-500">Date</TableHead>
                                    <TableHead className="text-xs font-medium text-gray-500">Description</TableHead>
                                    <TableHead className="text-xs font-medium text-gray-500">Type</TableHead>
                                    <TableHead className="text-right text-xs font-medium text-gray-500">Montant</TableHead>
                                    <TableHead className="text-right hidden sm:table-cell text-xs font-medium text-gray-500">Solde Apr&egrave;s</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {!transactions || transactions.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-12">
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="h-10 w-10 rounded-full bg-gray-50 flex items-center justify-center">
                                                    <Receipt className="h-5 w-5 text-gray-300" />
                                                </div>
                                                <p className="text-sm font-medium text-gray-400">Aucune transaction</p>
                                                <p className="text-xs text-gray-300">Vos transactions appara&icirc;tront ici.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    transactions.map((tx) => {
                                        const txConfig = TX_CONFIG[tx.type] || TX_CONFIG.ADJUSTMENT;
                                        const TxIcon = txConfig.icon;
                                        return (
                                            <TableRow key={tx._id} className="border-gray-50 hover:bg-gray-50/50 transition-colors">
                                                <TableCell className="text-xs text-gray-500">
                                                    {new Date(tx.createdAt).toLocaleDateString('fr-SN', {
                                                        day: '2-digit', month: 'short', year: 'numeric',
                                                    })}
                                                    <span className="block text-[10px] text-gray-300">
                                                        {new Date(tx.createdAt).toLocaleTimeString('fr-SN', {
                                                            hour: '2-digit', minute: '2-digit',
                                                        })}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-sm text-gray-900 font-medium">
                                                    {tx.description || '-'}
                                                </TableCell>
                                                <TableCell>
                                                    <span className={cn("inline-flex items-center gap-1.5 text-[10px] font-medium px-2 py-1 rounded-full", txConfig.color)}>
                                                        <TxIcon className="h-3 w-3" />
                                                        {txConfig.label}
                                                    </span>
                                                </TableCell>
                                                <TableCell className={cn("text-right text-sm font-semibold tabular-nums", {
                                                    'text-green-600': tx.amount > 0,
                                                    'text-gray-900': tx.amount <= 0,
                                                })}>
                                                    {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                                                </TableCell>
                                                <TableCell className="text-right hidden sm:table-cell text-xs text-gray-400 tabular-nums">
                                                    {formatCurrency(tx.balanceAfter)}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
