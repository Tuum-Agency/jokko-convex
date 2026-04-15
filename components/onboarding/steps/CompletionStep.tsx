'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    CheckCircle,
    MessageSquare,
    Users,
    FileText,
    Workflow,
    ArrowRight,
    Loader2,
    Sparkles,
    CreditCard,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCurrentOrg } from '@/hooks/use-current-org';
import { usePlanLimits } from '@/hooks/usePlans';
import { useMutation, useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { cn } from '@/lib/utils';

interface CompletionStepProps {
    onComplete: () => void;
}

const QUICK_ACTIONS = [
    {
        title: 'Envoyer un message',
        description: 'Démarrez une conversation WhatsApp',
        href: '/dashboard/conversations',
        icon: MessageSquare,
        gradient: 'from-[#14532d] to-[#059669]',
    },
    {
        title: 'Inviter l\'équipe',
        description: 'Ajoutez des agents à votre espace',
        href: '/dashboard/team',
        icon: Users,
        gradient: 'from-[#166534] to-[#0d9488]',
    },
    {
        title: 'Créer un modèle',
        description: 'Préparez vos messages WhatsApp',
        href: '/dashboard/modeles',
        icon: FileText,
        gradient: 'from-[#15803d] to-[#10b981]',
    },
    {
        title: 'Explorer les flux',
        description: 'Automatisez vos réponses',
        href: '/dashboard/flows',
        icon: Workflow,
        gradient: 'from-[#14532d] to-[#34d399]',
    },
];

export function CompletionStep({ onComplete }: CompletionStepProps) {
    const router = useRouter();
    const { currentOrg } = useCurrentOrg();
    const { currentPlan } = usePlanLimits();
    const completeOnboarding = useMutation(api.users.completeOnboarding);
    const createCheckout = useAction(api.stripe_actions.createCheckoutSession);
    const [checkoutLoading, setCheckoutLoading] = useState(false);

    // Safety net: ensure onboarding is marked complete
    useEffect(() => {
        completeOnboarding().catch(() => {});
    }, [completeOnboarding]);

    const isPaidPlan = currentOrg?.plan && currentOrg.plan !== 'FREE';
    const billingInterval = (typeof window !== 'undefined'
        ? sessionStorage.getItem('jokko_billing_interval')
        : null) as 'month' | 'year' | null;

    const handleActivateSubscription = async () => {
        if (!currentOrg?.plan) return;
        setCheckoutLoading(true);
        try {
            const { url } = await createCheckout({
                planKey: currentOrg.plan,
                interval: billingInterval || 'month',
            });
            if (url) {
                window.location.href = url;
            }
        } catch (error) {
            console.error('Checkout failed:', error);
            setCheckoutLoading(false);
        }
    };

    return (
        <div className="space-y-8 py-2">
            {/* Success header */}
            <div className="text-center space-y-3">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">
                    {currentOrg?.name ? `${currentOrg.name} est prêt !` : 'Tout est prêt !'}
                </h2>
                <p className="text-gray-500 text-sm max-w-md mx-auto">
                    Votre espace Jokko est configuré. Voici comment commencer.
                </p>
            </div>

            {/* Plan badge */}
            {currentPlan && (
                <div className="flex justify-center">
                    <div className={cn(
                        'inline-flex items-center gap-2 rounded-full px-4 py-2 border text-sm font-medium',
                        isPaidPlan
                            ? 'bg-green-50 border-green-200 text-green-700'
                            : 'bg-gray-50 border-gray-200 text-gray-600'
                    )}>
                        <Sparkles className="h-4 w-4" />
                        Plan {currentPlan.name}
                        {isPaidPlan && currentPlan.monthlyPriceFCFA > 0 && (
                            <span className="text-xs opacity-75">
                                — {new Intl.NumberFormat('fr-FR').format(
                                    billingInterval === 'year'
                                        ? currentPlan.yearlyMonthlyPriceFCFA
                                        : currentPlan.monthlyPriceFCFA
                                )} F CFA/mois
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Stripe CTA for paid plans */}
            {isPaidPlan && !currentOrg?.stripe?.status && (
                <div className="rounded-xl border border-green-200 bg-green-50/50 p-4 text-center space-y-3">
                    <p className="text-sm text-green-800">
                        Activez votre abonnement pour débloquer toutes les fonctionnalités du plan <strong>{currentPlan?.name}</strong>.
                    </p>
                    <Button
                        onClick={handleActivateSubscription}
                        disabled={checkoutLoading}
                        className="bg-gradient-to-r from-[#14532d] to-[#059669] hover:from-[#0f4024] hover:to-[#047857] text-white rounded-xl shadow-lg"
                    >
                        {checkoutLoading ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <CreditCard className="h-4 w-4 mr-2" />
                        )}
                        Activer l&apos;abonnement
                    </Button>
                    <p className="text-[11px] text-gray-500">
                        Vous pouvez aussi activer plus tard depuis Facturation.
                    </p>
                </div>
            )}

            {/* Quick actions grid */}
            <div className="grid grid-cols-2 gap-3">
                {QUICK_ACTIONS.map((action) => {
                    const Icon = action.icon;
                    return (
                        <button
                            key={action.href}
                            onClick={() => router.push(action.href)}
                            className="group flex flex-col items-center gap-2 rounded-xl border border-gray-200 bg-white p-4 text-center hover:border-green-200 hover:shadow-md transition-all duration-200"
                        >
                            <div className={cn(
                                'flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br shadow-md group-hover:scale-110 transition-transform',
                                action.gradient
                            )}>
                                <Icon className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-sm font-medium text-gray-900">{action.title}</span>
                            <span className="text-[11px] text-gray-500 leading-tight">{action.description}</span>
                        </button>
                    );
                })}
            </div>

            {/* Go to dashboard */}
            <Button
                onClick={() => router.push('/dashboard')}
                size="lg"
                className="w-full h-12 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-xl shadow-lg shadow-green-600/25 hover:shadow-green-600/40 transition-all duration-300 group"
            >
                Accéder au dashboard
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
        </div>
    );
}
