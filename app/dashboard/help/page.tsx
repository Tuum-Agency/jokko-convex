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
    CardDescription,
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
import { toast } from 'sonner';
import { Loader2, Mail, MessageCircle, Send, FileQuestion, LifeBuoy, AlertCircle, Phone } from 'lucide-react';

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

            // Reset form
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
        <div className="space-y-6 max-w-5xl mx-auto pb-10">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Centre d'aide & Support</h1>
                <p className="text-gray-500 mt-2">
                    Retrouvez les réponses à vos questions sur l'API WhatsApp Business ou contactez notre équipe.
                </p>
            </div>

            <Tabs defaultValue="faq" className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
                    <TabsTrigger value="faq">FAQ WhatsApp API</TabsTrigger>
                    <TabsTrigger value="support">Support & Ticket</TabsTrigger>
                </TabsList>

                {/* FAQ Tab */}
                <TabsContent value="faq" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Questions Fréquentes (FAQ)</CardTitle>
                            <CardDescription>
                                Tout ce que vous devez savoir sur l'utilisation de WhatsApp Business API.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Accordion type="single" collapsible className="w-full">
                                <AccordionItem value="item-1">
                                    <AccordionTrigger>Qu'est-ce que la fenêtre de 24 heures ?</AccordionTrigger>
                                    <AccordionContent>
                                        <div className="text-gray-600 space-y-2">
                                            <p>
                                                Lorsqu'un client vous envoie un message, une session de 24 heures s'ouvre. Pendant cette période, vous pouvez envoyer des messages libres (texte, média) sans restriction.
                                            </p>
                                            <p>
                                                Une fois les 24 heures écoulées, vous devez utiliser un <strong>Modèle de Message (Template)</strong> approuvé par Meta pour relancer la conversation.
                                            </p>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="item-2">
                                    <AccordionTrigger>Quels types de contenus sont interdits par Meta ?</AccordionTrigger>
                                    <AccordionContent>
                                        <div className="text-gray-600 space-y-2">
                                            <p>Meta interdit strictement l'utilisation de WhatsApp Business pour :</p>
                                            <ul className="list-disc pl-5 mt-2 space-y-1">
                                                <li>Les produits illégaux ou réglementés (alcool, tabac, drogues, armes).</li>
                                                <li>Les jeux d'argent en ligne.</li>
                                                <li>Le contenu adulte ou nuisible.</li>
                                                <li>La discrimination ou le harcèlement.</li>
                                                <li>Les services financiers prédateurs (prêts sur salaire, etc.).</li>
                                            </ul>
                                            <p className="mt-2 text-sm text-yellow-600 bg-yellow-50 p-2 rounded">
                                                Consultez la <a href="https://www.whatsapp.com/legal/commerce-policy/" target="_blank" rel="noopener noreferrer" className="underline">Politique Commerciale de WhatsApp</a> pour plus de détails.
                                            </p>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="item-3">
                                    <AccordionTrigger>Comment fonctionnent les modèles de message (Templates) ?</AccordionTrigger>
                                    <AccordionContent>
                                        <div className="text-gray-600 space-y-2">
                                            <p>
                                                Les templates sont nécessaires pour initier une conversation marketing, utilitaire ou d'authentification.
                                            </p>
                                            <p>
                                                Chaque template doit être validé par Meta avant utilisation. Cela prend généralement de quelques secondes à 24 heures. Ils sont classés en catégories :
                                            </p>
                                            <ul className="list-disc pl-5 mt-2 space-y-1">
                                                <li><strong>Marketing :</strong> Promotions, offres, news.</li>
                                                <li><strong>Utilitaire :</strong> Mises à jour de commande, confirmations.</li>
                                                <li><strong>Authentification :</strong> Codes OTP.</li>
                                            </ul>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="item-4">
                                    <AccordionTrigger>Qu'est-ce que le niveau de qualité (Quality Rating) ?</AccordionTrigger>
                                    <AccordionContent>
                                        <div className="text-gray-600 space-y-2">
                                            <p>
                                                WhatsApp attribue une note de qualité (Vert, Jaune, Rouge) à votre numéro de téléphone basée sur les signalements et blocages des utilisateurs.
                                            </p>
                                            <p>
                                                Si votre qualité passe au Rouge (Faible), votre capacité d'envoi de messages peut être restreinte.
                                            </p>
                                            <p className="font-medium">Conseils pour maintenir une bonne qualité :</p>
                                            <ul className="list-disc pl-5 space-y-1">
                                                <li>Ne spammez pas les utilisateurs.</li>
                                                <li>Assurez-vous d'avoir le consentement (Opt-in) des clients avant de les contacter.</li>
                                                <li>Répondez rapidement aux demandes.</li>
                                            </ul>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="item-5">
                                    <AccordionTrigger>Comment obtenir le badge vert (Official Business Account) ?</AccordionTrigger>
                                    <AccordionContent>
                                        <div className="text-gray-600 space-y-2">
                                            <p>
                                                Le badge vert est réservé aux entreprises notables et authentiques. Meta a des critères stricts incluant la notoriété de la marque (articles de presse, présence web).
                                            </p>
                                            <p>
                                                Vous pouvez faire la demande via votre gestionnaire WhatsApp (Meta Business Suite), mais l'approbation n'est pas garantie même pour les entreprises légitimes.
                                            </p>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Liens Utiles</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 md:grid-cols-2">
                            <a href="https://developers.facebook.com/docs/whatsapp/cloud-api/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                                <div className="p-2 bg-blue-100 text-blue-600 rounded-full">
                                    <FileQuestion className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="font-medium text-gray-900">Documentation Officielle</h3>
                                    <p className="text-sm text-gray-500">Guides techniques Meta</p>
                                </div>
                            </a>
                            <a href="https://business.facebook.com/settings" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                                <div className="p-2 bg-gray-100 text-gray-600 rounded-full">
                                    <LifeBuoy className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="font-medium text-gray-900">Meta Business Suite</h3>
                                    <p className="text-sm text-gray-500">Gérer votre compte WhatsApp</p>
                                </div>
                            </a>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Support Tab */}
                <TabsContent value="support" className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Contact Direct */}
                        <Card className="h-fit">
                            <CardHeader>
                                <CardTitle>Contact Direct</CardTitle>
                                <CardDescription>
                                    Besoin d'une réponse rapide ? Contactez-nous directement.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Button
                                    className="w-full justify-start gap-3 bg-[#25D366] hover:bg-[#128C7E] text-white"
                                    onClick={() => window.open('https://wa.me/221XXXXXXXXX', '_blank')}
                                >
                                    <MessageCircle className="h-5 w-5" />
                                    Contacter sur WhatsApp
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full justify-start gap-3"
                                    onClick={() => window.open('mailto:support@jokko.com', '_blank')}
                                >
                                    <Mail className="h-5 w-5" />
                                    Envoyer un email
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Ticket Form */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Ouvrir un ticket</CardTitle>
                                <CardDescription>
                                    Signalez un bug ou posez une question technique.
                                </CardDescription>
                            </CardHeader>
                            <form onSubmit={handleSubmit}>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="subject">Sujet</Label>
                                        <Input
                                            id="subject"
                                            placeholder="Ex: Problème d'envoi de template"
                                            value={subject}
                                            onChange={(e) => setSubject(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="type">Type</Label>
                                            <Select value={type} onValueChange={setType}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="BUG">Bug technique</SelectItem>
                                                    <SelectItem value="FEATURE">Suggestion</SelectItem>
                                                    <SelectItem value="BILLING">Facturation</SelectItem>
                                                    <SelectItem value="OTHER">Autre</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="priority">Priorité</Label>
                                            <Select value={priority} onValueChange={setPriority}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Priorité" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="LOW">Basse</SelectItem>
                                                    <SelectItem value="MEDIUM">Moyenne</SelectItem>
                                                    <SelectItem value="HIGH">Haute</SelectItem>
                                                    <SelectItem value="URGENT">Urgente</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="message">Message</Label>
                                        <Textarea
                                            id="message"
                                            placeholder="Décrivez votre problème en détail..."
                                            className="min-h-[120px]"
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            required
                                        />
                                    </div>

                                    {(!user?.email && !user?.phone) && (
                                        <div className="space-y-2 bg-yellow-50 p-3 rounded-md border border-yellow-200">
                                            <div className="flex items-center gap-2 text-yellow-800 mb-2">
                                                <AlertCircle className="h-4 w-4" />
                                                <span className="text-sm font-medium">Informations de contact</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <Input
                                                    placeholder="Votre email"
                                                    value={contactEmail}
                                                    onChange={(e) => setContactEmail(e.target.value)}
                                                />
                                                <Input
                                                    placeholder="Votre téléphone"
                                                    value={contactPhone}
                                                    onChange={(e) => setContactPhone(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                                <CardFooter className="flex justify-end border-t pt-4 bg-gray-50/50 rounded-b-xl">
                                    <Button type="submit" disabled={isSubmitting || !subject || !message} className="bg-green-600 hover:bg-green-700">
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Envoi...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="mr-2 h-4 w-4" />
                                                Envoyer le ticket
                                            </>
                                        )}
                                    </Button>
                                </CardFooter>
                            </form>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
