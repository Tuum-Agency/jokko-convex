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
    Megaphone,
    Contact,
    ArrowRight,
    Zap,
    CheckCircle,
    Sparkles,
    Send,
    Search
} from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'

// --- Visual Components for Cards ---

function InboxVisual() {
    return (
        <div className="absolute inset-x-4 bottom-0 h-40 bg-slate-50 border-t border-x border-slate-100 rounded-t-xl overflow-hidden p-3 flex flex-col gap-2">
            {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-2 p-2 bg-white border border-slate-100 rounded-lg shadow-sm">
                    <div className={`w-6 h-6 rounded-full shrink-0 ${i === 1 ? 'bg-green-100' : 'bg-slate-100'}`}></div>
                    <div className="flex-1 space-y-1">
                        <div className="w-16 h-1.5 bg-slate-200 rounded-full"></div>
                        <div className="w-24 h-1.5 bg-slate-100 rounded-full"></div>
                    </div>
                </div>
            ))}
        </div>
    )
}

function BroadcastVisual() {
    return (
        <div className="absolute inset-4 flex items-center justify-center">
            <div className="relative">
                <div className="absolute inset-0 bg-orange-500/20 blur-xl rounded-full animate-pulse"></div>
                <div className="relative w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg border border-orange-100">
                    <Megaphone className="w-8 h-8 text-orange-500 transform -rotate-12" />
                </div>
                {/* Flying particles */}
                {[1, 2, 3, 4].map(i => (
                    <motion.div
                        key={i}
                        animate={{
                            x: [0, 40 + i * 10],
                            y: [0, -20 - i * 5],
                            opacity: [1, 0]
                        }}
                        transition={{ repeat: Infinity, duration: 2, delay: i * 0.3 }}
                        className="absolute top-1/2 left-1/2 w-2 h-2 bg-orange-400 rounded-full"
                    />
                ))}
            </div>
        </div>
    )
}

function AIVisual() {
    return (
        <div className="absolute inset-x-4 bottom-0 h-32 flex flex-col justify-end p-2 gap-2">
            <div className="self-end bg-emerald-500 text-white text-[10px] p-2 rounded-lg rounded-tr-none shadow-md max-w-[80%]">
                Génère une réponse pour...
            </div>
            <div className="self-start bg-white border border-emerald-100 text-[10px] p-2 rounded-lg rounded-tl-none shadow-sm flex items-center gap-1.5 max-w-[90%]">
                <Sparkles className="w-3 h-3 text-emerald-500 shrink-0" />
                <span className="text-slate-600">Voici une suggestion...</span>
            </div>
        </div>
    )
}

function TeamVisual() {
    return (
        <div className="absolute inset-4 flex items-center justify-center">
            <div className="flex -space-x-4">
                {[1, 2, 3].map(i => (
                    <motion.div
                        key={i}
                        animate={{ y: [0, -5, 0] }}
                        transition={{ repeat: Infinity, duration: 2, delay: i * 0.5 }}
                        className="w-12 h-12 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-xs font-bold text-white bg-gradient-to-br from-blue-400 to-indigo-500"
                    >
                        {String.fromCharCode(64 + i)}
                    </motion.div>
                ))}
            </div>
        </div>
    )
}

function StatsVisual() {
    return (
        <div className="absolute inset-x-6 bottom-6 flex items-end justify-between gap-1 h-24">
            {[40, 70, 45, 90, 60, 80].map((h, i) => (
                <motion.div
                    key={i}
                    initial={{ height: 0 }}
                    whileInView={{ height: `${h}%` }}
                    className="w-full bg-purple-100 rounded-t-sm relative group"
                >
                    <div className="absolute bottom-0 inset-x-0 bg-purple-500 rounded-t-sm transition-all h-full opacity-60 group-hover:opacity-100"></div>
                </motion.div>
            ))}
        </div>
    )
}

function CRMVisual() {
    return (
        <div className="absolute inset-x-4 top-16 bottom-4 bg-white border border-slate-100 rounded-lg p-2 shadow-sm space-y-2">
            <div className="flex items-center gap-2 p-1.5 bg-slate-50 rounded">
                <Search className="w-3 h-3 text-slate-400" />
                <div className="w-20 h-1 bg-slate-200 rounded"></div>
            </div>
            {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center justify-between border-b border-slate-50 pb-1">
                    <div className="flex items-center gap-1.5">
                        <div className="w-4 h-4 rounded-full bg-indigo-100"></div>
                        <div className="w-12 h-1 bg-slate-200 rounded"></div>
                    </div>
                    <div className="w-8 h-3 rounded bg-green-100"></div>
                </div>
            ))}
        </div>
    )
}


