'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Eyebrow } from '@/components/ui/eyebrow'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { FadeInView, StaggerContainer, StaggerItem, ScaleInView } from '@/components/animations'
import {
    MessageCircle,
    Bot,
    Users,
    BarChart3,
    FileText,
    Shield,
    ArrowRight,
    Clock,
    Zap,
    CheckCircle,
    Star,
    TrendingUp,
    Settings,
    Lock
} from 'lucide-react'
import Link from 'next/link'

const features = [
    {
        icon: MessageCircle,
        title: 'Messages Centralisés',
        description: 'Unifiez toutes vos conversations WhatsApp dans un seul tableau de bord. Gérez plusieurs comptes, assignez des conversations et gardez une vue d\'ensemble complète de vos échanges clients.',
        benefits: ['Tableau de bord unifié', 'Multi-comptes', 'Vue d\'ensemble complète'],
        color: 'from-blue-500 to-blue-600',
        detailedDescription: 'Transformez la gestion de vos conversations WhatsApp avec notre solution centralisée. Plus besoin de jongler entre plusieurs applications ou comptes - tout est réuni dans une interface unique et intuitive.',
        keyFeatures: [
            { icon: MessageCircle, title: 'Inbox Unifié', description: 'Toutes vos conversations dans un seul endroit' },
            { icon: Users, title: 'Multi-comptes', description: 'Gérez plusieurs numéros WhatsApp Business' },
            { icon: Settings, title: 'Attribution Smart', description: 'Assignation automatique selon les règles définies' },
            { icon: Star, title: 'Priorités', description: 'Classement automatique par importance et urgence' }
        ],
        stats: [
            { value: '85%', label: 'Réduction du temps de gestion' },
            { value: '3x', label: 'Plus rapide pour traiter les demandes' },
            { value: '100%', label: 'Visibilité sur toutes les conversations' }
        ]
    },
    {
        icon: Bot,
        title: 'Réponses IA Intelligentes',
        description: 'Bénéficiez de l\'IA avancée pour générer des réponses pertinentes, automatiser les interactions courantes et réduire votre temps de réponse de 90%.',
        benefits: ['Réponses automatisées', 'IA contextuelle', '90% plus rapide'],
        color: 'from-purple-500 to-purple-600',
        detailedDescription: 'Notre IA avancée analyse le contexte de chaque conversation pour proposer des réponses pertinentes et cohérentes avec votre style de communication. Elle apprend de vos interactions pour s\'améliorer continuellement.',
        keyFeatures: [
            { icon: Bot, title: 'IA Contextuelle', description: 'Comprend le contexte complet de la conversation' },
            { icon: Zap, title: 'Réponses Instantanées', description: 'Suggestions en temps réel pendant que vous tapez' },
            { icon: TrendingUp, title: 'Apprentissage Continu', description: 'S\'améliore avec chaque interaction' },
            { icon: Settings, title: 'Personnalisation', description: 'Adapte le ton et le style à votre marque' }
        ],
        stats: [
            { value: '90%', label: 'Réduction du temps de réponse' },
            { value: '95%', label: 'Précision des suggestions' },
            { value: '24/7', label: 'Disponibilité continue' }
        ]
    },
    {
        icon: Users,
        title: 'Collaboration d\'Équipe',
        description: 'Travaillez efficacement en équipe avec l\'attribution automatique de conversations, les notes internes et le suivi des performances individuelles.',
        benefits: ['Attribution automatique', 'Notes internes', 'Suivi performances'],
        color: 'from-orange-500 to-orange-600',
        detailedDescription: 'Optimisez le travail d\'équipe avec des outils de collaboration avancés. Chaque membre peut voir l\'historique complet, ajouter des notes internes et suivre les performances en temps réel.',
        keyFeatures: [
            { icon: Users, title: 'Attribution Smart', description: 'Répartition automatique selon les compétences' },
            { icon: MessageCircle, title: 'Notes Internes', description: 'Communication entre agents sans que le client le voie' },
            { icon: BarChart3, title: 'Dashboard Personnel', description: 'Suivi des performances individuelles' },
            { icon: Clock, title: 'Historique Complet', description: 'Accès à tout l\'historique client' }
        ],
        stats: [
            { value: '60%', label: 'Amélioration de la productivité' },
            { value: '40%', label: 'Réduction des erreurs' },
            { value: '100%', label: 'Visibilité sur les performances' }
        ]
    },
    {
        icon: BarChart3,
        title: 'Analytics & Insights',
        description: 'Analysez vos performances avec des métriques détaillées : temps de réponse, taux de satisfaction, volume de conversations et ROI de votre support.',
        benefits: ['Métriques détaillées', 'Taux de satisfaction', 'ROI support'],
        color: 'from-emerald-500 to-emerald-600',
        detailedDescription: 'Prenez des décisions éclairées grâce à des analytics poussés. Mesurez l\'impact de votre support client sur votre business et identifiez les axes d\'amélioration.',
        keyFeatures: [
            { icon: BarChart3, title: 'Métriques Temps Réel', description: 'Données mises à jour en continu' },
            { icon: TrendingUp, title: 'Analyses Prédictives', description: 'Anticipez les pics de charge et les tendances' },
            { icon: Star, title: 'Satisfaction Client', description: 'Mesure automatique de la satisfaction' },
            { icon: Settings, title: 'Rapports Personnalisés', description: 'Créez vos propres dashboards' }
        ],
        stats: [
            { value: '15+', label: 'Métriques clés suivies' },
            { value: '100%', label: 'Données en temps réel' },
            { value: '3x', label: 'ROI moyen constaté' }
        ]
    },
    {
        icon: FileText,
        title: 'Gestion des Modèles',
        description: 'Créez et gérez une bibliothèque de réponses pré-approuvées. Assurez la cohérence de votre communication et accélérez les réponses courantes.',
        benefits: ['Bibliothèque centralisée', 'Réponses cohérentes', 'Accélération 3x'],
        color: 'from-indigo-500 to-indigo-600',
        detailedDescription: 'Standardisez votre communication avec une bibliothèque de modèles intelligent. Réponses pré-approuvées, variables dynamiques et suggestions contextuelles pour une efficacité maximale.',
        keyFeatures: [
            { icon: FileText, title: 'Bibliothèque Centralisée', description: 'Tous vos modèles dans un endroit unique' },
            { icon: Zap, title: 'Variables Dynamiques', description: 'Personnalisation automatique avec les données client' },
            { icon: Users, title: 'Validation Équipe', description: 'Processus d\'approbation des modèles' },
            { icon: Star, title: 'Suggestions Smart', description: 'Recommandation du meilleur modèle selon le contexte' }
        ],
        stats: [
            { value: '75%', label: 'Réduction du temps de rédaction' },
            { value: '95%', label: 'Cohérence des messages' },
            { value: '500+', label: 'Modèles pré-construits disponibles' }
        ]
    },
    {
        icon: Shield,
        title: 'Sécurité Enterprise',
        description: 'Architecture multi-tenant avec chiffrement de bout en bout, conformité RGPD, audit trails complets et isolation des données garantie.',
        benefits: ['Chiffrement E2E', 'Conformité RGPD', 'Audit trails'],
        color: 'from-red-500 to-red-600',
        detailedDescription: 'Sécurité de niveau bancaire pour protéger vos données et celles de vos clients. Conformité complète aux réglementations européennes et internationales.',
        keyFeatures: [
            { icon: Shield, title: 'Chiffrement E2E', description: 'Toutes les communications sont chiffrées' },
            { icon: Lock, title: 'Conformité RGPD', description: 'Respect total de la réglementation européenne' },
            { icon: FileText, title: 'Audit Trails', description: 'Traçabilité complète de toutes les actions' },
            { icon: Users, title: 'Isolation Données', description: 'Architecture multi-tenant sécurisée' }
        ],
        stats: [
            { value: '256-bit', label: 'Niveau de chiffrement' },
            { value: '99.9%', label: 'Disponibilité garantie' },
            { value: 'ISO 27001', label: 'Certification sécurité' }
        ]
    }
]

