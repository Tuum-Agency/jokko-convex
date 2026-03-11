"use client";

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Eyebrow } from '@/components/ui/eyebrow'
import { FadeInView, StaggerContainer, StaggerItem, ScaleInView } from '@/components/animations'
import { Check, DollarSign, Zap, Store, Building2, ShieldCheck, HelpCircle, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { PLANS as PLAN_DEFS, formatLimit } from '@/lib/plans'

const PLAN_UI = {
    STARTER: { icon: Zap, gradient: 'from-slate-50 to-white', border: 'border-slate-200', text: 'text-slate-900', buttonVariant: 'outline' as const, cta: "Démarrer" },
    BUSINESS: { icon: Store, gradient: 'from-green-50 to-emerald-100/40', border: 'border-green-500 ring-4 ring-green-500/10 shadow-2xl', text: 'text-green-800', buttonVariant: 'default' as const, cta: "Choisir Business" },
    PRO: { icon: Building2, gradient: 'from-purple-50 to-indigo-50/50', border: 'border-purple-200', text: 'text-purple-900', buttonVariant: 'secondary' as const, cta: "Passer Pro" },
} as const;

const plans = PLAN_DEFS.map((p) => {
    const ui = PLAN_UI[p.key as keyof typeof PLAN_UI];
    return {
        name: p.name,
        price: new Intl.NumberFormat('fr-FR').format(p.pricing.monthlyFCFA),
        period: 'mois',
        description: p.description,
        icon: ui.icon,
        gradient: ui.gradient,
        border: ui.border,
        text: ui.text,
        buttonVariant: ui.buttonVariant,
        features: [
            `${formatLimit(p.limits.agents)} Agent${p.limits.agents > 1 ? 's' : ''} ${p.limits.agents === 1 ? '(Vous uniquement)' : 'inclus'}`,
            `${formatLimit(p.limits.whatsappChannels)} Numéro${p.limits.whatsappChannels > 1 ? 's' : ''} WhatsApp`,
            `${formatLimit(p.limits.conversationsPerMonth)} conversations/mois`,
            ...p.features.filter(f => f.included).map(f => f.label),
            `Support ${p.supportLevel}`,
        ],
        limits: p.features.filter(f => !f.included).map(f => `Pas de ${f.label.replace(/^Pas de /, '')}`),
        cta: ui.cta,
        popular: p.popular || false,
    };
});

export function PricingSection() {
    return (
        <section id="pricing" className="py-24 relative overflow-hidden bg-slate-50">
            {/* Background Decoration */}
            <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-slate-300 to-transparent"></div>
            <div className="absolute top-[10%] left-[-10%] w-[500px] h-[500px] bg-green-200/20 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute bottom-[10%] right-[-10%] w-[500px] h-[500px] bg-purple-200/20 rounded-full blur-[100px] pointer-events-none"></div>


            <div className="max-w-7xl mx-auto px-6 relative z-10">
                {/* Header */}
                <div className="text-center mb-20 max-w-3xl mx-auto">
                    <FadeInView>
                        <Eyebrow
                            text="Tarification Simple"
                            icon={<DollarSign className="w-3 h-3" />}
                            className="bg-white border-slate-200 shadow-sm"
                        />
                    </FadeInView>
                    <FadeInView delay={0.2} className="mt-6">
                        <h2 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight leading-tight">
                            Investissez dans votre <br />
                            <span className="text-transparent bg-clip-text bg-linear-to-r from-green-600 to-teal-600">
                                Machine à Vendre
                            </span>
                        </h2>
                    </FadeInView>
                    <FadeInView delay={0.4}>
                        <p className="mt-6 text-xl text-slate-600 max-w-2xl mx-auto">
                            Rejoignez les entreprises innovantes qui préparent leur succès sur WhatsApp avec Jokko.
                            <br />
                            <span className="text-sm text-slate-500 mt-2 block">(Prix hors coûts de conversation Meta)</span>
                        </p>
                    </FadeInView>

                    <FadeInView delay={0.5}>
                        <div className="mt-8 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 border border-green-100 text-green-700 font-medium text-sm animate-pulse">
                            <Sparkles className="w-4 h-4" />
                            7 jours d'essai offerts sur tous les plans
                        </div>
                    </FadeInView>
                </div>

                {/* Pricing Cards */}
                <StaggerContainer staggerDelay={0.1} delayChildren={0.4}>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                        {plans.map((plan, index) => (
                            <StaggerItem key={plan.name} className={plan.popular ? 'lg:-mt-4' : ''}>
                                <div className={`relative group h-full ${plan.popular ? 'lg:scale-105 z-10' : 'z-0'}`}>
                                    <Card className={`h-full flex flex-col bg-linear-to-b ${plan.gradient} ${plan.border} transition-all duration-500 hover:shadow-2xl relative overflow-hidden`}>
                                        {/* Hover Effect */}
                                        <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-40 transition-opacity duration-500 pointer-events-none"></div>

                                        <CardHeader className="pb-8 pt-8 px-8 relative z-10">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-white shadow-sm border border-slate-100 ${plan.popular ? 'text-green-600' : 'text-slate-600'}`}>
                                                    <plan.icon className="w-7 h-7" />
                                                </div>
                                                {plan.popular && (
                                                    <Badge className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 text-xs uppercase tracking-widest shadow-lg shadow-green-200 border-none">
                                                        Recommandé
                                                    </Badge>
                                                )}
                                            </div>
                                            <CardTitle className="text-2xl font-bold text-slate-900">{plan.name}</CardTitle>
                                            <p className="text-slate-600 mt-2 text-sm font-medium">{plan.description}</p>
                                        </CardHeader>

                                        <CardContent className="px-8 flex-1 relative z-10">
                                            <div className="flex items-end mb-8">
                                                <span className={`text-5xl font-extrabold tracking-tight ${plan.text}`}>
                                                    {plan.price}
                                                </span>
                                                <span className="text-slate-500 font-medium ml-2 mb-1">F CFA /mois</span>
                                            </div>

                                            <div className="space-y-4 mb-8">
                                                {/* Included Features */}
                                                {plan.features.map((feature, i) => (
                                                    <div key={i} className="flex items-start gap-3">
                                                        <div className={`mt-0.5 p-0.5 rounded-full shrink-0 ${plan.popular ? 'bg-green-100' : 'bg-slate-100'}`}>
                                                            <Check className={`w-3.5 h-3.5 ${plan.popular ? 'text-green-600' : 'text-slate-600'}`} />
                                                        </div>
                                                        <span className="text-sm text-slate-700 font-medium">{feature}</span>
                                                    </div>
                                                ))}

                                                {/* Excluded/Limited Features (Grayed out) */}
                                                {plan.limits.map((limit, i) => (
                                                    <div key={i} className="flex items-start gap-3 opacity-50">
                                                        <div className="mt-0.5 p-0.5 rounded-full shrink-0 bg-slate-50">
                                                            <div className="w-3.5 h-3.5" />
                                                        </div>
                                                        <span className="text-sm text-slate-500 line-through decoration-slate-300">{limit}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>

                                        <CardFooter className="px-8 pb-8 pt-0 relative z-10 mt-auto">
                                            {/* Action buttons hidden until public launch
                                            <Button
                                                className={`w-full h-12 text-base rounded-xl transition-all duration-300 ${plan.popular
                                                    ? 'bg-green-600 hover:bg-green-700 shadow-green-200/50 shadow-xl hover:shadow-2xl hover:-translate-y-0.5 text-white'
                                                    : plan.buttonVariant === 'secondary'
                                                        ? 'bg-slate-800 hover:bg-slate-900 text-white shadow-lg'
                                                        : 'bg-white hover:bg-slate-50 text-slate-900 border-2 border-slate-200 hover:border-slate-300'
                                                    }`}
                                                asChild
                                            >
                                                <Link href="/auth/sign-up">{plan.cta}</Link>
                                            </Button>
                                            */}
                                        </CardFooter>
                                    </Card>
                                </div>
                            </StaggerItem>
                        ))}
                    </div>
                </StaggerContainer>

                {/* Enterprise Section */}
                <FadeInView delay={0.6} className="mt-20">
                    <div className="bg-slate-900 rounded-3xl p-8 md:p-12 relative overflow-hidden">
                        {/* Background Gradients */}
                        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/20 rounded-full blur-[80px]"></div>
                        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-green-500/10 rounded-full blur-[80px]"></div>

                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
                            <div className="max-w-xl">
                                <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
                                    Besoin d'une offre Enterprise ?
                                </h3>
                                <p className="text-slate-300 text-lg leading-relaxed">
                                    Pour les grandes organisations nécessitant une sécurité renforcée, des SLAs garantis et un accompagnement sur-mesure.
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 mt-8">
                                    <div className="flex items-center gap-2 text-slate-300 text-sm font-medium">
                                        <Check className="w-4 h-4 text-green-500" />
                                        <span>Agents & Utilisateurs Illimités</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-300 text-sm font-medium">
                                        <Check className="w-4 h-4 text-green-500" />
                                        <span>Multi-numéros WhatsApp</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-300 text-sm font-medium">
                                        <Check className="w-4 h-4 text-green-500" />
                                        <span>Templates Illimités</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-300 text-sm font-medium">
                                        <Check className="w-4 h-4 text-green-500" />
                                        <span>SSO & Sécurité Avancée</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-300 text-sm font-medium">
                                        <Check className="w-4 h-4 text-green-500" />
                                        <span>Onboarding & Account Manager</span>
                                    </div>
                                </div>
                            </div>
                            {/*
                            <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100 h-14 px-8 rounded-full text-lg shadow-xl shrink-0">
                                Contactez-nous
                            </Button>
                            */}
                        </div>
                    </div>
                </FadeInView>
            </div>
        </section>
    )
}
