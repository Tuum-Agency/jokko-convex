"use client";

import { Card, CardContent } from '@/components/ui/card'
import { Eyebrow } from '@/components/ui/eyebrow'
import { FadeInView, StaggerContainer, StaggerItem } from '@/components/animations'
import { Zap, MessageSquare, Bot, LineChart, Users, Sparkles, Heart } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

// --- Visual Components ---

function InboxVisual() {
    return (
        <div className="absolute inset-x-2 sm:inset-x-4 -bottom-2 rounded-t-xl bg-white shadow-2xl border border-slate-100 overflow-hidden flex flex-col h-full max-h-[280px]">
            {/* Fake Header */}
            <div className="h-10 bg-slate-50 border-b border-slate-100 flex items-center px-4 gap-2">
                <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
                </div>
                <div className="ml-4 w-40 h-2 bg-slate-200 rounded-full opacity-50"></div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar */}
                <div className="w-24 sm:w-48 border-r border-slate-100 bg-slate-50/30 p-2 space-y-2">
                    <div className="h-8 bg-slate-100 rounded-lg mb-4 w-full animate-pulse"></div>
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/50 border border-slate-100">
                            <div className="w-6 h-6 rounded-full bg-indigo-100 shrink-0"></div>
                            <div className="flex-1 min-w-0">
                                <div className="h-2 w-16 bg-slate-200 rounded mb-1"></div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Cloud/Canvas Area */}
                <div className="flex-1 bg-[#F0F2F5] p-4 relative">
                    <div className="space-y-3">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            whileInView={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="flex gap-2"
                        >
                            <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm text-xs text-slate-600 max-w-[160px]">
                                Bonjour, est-ce que ce produit est disponible ? 📦
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            whileInView={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="flex gap-2 flex-row-reverse"
                        >
                            <div className="bg-[#D9FDD3] p-3 rounded-2xl rounded-tr-none shadow-sm text-xs text-slate-900 max-w-[160px]">
                                Oui, tout à fait ! Il nous reste 3 unités. 🔥
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            whileInView={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 1.2 }}
                            className="flex gap-2"
                        >
                            <div className="bg-white p-2 rounded-2xl rounded-tl-none shadow-sm text-xs text-slate-600 flex gap-1 items-center">
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-100"></span>
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-200"></span>
                            </div>
                        </motion.div>
                    </div>

                    {/* FAB pulsing */}
                    <div className="absolute bottom-4 right-4 w-12 h-12 bg-green-500 rounded-full shadow-lg flex items-center justify-center text-white animate-pulse">
                        <MessageSquare className="w-6 h-6 fill-current" />
                    </div>
                </div>
            </div>
        </div>
    )
}

function AIVisual() {
    return (
        <div className="absolute inset-x-2 sm:inset-x-4 bottom-0 h-full max-h-48 bg-gradient-to-t from-emerald-50 to-transparent p-3 sm:p-4 flex flex-col justify-end">
            {/* User message */}
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="self-end bg-emerald-600 text-white p-3 rounded-2xl rounded-tr-sm text-xs shadow-lg mb-3 max-w-[85%]"
            >
                Une promo pour ce weekend ?
            </motion.div>

            {/* AI Response with Shimmer */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1 }}
                className="self-start relative group"
            >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-400 to-cyan-500 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-1000"></div>
                <div className="relative bg-white border border-emerald-100 text-slate-600 p-3 rounded-2xl rounded-tl-sm text-xs shadow-sm">
                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-50">
                        <div className="p-1 bg-emerald-100 rounded-lg">
                            <Sparkles className="w-3 h-3 text-emerald-600" />
                        </div>
                        <span className="font-bold text-emerald-700 text-[10px] uppercase tracking-wider">Jokko AI</span>
                    </div>
                    Bien sûr ! Voici une offre spéciale -20% générée pour vos clients fidèles. ✨
                </div>
            </motion.div>
        </div>
    )
}

