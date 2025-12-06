import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FadeInView, SlideInView, StaggerContainer, StaggerItem, ScaleInView } from '@/components/animations'
import { MessageCircle, ArrowRight, Sparkles } from 'lucide-react'
import Link from 'next/link'

export function CtaSection() {
    return (
        <section className="py-16 md:py-24 bg-muted/30">
            <div className="container mx-auto px-4 max-w-4xl">
                <div className="text-center space-y-8">
                    {/* Modern Badge */}
                    <FadeInView delay={0.2}>
                        <Badge variant="secondary" className="mb-4">
                            <Sparkles className="w-4 h-4 mr-2" />
                            Plateforme WhatsApp Business N°1
                        </Badge>
                    </FadeInView>

                    {/* Right-sized Headlines */}
                    <div className="space-y-4">
                        <FadeInView delay={0.4}>
                            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                                Transformez votre
                                <span className="text-primary block">
                                    Communication Client
                                </span>
                            </h2>
                        </FadeInView>
                        <FadeInView delay={0.6}>
                            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                                Rejoignez plus de 10 000 entreprises qui automatisent leurs conversations WhatsApp avec l&apos;IA.
                            </p>
                        </FadeInView>
                    </div>

                    {/* Clean Stats */}
                    <StaggerContainer staggerDelay={0.15} delayChildren={0.8}>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
                            <StaggerItem>
                                <ScaleInView>
                                    <div className="text-center">
                                        <div className="text-3xl font-bold text-foreground mb-1">10 000+</div>
                                        <div className="text-sm text-muted-foreground">Entreprises Actives</div>
                                    </div>
                                </ScaleInView>
                            </StaggerItem>
                            <StaggerItem>
                                <ScaleInView>
                                    <div className="text-center">
                                        <div className="text-3xl font-bold text-foreground mb-1">50M+</div>
                                        <div className="text-sm text-muted-foreground">Messages Traités</div>
                                    </div>
                                </ScaleInView>
                            </StaggerItem>
                            <StaggerItem>
                                <ScaleInView>
                                    <div className="text-center">
                                        <div className="text-3xl font-bold text-foreground mb-1">99,9%</div>
                                        <div className="text-sm text-muted-foreground">Garantie de Disponibilité</div>
                                    </div>
                                </ScaleInView>
                            </StaggerItem>
                        </div>
                    </StaggerContainer>

                    {/* Standard Button Sizing */}
                    <StaggerContainer staggerDelay={0.15} delayChildren={1.2}>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <StaggerItem>
                                <Button size="lg" asChild>
                                    <Link href="/auth/sign-up">
                                        Commencer l&apos;Essai Gratuit
                                        <ArrowRight className="w-4 h-4 ml-2" />
                                    </Link>
                                </Button>
                            </StaggerItem>
                            <StaggerItem>
                                <Button size="lg" variant="outline" asChild>
                                    <Link href="/contact">
                                        <MessageCircle className="w-4 h-4 mr-2" />
                                        Parler aux Ventes
                                    </Link>
                                </Button>
                            </StaggerItem>
                        </div>
                    </StaggerContainer>

                    {/* Simple Trust Indicators */}
                    <SlideInView direction="up" delay={1.5}>
                        <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
                            <span>✓ Essai gratuit 14 jours</span>
                            <span>✓ Aucune carte de crédit requise</span>
                            <span>✓ Configuration en 5 minutes</span>
                            <span>✓ Annulation à tout moment</span>
                        </div>
                    </SlideInView>
                </div>
            </div>
        </section>
    )
}
