import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Politique de Confidentialité - Jokko',
    description: 'Comment nous protégeons vos données et votre vie privée.',
}

export default function PrivacyPage() {
    return (
        <div className="bg-slate-50 min-h-screen py-32">
            <div className="max-w-4xl mx-auto px-6">
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-12 md:p-20">
                    <h1 className="text-4xl font-bold text-slate-900 mb-8">Politique de Confidentialité</h1>

                    <div className="prose prose-slate max-w-none text-slate-600">
                        <p className="lead">
                            Dernière mise à jour : 12 Décembre 2024
                        </p>

                        <h3>1. Introduction</h3>
                        <p>
                            Chez Jokko ("nous", "notre"), nous prenons votre vie privée très au sérieux.
                            Cette politique décrit comment nous collectons, utilisons et protégeons vos données lorsque vous utilisez notre plateforme WhatsApp Business.
                        </p>

                        <h3>2. Données collectées</h3>
                        <ul>
                            <li><strong>Informations de compte :</strong> Nom, email, numéro de téléphone, nom de l'entreprise.</li>
                            <li><strong>Données WhatsApp :</strong> Numéro WhatsApp Business connecté, messages (traités pour l'affichage mais non stockés à des fins autres que le service).</li>
                            <li><strong>Métadonnées :</strong> Logs de connexion, type d'appareil, adresse IP.</li>
                        </ul>

                        <h3>3. Utilisation des données</h3>
                        <p>
                            Nous utilisons vos données uniquement pour :
                        </p>
                        <ul>
                            <li>Fournir le service Jokko (envoi/réception de messages).</li>
                            <li>Améliorer nos fonctionnalités.</li>
                            <li>Vous contacter pour le support ou la facturation.</li>
                        </ul>
                        <p>
                            <strong>Nous ne vendons jamais vos données à des tiers.</strong>
                        </p>

                        <h3>4. Sécurité</h3>
                        <p>
                            Toutes les communications entre vous, nous et Meta (WhatsApp) sont chiffrées.
                            Nos serveurs sont sécurisés et accessibles uniquement par le personnel autorisé.
                        </p>

                        <h3>5. Vos droits</h3>
                        <p>
                            Conformément au RGPD, vous disposez d'un droit d'accès, de rectification et de suppression de vos données.
                            Contactez-nous à <a href="mailto:privacy@jokko.co" className="text-green-600 font-medium">privacy@jokko.co</a> pour exercer ces droits.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
