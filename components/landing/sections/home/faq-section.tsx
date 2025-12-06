import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Eyebrow } from '@/components/ui/eyebrow'
import { FadeInView, StaggerContainer, StaggerItem } from '@/components/animations'
import { HelpCircle } from 'lucide-react'
import { SquigglyUnderline } from '@/components/animations'

const faqs = [
    {
        question: 'Comment fonctionne la collaboration d\'équipe ?',
        answer: 'Vous pouvez inviter des membres d\'équipe dans votre espace de travail Jokko, assigner des conversations à des agents spécifiques, ajouter des notes internes et suivre les performances. Chaque membre de l\'équipe obtient sa propre connexion et des permissions basées sur les rôles.'
    },
    {
        question: 'Mes données sont-elles sécurisées et privées ?',
        answer: 'Absolument. Nous utilisons une sécurité de niveau entreprise avec chiffrement de bout en bout, une architecture multi-tenant pour l\'isolation des données, et nous nous conformons au RGPD et autres réglementations de confidentialité. Vos conversations ne sont jamais partagées ou utilisées à d\'autres fins.'
    },
    {
        question: 'Puis-je utiliser les réponses IA pour mon entreprise ?',
        answer: 'Oui, nos suggestions de réponses alimentées par IA apprennent de vos conversations précédentes et peuvent vous aider à répondre plus rapidement. Vous gardez toujours le contrôle total et pouvez modifier ou rejeter toute suggestion IA avant l\'envoi.'
    },
    {
        question: 'Que se passe-t-il si je dépasse ma limite de messages ?',
        answer: 'Nous vous avertirons lorsque vous approchez de votre limite. Vous pouvez soit passer à un plan supérieur, soit acheter des crédits de messages supplémentaires. Votre service ne sera pas interrompu pendant le mois.'
    },
    {
        question: 'Puis-je annuler mon abonnement à tout moment ?',
        answer: 'Oui, vous pouvez annuler votre abonnement à tout moment depuis les paramètres de votre compte. Il n\'y a pas de frais d\'annulation et vous continuerez à avoir accès jusqu\'à la fin de votre période de facturation.'
    },
    {
        question: 'Offrez-vous du support pendant l\'essai ?',
        answer: 'Absolument ! Tous les utilisateurs d\'essai ont accès à notre équipe de support via email et chat. Nous fournissons également une assistance d\'intégration pour vous aider à tirer le meilleur parti de Jokko pendant votre période d\'essai.'
    }
]

export function FaqSection() {
    return (
        <section className="py-24 bg-white">
            <div className="max-w-4xl mx-auto px-4">
                <div className="text-center mb-16">
                    <FadeInView>
                        <Eyebrow
                            text="FAQ"
                            icon={<HelpCircle className="w-3 h-3" />}
                            className="mb-4"
                        />
                    </FadeInView>
                    <FadeInView delay={0.2}>
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 max-w-2xl mx-auto">
                            Questions Fréquemment Posées
                        </h2>
                    </FadeInView>
                    <FadeInView delay={0.4}>
                        <p className="text-xl text-gray-600">
                            Trouvez des réponses aux questions courantes sur Jokko et l&apos;intégration WhatsApp Business.
                        </p>
                    </FadeInView>
                </div>

                <StaggerContainer staggerDelay={0.1} delayChildren={0.6}>
                    <Accordion type="single" collapsible className="space-y-4">
                        {faqs.map((faq, index) => (
                            <StaggerItem key={index}>
                                <AccordionItem
                                    value={`item-${index}`}
                                    className="border border-gray-200 rounded-lg px-6"
                                >
                                    <AccordionTrigger className="text-left font-semibold text-gray-900 hover:text-green-600 transition-colors">
                                        {faq.question}
                                    </AccordionTrigger>
                                    <AccordionContent className="text-gray-600 leading-relaxed pt-2 pb-4">
                                        {faq.answer}
                                    </AccordionContent>
                                </AccordionItem>
                            </StaggerItem>
                        ))}
                    </Accordion>
                </StaggerContainer>

                <FadeInView delay={1.0}>
                    <div className="text-center mt-12">
                        <p className="text-gray-600 mb-4">
                            Vous avez encore des questions ? Nous sommes là pour vous aider.
                        </p>
                        <a
                            href="/contact"
                            className="text-green-600 hover:text-green-700 font-medium relative inline-block"
                        >
                            Contactez notre équipe de support →
                            <SquigglyUnderline />
                        </a>
                    </div>
                </FadeInView>
            </div>
        </section>
    )
}
