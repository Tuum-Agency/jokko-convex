import { Card, CardContent } from '@/components/ui/card'
import { Eyebrow } from '@/components/ui/eyebrow'
import { FadeInView, StaggerContainer, StaggerItem, ScaleInView } from '@/components/animations'
import { MessageCircle, Bot, Users, BarChart3, FileText, Shield, Zap } from 'lucide-react'

const features = [
    {
        icon: MessageCircle,
        title: 'Messages Centralisés',
        description: 'Gérez toutes les conversations WhatsApp Business depuis un tableau de bord unique et unifié pour toute votre équipe.'
    },
    {
        icon: Bot,
        title: 'Réponses IA',
        description: 'Obtenez des suggestions de messages intelligentes et des réponses automatisées alimentées par l\'IA avancée pour répondre 10x plus vite.'
    },
    {
        icon: Users,
        title: 'Collaboration Équipe',
        description: 'Assignez des conversations aux membres de l\'équipe, ajoutez des notes internes et collaborez de manière transparente.'
    },
    {
        icon: BarChart3,
        title: 'Analytics & Insights',
        description: 'Suivez les temps de réponse, le volume de conversations et les performances de l\'équipe avec des tableaux de bord analytiques complets.'
    },
    {
        icon: FileText,
        title: 'Gestion des Modèles',
        description: 'Créez, gérez et utilisez des modèles de messages pré-approuvés pour assurer une communication client cohérente.'
    },
    {
        icon: Shield,
        title: 'Sécurité Enterprise',
        description: 'Architecture multi-tenant avec sécurité de niveau entreprise, isolation des données et normes de conformité.'
    }
]

export function FeatureSection() {
    return (
        <section id="features" className="py-24 bg-white">
            <div className="max-w-6xl mx-auto px-4">
                <div className="text-center mb-16">
                    <FadeInView>
                        <Eyebrow
                            text="Fonctionnalités"
                            icon={<Zap className="w-3 h-3" />}
                            className="mb-4"
                        />
                    </FadeInView>
                    <FadeInView delay={0.2}>
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 max-w-3xl mx-auto">
                            Tout ce dont vous avez besoin pour développer votre WhatsApp Business
                        </h2>
                    </FadeInView>
                    <FadeInView delay={0.4}>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Des fonctionnalités puissantes conçues pour aider votre équipe à gérer les conversations clients plus efficacement.
                        </p>
                    </FadeInView>
                </div>

                <StaggerContainer staggerDelay={0.15} delayChildren={0.6}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, index) => {
                            const Icon = feature.icon
                            return (
                                <StaggerItem key={index}>
                                    <ScaleInView>
                                        <Card className="border-none shadow-sm hover:shadow-md transition-shadow duration-300 h-full">
                                            <CardContent className="p-6">
                                                <div className="flex flex-col items-start space-y-4">
                                                    <div className="p-3 bg-green-100 rounded-lg">
                                                        <Icon className="w-6 h-6 text-green-600" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <h3 className="text-xl font-semibold text-gray-900">
                                                            {feature.title}
                                                        </h3>
                                                        <p className="text-gray-600 leading-relaxed">
                                                            {feature.description}
                                                        </p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </ScaleInView>
                                </StaggerItem>
                            )
                        })}
                    </div>
                </StaggerContainer>

                {/* Additional CTA */}
                <div className="text-center mt-16">
                    <p className="text-lg text-gray-600 mb-6">
                        Prêt à transformer vos communications client ?
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span>Configuration en 5 minutes</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span>Aucune connaissance technique requise</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span>Support client 24h/24 et 7j/7</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
