'use client'

import React, { useState } from 'react';
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/ui/search-input';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { MoreHorizontal, Search, Plus, RadioTower, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Empty,
    EmptyHeader,
    EmptyTitle,
    EmptyDescription,
    EmptyMedia
} from '@/components/ui/empty';

export const BroadcastList: React.FC = () => {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');

    // Using the list query we created
    const broadcasts = useQuery(api.broadcasts.list, { search: searchTerm || undefined });

    if (broadcasts === undefined) {
        return (
            <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
            </div>
        );
    }

    if (broadcasts.length === 0 && !searchTerm) {
        return (
            <Empty>
                <EmptyMedia variant="icon">
                    <RadioTower className="size-6" />
                </EmptyMedia>
                <EmptyHeader>
                    <EmptyTitle>Aucune campagne trouvée</EmptyTitle>
                    <EmptyDescription>
                        Créez votre première campagne de diffusion WhatsApp pour toucher vos clients.
                    </EmptyDescription>
                </EmptyHeader>
                <div className="mt-4">
                    <Button onClick={() => router.push('/dashboard/broadcasts/new')}>
                        <Plus className="mr-2 h-4 w-4" />
                        Nouvelle Campagne
                    </Button>
                </div>
            </Empty>
        );
    }

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'COMPLETED': return 'default'; // Greenish usually for success but default is primary
            case 'FAILED': return 'destructive';
            case 'SENDING': return 'default'; // Maybe animate?
            case 'SCHEDULED': return 'secondary';
            case 'DRAFT': return 'outline';
            case 'CANCELLED': return 'secondary';
            default: return 'outline';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'COMPLETED': return 'Terminée';
            case 'FAILED': return 'Échouée';
            case 'SENDING': return 'En cours';
            case 'SCHEDULED': return 'Planifiée';
            case 'DRAFT': return 'Brouillon';
            case 'CANCELLED': return 'Annulée';
            default: return status;
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <SearchInput
                    placeholder="Rechercher une campagne..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Button onClick={() => router.push('/dashboard/broadcasts/new')}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nouvelle Campagne
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[300px]">Campagne</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead>Envoyés</TableHead>
                            <TableHead>Taux d'ouverture</TableHead>
                            <TableHead className="text-right">Date</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {broadcasts.map((broadcast) => {
                            const openRate = broadcast.deliveredCount > 0 ? Math.round((broadcast.readCount / broadcast.deliveredCount) * 100) : 0;

                            return (
                                <TableRow key={broadcast._id} className="cursor-pointer hover:bg-muted/50" onClick={() => router.push(`/dashboard/broadcasts/${broadcast._id}`)}>
                                    <TableCell className="font-medium">
                                        <div className="flex flex-col">
                                            <span className="truncate max-w-[250px]">{broadcast.name}</span>
                                            <span className="text-xs text-muted-foreground truncate max-w-[250px]">
                                                {broadcast.templateName || 'Template inconnu'}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusVariant(broadcast.status) as any}>
                                            {getStatusLabel(broadcast.status)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col text-sm">
                                            <span>{broadcast.sentCount} envoyés</span>
                                            {broadcast.failedCount > 0 && <span className="text-xs text-destructive">{broadcast.failedCount} échecs</span>}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">{openRate}%</span>
                                            <span className="text-xs text-muted-foreground">({broadcast.readCount}/{broadcast.deliveredCount})</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right text-sm text-muted-foreground">
                                        {format(new Date(broadcast.createdAt), 'dd MMM yyyy', { locale: fr })}
                                    </TableCell>
                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => router.push(`/dashboard/broadcasts/${broadcast._id}`)}>
                                                    <ExternalLink className="mr-2 h-4 w-4" /> Détails
                                                </DropdownMenuItem>
                                                {/* Add more actions like Duplicate, Delete later */}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};
