/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║     app/(dashboard)/dashboard/conversations/layout.tsx        ║
 * ╠═══════════════════════════════════════════════════════════════╣
 * ║ DESCRIPTION:                                                  ║
 * ║   Layout pour les pages de conversations.                     ║
 * ║   Fournit le contexte de l'organisation et le layout.         ║
 * ╚═══════════════════════════════════════════════════════════════╝
 */

import { ConversationsLayoutClient } from './_components/conversations-layout-client'

export default function ConversationsLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <ConversationsLayoutClient>
            {children}
        </ConversationsLayoutClient>
    )
}
