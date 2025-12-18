'use client'

import React from 'react'
import { Check, Minus, HelpCircle, Info } from 'lucide-react'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import { FadeInView } from '@/components/animations'

const features = [
    {
        category: 'Général',
        items: [
            { name: 'Utilisateurs inclus', starter: '1 (Vous)', business: '5', pro: '20', help: 'Nombre de personnes pouvant accéder au compte.' },
            { name: 'Numéros WhatsApp', starter: '1', business: '1', pro: '1', help: 'Nombre de numéros de téléphone connectables.' },
            { name: 'Contacts', starter: 'Illimité', business: 'Illimité', pro: 'Illimité', help: 'Nombre de contacts dans votre CRM.' },
            { name: 'Historique des messages', starter: '30 jours', business: 'Illimité', pro: 'Illimité', help: 'Durée de conservation des conversations.' },
        ]
    },
    {
        category: 'Messagerie & Diffusion',
        items: [
            { name: 'Boîte de réception unifiée', starter: true, business: true, pro: true, help: 'Message centralisés au même endroit.' },
            { name: 'Campagnes Marketing (Broadcast)', starter: false, business: 'Illimité', pro: 'Illimité', help: 'Envoi en masse. Les frais de conversation WhatsApp (Meta) sont à votre charge.' },
            { name: 'Segmentation avancée', starter: false, business: true, pro: true, help: 'Filtrez vos clients par tags et attributs.' },
            { name: 'Modèles de messages (Templates)', starter: 'Limité', business: 'Limité', pro: 'Limité', help: 'Modèles pré-approuvés par Meta.' },
            { name: 'Envoi de médias (Images, Vidéos, Docs)', starter: true, business: true, pro: true, help: 'Support de tous les fichiers.' },
        ]
    },
    {
        category: 'Automatisation & IA',
        items: [
            { name: 'Réponses rapides', starter: true, business: true, pro: true, help: 'Raccourcis clavier pour les messages fréquents.' },
            { name: 'Chatbot (Règles simples)', starter: false, business: true, pro: true, help: 'Automatisation basique par mots-clés.' },
            { name: 'Jokko AI (Assistant Intelligent)', starter: false, business: 'Option', pro: 'Inclus', help: 'IA générative qui répond à vos clients.' },
            { name: 'Flux de conversation (Flows)', starter: false, business: false, pro: true, help: 'Création de parcours clients complexes.' },
        ]
    },
    {
        category: 'Support & Technique',
        items: [
            { name: 'Support Client', starter: 'Email', business: 'Email & Chat', pro: 'Prioritaire 24/7' },
            { name: 'Onboarding assisté', starter: false, business: false, pro: true, help: 'Configuration initiale par nos experts.' },
            { name: 'API Access', starter: false, business: false, pro: true, help: 'Connectez Jokko à vos outils.' },
            { name: 'Webhooks', starter: false, business: true, pro: true, help: 'Recevez les événements en temps réel.' },
        ]
    }
]

export function PricingComparisonTable() {
    return (
        <section className="py-24 bg-white">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold text-slate-900 mb-4">Comparatif Détaillé</h2>
                    <p className="text-lg text-slate-600">Tout ce que vous devez savoir pour faire le bon choix.</p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px] border-collapse">
                        <thead>
                            <tr>
                                <th className="text-left py-4 px-6 w-1/4 bg-white sticky top-0 z-10"></th>
                                <th className="text-center py-4 px-6 w-1/4 bg-slate-50 rounded-t-xl text-lg font-bold text-slate-900">Starter</th>
                                <th className="text-center py-4 px-6 w-1/4 bg-green-50 rounded-t-xl text-lg font-bold text-green-700 border-t-2 border-green-500">Business</th>
                                <th className="text-center py-4 px-6 w-1/4 bg-slate-50 rounded-t-xl text-lg font-bold text-slate-900">Pro</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {features.map((section, sIndex) => (
                                <React.Fragment key={section.category}>
                                    <tr>
                                        <td colSpan={4} className="py-6 px-6 bg-white">
                                            <h3 className="text-lg font-bold text-slate-900">{section.category}</h3>
                                        </td>
                                    </tr>
                                    {section.items.map((item, iIndex) => (
                                        <tr key={item.name} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="py-4 px-6 text-slate-600 font-medium flex items-center gap-2">
                                                {item.name}
                                                {item.help && (
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger>
                                                                <Info className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p className="max-w-xs text-sm">{item.help}</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                )}
                                            </td>
                                            {['starter', 'business', 'pro'].map((plan) => {
                                                const value = (item as any)[plan]
                                                return (
                                                    <td key={plan} className={`text-center py-4 px-6 ${plan === 'business' ? 'bg-green-50/30' : ''}`}>
                                                        <div className="flex justify-center items-center">
                                                            {value === true ? (
                                                                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                                                                    <Check className="w-4 h-4 text-green-600" />
                                                                </div>
                                                            ) : value === false ? (
                                                                <Minus className="w-4 h-4 text-slate-300" />
                                                            ) : (
                                                                <span className="text-sm font-semibold text-slate-700">{value}</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                )
                                            })}
                                        </tr>
                                    ))}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    )
}
