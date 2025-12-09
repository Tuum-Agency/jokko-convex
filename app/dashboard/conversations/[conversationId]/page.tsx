/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║   app/(dashboard)/dashboard/conversations/[conversationId]/page.tsx ║
 * ╠═══════════════════════════════════════════════════════════════╣
 * ║ DESCRIPTION:                                                  ║
 * ║   Page d'une conversation specifique.                         ║
 * ║   Affiche les messages et permet d'envoyer des messages.      ║
 * ╚═══════════════════════════════════════════════════════════════╝
 */

import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Conversation | Jokko',
    description: 'Discutez avec votre contact WhatsApp',
}

export default function ConversationPage() {
    // The layout handles the rendering based on the URL params
    return null
}
