import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Eyebrow } from '@/components/ui/eyebrow'
import { FadeInView, StaggerContainer, StaggerItem, ScaleInView } from '@/components/animations'
import { Check, DollarSign } from 'lucide-react'
import Link from 'next/link'

export function PricingSection() {
    return (
        <section id="pricing" className="py-24 bg-gray-50/50">
            <div className="max-w-6xl mx-auto px-4">
                {/* Header */}
                <div className="text-center mb-16">
                    <FadeInView>
                        <Eyebrow
                            text="Tarifs"
                            icon={<DollarSign className="w-3 h-3" />}
                            className="mb-4"
                        />
                    </FadeInView>
                    <FadeInView delay={0.2}>
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            Plans simples et transparents
                        </h2>
                    </FadeInView>
                    <FadeInView delay={0.4}>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            Choisissez le plan qui correspond à vos besoins. Aucun frais caché.
                        </p>
                    </FadeInView>
                </div>

                {/* Pricing Cards */}
                <StaggerContainer staggerDelay={0.15} delayChildren={0.6}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {['Starter', 'Pro', 'Enterprise'].map((plan) => (
                            <StaggerItem key={plan}>
                                <ScaleInView>
                                    <Card className="h-full flex flex-col hover:shadow-lg transition-shadow duration-300">
                                        <CardHeader>
                                            <CardTitle>{plan}</CardTitle>
                                            <CardDescription>Pour gérer votre activité WhatsApp</CardDescription>
                                        </CardHeader>
                                        <CardContent className="flex-1">
                                            <ul className="space-y-3">
                                                <li className="flex items-center gap-2">
                                                    <div className="p-1 bg-green-100 rounded-full">
                                                        <Check className="w-3 h-3 text-green-600" />
                                                    </div>
                                                    <span className="text-sm text-gray-600">Messages illimités</span>
                                                </li>
                                                <li className="flex items-center gap-2">
                                                    <div className="p-1 bg-green-100 rounded-full">
                                                        <Check className="w-3 h-3 text-green-600" />
                                                    </div>
                                                    <span className="text-sm text-gray-600">Support prioritaire</span>
                                                </li>
                                                <li className="flex items-center gap-2">
                                                    <div className="p-1 bg-green-100 rounded-full">
                                                        <Check className="w-3 h-3 text-green-600" />
                                                    </div>
                                                    <span className="text-sm text-gray-600">Tableau de bord analytics</span>
                                                </li>
                                            </ul>
                                        </CardContent>
                                        <CardFooter>
                                            <Button className="w-full bg-green-600 hover:bg-green-700" asChild>
                                                <Link href="/auth/sign-up">Commencer l&apos;essai</Link>
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                </ScaleInView>
                            </StaggerItem>
                        ))}
                    </div>
                </StaggerContainer>
            </div>
        </section>
    )
}
