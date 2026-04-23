'use client';

import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
    Loader2,
    Mail,
    MessageCircle,
    Send,
    FileQuestion,
    LifeBuoy,
    AlertCircle,
    HelpCircle,
    BookOpen,
    Ticket,
    ExternalLink,
    Clock,
    ShieldCheck,
    Zap,
    MessageSquare,
    ChevronRight,
} from 'lucide-react';

const FAQ_CATEGORIES = [
    { key: "all", label: "Tout" },
    { key: "getting-started", label: "Prise en main" },
    { key: "conversations", label: "Conversations" },
    { key: "contacts", label: "Contacts" },
    { key: "campaigns", label: "Campagnes" },
    { key: "templates", label: "Modèles" },
    { key: "automation", label: "Automatisations" },
    { key: "team", label: "Équipe" },
    { key: "billing", label: "Facturation" },
    { key: "whatsapp", label: "WhatsApp API" },
];

const FAQ_ITEMS = [
    // ---- PRISE EN MAIN ----
    {
        id: "start-1",
        question: "Comment connecter mon numéro WhatsApp Business à Jokko ?",
        answer: (
            <div className="text-gray-600 space-y-2 text-sm">
                <p>Pour connecter votre numéro WhatsApp Business :</p>
                <ol className="list-decimal pl-5 space-y-1">
                    <li>Allez dans <strong>Paramètres → WhatsApp</strong>.</li>
                    <li>Cliquez sur <strong>Connecter WhatsApp Business</strong>.</li>
                    <li>Connectez-vous avec votre compte Facebook/Meta Business.</li>
                    <li>Sélectionnez votre numéro WhatsApp Business parmi la liste.</li>
                    <li>Confirmez la sélection.</li>
                </ol>
                <p>Votre numéro sera connecté en quelques secondes. Tous les messages entrants seront désormais reçus dans Jokko.</p>
            </div>
        ),
        category: "getting-started",
    },
    {
        id: "start-2",
        question: "Quels sont les différents rôles dans Jokko ?",
        answer: (
            <div className="text-gray-600 space-y-2 text-sm">
                <p>Jokko propose trois rôles avec des permissions différentes :</p>
                <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Propriétaire :</strong> Accès total — gestion de l'organisation, facturation, suppression de membres, paramètres WhatsApp.</li>
                    <li><strong>Administrateur :</strong> Gestion des membres, conversations, templates, campagnes et automatisations. Ne peut pas supprimer l'organisation ni gérer la facturation.</li>
                    <li><strong>Agent :</strong> Gère uniquement ses conversations assignées, peut consulter les contacts et envoyer des messages.</li>
                </ul>
            </div>
        ),
        category: "getting-started",
    },
    {
        id: "start-3",
        question: "Comment inviter des membres dans mon équipe ?",
        answer: (
            <div className="text-gray-600 space-y-2 text-sm">
                <p>Allez dans <strong>Équipe</strong> depuis le menu latéral, puis cliquez sur <strong>Inviter un membre</strong>. Entrez l'adresse email du membre et choisissez son rôle (Admin ou Agent).</p>
                <p>Le membre recevra un email d'invitation avec un lien pour rejoindre votre organisation. Vous pouvez suivre les invitations en attente dans l'onglet <strong>Invitations</strong>.</p>
            </div>
        ),
        category: "getting-started",
    },

    // ---- CONVERSATIONS ----
    {
        id: "conv-1",
        question: "Comment fonctionne la boîte de réception des conversations ?",
        answer: (
            <div className="text-gray-600 space-y-2 text-sm">
                <p>La boîte de réception affiche toutes les conversations WhatsApp de votre organisation. Elle fonctionne en deux panneaux :</p>
                <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Panneau gauche :</strong> Liste des conversations avec aperçu du dernier message, nom du contact et indicateur de messages non lus.</li>
                    <li><strong>Panneau droit :</strong> Fil de discussion complet avec historique des messages.</li>
                </ul>
                <p>Vous pouvez filtrer les conversations par statut (non assignées, assignées à moi, toutes) et rechercher par nom ou numéro de contact.</p>
            </div>
        ),
        category: "conversations",
    },
    {
        id: "conv-2",
        question: "Comment assigner une conversation à un agent ?",
        answer: (
            <div className="text-gray-600 space-y-2 text-sm">
                <p>Vous pouvez assigner une conversation de deux manières :</p>
                <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Manuellement :</strong> Ouvrez la conversation, puis utilisez le menu d'assignation en haut pour sélectionner un agent dans la liste.</li>
                    <li><strong>Automatiquement :</strong> Activez l'attribution automatique dans <strong>Paramètres → Organisation → Attribution automatique</strong>. Les nouvelles conversations seront distribuées aux agents disponibles en rotation.</li>
                </ul>
            </div>
        ),
        category: "conversations",
    },
    {
        id: "conv-3",
        question: "Qu'est-ce que la fenêtre de 24 heures ?",
        answer: (
            <div className="text-gray-600 space-y-2 text-sm">
                <p>Lorsqu'un client vous envoie un message, une session de 24 heures s'ouvre. Pendant cette période, vous pouvez envoyer des messages libres (texte, média) sans restriction.</p>
                <p>Une fois les 24 heures écoulées, vous devez utiliser un <strong>Modèle de Message (Template)</strong> approuvé par Meta pour relancer la conversation.</p>
            </div>
        ),
        category: "conversations",
    },
    {
        id: "conv-4",
        question: "Puis-je envoyer des images ou des fichiers dans les conversations ?",
        answer: (
            <div className="text-gray-600 space-y-2 text-sm">
                <p>Oui, Jokko supporte l'envoi et la réception de différents types de médias :</p>
                <ul className="list-disc pl-5 space-y-1">
                    <li>Images (JPG, PNG, GIF)</li>
                    <li>Documents (PDF, Word, Excel)</li>
                    <li>Messages de localisation</li>
                    <li>Messages transférés</li>
                </ul>
                <p>Utilisez le bouton d'attachement dans la zone de saisie pour joindre un fichier.</p>
            </div>
        ),
        category: "conversations",
    },

    // ---- CONTACTS ----
    {
        id: "contact-1",
        question: "Comment ajouter un nouveau contact ?",
        answer: (
            <div className="text-gray-600 space-y-2 text-sm">
                <p>Allez dans <strong>Contacts</strong> depuis le menu latéral et cliquez sur <strong>Ajouter un contact</strong>. Renseignez le nom et le numéro de téléphone au format international (ex: +221 77 123 45 67).</p>
                <p>Les contacts sont également créés automatiquement lorsqu'un nouveau client vous envoie un message sur WhatsApp.</p>
            </div>
        ),
        category: "contacts",
    },
    {
        id: "contact-2",
        question: "Comment rechercher un contact existant ?",
        answer: (
            <div className="text-gray-600 space-y-2 text-sm">
                <p>Utilisez la barre de recherche en haut de la page <strong>Contacts</strong>. Vous pouvez chercher par nom ou par numéro de téléphone. La recherche est instantanée et filtre les résultats au fur et à mesure de la saisie.</p>
            </div>
        ),
        category: "contacts",
    },

    // ---- CAMPAGNES ----
    {
        id: "camp-1",
        question: "Comment créer une campagne de diffusion ?",
        answer: (
            <div className="text-gray-600 space-y-2 text-sm">
                <p>Pour créer une campagne :</p>
                <ol className="list-decimal pl-5 space-y-1">
                    <li>Allez dans <strong>Campagnes</strong> depuis le menu latéral.</li>
                    <li>Cliquez sur <strong>Nouvelle campagne</strong>.</li>
                    <li>Sélectionnez un modèle de message approuvé par Meta.</li>
                    <li>Choisissez les destinataires (contacts individuels ou groupes).</li>
                    <li>Planifiez l'envoi ou envoyez immédiatement.</li>
                </ol>
                <p>Les campagnes consomment des crédits marketing. Vérifiez votre solde dans <strong>Facturation</strong> avant l'envoi.</p>
                <div className="mt-2 text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-100">
                    Seuls les Propriétaires et Administrateurs peuvent créer des campagnes.
                </div>
            </div>
        ),
        category: "campaigns",
    },
    {
        id: "camp-2",
        question: "Quelle est la différence entre crédits marketing et abonnement ?",
        answer: (
            <div className="text-gray-600 space-y-2 text-sm">
                <p>Jokko utilise deux systèmes de paiement distincts :</p>
                <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Abonnement mensuel/annuel :</strong> Donne accès aux fonctionnalités de la plateforme (nombre d'agents, de numéros WhatsApp, conversations/mois).</li>
                    <li><strong>Crédits marketing (pay-as-you-go) :</strong> Consommés uniquement lors de l'envoi de campagnes de diffusion. Rechargez votre solde à tout moment depuis la page Facturation.</li>
                </ul>
                <p>Les conversations individuelles avec les clients ne consomment pas de crédits marketing.</p>
            </div>
        ),
        category: "campaigns",
    },

    // ---- MODÈLES ----
    {
        id: "tpl-1",
        question: "Quelle est la différence entre un modèle WhatsApp et une réponse rapide ?",
        answer: (
            <div className="text-gray-600 space-y-2 text-sm">
                <p>Jokko propose deux types de modèles :</p>
                <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Modèles WhatsApp :</strong> Templates officiels soumis à Meta pour approbation. Nécessaires pour initier une conversation ou envoyer des campagnes. Supportent les variables dynamiques.</li>
                    <li><strong>Réponses rapides :</strong> Raccourcis internes à Jokko, utilisables uniquement dans les conversations ouvertes. Pas besoin d'approbation Meta. Idéal pour les messages fréquents (salutations, informations standard).</li>
                </ul>
            </div>
        ),
        category: "templates",
    },
    {
        id: "tpl-2",
        question: "Combien de temps prend l'approbation d'un modèle par Meta ?",
        answer: (
            <div className="text-gray-600 space-y-2 text-sm">
                <p>L'approbation d'un modèle WhatsApp par Meta prend généralement entre quelques secondes et 24 heures. Dans de rares cas, cela peut prendre jusqu'à 48 heures.</p>
                <p className="font-medium">Pour accélérer l'approbation :</p>
                <ul className="list-disc pl-5 space-y-1">
                    <li>Évitez les termes promotionnels agressifs.</li>
                    <li>Respectez les catégories (marketing, utilitaire, authentification).</li>
                    <li>Utilisez un langage professionnel et clair.</li>
                    <li>Ne modifiez pas un template récemment approuvé trop fréquemment.</li>
                </ul>
            </div>
        ),
        category: "templates",
    },

    // ---- AUTOMATISATIONS ----
    {
        id: "auto-1",
        question: "Comment créer un chatbot automatique ?",
        answer: (
            <div className="text-gray-600 space-y-2 text-sm">
                <p>Jokko dispose d'un constructeur de flux visuel :</p>
                <ol className="list-decimal pl-5 space-y-1">
                    <li>Allez dans <strong>Automatisations</strong> depuis le menu latéral.</li>
                    <li>Cliquez sur <strong>Nouveau flux</strong>.</li>
                    <li>Utilisez l'éditeur glisser-déposer pour construire votre flux :</li>
                </ol>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                    <li><strong>Déclencheur :</strong> Message reçu, mot-clé détecté.</li>
                    <li><strong>Message :</strong> Envoyer un texte ou un menu interactif.</li>
                    <li><strong>Action :</strong> Assigner la conversation, mettre à jour le contact, appeler un webhook.</li>
                </ul>
                <p className="mt-1">Testez votre flux avec l'interface de chat intégrée avant de le publier.</p>
            </div>
        ),
        category: "automation",
    },
    {
        id: "auto-2",
        question: "Comment fonctionne la réponse automatique hors ligne ?",
        answer: (
            <div className="text-gray-600 space-y-2 text-sm">
                <p>Quand la réponse automatique est activée dans <strong>Paramètres → Organisation</strong>, un message est envoyé automatiquement aux clients dans deux cas :</p>
                <ul className="list-disc pl-5 space-y-1">
                    <li>En dehors des horaires d'ouverture définis.</li>
                    <li>Quand aucun agent n'est en ligne pour répondre.</li>
                </ul>
                <p>Vous pouvez personnaliser le message de réponse automatique et configurer les horaires d'ouverture jour par jour.</p>
            </div>
        ),
        category: "automation",
    },
    {
        id: "auto-3",
        question: "Comment fonctionne l'attribution automatique des conversations ?",
        answer: (
            <div className="text-gray-600 space-y-2 text-sm">
                <p>L'attribution automatique distribue les nouvelles conversations aux agents disponibles en <strong>rotation (round-robin)</strong>. Configurable dans <strong>Paramètres → Organisation → Attribution automatique</strong> :</p>
                <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Max conversations par agent :</strong> Limite le nombre de conversations simultanées.</li>
                    <li><strong>Exclure les agents hors ligne :</strong> N'attribue pas de conversations aux agents déconnectés.</li>
                </ul>
                <p>Si un client demande un agent spécifique ou un service précis, le système d'IA le détecte et redirige automatiquement vers la bonne personne.</p>
            </div>
        ),
        category: "automation",
    },

    // ---- ÉQUIPE ----
    {
        id: "team-1",
        question: "Qu'est-ce qu'un pôle (département) et comment l'utiliser ?",
        answer: (
            <div className="text-gray-600 space-y-2 text-sm">
                <p>Les pôles permettent d'organiser votre équipe par service (Commercial, Support, SAV, etc.). Pour créer un pôle :</p>
                <ol className="list-decimal pl-5 space-y-1">
                    <li>Allez dans <strong>Équipe → Pôles</strong>.</li>
                    <li>Cliquez sur <strong>Créer un pôle</strong>.</li>
                    <li>Assignez des membres au pôle.</li>
                </ol>
                <p>Les conversations peuvent être routées automatiquement vers le bon pôle en fonction du contenu du message client.</p>
            </div>
        ),
        category: "team",
    },
    {
        id: "team-2",
        question: "Combien de membres puis-je avoir dans mon équipe ?",
        answer: (
            <div className="text-gray-600 space-y-2 text-sm">
                <p>Le nombre de membres dépend de votre plan :</p>
                <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Gratuit :</strong> 1 agent</li>
                    <li><strong>Starter :</strong> 2 agents</li>
                    <li><strong>Business :</strong> 5 agents</li>
                    <li><strong>Pro :</strong> 20 agents</li>
                    <li><strong>Enterprise :</strong> Configuration sur mesure</li>
                </ul>
                <p>Vous pouvez changer de plan à tout moment depuis la page <strong>Facturation</strong>.</p>
            </div>
        ),
        category: "team",
    },

    // ---- FACTURATION ----
    {
        id: "bill-1",
        question: "Comment changer de plan d'abonnement ?",
        answer: (
            <div className="text-gray-600 space-y-2 text-sm">
                <p>Allez dans <strong>Facturation</strong> depuis le menu latéral. Vous verrez les plans disponibles avec leurs fonctionnalités. Cliquez sur <strong>Choisir ce plan</strong> pour passer à un plan supérieur.</p>
                <p>Le changement est effectif immédiatement. Si vous passez à un plan inférieur, le changement prendra effet à la fin de votre période de facturation en cours.</p>
                <p>Tous les plans payants incluent un <strong>essai gratuit de 7 jours</strong>. Vous bénéficiez également d'une <strong>réduction de 20%</strong> sur la facturation annuelle.</p>
            </div>
        ),
        category: "billing",
    },
    {
        id: "bill-2",
        question: "Comment recharger mes crédits marketing ?",
        answer: (
            <div className="text-gray-600 space-y-2 text-sm">
                <p>Depuis la page <strong>Facturation</strong>, vous trouverez votre solde de crédits marketing en haut. Cliquez sur <strong>Recharger</strong> pour ajouter des crédits.</p>
                <p>Le paiement est sécurisé via Stripe. Les crédits sont ajoutés instantanément à votre compte et n'expirent pas.</p>
            </div>
        ),
        category: "billing",
    },
    {
        id: "bill-3",
        question: "Où puis-je voir l'historique de mes transactions ?",
        answer: (
            <div className="text-gray-600 space-y-2 text-sm">
                <p>L'historique complet de vos transactions (rechargements, consommations, abonnements) est disponible dans la section <strong>Transactions récentes</strong> de la page Facturation.</p>
                <p>Chaque transaction indique la date, le type (recharge, abonnement, consommation), et le montant.</p>
            </div>
        ),
        category: "billing",
    },

    // ---- WHATSAPP API ----
    {
        id: "wa-1",
        question: "Quels types de contenus sont interdits par Meta ?",
        answer: (
            <div className="text-gray-600 space-y-2 text-sm">
                <p>Meta interdit strictement l'utilisation de WhatsApp Business pour :</p>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                    <li>Les produits illégaux ou réglementés (alcool, tabac, drogues, armes).</li>
                    <li>Les jeux d'argent en ligne.</li>
                    <li>Le contenu adulte ou nuisible.</li>
                    <li>La discrimination ou le harcèlement.</li>
                    <li>Les services financiers prédateurs.</li>
                </ul>
                <div className="mt-2 text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-100">
                    Consultez la <a href="https://www.whatsapp.com/legal/commerce-policy/" target="_blank" rel="noopener noreferrer" className="underline font-medium">Politique Commerciale de WhatsApp</a> pour plus de détails.
                </div>
            </div>
        ),
        category: "whatsapp",
    },
    {
        id: "wa-2",
        question: "Qu'est-ce que le niveau de qualité (Quality Rating) ?",
        answer: (
            <div className="text-gray-600 space-y-2 text-sm">
                <p>WhatsApp attribue une note de qualité (Vert, Jaune, Rouge) à votre numéro basée sur les signalements et blocages des utilisateurs.</p>
                <p>Si votre qualité passe au Rouge, votre capacité d'envoi peut être restreinte.</p>
                <p className="font-medium">Conseils pour maintenir une bonne qualité :</p>
                <ul className="list-disc pl-5 space-y-1">
                    <li>Ne spammez pas les utilisateurs.</li>
                    <li>Obtenez le consentement (Opt-in) avant de contacter les clients.</li>
                    <li>Répondez rapidement aux demandes.</li>
                </ul>
            </div>
        ),
        category: "whatsapp",
    },
    {
        id: "wa-3",
        question: "Comment obtenir le badge vert (Official Business Account) ?",
        answer: (
            <div className="text-gray-600 space-y-2 text-sm">
                <p>Le badge vert est réservé aux entreprises notables et authentiques. Meta applique des critères stricts incluant la notoriété de la marque (articles de presse, présence web significative).</p>
                <p>Vous pouvez faire la demande via Meta Business Suite, mais l'approbation n'est pas garantie même pour les entreprises légitimes.</p>
            </div>
        ),
        category: "whatsapp",
    },
    {
        id: "wa-4",
        question: "Puis-je connecter plusieurs numéros WhatsApp ?",
        answer: (
            <div className="text-gray-600 space-y-2 text-sm">
                <p>Oui, le nombre de numéros WhatsApp dépend de votre plan :</p>
                <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Gratuit / Starter :</strong> 1 numéro</li>
                    <li><strong>Business :</strong> 3 numéros</li>
                    <li><strong>Pro / Enterprise :</strong> Illimité</li>
                </ul>
                <p>Chaque numéro peut être assigné à une équipe spécifique et défini comme canal par défaut pour l'envoi des messages sortants.</p>
            </div>
        ),
        category: "whatsapp",
    },
];

const USEFUL_LINKS = [
    {
        title: "Documentation Cloud API",
        description: "Guides techniques officiels Meta",
        href: "https://developers.facebook.com/docs/whatsapp/cloud-api/",
        icon: BookOpen,
        color: "from-blue-600 to-blue-400",
    },
    {
        title: "Meta Business Suite",
        description: "Gérer votre compte WhatsApp",
        href: "https://business.facebook.com/settings",
        icon: LifeBuoy,
        color: "from-gray-700 to-gray-500",
    },
    {
        title: "Politique Commerciale",
        description: "Règles d'utilisation WhatsApp Business",
        href: "https://www.whatsapp.com/legal/commerce-policy/",
        icon: ShieldCheck,
        color: "from-emerald-600 to-emerald-400",
    },
    {
        title: "Statut de l'API",
        description: "Vérifier la disponibilité des services",
        href: "https://metastatus.com/",
        icon: Zap,
        color: "from-amber-500 to-amber-400",
    },
];

export default function HelpPage() {
    const user = useQuery(api.users.me);
    const session = useQuery(api.sessions.current);
    const createTicket = useMutation(api.tickets.create);

    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [type, setType] = useState('OTHER');
    const [priority, setPriority] = useState('MEDIUM');
    const [contactEmail, setContactEmail] = useState('');
    const [contactPhone, setContactPhone] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [faqFilter, setFaqFilter] = useState('all');

    const filteredFaq = faqFilter === 'all' ? FAQ_ITEMS : FAQ_ITEMS.filter(item => item.category === faqFilter);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            await createTicket({
                subject,
                message,
                type: type as "BUG" | "FEATURE" | "BILLING" | "OTHER",
                priority: priority as "LOW" | "MEDIUM" | "HIGH" | "URGENT",
                contactEmail: contactEmail || user?.email,
                contactPhone: contactPhone || user?.phone,
                organizationId: session?.organization?._id,
            });

            toast.success("Ticket créé avec succès", {
                description: "Nous avons bien reçu votre demande et vous répondrons dans les plus brefs délais.",
            });

            setSubject('');
            setMessage('');
            setType('OTHER');
            setPriority('MEDIUM');
        } catch (error) {
            console.error(error);
            toast.error("Erreur lors de la création du ticket", {
                description: "Veuillez réessayer plus tard ou nous contacter directement.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* ==================== HEADER ==================== */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                        Aide & Support
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Retrouvez les réponses à vos questions ou contactez notre équipe.
                    </p>
                </div>
            </div>

            {/* ==================== QUICK ACTIONS ==================== */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Card
                    className="bg-white border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                    onClick={() => window.open('https://wa.me/221XXXXXXXXX', '_blank')}
                >
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#25D366] to-[#128C7E] flex items-center justify-center shadow-sm shrink-0">
                            <MessageCircle className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900">WhatsApp</p>
                            <p className="text-[11px] text-gray-400 mt-0.5">Réponse en moins de 5 min</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors shrink-0" />
                    </CardContent>
                </Card>

                <Card
                    className="bg-white border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                    onClick={() => window.open('mailto:support@jokko.com', '_blank')}
                >
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#14532d] to-[#059669] flex items-center justify-center shadow-sm shrink-0">
                            <Mail className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900">Email</p>
                            <p className="text-[11px] text-gray-400 mt-0.5">support@jokko.com</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors shrink-0" />
                    </CardContent>
                </Card>

                <Card className="bg-white border-gray-100 shadow-sm">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#166534] to-[#10b981] flex items-center justify-center shadow-sm shrink-0">
                            <Clock className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900">Horaires</p>
                            <p className="text-[11px] text-gray-400 mt-0.5">Lun-Ven, 8h - 18h (GMT)</p>
                        </div>
                        <Badge variant="secondary" className="text-[10px] bg-green-50 text-green-700 font-medium shrink-0">
                            En ligne
                        </Badge>
                    </CardContent>
                </Card>
            </div>

            {/* ==================== TABS ==================== */}
            <Tabs defaultValue="faq" className="space-y-6">
                <TabsList className="flex w-full overflow-x-auto no-scrollbar lg:grid lg:grid-cols-3 lg:w-[450px]">
                    <TabsTrigger value="faq" className="shrink-0 gap-1.5 text-xs cursor-pointer">
                        <HelpCircle className="h-3.5 w-3.5" />
                        FAQ
                    </TabsTrigger>
                    <TabsTrigger value="support" className="shrink-0 gap-1.5 text-xs cursor-pointer">
                        <Ticket className="h-3.5 w-3.5" />
                        Ouvrir un ticket
                    </TabsTrigger>
                    <TabsTrigger value="resources" className="shrink-0 gap-1.5 text-xs cursor-pointer">
                        <BookOpen className="h-3.5 w-3.5" />
                        Ressources
                    </TabsTrigger>
                </TabsList>

                {/* ==================== FAQ TAB ==================== */}
                <TabsContent value="faq" className="space-y-6">
                    <Card className="bg-white border-gray-100 shadow-sm">
                        <CardHeader className="pb-2">
                            <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#14532d] to-[#059669] flex items-center justify-center shadow-sm">
                                    <HelpCircle className="h-4 w-4 text-white" />
                                </div>
                                <div>
                                    <CardTitle className="text-sm sm:text-base font-semibold text-gray-900">
                                        Questions fréquentes
                                    </CardTitle>
                                    <p className="text-[11px] text-gray-400 mt-0.5">
                                        {filteredFaq.length} question{filteredFaq.length > 1 ? "s" : ""} — Filtrez par catégorie
                                    </p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-4">
                            {/* Category Filter */}
                            <div className="flex flex-wrap gap-1.5">
                                {FAQ_CATEGORIES.map((cat) => (
                                    <button
                                        key={cat.key}
                                        onClick={() => setFaqFilter(cat.key)}
                                        className={`px-3 py-1 rounded-full text-[11px] font-medium transition-colors cursor-pointer ${
                                            faqFilter === cat.key
                                                ? "bg-gradient-to-r from-[#14532d] to-[#059669] text-white shadow-sm"
                                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                        }`}
                                    >
                                        {cat.label}
                                    </button>
                                ))}
                            </div>

                            <Separator className="bg-gray-100" />

                            {/* FAQ List */}
                            <Accordion type="single" collapsible className="w-full">
                                {filteredFaq.map((item) => (
                                    <AccordionItem key={item.id} value={item.id} className="border-gray-100">
                                        <AccordionTrigger className="text-sm font-medium text-gray-900 hover:text-gray-700 hover:no-underline py-3">
                                            {item.question}
                                        </AccordionTrigger>
                                        <AccordionContent className="pb-4">
                                            {item.answer}
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>

                            {filteredFaq.length === 0 && (
                                <div className="text-center py-8">
                                    <HelpCircle className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                                    <p className="text-sm text-gray-500">Aucune question dans cette catégorie.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ==================== SUPPORT TAB ==================== */}
                <TabsContent value="support" className="space-y-6">
                    <Card className="bg-white border-gray-100 shadow-sm">
                        <CardHeader className="pb-2">
                            <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#14532d] to-[#059669] flex items-center justify-center shadow-sm">
                                    <Ticket className="h-4 w-4 text-white" />
                                </div>
                                <div>
                                    <CardTitle className="text-sm sm:text-base font-semibold text-gray-900">
                                        Ouvrir un ticket de support
                                    </CardTitle>
                                    <p className="text-[11px] text-gray-400 mt-0.5">
                                        Signalez un bug ou posez une question technique
                                    </p>
                                </div>
                            </div>
                        </CardHeader>
                        <form onSubmit={handleSubmit}>
                            <CardContent className="space-y-5 pt-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="subject" className="text-xs font-medium text-gray-500">Sujet</Label>
                                    <Input
                                        id="subject"
                                        placeholder="Ex: Problème d'envoi de template"
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        required
                                        className="h-9 text-sm"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="type" className="text-xs font-medium text-gray-500">Type</Label>
                                        <Select value={type} onValueChange={setType}>
                                            <SelectTrigger className="h-9 text-sm">
                                                <SelectValue placeholder="Type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="BUG" className="text-sm">Bug technique</SelectItem>
                                                <SelectItem value="FEATURE" className="text-sm">Suggestion</SelectItem>
                                                <SelectItem value="BILLING" className="text-sm">Facturation</SelectItem>
                                                <SelectItem value="OTHER" className="text-sm">Autre</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="priority" className="text-xs font-medium text-gray-500">Priorité</Label>
                                        <Select value={priority} onValueChange={setPriority}>
                                            <SelectTrigger className="h-9 text-sm">
                                                <SelectValue placeholder="Priorité" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="LOW" className="text-sm">Basse</SelectItem>
                                                <SelectItem value="MEDIUM" className="text-sm">Moyenne</SelectItem>
                                                <SelectItem value="HIGH" className="text-sm">Haute</SelectItem>
                                                <SelectItem value="URGENT" className="text-sm">Urgente</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="message" className="text-xs font-medium text-gray-500">Message</Label>
                                    <Textarea
                                        id="message"
                                        placeholder="Décrivez votre problème en détail..."
                                        className="min-h-[120px] text-sm resize-none"
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        required
                                    />
                                </div>

                                {(!user?.email && !user?.phone) && (
                                    <div className="space-y-3 bg-amber-50/50 p-4 rounded-xl border border-amber-100">
                                        <div className="flex items-center gap-2 text-amber-800">
                                            <AlertCircle className="h-3.5 w-3.5" />
                                            <span className="text-xs font-medium">Informations de contact</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <Input
                                                placeholder="Votre email"
                                                value={contactEmail}
                                                onChange={(e) => setContactEmail(e.target.value)}
                                                className="h-9 text-sm"
                                            />
                                            <Input
                                                placeholder="Votre téléphone"
                                                value={contactPhone}
                                                onChange={(e) => setContactPhone(e.target.value)}
                                                className="h-9 text-sm"
                                            />
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                            <CardFooter className="flex justify-end border-t border-gray-100 p-4 bg-gray-50/30">
                                <Button
                                    type="submit"
                                    size="sm"
                                    disabled={isSubmitting || !subject || !message}
                                    className="h-8 text-xs rounded-full bg-gradient-to-r from-[#14532d] to-[#059669] hover:from-[#14532d]/90 hover:to-[#059669]/90 cursor-pointer"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                            Envoi...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="mr-1.5 h-3.5 w-3.5" />
                                            Envoyer le ticket
                                        </>
                                    )}
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>
                </TabsContent>

                {/* ==================== RESOURCES TAB ==================== */}
                <TabsContent value="resources" className="space-y-6">
                    <Card className="bg-white border-gray-100 shadow-sm">
                        <CardHeader className="pb-2">
                            <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#15803d] to-[#34d399] flex items-center justify-center shadow-sm">
                                    <BookOpen className="h-4 w-4 text-white" />
                                </div>
                                <div>
                                    <CardTitle className="text-sm sm:text-base font-semibold text-gray-900">
                                        Liens utiles
                                    </CardTitle>
                                    <p className="text-[11px] text-gray-400 mt-0.5">
                                        Documentation officielle et outils complémentaires
                                    </p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <div className="grid gap-3 sm:grid-cols-2">
                                {USEFUL_LINKS.map((link) => (
                                    <a
                                        key={link.title}
                                        href={link.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 p-4 border border-gray-100 rounded-xl bg-gray-50/50 hover:bg-gray-50 hover:shadow-sm transition-all group"
                                    >
                                        <div className={`h-9 w-9 rounded-full bg-gradient-to-br ${link.color} flex items-center justify-center shadow-sm shrink-0`}>
                                            <link.icon className="h-4 w-4 text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 group-hover:text-gray-700">{link.title}</p>
                                            <p className="text-[11px] text-gray-400 mt-0.5">{link.description}</p>
                                        </div>
                                        <ExternalLink className="h-3.5 w-3.5 text-gray-300 group-hover:text-gray-500 transition-colors shrink-0" />
                                    </a>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white border-gray-100 shadow-sm">
                        <CardHeader className="pb-2">
                            <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#14532d] to-[#059669] flex items-center justify-center shadow-sm">
                                    <MessageSquare className="h-4 w-4 text-white" />
                                </div>
                                <div>
                                    <CardTitle className="text-sm sm:text-base font-semibold text-gray-900">
                                        Besoin d'aide supplémentaire ?
                                    </CardTitle>
                                    <p className="text-[11px] text-gray-400 mt-0.5">
                                        Notre équipe est disponible pour vous accompagner
                                    </p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border border-gray-100 rounded-xl bg-gray-50/50">
                                <div>
                                    <p className="text-sm font-medium text-gray-900">Planifier un appel avec notre équipe</p>
                                    <p className="text-[11px] text-gray-400 mt-0.5">
                                        Réservez un créneau de 30 minutes pour une assistance personnalisée.
                                    </p>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 text-xs rounded-full cursor-pointer w-full sm:w-auto shrink-0"
                                    onClick={() => window.open('https://calendly.com/', '_blank')}
                                >
                                    Réserver un créneau
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