function StatsVisual() {
    return (
        <div className="absolute inset-x-2 sm:inset-x-4 bottom-4 h-full max-h-32 flex items-end gap-2 px-2">
            {[20, 45, 25, 60, 35, 55].map((h, i) => (
                <motion.div
                    key={i}
                    initial={{ height: 0 }}
                    whileInView={{ height: `${h}%` }}
                    transition={{ delay: i * 0.1, type: "spring", stiffness: 100 }}
                    className="flex-1 bg-purple-100 rounded-t-lg relative overflow-hidden group cursor-pointer"
                >
                    <div className="absolute bottom-0 inset-x-0 bg-purple-500 rounded-t-lg h-full opacity-60 transition-all duration-300 group-hover:bg-purple-600 group-hover:opacity-100"></div>
                </motion.div>
            ))}
        </div>
    )
}

function CollabVisual() {
    return (
        <div className="absolute inset-x-2 sm:inset-x-4 bottom-3 sm:bottom-4 bg-white/80 backdrop-blur-sm rounded-xl border border-orange-100 p-3 sm:p-4 shadow-sm">
            <div className="flex -space-x-3 justify-center mb-3">
                {[1, 2, 3].map(i => (
                    <motion.div
                        key={i}
                        initial={{ y: 0 }}
                        animate={{ y: [0, -4, 0] }}
                        transition={{ repeat: Infinity, duration: 2, delay: i * 0.5, ease: "easeInOut" }}
                        className={`w-10 h-10 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold text-white shadow-md bg-gradient-to-br ${i === 1 ? 'from-orange-400 to-red-500' :
                            i === 2 ? 'from-blue-400 to-indigo-500 z-10' : 'from-green-400 to-emerald-500'
                            }`}
                    >
                        {i === 2 && <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>}
                        <Users className="w-4 h-4" />
                    </motion.div>
                ))}
            </div>
            <div className="text-center">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-50 rounded-full text-[10px] font-bold text-orange-600 border border-orange-200">
                    <Heart className="w-3 h-3 fill-orange-500 text-orange-500" />
                    Team Happy
                </span>
            </div>
        </div>
    )
}


