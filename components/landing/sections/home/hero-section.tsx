"use client";

import { Button } from "@/components/ui/button"
import { Play, Sparkles, MessageCircle, ArrowRight } from "lucide-react"
import { AnimatedBadge, FadeInView, StaggerContainer, StaggerItem } from "@/components/animations"
import { PhoneMockup } from "@/components/landing/ui/phone-mockup"
import Link from "next/link"
import { motion } from "framer-motion"

export function HeroSection() {
    return (
        <section id="home" className="relative min-h-[90vh] flex items-center overflow-hidden bg-white pt-36 lg:pt-40">
            {/* ====================
                BACKGROUND ELEMENTS 
               ==================== */}
            {/* Gradient Mesh */}
            <div className="absolute inset-0 pointer-events-none">
                {/* Top Right Orb */}
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 90, 0],
                    }}
                    transition={{
                        duration: 20,
                        repeat: Infinity,
                        repeatType: "reverse"
                    }}
                    className="absolute -top-[20%] -right-[10%] w-[800px] h-[800px] bg-green-200/40 rounded-full blur-[100px] mix-blend-multiply"
                />
                {/* Bottom Left Orb */}
                <motion.div
                    animate={{
                        scale: [1, 1.3, 1],
                        x: [0, 50, 0],
                    }}
                    transition={{
                        duration: 25,
                        repeat: Infinity,
                        repeatType: "reverse"
                    }}
                    className="absolute -bottom-[20%] -left-[10%] w-[600px] h-[600px] bg-teal-200/40 rounded-full blur-[100px] mix-blend-multiply"
                />
                {/* Center Orb */}
                <motion.div
                    animate={{
                        opacity: [0.3, 0.6, 0.3],
                    }}
                    transition={{
                        duration: 10,
                        repeat: Infinity,
                        repeatType: "reverse"
                    }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-emerald-100/30 rounded-full blur-[80px] mix-blend-multiply"
                />
            </div>

            {/* Grid Pattern Overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px]"></div>


            {/* ====================
                CONTENT
               ==================== */}
            <div className="relative max-w-7xl mx-auto px-6 pb-16 lg:pt-0">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">

                    {/* LEFT: Text Content */}
                    <div className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-8 max-w-2xl mx-auto lg:mx-0">
                        {/* Badge */}
                        <FadeInView delay={0.1} trigger="mount">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 border border-green-100 text-green-700 shadow-sm">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                </span>
                                <span className="text-sm font-semibold tracking-wide uppercase">Nouvelle Génération</span>
                            </div>
                        </FadeInView>

                        {/* Title */}
                        <FadeInView delay={0.2} className="space-y-4" trigger="mount">
                            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-slate-900 leading-[1.1]">
                                Le Futur du <br />
                                <span className="text-transparent bg-clip-text bg-linear-to-r from-green-600 to-teal-500">
                                    Commerce WhatsApp
                                </span>
                            </h1>
                            <p className="text-lg md:text-xl text-slate-600 leading-relaxed max-w-lg mx-auto lg:mx-0">
                                Automatisez vos ventes, centralisez vos messages et fidélisez vos clients avec la plateforme WhatsApp la plus avancée du Sénégal.
                            </p>
                        </FadeInView>

                        {/* Buttons */}
                        <FadeInView delay={0.4} className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto" trigger="mount">
                            <Button size="lg" asChild className="h-14 px-8 rounded-full bg-green-600 hover:bg-green-700 text-white text-lg shadow-green-200/50 shadow-xl transition-all hover:-translate-y-1">
                                <Link href="/auth/sign-up">
                                    <span className="flex items-center gap-2">Essayer Gratuitement <ArrowRight className="w-5 h-5" /></span>
                                </Link>
                            </Button>
                            <Button size="lg" variant="outline" asChild className="h-14 px-8 rounded-full border-2 border-slate-200 text-slate-700 hover:border-green-600 hover:text-green-600 bg-white/50 backdrop-blur-sm text-lg transition-all">
                                <Link href="#demo">
                                    <span className="flex items-center gap-2"><Play className="w-5 h-5" /> Voir la démo</span>
                                </Link>
                            </Button>
                        </FadeInView>

                        {/* Trust */}
                        <FadeInView delay={0.6} className="pt-4 flex items-center gap-4 text-sm text-slate-500" trigger="mount">
                            <div className="flex -space-x-2">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-[10px] font-bold">
                                        {String.fromCharCode(64 + i)}
                                    </div>
                                ))}
                            </div>
                            <p>Déjà adopté par <span className="font-bold text-slate-900">500+ entreprises</span></p>
                        </FadeInView>
                    </div>

                    {/* RIGHT: Visual (Floating Phone) */}
                    <div className="hidden lg:flex justify-center items-center relative perspective-1000">
                        {/* Decorative Circle behind phone */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-green-100/50 rounded-full blur-3xl -z-10"></div>

                        <motion.div
                            animate={{
                                y: [-10, 10, -10],
                                rotate: [0, -1, 0, 1, 0]
                            }}
                            transition={{
                                duration: 6,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                        >
                            <PhoneMockup />
                        </motion.div>

                        {/* Floating Cards around Phone */}
                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 1 }}
                            className="absolute right-0 top-1/4 bg-white p-4 rounded-xl shadow-2xl border border-slate-100 max-w-[200px]"
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                    <Sparkles className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-900">IA Active</p>
                                    <p className="text-[10px] text-slate-500">Réponse auto générée</p>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 1.5 }}
                            className="absolute left-0 bottom-1/4 bg-white p-4 rounded-xl shadow-2xl border border-slate-100 max-w-[200px]"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-600">
                                    <MessageCircle className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-900">+150 Leads</p>
                                    <p className="text-[10px] text-slate-500">Aujourd'hui</p>
                                </div>
                            </div>
                        </motion.div>

                    </div>
                </div>
            </div>
        </section>
    )
}