const features = [
    {
        id: 'inbox',
        icon: MessageCircle,
        title: 'Inbox Unifiée',
        description: 'Tous vos messages WhatsApp Business centralisés au même endroit.',
        color: 'from-blue-500 to-indigo-600',
        visual: InboxVisual,
        tags: ['Centralisation', 'Multi-numéros'],
        bg: 'bg-blue-50',
        detailedDescription: 'Ne perdez plus jamais une conversion. Centralisez tous vos numéros WhatsApp dans une interface unique conçue pour la productivité.',
        keyFeatures: [
            { icon: MessageCircle, title: 'Tout-en-un', description: 'Gérez tous vos numéros' },
            { icon: Users, title: 'Vue Client 360', description: 'Historique complet des échanges' },
        ],
        stats: [{ value: '100%', label: 'Messages centralisés' }]
    },
    {
        id: 'broadcast',
        icon: Megaphone,
        title: 'Campagnes Marketing',
        description: 'Envoyez des messages ciblés à des milliers de clients en 1 clic.',
        color: 'from-orange-500 to-red-600',
        visual: BroadcastVisual,
        tags: ['Vente', 'Fidélisation'],
        bg: 'bg-orange-50',
        detailedDescription: 'Transformez WhatsApp en canal d’acquisition. Créez des campagnes engageantes avec des taux d’ouverture supérieurs à 90%.',
        keyFeatures: [
            { icon: Send, title: 'Envoi de masse', description: 'Sans risque de blocage' },
            { icon: BarChart3, title: 'Tracking', description: 'Taux d\'ouverture et clics' },
        ],
        stats: [{ value: '98%', label: 'Taux d\'ouverture' }]
    },
    {
        id: 'ai',
        icon: Bot,
        title: 'Jokko AI',
        description: 'Un assistant intelligent qui répond à vos clients 24/7.',
        color: 'from-emerald-500 to-teal-600',
        visual: AIVisual,
        tags: ['Automatisation', 'Support'],
        bg: 'bg-emerald-50',
        detailedDescription: 'Automatisez jusqu\'à 80% de votre support client. Notre IA comprend le contexte et répond avec votre ton de marque.',
        keyFeatures: [
            { icon: Sparkles, title: 'Antisèches', description: 'Suggestions de réponses' },
            { icon: Zap, title: 'Auto-réponse', description: 'Gestion des FAQ' },
        ],
        stats: [{ value: '24/7', label: 'Disponibilité' }]
    },
    {
        id: 'crm',
        icon: Contact,
        title: 'CRM & Contacts',
        description: 'Gérez votre base client, segmentez et personnalisez vos échanges.',
        color: 'from-pink-500 to-rose-600',
        visual: CRMVisual,
        tags: ['Organisation', 'Données'],
        bg: 'bg-pink-50',
        detailedDescription: 'Plus qu\'un simple carnet d\'adresses. Segmentez vos clients par tags, créez des listes de diffusion dynamiques et personnalisez chaque interaction.',
        keyFeatures: [
            { icon: Users, title: 'Segmentation', description: 'Tags et filtres avancés' },
            { icon: Search, title: 'Recherche', description: 'Retrouvez tout instantanément' },
        ],
        stats: [{ value: 'Unlim', label: 'Contacts illimités' }]
    },
    {
        id: 'team',
        icon: Users,
        title: 'Travail d\'Équipe',
        description: 'Invitez vos collaborateurs et assignez les conversations.',
        color: 'from-indigo-500 to-violet-600',
        visual: TeamVisual,
        tags: ['Collaboration', 'Assignation'],
        bg: 'bg-indigo-50',
        detailedDescription: 'WhatsApp n\'est plus un goulot d\'étranglement. Travaillez à plusieurs sur le même numéro sans conflit.',
        keyFeatures: [
            { icon: CheckCircle, title: 'Assignation', description: 'Distribuez les chats' },
            { icon: Users, title: 'Rôles', description: 'Permissions granulaires' },
        ],
        stats: [{ value: '+50%', label: 'Productivité équipe' }]
    },
    {
        id: 'analytics',
        icon: BarChart3,
        title: 'Analytics',
        description: 'Pilotez votre activité avec des données précises en temps réel.',
        color: 'from-purple-500 to-fuchsia-600',
        visual: StatsVisual,
        tags: ['Performance', 'ROI'],
        bg: 'bg-purple-50',
        detailedDescription: 'Prenez les bonnes décisions. Suivez le volume de messages, les temps de réponse et la performance de vos campagnes.',
        keyFeatures: [
            { icon: BarChart3, title: 'Dashboards', description: 'Vues personnalisables' },
            { icon: Zap, title: 'Temps réel', description: 'Données live' },
        ],
        stats: [{ value: '360°', label: 'Vue complète' }]
    }
]

