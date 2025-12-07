
import { Metadata } from 'next'
import { ContactsPageClient } from './client'

export const metadata: Metadata = {
    title: 'Contacts | Jokko',
    description: 'Gérez vos contacts WhatsApp',
}

export default function ContactsPage() {
    return <ContactsPageClient />
}
