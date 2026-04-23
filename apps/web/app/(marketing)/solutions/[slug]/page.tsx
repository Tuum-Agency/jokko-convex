'use client'

import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { MessageCircle, ShoppingBag, Users, Building2, Store, ArrowRight, CheckCircle, Zap, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { CtaSection } from '@/components/landing/sections/home/cta-section'
import { FaqSection } from '@/components/landing/sections/home/faq-section'

// Data for each solution
const solutionsData = {
    'e-commerce': {
        title: "Boostez vos ventes E-commerce",
        description: "Transformez chaque conversation en opportunité de vente. Récupérez les paniers abandonnés et offrez un support instantané sur WhatsApp.",
        icon: ShoppingBag,
        gradient: "from-blue-600 to-indigo-600",
        // Pre-computed classes to avoid dynamic tailwind matching issues
        theme: {
            lightIconBg: "bg-blue-100",
            iconColor: "text-blue-600",
            hoverBg: "group-hover:bg-blue-600",
            blob1: "bg-blue-200/20",
            blob2: "bg-blue-300/20",
            buttonShadow: "shadow-blue-500/20",
            cardBlob: "bg-blue-50"
        },
        stats: [
            { value: "45%", label: "Taux de récupération panier" },
            { value: "3x", label: "Plus de conversions" },
            { value: "24/7", label: "Support automatisé" }
        ],
        features: [
            { title: "Relance Paniers Abandonnés", desc: "Envoyez automatiquement un message WhatsApp pour récupérer les ventes perdues.", icon: MessageCircle },
            { title: "Notifications de Commande", desc: "Tenez vos clients informés de l'état de leur livraison en temps réel.", icon: CheckCircle },
            { title: "Catalogue Produit", desc: "Envoyez vos produits directement dans la discussion pour un achat rapide.", icon: ShoppingBag }
        ]
    },
    'service-client': {
        title: "Un Service Client 5 Étoiles",
        description: "Centralisez toutes vos demandes clients. Répondez plus vite, automatisez les questions fréquentes et satisfaites vos clients.",
        icon: Users,
        gradient: "from-green-600 to-emerald-600",
        theme: {
            lightIconBg: "bg-green-100",
            iconColor: "text-green-600",
            hoverBg: "group-hover:bg-green-600",
            blob1: "bg-green-200/20",
            blob2: "bg-green-300/20",
            buttonShadow: "shadow-green-500/20",
            cardBlob: "bg-green-50"
        },
        stats: [
            { value: "-50%", label: "Temps de réponse" },
            { value: "98%", label: "Satisfaction client" },
            { value: "0", label: "Message perdu" }
        ],
        features: [
            { title: "Boîte de Réception Partagée", desc: "Toute votre équipe sur un seul numéro WhatsApp pour une collaboration fluide.", icon: Users },
            { title: "Réponses Rapides & IA", desc: "Utilisez des modèles et l'IA pour répondre instantanément aux questions récurrentes.", icon: Zap },
            { title: "Assignation Automatique", desc: "Routez les conversations vers le bon agent automatiquement.", icon: ArrowRight }
        ]
    },
    'agences': {
        title: "Pour les Agences Marketing",
        description: "Gérez plusieurs clients WhatsApp depuis une seule interface. Créez des campagnes ROIstes pour vos clients.",
        icon: Building2,
        gradient: "from-purple-600 to-violet-600",
        theme: {
            lightIconBg: "bg-purple-100",
            iconColor: "text-purple-600",
            hoverBg: "group-hover:bg-purple-600",
            blob1: "bg-purple-200/20",
            blob2: "bg-purple-300/20",
            buttonShadow: "shadow-purple-500/20",
            cardBlob: "bg-purple-50"
        },
        stats: [
            { value: "10+", label: "Comptes clients / agent" },
            { value: "90%", label: "Taux d'ouverture" },
            { value: "X2", label: "Productivité" }
        ],
        features: [
            { title: "Multi-Comptes", desc: "Passez d'un compte client à l'autre sans déconnexion.", icon: Users },
            { title: "Reporting Détaillé", desc: "Prouvez votre ROI avec des statistiques précises sur les campagnes.", icon: ShieldCheck },
            { title: "Broadcasting Ciblé", desc: "Envoyez des offres promotionnelles hyper-ciblées à des milliers de contacts.", icon: MessageCircle }
        ]
    },
    'tpe-pme': {
        title: "L'outil idéal pour TPE & PME",
        description: "Donnez une image professionnelle à votre entreprise. Gérez vos clients comme les grands, sans la complexité.",
        icon: Store,
        gradient: "from-orange-500 to-red-500",
        theme: {
            lightIconBg: "bg-orange-100",
            iconColor: "text-orange-600",
            hoverBg: "group-hover:bg-orange-600",
            blob1: "bg-orange-200/20",
            blob2: "bg-orange-300/20",
            buttonShadow: "shadow-orange-500/20",
            cardBlob: "bg-orange-50"
        },
        stats: [
            { value: "100%", label: "Professionnel" },
            { value: "15min", label: "Installation" },
            { value: "H24", label: "Disponibilité" }
        ],
        features: [
            { title: "Numéro Fixe ou Mobile", desc: "Utilisez votre numéro actuel pour WhatsApp Business.", icon: CheckCircle },
            { title: "Message d'Accueil", desc: "Accueillez chaque client automatiquement, même la nuit.", icon: MessageCircle },
            { title: "Organisation Simple", desc: "Tags, notes et rappels pour ne jamais oublier un client.", icon: Zap }
        ]
    }
}

export default function SolutionPage() {
    const params = useParams()
    const slug = params.slug as string
    const data = solutionsData[slug as keyof typeof solutionsData]

    // Fallback if slug not found
    if (!data) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-slate-900 mb-4">Page non trouvée</h1>
                    <Link href="/">
                        <Button>Retour à l'accueil</Button>
                    </Link>
                </div>
            </div>
        )
    }

    const Icon = data.icon

    return (
        <div className="bg-slate-50 min-h-screen">
            {/* Hero Section */}
            <section className="relative pt-32 pb-20 overflow-hidden">
                <div className={`absolute top-0 right-0 w-[600px] h-[600px] ${data.theme.blob1} rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/3`}></div>
                <div className={`absolute bottom-0 left-0 w-[400px] h-[400px] ${data.theme.blob2} rounded-full blur-[80px] pointer-events-none translate-y-1/2 -translate-x-1/2`}></div>

                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="text-center max-w-4xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center justify-center p-3 bg-white rounded-2xl shadow-xl shadow-slate-200/50 mb-8 ring-1 ring-slate-100"
                        >
                            <div className={`w-10 h-10 rounded-xl bg-linear-to-br ${data.gradient} flex items-center justify-center text-white mr-3 shadow-lg`}>
                                <Icon className="w-5 h-5" />
                            </div>
                            <span className="text-sm font-bold text-slate-800 tracking-wide uppercase">Solution {slug.replace('-', ' ')}</span>
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-5xl md:text-7xl font-bold text-slate-900 tracking-tight leading-tight mb-8"
                        >
                            {data.title}
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-xl text-slate-600 mb-10 leading-relaxed max-w-2xl mx-auto"
                        >
                            {data.description}
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="flex justify-center gap-4"
                        >
                            <Link href="/auth/sign-up">
                                <Button size="lg" className={`h-14 px-8 text-lg bg-linear-to-r ${data.gradient} hover:opacity-90 shadow-xl ${data.theme.buttonShadow} rounded-2xl transition-all hover:scale-105`}>
                                    Commencer gratuitement
                                </Button>
                            </Link>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-12 bg-white border-y border-slate-100 relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                        {data.stats.map((stat, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, scale: 0.5 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.1 }}
                                viewport={{ once: true }}
                                className="p-6"
                            >
                                <div className={`text-5xl font-black text-transparent bg-clip-text bg-linear-to-br ${data.gradient} mb-2`}>
                                    {stat.value}
                                </div>
                                <div className="text-sm font-bold text-slate-400 uppercase tracking-wider">{stat.label}</div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-24 relative">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {data.features.map((feature, idx) => {
                            const FeatureIcon = feature.icon
                            return (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.2 }}
                                    viewport={{ once: true }}
                                    className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 relative group overflow-hidden"
                                >
                                    <div className={`absolute top-0 right-0 w-32 h-32 ${data.theme.cardBlob} rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-150`}></div>
                                    <div className={`w-14 h-14 rounded-2xl ${data.theme.lightIconBg} flex items-center justify-center ${data.theme.iconColor} mb-6 relative z-10 ${data.theme.hoverBg} group-hover:text-white transition-colors`}>
                                        <FeatureIcon className="w-7 h-7" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-3 relative z-10">{feature.title}</h3>
                                    <p className="text-slate-600 leading-relaxed relative z-10">
                                        {feature.desc}
                                    </p>
                                </motion.div>
                            )
                        })}
                    </div>
                </div>
            </section>

            {/* Common Sections */}
            <CtaSection />
            <div className="py-12 bg-white">
                <FaqSection />
            </div>
        </div>
    )
}
