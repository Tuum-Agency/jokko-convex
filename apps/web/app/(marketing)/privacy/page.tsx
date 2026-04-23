import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
    title: 'Politique de Confidentialité - Jokko',
    description: 'Politique de confidentialité et protection des données personnelles de Jokko.',
}

export default function PrivacyPage() {
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
                    <div className="bg-green-600 px-8 py-10 text-white">
                        <h1 className="text-3xl md:text-4xl font-bold mb-4">Politique de Confidentialité</h1>
                        <p className="text-green-100 text-lg">
                            Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                    </div>

                    <div className="p-8 md:p-12 space-y-10 text-gray-700 leading-relaxed">

                        {/* 1. Introduction */}
                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                1. Introduction
                            </h2>
                            <p className="mb-4">
                                Bienvenue sur Jokko ("nous", "notre", "nos"). Nous nous engageons à protéger votre vie privée et vos données personnelles.
                                Cette politique de confidentialité explique comment nous collectons, utilisons, divulguons et protégeons vos informations
                                lorsque vous utilisez notre application web et nos services d'intégration WhatsApp Business (le "Service").
                            </p>
                            <p>
                                En utilisant Jokko, vous acceptez les pratiques décrites dans cette politique. Si vous n'êtes pas d'accord, veuillez ne pas utiliser notre Service.
                            </p>
                        </section>

                        {/* 2. Données collectées */}
                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Les Données que nous collectons</h2>
                            <p className="mb-4">Nous collectons différents types d'informations pour fournir et améliorer notre Service :</p>

                            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-2">a. Informations que vous nous fournissez</h3>
                            <ul className="list-disc ml-6 space-y-2 mb-4">
                                <li><strong>Informations de compte :</strong> Nom, adresse email, numéro de téléphone, nom de l'entreprise.</li>
                                <li><strong>Identifiants WhatsApp :</strong> Token d'accès WhatsApp Business API, Numéro de téléphone WhatsApp Business (WABA ID).</li>
                                <li><strong>Contenu des communications :</strong> Messages, modèles de messages et contacts importés pour l'usage du service.</li>
                            </ul>

                            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-2">b. Informations collectées automatiquement</h3>
                            <ul className="list-disc ml-6 space-y-2 mb-4">
                                <li><strong>Données d'utilisation :</strong> Journaux d'accès, interactions avec l'interface, temps de connexion.</li>
                                <li><strong>Données techniques :</strong> Adresse IP, type de navigateur, système d'exploitation.</li>
                            </ul>
                        </section>

                        {/* 3. Utilisation des données */}
                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Comment nous utilisons vos données</h2>
                            <p className="mb-4">Vos données sont utilisées pour les finalités suivantes :</p>
                            <ul className="list-disc ml-6 space-y-2">
                                <li>Fournir, exploiter et maintenir notre Service.</li>
                                <li>Faciliter l'intégration avec l'API WhatsApp Business via <strong>Meta Platforms, Inc</strong>.</li>
                                <li>Gérer votre compte et vos abonnements.</li>
                                <li>Améliorer l'expérience utilisateur et résoudre les problèmes techniques.</li>
                                <li>Communiquer avec vous (mises à jour, alertes de sécurité, support).</li>
                                <li>Se conformer aux obligations légales.</li>
                            </ul>
                        </section>

                        {/* 4. Partage des données */}
                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Partage et divulgation des données</h2>
                            <p className="mb-4">Nous ne vendons jamais vos données personnelles. Nous pouvons partager vos informations avec :</p>
                            <ul className="list-disc ml-6 space-y-2">
                                <li><strong>Fournisseurs de services tiers :</strong> Tels que AWS (hébergement), Convex (base de données) qui nous aident à exploiter le Service.</li>
                                <li><strong>Meta (WhatsApp) :</strong> Nécessaire pour le fonctionnement de la messagerie WhatsApp Business. Le traitement des messages est soumis aux conditions de Meta.</li>
                                <li><strong>Autorités légales :</strong> Si requis par la loi ou pour protéger nos droits.</li>
                            </ul>
                        </section>

                        {/* 5. Sécurité des données */}
                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Sécurité des données</h2>
                            <p>
                                Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles appropriées (chiffrement TLS/SSL, contrôles d'accès stricts)
                                pour protéger vos données contre l'accès non autorisé, la perte ou l'altération.
                            </p>
                        </section>

                        {/* 6. Conservation des données */}
                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Conservation des données</h2>
                            <p>
                                Nous conservons vos informations personnelles aussi longtemps que nécessaire pour les finalités énoncées dans cette politique,
                                à moins qu'une période de conservation plus longue ne soit requise ou permise par la loi. Vous pouvez demander la suppression de vos données à tout moment.
                            </p>
                        </section>

                        {/* 7. Vos droits (RGPD) */}
                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Vos droits (RGPD & Confidentialité)</h2>
                            <p className="mb-4">
                                Conformément aux lois sur la protection des données, vous disposez des droits suivants :
                            </p>
                            <ul className="list-disc ml-6 space-y-2">
                                <li><strong>Droit d'accès :</strong> Obtenir une copie de vos données.</li>
                                <li><strong>Droit de rectification :</strong> Corriger des données inexactes.</li>
                                <li><strong>Droit à l'effacement :</strong> Demander la suppression de vos données ("Droit à l'oubli").</li>
                                <li><strong>Droit à la limitation :</strong> Limiter le traitement de vos données.</li>
                                <li><strong>Droit à l'opposition :</strong> Vous opposer au traitement de vos données.</li>
                            </ul>
                            <p className="mt-4 p-4 bg-green-50 rounded-lg border border-green-100">
                                Pour exercer ces droits ou demander la suppression définitive de vos données, contactez notre Délégué à la Protection des Données (DPO) :
                                <br />
                                <a href="mailto:privacy@jokko.com" className="font-bold text-green-700 hover:underline mt-1 inline-block">privacy@jokko.com</a>
                            </p>
                        </section>

                        {/* 8. Modifications */}
                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Modifications de cette politique</h2>
                            <p>
                                Nous pouvons mettre à jour cette politique de confidentialité de temps à autre. Nous vous informerons de tout changement important
                                en publiant la nouvelle politique sur cette page et en mettant à jour la date de "Dernière mise à jour".
                            </p>
                        </section>

                        {/* 9. Contact */}
                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Nous contacter</h2>
                            <p className="mb-2">
                                Pour toute question concernant cette politique de confidentialité, veuillez nous contacter :
                            </p>
                            <address className="not-italic bg-gray-50 p-6 rounded-xl border border-gray-100">
                                <strong className="text-gray-900 block mb-2">Jokko Inc.</strong>
                                <span className="block mb-1">Email : hello@jokko.com</span>
                                <span className="block">Dakar, Sénégal</span>
                            </address>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    )
}
