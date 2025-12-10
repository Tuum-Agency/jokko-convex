import { Metadata } from 'next'
import { Mail, MessageCircle, Globe, Clock, CheckCircle } from 'lucide-react'
import { ContactForm } from '@/components/landing/sections/contact-form'

export const metadata: Metadata = {
    title: 'Contact - Jokko | Nous contacter',
    description: 'Contactez notre équipe Jokko pour toute question sur votre plateforme WhatsApp Business',
}

export default function ContactPage() {

    return (

        <>
            {/* Simple title section */}
            <section className="pt-32 pb-16" aria-labelledby="contact-title">
                <div className="max-w-6xl mx-auto px-4 text-center">
                    <h1 id="contact-title" className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                        Nous contacter
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Notre équipe est là pour vous accompagner. Choisissez le moyen le plus adapté à vos besoins.
                    </p>
                </div>
            </section>

            {/* Contact Form */}
            <section className="pb-16">
                <div className="max-w-3xl mx-auto px-4">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-semibold text-gray-900 mb-4">Envoyez-nous un message</h2>
                        <p className="text-lg text-gray-600">
                            Remplissez le formulaire ci-dessous et nous vous répondrons rapidement.
                        </p>
                    </div>
                    <ContactForm />
                </div>
            </section>

            {/* Contact Options */}
            <section className="pb-24 bg-gray-50">
                <div className="max-w-6xl mx-auto px-4 pt-16">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-semibold text-gray-900 mb-4">Autres moyens de contact</h2>
                        <p className="text-lg text-gray-600">
                            Préférez-vous nous contacter directement ? Choisissez la méthode qui vous convient.
                        </p>
                    </div>
                    <div className="grid gap-8 md:grid-cols-2">
                        {/* Support Général */}
                        <div className="bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-lg transition-shadow">
                            <div className="flex items-center mb-6">
                                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mr-4">
                                    <Mail className="w-6 h-6 text-green-600" />
                                </div>
                                <h2 className="text-2xl font-semibold text-gray-900">Support Général</h2>
                            </div>
                            <p className="text-gray-600 mb-6">
                                Questions techniques, aide sur votre compte ou assistance générale.
                            </p>
                            <div className="space-y-3">
                                <div>
                                    <p className="font-medium text-gray-900 mb-1">Email :</p>
                                    <a href="mailto:support@jokko.co" className="text-green-600 hover:text-green-700 font-medium">
                                        support@jokko.co
                                    </a>
                                </div>
                                <p className="text-sm text-gray-500">
                                    Réponse sous 24h • Lundi - Vendredi 9h-18h
                                </p>
                            </div>
                        </div>

                        {/* Ventes & Démonstrations */}
                        <div className="bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-lg transition-shadow">
                            <div className="flex items-center mb-6">
                                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mr-4">
                                    <MessageCircle className="w-6 h-6 text-blue-600" />
                                </div>
                                <h2 className="text-2xl font-semibold text-gray-900">Ventes & Démonstrations</h2>
                            </div>
                            <p className="text-gray-600 mb-6">
                                Tarifs, fonctionnalités, démonstration personnalisée ou solutions entreprise.
                            </p>
                            <div className="space-y-3">
                                <div>
                                    <p className="font-medium text-gray-900 mb-1">Email :</p>
                                    <a href="mailto:sales@jokko.co" className="text-blue-600 hover:text-blue-700 font-medium">
                                        sales@jokko.co
                                    </a>
                                </div>
                                <p className="text-sm text-gray-500">
                                    Réponse le jour même • Lundi - Vendredi 9h-19h
                                </p>
                            </div>
                        </div>

                        {/* Support Urgence */}
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-8">
                            <div className="flex items-center mb-6">
                                <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center mr-4">
                                    <Clock className="w-6 h-6 text-white" />
                                </div>
                                <h2 className="text-2xl font-semibold text-gray-900">Support Prioritaire</h2>
                            </div>
                            <p className="text-gray-600 mb-6">
                                Pour les problèmes critiques affectant vos opérations business.
                            </p>
                            <div className="space-y-3">
                                <div>
                                    <p className="font-medium text-gray-900 mb-1">Email prioritaire :</p>
                                    <a href="mailto:urgent@jokko.co" className="text-green-600 hover:text-green-700 font-medium">
                                        urgent@jokko.co
                                    </a>
                                </div>
                                <p className="text-sm text-gray-500">
                                    Disponible 24h/24 pour les clients Pro et Enterprise
                                </p>
                            </div>
                        </div>

                        {/* Juridique & Conformité */}
                        <div className="bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-lg transition-shadow">
                            <div className="flex items-center mb-6">
                                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mr-4">
                                    <Globe className="w-6 h-6 text-purple-600" />
                                </div>
                                <h2 className="text-2xl font-semibold text-gray-900">Juridique & Conformité</h2>
                            </div>
                            <p className="text-gray-600 mb-6">
                                Questions RGPD, données personnelles, conformité ou aspects légaux.
                            </p>
                            <div className="space-y-3">
                                <div>
                                    <p className="font-medium text-gray-900 mb-1">Email :</p>
                                    <a href="mailto:legal@jokko.co" className="text-purple-600 hover:text-purple-700 font-medium">
                                        legal@jokko.co
                                    </a>
                                </div>
                                <p className="text-sm text-gray-500">
                                    Réponse sous 48h • Consultations spécialisées
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Conseils avant contact */}
                    <div className="mt-16 bg-white rounded-2xl p-8 border border-gray-200">
                        <h3 className="text-xl font-semibold text-gray-900 mb-4">Avant de nous contacter</h3>
                        <p className="text-gray-600 mb-6">
                            Pour nous aider à vous répondre plus rapidement :
                        </p>
                        <div className="grid md:grid-cols-2 gap-4">
                            <ul className="space-y-2 text-gray-600">
                                <li className="flex items-start">
                                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                                    Vérifiez vos spams/indésirables
                                </li>
                                <li className="flex items-start">
                                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                                    Indiquez votre email de compte
                                </li>
                            </ul>
                            <ul className="space-y-2 text-gray-600">
                                <li className="flex items-start">
                                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                                    Décrivez précisément votre problème
                                </li>
                                <li className="flex items-start">
                                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                                    Joignez des captures d'écran si utile
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>
        </>

    )
}
