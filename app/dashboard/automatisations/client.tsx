'use client';

import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { AutomationTable } from './components/AutomationTable';

export default function AutomationsClient() {
    const role = useQuery(api.users.currentUserRole);
    const flows = useQuery(api.flows.list);
    const [searchTerm, setSearchTerm] = useState('');

    if (role === undefined) {
        return (
            <div className="space-y-6 p-4 sm:p-6">
                <div>
                    <Skeleton className="h-7 w-48 mb-2" />
                    <Skeleton className="h-4 w-72" />
                </div>
                <Skeleton className="h-96 w-full rounded-lg" />
            </div>
        );
    }

    if (role === 'AGENT') {
        return (
            <div className="p-4 sm:p-6">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Accès refusé</AlertTitle>
                    <AlertDescription>
                        Vous n&apos;avez pas les autorisations nécessaires pour accéder à cette page.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    const allFlows = flows ?? [];

    const filteredFlows = allFlows.filter(f =>
        f.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                        Automatisations
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Gérez vos flux automatisés et chatbots WhatsApp
                    </p>
                </div>
            </div>

            <AutomationTable
                flows={filteredFlows}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
            />
        </div>
    );
}
