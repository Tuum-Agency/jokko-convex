import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
    title: 'Conditions d\'Utilisation - Jokko',
    description: 'Conditions générales d\'utilisation de la plateforme Jokko.',
}

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Back link */}
                <Link
                    href="/"
                    className="inline-flex items-center text-sm text-gray-600 hover:text-green-600 mb-8 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Retour à l'accueil
                </Link>

                <div className="bg-white shadow-xl rounded-2xl border border-gray-100 overflow-hidden">
                    {/* Header Banner */}
                    <div className="bg-slate-900 px-8 py-10 text-white">
                        <h1 className="text-3xl md:text-4xl font-bold mb-4">Conditions d'Utilisation</h1>
                        <p className="text-slate-300 text-lg">
                            Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                    </div>

                    <div className="p-8 md:p-12 space-y-10 text-gray-700 leading-relaxed">

                        {/* 1. Acceptation */}
                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                1. Acceptation des conditions
                            </h2>
                            <p className="mb-4">
                                En accédant à la plateforme Jokko ("Service"), vous acceptez d'être lié par les présentes Conditions d'Utilisation ("Conditions").
                                Si vous n'acceptez pas ces termes, veuillez ne pas utiliser notre Service.
                            </p>
                        </section>

                        {/* 2. Description du Service */}
                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Description du Service</h2>
                            <p className="mb-4">
                                Jokko fournit une plateforme de messagerie multi-canaux pour entreprises, permettant la gestion des communications via WhatsApp Business API,
                                l'automatisation des réponses et l'analyse des données. Le Service inclut :
                            </p>
                            <ul className="list-disc ml-6 space-y-2">
                                <li>Interface de gestion de conversations.</li>
                                <li>Outils de campagnes marketing.</li>
                                <li>Intégrations CRM et Chatbots.</li>
                                <li>Analytiques et rapports de performance.</li>
                            </ul>
                        </section>

                        {/* 3. Comptes Utilisateur */}
                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Inscription et Compte</h2>
                            <p className="mb-4">Pour utiliser le Service, vous devez créer un compte. Vous êtes responsable de :</p>
                            <ul className="list-disc ml-6 space-y-2">
                                <li>Fournir des informations exactes et complètes.</li>
                                <li>Maintenir la confidentialité de vos identifiants.</li>
                                <li>Toutes les activités effectuées sous votre compte.</li>
                            </ul>
                        </section>

                        {/* 4. Utilisation Acceptable (WhatsApp Policy) */}
                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Usage Acceptable et Politique WhatsApp</h2>
                            <p className="mb-4">
                                Vous vous engagez à respecter les conditions de service de WhatsApp Business et la Politique de Commerce de WhatsApp.
                                Il est strictement interdit d'utiliser le Service pour :
                            </p>
                            <ul className="list-disc ml-6 space-y-2">
                                <li>Envoyer des messages non sollicités (SPAM).</li>
                                <li>Diffuser du contenu illégal, offensant ou frauduleux.</li>
                                <li>Vendre des produits ou services interdits par Meta.</li>
                                <li>Collecter des données utilisateurs sans consentement explicite.</li>
                            </ul>
                        </section>

                        {/* 5. Tarifs et Paiement */}
                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Tarifs et Paiement</h2>
                            <p className="mb-4">
                                Certains aspects du Service sont payants. Les tarifs sont affichés sur notre site et peuvent être modifiés avec un préavis de 30 jours.
                                Les paiements sont non-remboursables, sauf disposition légale contraire.
                            </p>
                        </section>

                        {/* 6. Propriété Intellectuelle */}
                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Propriété Intellectuelle</h2>
                            <p>
                                Le Service et son contenu original (fonctionnalités, design, code) sont et resteront la propriété exclusive de Jokko et de ses concédants.
                            </p>
                        </section>

                        {/* 7. Limitation de Responsabilité */}
                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Limitation de Responsabilité</h2>
                            <p className="mb-4">
                                Jokko ne pourra être tenu responsable des dommages indirects, pertes de données ou interruptions de service,
                                notamment ceux liés à des dysfonctionnements de l'API WhatsApp ou de services tiers (Meta).
                            </p>
                        </section>

                        {/* 8. Contact */}
                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Nous contacter</h2>
                            <p className="mb-2">
                                Pour toute question concernant ces Conditions, veuillez nous contacter :
                            </p>
                            <address className="not-italic bg-gray-50 p-6 rounded-xl border border-gray-100">
                                <strong className="text-gray-900 block mb-2">Support Jokko</strong>
                                <span className="block mb-1">Email : legal@jokko.com</span>
                            </address>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    )
}