export function FeaturesOverviewSection() {
    const [selectedFeature, setSelectedFeature] = useState<typeof features[0] | null>(null)

    return (
        <section className="py-24 bg-white">
            <div className="max-w-6xl mx-auto px-4">
                {/* Header */}
                <div className="text-center mb-16">
                    <FadeInView>
                        <Eyebrow
                            text="Vue d'ensemble"
                            icon={<Zap className="w-3 h-3" />}
                            className="mb-4"
                        />
                    </FadeInView>
                    <FadeInView delay={0.2}>
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            Six fonctionnalités essentielles pour transformer vos communications
                        </h2>
                    </FadeInView>
                    <FadeInView delay={0.4}>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Chaque fonctionnalité a été conçue pour résoudre un défi spécifique dans la gestion de votre support client WhatsApp.
                        </p>
                    </FadeInView>
                </div>

                {/* Features Grid */}
                <StaggerContainer staggerDelay={0.1} delayChildren={0.6}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 auto-rows-fr">
                        {features.map((feature, index) => {
                            const Icon = feature.icon
                            return (
                                <StaggerItem key={index} className="flex">
                                    <ScaleInView className="w-full">
                                        <Card className="border-none shadow-sm hover:shadow-lg transition-all duration-300 group cursor-pointer h-full w-full">
                                            <CardContent className="p-6 h-full flex flex-col">
                                                {/* Icon */}
                                                <div className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 mb-4`}>
                                                    <Icon className="w-6 h-6 text-white" />
                                                </div>

                                                {/* Content - Takes available space */}
                                                <div className="flex-1 flex flex-col">
                                                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                                                        {feature.title}
                                                    </h3>
                                                    <p className="text-gray-600 leading-relaxed text-sm mb-4 flex-1">
                                                        {feature.description}
                                                    </p>

                                                    {/* Benefits */}
                                                    <div className="space-y-2 mb-4">
                                                        {feature.benefits.map((benefit, idx) => (
                                                            <div key={idx} className="flex items-center gap-2 text-xs text-gray-500">
                                                                <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                                                                <span>{benefit}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* CTA - Always at bottom */}
                                                <Button
                                                    variant="ghost"
                                                    className="w-full justify-between text-green-600 hover:text-green-700 hover:bg-green-50 group/btn mt-auto"
                                                    onClick={() => setSelectedFeature(feature)}
                                                >
                                                    En savoir plus
                                                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform duration-200" />
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    </ScaleInView>
                                </StaggerItem>
                            )
                        })}
                    </div>
                </StaggerContainer>

                {/* Feature Detail Modal */}
                <Dialog open={!!selectedFeature} onOpenChange={() => setSelectedFeature(null)}>
                    <DialogContent className="sm:max-w-7xl w-[95vw] max-h-[90vh] overflow-y-auto">
                        {selectedFeature && (
                            <>
                                <DialogHeader>
                                    <div className="flex items-center gap-4 mb-2">
                                        <div className={`hidden sm:flex w-12 h-12 bg-gradient-to-br ${selectedFeature.color} rounded-xl items-center justify-center`}>
                                            <selectedFeature.icon className="w-6 h-6 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <DialogTitle className="text-xl sm:text-2xl font-bold text-gray-900">
                                                {selectedFeature.title}
                                            </DialogTitle>
                                            <DialogDescription className="text-sm sm:text-base text-gray-600 mt-1">
                                                {selectedFeature.detailedDescription}
                                            </DialogDescription>
                                        </div>
                                    </div>
                                </DialogHeader>

                                <div className="space-y-6 md:space-y-8">
                                    {/* Key Features */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Fonctionnalités clés</h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-3 md:gap-4">
                                            {selectedFeature.keyFeatures.map((keyFeature, idx) => {
                                                const FeatureIcon = keyFeature.icon
                                                return (
                                                    <div key={idx} className="flex items-start gap-3 p-3 md:p-4 bg-gray-50 rounded-lg">
                                                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                                                            <FeatureIcon className="w-4 h-4 text-gray-600" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="font-medium text-gray-900 mb-1 text-sm md:text-base">{keyFeature.title}</h4>
                                                            <p className="text-xs md:text-sm text-gray-600 leading-relaxed">{keyFeature.description}</p>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>

                                    {/* Stats */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Impact mesurable</h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                                            {selectedFeature.stats.map((stat, idx) => (
                                                <div key={idx} className="text-center p-4 md:p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100">
                                                    <div className="text-2xl md:text-3xl font-bold text-green-600 mb-2">{stat.value}</div>
                                                    <div className="text-xs md:text-sm text-gray-600">{stat.label}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* CTA Section */}
                                    <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-4 md:p-6 text-center">
                                        <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">
                                            Prêt à découvrir {selectedFeature.title.toLowerCase()} ?
                                        </h3>
                                        <p className="text-sm md:text-base text-gray-600 mb-4">
                                            Testez cette fonctionnalité gratuitement pendant 14 jours.
                                        </p>
                                        <Button
                                            asChild
                                            size="lg"
                                            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 md:px-8 py-2 md:py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                                        >
                                            <Link href="/auth/sign-up">
                                                Commencer l'essai gratuit
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            </>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Bottom CTA */}
                <div className="text-center mt-16">
                    <FadeInView delay={1.0}>
                        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-8 md:p-12">
                            <div className="max-w-3xl mx-auto">
                                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                                    Prêt à découvrir toutes ces fonctionnalités ?
                                </h3>
                                <p className="text-lg text-gray-600 mb-6">
                                    Testez Jokko gratuitement pendant 14 jours et découvrez comment nos fonctionnalités peuvent transformer votre support client.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <Clock className="w-4 h-4" />
                                        <span>Configuration en 5 minutes</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                        <span>Aucune carte bancaire requise</span>
                                    </div>
                                </div>
                                <div className="mt-6">
                                    <Button
                                        asChild
                                        size="lg"
                                        className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-8 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                                    >
                                        <Link href="/auth/sign-up">
                                            Commencer l'essai gratuit
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </FadeInView>
                </div>
            </div>
        </section>
    )
}