export function FeaturesOverviewSection() {
    const [selectedFeature, setSelectedFeature] = useState<typeof features[0] | null>(null)

    return (
        <section className="py-24 bg-white relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-100/30 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-100/30 rounded-full blur-[100px] pointer-events-none translate-y-1/2 -translate-x-1/2"></div>


            <div className="max-w-7xl mx-auto px-6 relative z-10">
                {/* Header */}
                <div className="text-center mb-20 max-w-3xl mx-auto">
                    <FadeInView>
                        <Eyebrow
                            text="Tout ce qu'il vous faut"
                            icon={<Zap className="w-3 h-3 text-orange-500" />}
                            className="bg-orange-50 text-orange-700 border-orange-100 mb-6"
                        />
                    </FadeInView>
                    <FadeInView delay={0.2}>
                        <h2 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight leading-tight mb-6">
                            Une Machine à Vendre <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600">Complète et Puissante</span>
                        </h2>
                    </FadeInView>
                    <FadeInView delay={0.4}>
                        <p className="text-xl text-slate-600 leading-relaxed">
                            Nous avons rassemblé les meilleurs outils pour vous permettre de vendre, supporter et engager vos clients sur WhatsApp.
                        </p>
                    </FadeInView>
                </div>

                {/* Features Grid */}
                <StaggerContainer staggerDelay={0.1} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, index) => {
                        const Icon = feature.icon
                        const Visual = feature.visual
                        return (
                            <StaggerItem key={index} className="h-full">
                                <motion.div whileHover={{ y: -8 }} className="h-full">
                                    <Card
                                        className={`h-full border-none shadow-lg hover:shadow-2xl transition-all duration-300 bg-white relative overflow-hidden group cursor-pointer ring-1 ring-slate-200/50 hover:ring-${feature.color.split('-')[1]}/30`}
                                        onClick={() => setSelectedFeature(feature)}
                                    >
                                        <div className={`absolute top-0 right-0 w-32 h-32 ${feature.bg} rounded-bl-[100px] opacity-50 transition-transform duration-500 group-hover:scale-150`}></div>

                                        <CardContent className="p-8 h-full flex flex-col relative z-10">
                                            {/* Header */}
                                            <div className="flex justify-between items-start mb-6">
                                                <div className={`w-12 h-12 rounded-2xl bg-linear-to-br ${feature.color} text-white flex items-center justify-center shadow-lg`}>
                                                    <Icon className="w-6 h-6" />
                                                </div>
                                                <div className="flex gap-2">
                                                    {feature.tags.map(tag => (
                                                        <span key={tag} className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-slate-100 text-slate-500">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Text */}
                                            <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-linear-to-r group-hover:from-slate-900 group-hover:to-slate-700 transition-colors">
                                                {feature.title}
                                            </h3>
                                            <p className="text-slate-600 text-sm leading-relaxed mb-8 flex-1">
                                                {feature.description}
                                            </p>

                                            {/* Visual Area */}
                                            <div className={`relative h-40 w-full rounded-xl overflow-hidden ${feature.bg} border border-slate-100/50 group-hover:border-${feature.color.split('-')[1]}/20 transition-colors`}>
                                                <Visual />
                                            </div>

                                            {/* CTA */}
                                            <div className="mt-6 flex items-center text-sm font-semibold text-slate-400 group-hover:text-slate-900 transition-colors">
                                                En savoir plus <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            </StaggerItem>
                        )
                    })}
                </StaggerContainer>

                {/* Feature Detail Modal */}
                <Dialog open={!!selectedFeature} onOpenChange={() => setSelectedFeature(null)}>
                    <DialogContent className="sm:max-w-4xl p-0 overflow-hidden border-none bg-white">
                        {selectedFeature && (
                            <div className="flex flex-col md:flex-row h-full md:h-[500px]">
                                {/* Left Side: Visual & Stats */}
                                <div className={`md:w-2/5 p-8 relative overflow-hidden bg-linear-to-br ${selectedFeature.color} text-white flex flex-col justify-between`}>
                                    <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20"></div>
                                    <div className="relative z-10">
                                        <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-6">
                                            <selectedFeature.icon className="w-7 h-7 text-white" />
                                        </div>
                                        <h3 className="text-3xl font-bold mb-2">{selectedFeature.title}</h3>
                                        <div className="flex flex-wrap gap-2 mt-4">
                                            {selectedFeature.tags.map(tag => (
                                                <span key={tag} className="px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-medium">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="relative z-10 grid grid-cols-1 gap-4 mt-8">
                                        {selectedFeature.stats.map((stat, i) => (
                                            <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                                                <div className="text-3xl font-bold">{stat.value}</div>
                                                <div className="text-white/80 text-sm">{stat.label}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Right Side: Content */}
                                <div className="md:w-3/5 p-8 md:p-10 flex flex-col overflow-y-auto">
                                    <DialogHeader className="mb-6">
                                        <DialogDescription className="text-lg text-slate-600 leading-relaxed">
                                            {selectedFeature.detailedDescription}
                                        </DialogDescription>
                                    </DialogHeader>

                                    <div className="space-y-6 mb-8 flex-1">
                                        {selectedFeature.keyFeatures.map((kf, i) => (
                                            <div key={i} className="flex gap-4">
                                                <div className={`w-10 h-10 rounded-lg shrink-0 flex items-center justify-center ${selectedFeature.bg}`}>
                                                    <kf.icon className="w-5 h-5 text-slate-700" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-900">{kf.title}</h4>
                                                    <p className="text-sm text-slate-500">{kf.description}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-auto pt-6 border-t border-slate-100 flex justify-end">
                                        <Button asChild className="bg-slate-900 text-white hover:bg-slate-800 rounded-full px-6">
                                            <Link href="/auth/sign-up">
                                                Essayer gratuitement
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </section>
    )
}
