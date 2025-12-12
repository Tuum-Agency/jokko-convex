import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Eyebrow } from '@/components/ui/eyebrow'
import { FadeInView, StaggerContainer, StaggerItem, ScaleInView } from '@/components/animations'
import { Check, DollarSign, Zap, Briefcase, Building, User } from 'lucide-react'
import Link from 'next/link'

const plans = [
    {
        name: 'Starter',
        price: '25 000',
        period: 'mois',
        description: 'Pour solopreneurs. L\'essentiel pour démarrer.',
        icon: User,
        color: 'bg-green-100 text-green-600',
        features: [
            'Votre numéro Business connecté',
            '1 Agent (Vous)',
            'Réception illimitée (Gratuit)',
            'Pas de marketing de masse',
            'Support par email'
        ],
        cta: "Commencer l'essai",
        popular: false
    },
    {
        name: 'Business',
        price: '65 000',
        period: 'mois',
        description: 'Pour PME. Automatisez votre activité.',
        icon: Briefcase,
        color: 'bg-blue-100 text-blue-600',
        features: [
            '5 Agents inclus',
            'Chatbot (Répondeur auto)',
            'Outil de campagnes illimité',
            'Étiquettes clients',
            'Paiement WhatsApp au réel',
        ],
        cta: "Choisir Business",
        popular: true
    },
    {
        name: 'Pro',
        price: '150 000',
        period: 'mois',
        description: 'Pour les Leaders. Aucune limite logicielle.',
        icon: Building,
        color: 'bg-purple-100 text-purple-600',
        features: [
            'Agents Illimités',
            'Automatisation IA avancée',
            'Marketing illimité (selon votre budget Meta)',
            'API & Intégrations',
            'Support Prioritaire (WhatsApp)'
        ],
        cta: "Choisir Pro",
        popular: false
    }
]

export function PricingSection() {
    return (
        <section id="pricing" className="py-24 bg-gray-50/50">
            <div className="max-w-7xl mx-auto px-4">
                {/* Header */}
                <div className="text-center mb-16">
                    <FadeInView>
                        <Eyebrow
                            text="Tarifs Tout Inclus"
                            icon={<DollarSign className="w-3 h-3" />}
                            className="mb-4"
                        />
                    </FadeInView>
                    <FadeInView delay={0.2}>
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            Simple. Transparent. Sans surprise.
                        </h2>
                    </FadeInView>
                    <FadeInView delay={0.4}>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            Louez la technologie Jokko (Dashboard, IA, Chatbot).
                            Gérez votre budget publicitaire WhatsApp directement avec Meta.
                            <br />
                            <span className="text-green-600 font-semibold">100% Transparent. 100% Rentable.</span>
                        </p>
                    </FadeInView>
                </div>

                {/* Pricing Cards */}
                <StaggerContainer staggerDelay={0.15} delayChildren={0.6}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {plans.map((plan) => (
                            <StaggerItem key={plan.name}>
                                <ScaleInView>
                                    <Card className={`h-full flex flex-col hover:shadow-xl transition-all duration-300 border-2 ${plan.popular ? 'border-green-500 shadow-md relative' : 'border-transparent hover:border-gray-200'}`}>

                                        {plan.popular && (
                                            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                                                Recommandé
                                            </div>
                                        )}

                                        <CardHeader>
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${plan.color}`}>
                                                <plan.icon className="w-6 h-6" />
                                            </div>
                                            <CardTitle className="text-2xl">{plan.name}</CardTitle>
                                            <CardDescription className="mt-2 text-base">{plan.description}</CardDescription>
                                        </CardHeader>

                                        <CardContent className="flex-1">
                                            <div className="mb-6">
                                                <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                                                <span className="text-gray-500 font-medium text-lg"> FCFA</span>
                                                <span className="text-gray-400">/{plan.period}</span>
                                            </div>

                                            <div className="space-y-4">
                                                {plan.features.map((feature, i) => (
                                                    <div key={i} className="flex items-start gap-3">
                                                        <div className="p-0.5 bg-green-100 rounded-full mt-0.5 shrink-0">
                                                            <Check className="w-3 h-3 text-green-600" />
                                                        </div>
                                                        <span className="text-sm text-gray-600 leading-relaxed">{feature}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>

                                        <CardFooter>
                                            <Button
                                                className={`w-full h-11 text-base font-medium ${plan.popular ? 'bg-green-600 hover:bg-green-700 shadow-lg shadow-green-200' : 'bg-gray-900 hover:bg-gray-800'}`}
                                                variant={plan.popular ? 'default' : 'secondary'}
                                                asChild
                                            >
                                                <Link href="/auth/sign-up">{plan.cta}</Link>
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                </ScaleInView>
                            </StaggerItem>
                        ))}
                    </div>
                </StaggerContainer>

                {/* Enterprise Contact */}
                <FadeInView delay={0.8} className="mt-16 text-center">
                    <p className="text-gray-600">
                        Besoin d'une offre Grand Compte (Enterprise) ?{' '}
                        <Link href="/contact" className="text-green-600 font-semibold hover:underline">
                            Contactez notre équipe commerciale
                        </Link>
                    </p>
                </FadeInView>
            </div>
        </section>
    )
}
