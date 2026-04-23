import { Metadata } from 'next'
import { Mail, MessageCircle, Globe, Clock, ArrowRight } from 'lucide-react'
import { ContactForm } from '@/components/landing/sections/contact-form'
import { FaqSection } from '@/components/landing/sections/home'

export const metadata: Metadata = {
    title: 'Contact - Jokko | Nous contacter',
    description: 'Contactez notre équipe Jokko pour toute question sur votre plateforme WhatsApp Business',
}

export default function ContactPage() {
    return (
        <>
            <section className="pt-32 pb-24 bg-slate-50 relative overflow-hidden">
                {/* Decoration */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-green-200/20 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/2"></div>

                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="text-center mb-16 max-w-2xl mx-auto">
                        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 tracking-tight">
                            Entrons en contact
                        </h1>
                        <p className="text-lg text-slate-600">
                            Une question sur nos tarifs, une demande de démo ou besoin d&apos;aide ?
                            Notre équipe est là pour vous répondre rapidement.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-start">
                        {/* LEFT COLUMN: Info & Direct Contacts (2 cols width) */}
                        <div className="lg:col-span-2 space-y-8">

                            {/* Card: Sales */}
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                                        <MessageCircle className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 mb-1">Commercial & Démo</h3>
                                        <p className="text-sm text-slate-600 mb-3">Pour discuter de vos besoins ou voir Jokko en action.</p>
                                        <a href="mailto:sales@jokko.co" className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 group">
                                            sales@jokko.co <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                        </a>
                                    </div>
                                </div>
                            </div>

                            {/* Card: Support */}
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                                        <Mail className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 mb-1">Support Client</h3>
                                        <p className="text-sm text-slate-600 mb-3">Une question technique ou un souci avec votre compte ?</p>
                                        <a href="mailto:support@jokko.co" className="text-sm font-semibold text-green-600 hover:text-green-700 flex items-center gap-1 group">
                                            support@jokko.co <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                        </a>
                                    </div>
                                </div>
                            </div>

                            {/* Card: Legal */}
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                                        <Globe className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 mb-1">Légal & Conformité</h3>
                                        <p className="text-sm text-slate-600 mb-3">Questions sur le RGPD ou vos données.</p>
                                        <a href="mailto:legal@jokko.co" className="text-sm font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-1 group">
                                            legal@jokko.co <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                        </a>
                                    </div>
                                </div>
                            </div>

                            {/* Tips Section */}
                            <div className="mt-8 pt-8 border-t border-slate-200">
                                <h4 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-slate-500" />
                                    Horaires d&apos;ouverture
                                </h4>
                                <p className="text-sm text-slate-600 mb-2">
                                    <span className="font-medium text-slate-900">Lundi - Vendredi :</span> 09h00 - 18h00
                                </p>
                                <p className="text-sm text-slate-600">
                                    Nous essayons de répondre à tous les messages sous 24h ouvrées.
                                </p>
                            </div>

                        </div>

                        {/* RIGHT COLUMN: Form (3 cols width) */}
                        <div className="lg:col-span-3">
                            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-1 border border-slate-100">
                                <ContactForm />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ Section Reuse */}
            <FaqSection />
        </>

    )
}
