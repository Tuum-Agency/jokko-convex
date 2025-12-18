import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Mentions Légales - Jokko',
    description: 'Informations légales sur la société Jokko.',
}

export default function LegalPage() {
    return (
        <div className="bg-slate-50 min-h-screen py-32">
            <div className="max-w-4xl mx-auto px-6">
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-12 md:p-20">
                    <h1 className="text-4xl font-bold text-slate-900 mb-8">Mentions Légales</h1>

                    <div className="prose prose-slate max-w-none text-slate-600">
                        <h3>Éditeur du site</h3>
                        <p>
                            Le site Jokko est édité par la société <strong>Jokko SAS</strong> (ou structure juridique à définir).<br />
                            Siège social : Dakar, Sénégal.<br />
                            Email : <a href="mailto:contact@jokko.co" className="text-green-600">contact@jokko.co</a>
                        </p>

                        <h3>Hébergement</h3>
                        <p>
                            Ce site et l'application sont hébergés sur des infrastructures cloud sécurisées (Vercel / AWS).
                        </p>

                        <h3>Propriété Intellectuelle</h3>
                        <p>
                            L'ensemble de ce site relève de la législation sur le droit d'auteur et la propriété intellectuelle.
                            Tous les droits de reproduction sont réservés.
                        </p>

                        <h3>Responsabilité</h3>
                        <p>
                            Jokko s'efforce d'assurer au mieux de ses possibilités, l'exactitude et la mise à jour des informations diffusées sur ce site.
                            Toutefois, nous ne pouvons garantir l'exactitude, la précision ou l'exhaustivité des informations mises à la disposition sur ce site.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
