'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';

export interface CrmLink {
    provider: string;
    providerLabel: string;
    externalId: string;
    externalUrl: string | null;
    connectionId: string;
    connectionStatus: string;
    remoteAccountLabel: string | null;
    linkedAt: number;
    lastPulledAt: number;
    lastPushedAt: number | null;
}

export function useCrmLink(contactId: string | Id<'contacts'> | null | undefined) {
    const link = useQuery(
        api.crm.contactLinks.getLinkForContact,
        contactId ? { contactId: contactId as Id<'contacts'> } : 'skip',
    );
    return link as CrmLink | null | undefined;
}
