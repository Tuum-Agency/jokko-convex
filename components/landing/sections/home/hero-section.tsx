import { Button } from "@/components/ui/button"
import { Play, Sparkles, MessageCircle } from "lucide-react"
import { AnimatedBadge, FadeInView, StaggerContainer, StaggerItem } from "@/components/animations"
import Link from "next/link"

export function HeroSection() {
    return (
        <section id="home" className="relative pt-32 pb-16 bg-linear-to-br from-green-50 via-white to-green-50">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

            <div className="relative max-w-6xl mx-auto px-4">
                <div className="flex flex-col items-center gap-12">
                    {/* Hero Content */}
                    <div className="max-w-4xl flex flex-col items-center gap-8">
                        {/* WhatsApp Badge */}
                        <FadeInView delay={0.2}>
                            <AnimatedBadge
                                text="Plateforme WhatsApp Business"
                                icon={<MessageCircle className="w-4 h-4 text-green-600" />}
                            />
                        </FadeInView>

                        <div className="flex flex-col items-center gap-6">
                            <FadeInView delay={0.4}>
                                <h1 className="max-w-4xl lg:max-w-7xl text-center text-gray-900 text-4xl md:text-6xl lg:text-7xl font-bold leading-tight">
                                    Transformez Vos{" "}
                                    <span className="text-green-600 relative">
                                        Communications WhatsApp
                                        <div className="absolute -bottom-2 left-0 right-0 h-1 bg-green-600/20 rounded-full"></div>
                                    </span>{" "}
                                    Business
                                </h1>
                            </FadeInView>

                            <FadeInView delay={0.6}>
                                <p className="max-w-2xl text-center text-gray-600 text-lg md:text-xl leading-relaxed">
                                    Centralisez vos conversations, automatisez vos réponses et développez votre support client avec notre plateforme WhatsApp Business alimentée par l&apos;IA. Commencez votre essai gratuit de 14 jours dès aujourd&apos;hui.
                                </p>
                            </FadeInView>
                        </div>

                        {/* Trust Indicators */}
                        <StaggerContainer delayChildren={0.8} staggerDelay={0.1}>
                            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
                                <StaggerItem>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        <span>Essai gratuit 14 jours</span>
                                    </div>
                                </StaggerItem>
                                <StaggerItem>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        <span>Aucune carte bancaire requise</span>
                                    </div>
                                </StaggerItem>
                                <StaggerItem>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        <span>Annulation à tout moment</span>
                                    </div>
                                </StaggerItem>
                            </div>
                        </StaggerContainer>
                    </div>

                    {/* CTA Buttons */}
                    <StaggerContainer delayChildren={1.0} staggerDelay={0.15}>
                        <div className="flex flex-col sm:flex-row gap-4 items-center w-full max-w-xs sm:max-w-none">
                            <StaggerItem className="w-full sm:w-auto">
                                <Button
                                    asChild
                                    size="lg"
                                    className="w-full sm:w-64 h-12 px-8 bg-linear-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-full font-semibold text-base shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden group"
                                >
                                    <Link href="/auth/sign-up">
                                        <span className="relative z-10 flex items-center justify-center">
                                            Commencer l&apos;Essai Gratuit
                                        </span>
                                        {/* Effet de brillance */}
                                        <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -skew-x-12 group-hover:translate-x-full transition-transform duration-700" />
                                    </Link>
                                </Button>
                            </StaggerItem>

                            <StaggerItem className="w-full sm:w-auto">
                                <Button
                                    variant="outline"
                                    size="lg"
                                    className="w-full sm:w-64 h-12 px-8 border-2 border-gray-300 hover:border-green-600 rounded-full font-semibold text-base"
                                >
                                    <Play className="w-4 h-4 mr-2" />
                                    Voir la Démo
                                </Button>
                            </StaggerItem>
                        </div>
                    </StaggerContainer>

                    {/* Social Proof */}
                    <div className="flex flex-col items-center gap-4 mt-8">
                        <p className="text-sm text-gray-500">Approuvé par plus de 10 000 entreprises dans le monde</p>
                        <div className="flex items-center gap-8 opacity-60">
                            <div className="text-gray-400 font-semibold">Entreprise A</div>
                            <div className="text-gray-400 font-semibold">Entreprise B</div>
                            <div className="text-gray-400 font-semibold">Entreprise C</div>
                            <div className="text-gray-400 font-semibold">Entreprise D</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
