'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
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
    },
    BUSINESS: {
        icon: Store,
        gradient: 'from-[#166534] to-[#0d9488]',
    },
    PRO: {
        icon: Building2,
        gradient: 'from-[#15803d] to-[#10b981]',
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

            <div className="grid gap-5 lg:gap-6 md:grid-cols-3">
                {displayPlans.map((plan, index) => {
                    const Icon = plan.icon;
                    const isSelected = selectedPlan === plan.key;
                    const price = billingInterval === 'month'
                        ? plan.priceMonthly
                        : plan.priceYearlyMonthly;

                    return (
                        <motion.button
                            key={plan.key}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.25, delay: index * 0.06, ease: [0.32, 0.72, 0, 1] }}
                            onClick={() => setSelectedPlan(plan.key)}
                            disabled={isLoading}
                            className={cn(
                                'relative flex flex-col rounded-2xl border p-6 lg:p-7 text-left transition-all duration-200 bg-white',
                                isSelected
                                    ? 'border-green-500 ring-4 ring-green-100 shadow-sm'
                                    : 'border-gray-200 hover:border-green-200 hover:bg-green-50/30 hover:shadow-sm',
                            )}
                        >
                            {plan.popular && (
                                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#14532d] to-[#059669] px-3.5 py-1 text-[11px] font-bold text-white shadow-sm shadow-green-900/20">
                                    Recommandé
                                </span>
                            )}

                            <div className="flex items-center gap-3 mb-5">
                                <div className={cn(
                                    'flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br shadow-sm shadow-green-900/20',
                                    plan.gradient
                                )}>
                                    <Icon className="h-6 w-6 text-white" />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-base font-semibold text-gray-900">{plan.name}</h3>
                                    <p className="text-xs text-gray-500 truncate">{plan.description}</p>
                                </div>
                            </div>

                            <div className="mb-5">
                                <span className="text-3xl font-bold text-gray-900 tracking-tight">
                                    {new Intl.NumberFormat('fr-FR').format(price)}
                                </span>
                                <span className="text-sm text-gray-500 ml-1">F CFA</span>
                                <div className="text-xs text-gray-500 mt-0.5">par mois</div>
                            </div>

                            <ul className="space-y-2.5 flex-1">
                                {plan.features.map((feature, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                                        <Check className="h-4 w-4 shrink-0 text-green-600 mt-0.5" strokeWidth={2.5} />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            {isSelected && (
                                <div className="mt-5 flex items-center justify-center gap-1.5 rounded-lg bg-green-50 border border-green-100 py-2 text-sm font-semibold text-green-700">
                                    <Check className="h-4 w-4" strokeWidth={2.5} />
                                    Sélectionné
                                </div>
                            )}
                        </motion.button>
                    );
                })}
            </div>

            <Button
                onClick={() => handleSelectPlan(selectedPlan)}
                disabled={isLoading}
                size="lg"
                className="w-full h-12 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-xl shadow-sm hover:shadow-md transition-all group"
            >
                {isLoading ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                    <>
                        Continuer avec {displayPlans.find(p => p.key === selectedPlan)?.name}
                        <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-0.5 transition-transform" />
                    </>
                )}
            </Button>

            <button
                onClick={() => handleSelectPlan('FREE')}
                disabled={isLoading}
                className="w-full text-center text-sm text-gray-500 hover:text-gray-900 transition-colors py-1"
            >
                Continuer gratuitement avec le plan Free
            </button>
        </div>
    );
}
