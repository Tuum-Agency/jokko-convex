
"use client";


import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FadeInView, SlideInView, StaggerContainer, StaggerItem, ScaleInView } from '@/components/animations'
import { MessageCircle, ArrowRight, Zap, CheckCircle2, Star, Calendar } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { WaitingListDialog } from '@/components/landing/waiting-list-dialog'


function BackgroundBeams() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Dark Gradient Background */}
            <div className="absolute inset-0 bg-slate-950"></div>

            {/* Animated Beams */}
            <div className="absolute -top-[50%] -left-[10%] w-[1000px] h-[1000px] bg-green-500/20 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute -bottom-[50%] -right-[10%] w-[1000px] h-[1000px] bg-emerald-600/10 rounded-full blur-[120px]"></div>

            {/* Particles/Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]"></div>
        </div>
    )
}

export function CtaSection() {

    return (
        <section className="relative py-16 sm:py-24 lg:py-32 overflow-hidden text-white">
            <BackgroundBeams />

            <div className="container relative z-10 mx-auto px-4 sm:px-6 max-w-5xl">
                <div className="text-center space-y-12">

                    {/* Badge */}
                    <FadeInView delay={0.2} className="flex justify-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700 backdrop-blur-md shadow-xl text-green-400 font-medium text-sm">
                            <Star className="w-4 h-4 fill-green-400 text-green-400" />
                            <span className="text-white">Accès en avant-première</span>
                        </div>
                    </FadeInView>

                    {/* Headline */}
                    <FadeInView delay={0.4} className="space-y-6">
                        <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold tracking-tight leading-tight">
                            Prêt à révolutionner votre <br className="hidden md:block" />
                            <span className="text-transparent bg-clip-text bg-linear-to-r from-green-400 via-emerald-400 to-teal-400 animate-gradient-x">
                                Business WhatsApp ?
                            </span>
                        </h2>
                        <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
                            Ne laissez plus aucune vente vous échapper. Centralisez, Automatisez et Vendez plus. <br />
                            <span className="text-white font-medium">Commencez gratuitement aujourd'hui.</span>
                        </p>
                    </FadeInView>

                    {/* Buttons */}
                    <StaggerContainer staggerDelay={0.15} delayChildren={0.6}>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <StaggerItem>
                                <WaitingListDialog>
                                    <Button size="lg" className="h-12 px-8 rounded-full bg-white hover:bg-slate-100 text-slate-900 text-base font-bold transition-all duration-300 transform hover:scale-105 shadow-[0_0_20px_-5px_rgba(74,222,128,0.4)] hover:shadow-[0_0_30px_-10px_rgba(74,222,128,0.6)]">
                                        <Zap className="w-5 h-5 mr-2 text-green-600 fill-green-600" />
                                        Rejoindre la liste d'attente
                                    </Button>
                                </WaitingListDialog>
                            </StaggerItem>

                        </div>
                    </StaggerContainer>

                    {/* Trust Indicators */}
                    <FadeInView delay={0.8} className="pt-8 border-t border-slate-800/50 mt-12 max-w-3xl mx-auto">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-slate-400 overflow-hidden">
                            {[
                                "Pas de carte requise",
                                "Setup en 2 minutes",
                                "Support 24/7",
                                "Annulable à tout moment"
                            ].map((text, i) => (
                                <div key={i} className="flex items-center justify-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                                    <span>{text}</span>
                                </div>
                            ))}
                        </div>
                    </FadeInView>

                    {/* Payment Methods */}
                    <FadeInView delay={1.0} className="flex flex-col items-center gap-4 mt-8 opacity-80">
                        <span className="text-sm text-slate-500 uppercase tracking-widest font-semibold">Moyens de paiement acceptés</span>
                        <div className="flex flex-wrap justify-center gap-3">
                            <div className="px-3 py-1 rounded bg-slate-700/50 border border-slate-600 text-slate-300 text-xs font-bold tracking-wide flex items-center gap-1">
                                <span>💳</span> CARTE BANCAIRE
                            </div>
                            <div className="px-3 py-1 rounded bg-orange-500/10 border border-orange-500/20 text-orange-500 text-xs font-bold tracking-wide">
                                ORANGE MONEY
                            </div>
                            <div className="px-3 py-1 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold tracking-wide">
                                WAVE
                            </div>
                            <div className="px-3 py-1 rounded bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold tracking-wide">
                                FREE MONEY
                            </div>
                        </div>
                    </FadeInView>


                </div>
            </div>
        </section>
    )
}
