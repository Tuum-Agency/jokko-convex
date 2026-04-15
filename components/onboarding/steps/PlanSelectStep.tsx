'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Check, Zap, Store, Building2, ArrowRight } from 'lucide-react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { usePlans } from '@/hooks/usePlans';
import { formatLimit } from '@/lib/plan-utils';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface PlanSelectStepProps {
    onComplete: () => void;
}

const PLAN_CONFIG = {
    STARTER: {
        icon: Zap,
        gradient: 'from-[#14532d] to-[#059669]',
        ring: 'ring-emerald-500/10 border-emerald-300',
    },
    BUSINESS: {
        icon: Store,
        gradient: 'from-[#166534] to-[#0d9488]',
        ring: 'ring-teal-500/10 border-teal-300',
    },
    PRO: {
        icon: Building2,
        gradient: 'from-[#15803d] to-[#10b981]',
        ring: 'ring-green-500/10 border-green-300',
    },
} as const;

type PlanKey = keyof typeof PLAN_CONFIG;

export function PlanSelectStep({ onComplete }: PlanSelectStepProps) {
    const [selectedPlan, setSelectedPlan] = useState<string>('BUSINESS');
    const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');
    const [isLoading, setIsLoading] = useState(false);

    const { plans: planDefs, isLoading: plansLoading } = usePlans();
    const updateOrgPlan = useMutation(api.organizations.updateOrgPlan);

    const displayPlans = planDefs
        .filter((p) => PLAN_CONFIG[p.key as PlanKey])
        .map((p) => {
            const config = PLAN_CONFIG[p.key as PlanKey];
            return {
                key: p.key as PlanKey,
                name: p.name,
                description: p.description,
                priceMonthly: p.monthlyPriceFCFA,
                priceYearlyMonthly: p.yearlyMonthlyPriceFCFA,
                popular: p.popular,
                features: [
                    `${formatLimit(p.maxAgents)} agent${p.maxAgents > 1 ? 's' : ''}`,
                    `${formatLimit(p.maxWhatsappChannels)} canal${p.maxWhatsappChannels > 1 ? 'aux' : ''} WhatsApp`,
                    `${formatLimit(p.maxConversationsPerMonth)} conversations/mois`,
                    ...p.features.filter((f: any) => f.included).slice(0, 2).map((f: any) => f.label),
                ],
                ...config,
            };
        });

    const handleSelectPlan = async (planKey: string) => {
        setIsLoading(true);
        try {
            await updateOrgPlan({ plan: planKey as any });
            if (planKey !== 'FREE') {
                sessionStorage.setItem('jokko_billing_interval', billingInterval);
            }
            onComplete();
        } catch (error) {
            console.error('Failed to update plan:', error);
            setIsLoading(false);
        }
    };

    if (plansLoading) {
        return (
            <div className="space-y-6">
                <div className="flex justify-center">
                    <Skeleton className="h-10 w-48 rounded-full" />
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-80 rounded-xl" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Billing interval toggle */}
            <div className="flex justify-center">
                <div className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 p-1">
                    <button
                        onClick={() => setBillingInterval('month')}
                        className={cn(
                            'rounded-full px-4 py-1.5 text-sm font-medium transition-all',
                            billingInterval === 'month'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                        )}
                    >
                        Mensuel
                    </button>
                    <button
                        onClick={() => setBillingInterval('year')}
                        className={cn(
                            'rounded-full px-4 py-1.5 text-sm font-medium transition-all',
                            billingInterval === 'year'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                        )}
                    >
                        Annuel
                        <span className="ml-1.5 text-[10px] font-bold text-green-600">-20%</span>
                    </button>
                </div>
            </div>

            {/* Plan cards */}
            <div className="grid gap-4 md:grid-cols-3">
                {displayPlans.map((plan) => {
                    const Icon = plan.icon;
                    const isSelected = selectedPlan === plan.key;
                    const price = billingInterval === 'month'
                        ? plan.priceMonthly
                        : plan.priceYearlyMonthly;

                    return (
                        <button
                            key={plan.key}
                            onClick={() => setSelectedPlan(plan.key)}
                            disabled={isLoading}
                            className={cn(
                                'relative flex flex-col rounded-xl border-2 p-5 text-left transition-all duration-200',
                                isSelected
                                    ? `ring-4 ${plan.ring} shadow-lg`
                                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md',
                                plan.popular && !isSelected && 'border-gray-300'
                            )}
                        >
                            {/* Popular badge */}
                            {plan.popular && (
                                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#14532d] to-[#059669] px-3 py-0.5 text-[10px] font-bold text-white shadow-sm">
                                    Recommandé
                                </span>
                            )}

                            {/* Icon + Name */}
                            <div className="flex items-center gap-3 mb-3">
                                <div className={cn(
                                    'flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br shadow-lg',
                                    plan.gradient
                                )}>
                                    <Icon className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">{plan.name}</h3>
                                    <p className="text-[11px] text-gray-500">{plan.description}</p>
                                </div>
                            </div>

                            {/* Price */}
                            <div className="mb-4">
                                <span className="text-2xl font-bold text-gray-900">
                                    {new Intl.NumberFormat('fr-FR').format(price)}
                                </span>
                                <span className="text-sm text-gray-500 ml-1">F CFA/mois</span>
                            </div>

                            {/* Features */}
                            <ul className="space-y-2 flex-1">
                                {plan.features.map((feature, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                                        <Check className="h-4 w-4 shrink-0 text-green-600 mt-0.5" />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            {/* Selection indicator */}
                            {isSelected && (
                                <div className="mt-4 flex items-center justify-center gap-1.5 rounded-lg bg-green-50 py-2 text-sm font-medium text-green-700">
                                    <Check className="h-4 w-4" />
                                    Sélectionné
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* CTA */}
            <Button
                onClick={() => handleSelectPlan(selectedPlan)}
                disabled={isLoading}
                size="lg"
                className="w-full h-12 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-xl shadow-lg shadow-green-600/25 hover:shadow-green-600/40 transition-all duration-300 group"
            >
                {isLoading ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                    <>
                        Continuer avec {displayPlans.find(p => p.key === selectedPlan)?.name}
                        <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </>
                )}
            </Button>

            {/* Free option */}
            <button
                onClick={() => handleSelectPlan('FREE')}
                disabled={isLoading}
                className="w-full text-center text-sm text-gray-500 hover:text-gray-700 transition-colors py-2"
            >
                Continuer gratuitement avec le plan Free
            </button>
        </div>
    );
}
