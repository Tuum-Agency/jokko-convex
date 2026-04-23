/**
 * Static marketing content for the pricing comparison table.
 *
 * Plan limits and pricing are now served from the Convex `plans` table.
 * See lib/plan-utils.ts for frontend helpers and hooks/usePlans.ts for React hooks.
 */

export interface ComparisonFeature {
    name: string;
    help?: string;
    starter: string | boolean;
    business: string | boolean;
    pro: string | boolean;
}

export interface ComparisonCategory {
    category: string;
    items: ComparisonFeature[];
}

export const COMPARISON_TABLE: ComparisonCategory[] = [
    {
        category: "Général",
        items: [
            { name: "Agents (Utilisateurs)", starter: "1", business: "5", pro: "20", help: "Nombre de personnes pouvant accéder au compte." },
            { name: "Numéros WhatsApp", starter: "1", business: "3", pro: "10", help: "Nombre de numéros de téléphone connectables." },
            { name: "Conversations/mois", starter: "1 000", business: "5 000", pro: "10 000", help: "Conversations de service incluses par mois." },
            { name: "Contacts", starter: "Illimité", business: "Illimité", pro: "Illimité", help: "Nombre de contacts dans votre CRM." },
            { name: "Historique des messages", starter: "30 jours", business: "Illimité", pro: "Illimité", help: "Durée de conservation des conversations." },
        ],
    },
    {
        category: "Messagerie & Diffusion",
        items: [
            { name: "Boîte de réception unifiée", starter: true, business: true, pro: true, help: "Messages centralisés au même endroit." },
            { name: "Campagnes Marketing (Broadcast)", starter: false, business: "Illimité", pro: "Illimité", help: "Envoi en masse. Les frais de conversation WhatsApp (Meta) sont à votre charge." },
            { name: "Segmentation avancée", starter: false, business: true, pro: true, help: "Filtrez vos clients par tags et attributs." },
            { name: "Modèles de messages (Templates)", starter: "5", business: "20", pro: "Illimité", help: "Modèles pré-approuvés par Meta." },
            { name: "Envoi de médias (Images, Vidéos, Docs)", starter: true, business: true, pro: true, help: "Support de tous les fichiers." },
        ],
    },
    {
        category: "Automatisation & IA",
        items: [
            { name: "Réponses rapides", starter: true, business: true, pro: true, help: "Raccourcis clavier pour les messages fréquents." },
            { name: "Chatbot (Règles simples)", starter: false, business: true, pro: true, help: "Automatisation basique par mots-clés." },
            { name: "Jokko AI (Assistant Intelligent)", starter: false, business: false, pro: "Inclus", help: "IA générative qui répond à vos clients." },
            { name: "Flux de conversation (Flows)", starter: false, business: false, pro: true, help: "Création de parcours clients complexes." },
        ],
    },
    {
        category: "Support & Technique",
        items: [
            { name: "Support Client", starter: "Email", business: "Prioritaire", pro: "Dédié 24/7", help: "Niveau de support inclus." },
            { name: "Onboarding assisté", starter: false, business: false, pro: true, help: "Configuration initiale par nos experts." },
            { name: "API Access", starter: false, business: false, pro: true, help: "Connectez Jokko à vos outils." },
            { name: "Webhooks", starter: false, business: true, pro: true, help: "Recevez les événements en temps réel." },
        ],
    },
];