export function FeatureSection() {
    return (
        <section id="features" className="py-16 sm:py-24 lg:py-32 bg-slate-50 overflow-hidden relative">
            {/* Warm Background Blobs */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-orange-100/40 rounded-full blur-[100px] pointer-events-none translate-x-1/3 -translate-y-1/3"></div>
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-100/40 rounded-full blur-[100px] pointer-events-none -translate-x-1/3 translate-y-1/3"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">

                {/* Header */}
                <div className="text-center mb-12 sm:mb-16 lg:mb-20 max-w-3xl mx-auto">
                    <FadeInView>
                        <Eyebrow text="Pourquoi Jokko ?" icon={<Zap className="w-3 h-3 text-orange-500" />} className="bg-orange-50 text-orange-700 border-orange-100" />
                    </FadeInView>
                    <FadeInView delay={0.2} className="mt-6">
                        <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-slate-900 tracking-tight leading-tight">
                            Tout ce dont vous avez besoin pour <br className="hidden sm:block" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-600">
                                Enchanter vos Clients
                            </span>
                        </h2>
                    </FadeInView>
                    <FadeInView delay={0.4}>
                        <p className="mt-4 sm:mt-6 text-base sm:text-lg lg:text-xl text-slate-600 leading-relaxed">
                            Plus qu'un outil, un véritable partenaire de croissance qui travaille 24/7 pour vous.
                        </p>
                    </FadeInView>
                </div>

                {/* Rich Bento Grid */}
                <StaggerContainer staggerDelay={0.1}>
                    <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8 h-auto lg:h-[650px]">

                        {/* FEATURE 1: Inbox (Large, Left) */}
                        <StaggerItem className="md:col-span-6 lg:col-span-7 lg:row-span-2 group">
                            <motion.div whileHover={{ y: -5 }} className="h-full">
                                <Card className="h-full border-none shadow-lg hover:shadow-2xl transition-all duration-500 bg-white relative overflow-hidden ring-1 ring-slate-900/5 group-hover:ring-orange-500/20">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 rounded-full blur-[60px] pointer-events-none"></div>

                                    <CardContent className="p-6 sm:p-8 lg:p-10 h-full flex flex-col relative z-20">
                                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center mb-6 shadow-lg shadow-blue-200">
                                            <MessageSquare className="w-7 h-7" />
                                        </div>
                                        <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2 sm:mb-3">Boîte de Réception Unifiée</h3>
                                        <p className="text-slate-600 text-sm sm:text-lg leading-relaxed max-w-md">
                                            Centralisez tous vos numéros WhatsApp Business. Assignez les conversations et ne perdez plus jamais le fil.
                                        </p>

                                        {/* Visual Representation */}
                                        <div className="flex-1 mt-6 sm:mt-10 relative h-[240px] sm:h-[280px] w-full perspective-1000">
                                            <InboxVisual />
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </StaggerItem>

                        {/* FEATURE 2: AI (Top Right) */}
                        <StaggerItem className="md:col-span-6 lg:col-span-5 group">
                            <motion.div whileHover={{ y: -5 }} className="h-full">
                                <Card className="h-full border-none shadow-lg hover:shadow-2xl transition-all duration-300 bg-white relative overflow-hidden ring-1 ring-slate-900/5 group-hover:ring-emerald-500/20">
                                    <CardContent className="p-5 sm:p-8 pb-0 h-full flex flex-col">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center mb-5 shadow-lg shadow-emerald-200">
                                                    <Sparkles className="w-6 h-6" />
                                                </div>
                                                <h3 className="text-xl font-bold text-slate-900">IA Générative</h3>
                                                <p className="text-slate-600 mt-2">Votre assistant qui ne dort jamais.</p>
                                            </div>
                                        </div>
                                        <div className="flex-1 relative min-h-[160px]">
                                            <AIVisual />
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </StaggerItem>

                        {/* FEATURE 4: Collaboration */}
                        <StaggerItem className="md:col-span-3 lg:col-span-3 group">
                            <motion.div whileHover={{ y: -5 }} className="h-full">
                                <Card className="h-full border-none shadow-lg hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-orange-50 to-amber-50 relative overflow-hidden ring-1 ring-orange-500/10">
                                    <div className="absolute inset-0 bg-white/40"></div>
                                    <CardContent className="p-6 h-full flex flex-col relative z-10">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 text-white flex items-center justify-center mb-4 shadow-lg shadow-orange-200">
                                            <Users className="w-6 h-6" />
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-900">Collaboration</h3>
                                        <p className="text-slate-600 text-sm">Travaillez ensemble.</p>
                                        <div className="flex-1 relative min-h-[120px] mt-2">
                                            <CollabVisual />
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </StaggerItem>

                        {/* FEATURE 3: Analytics (Smallest) */}
                        <StaggerItem className="md:col-span-3 lg:col-span-2 group">
                            <motion.div whileHover={{ y: -5 }} className="h-full">
                                <Card className="h-full border-none shadow-lg hover:shadow-2xl transition-all duration-300 bg-white relative overflow-hidden ring-1 ring-purple-500/10">
                                    <CardContent className="p-6 h-full flex flex-col">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 text-white flex items-center justify-center mb-4 shadow-lg shadow-purple-200">
                                            <LineChart className="w-6 h-6" />
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-900">KPIs</h3>
                                        <p className="text-slate-600 text-sm mb-4">Vue 360°.</p>
                                        <div className="flex-1 relative min-h-[120px]">
                                            <StatsVisual />
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </StaggerItem>

                    </div>
                </StaggerContainer>
            </div>
        </section>
    )
}

