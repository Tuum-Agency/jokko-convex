'use client'

import React, { useState } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { SearchInput } from '@/components/ui/search-input';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { MoreHorizontal, Search, Plus, RadioTower, ExternalLink, Trash2, Copy } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";
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
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
    Empty,
    EmptyHeader,
    EmptyTitle,
    EmptyDescription,
    EmptyMedia
} from '@/components/ui/empty';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const BroadcastList: React.FC = () => {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
    const [broadcastToDelete, setBroadcastToDelete] = useState<string | null>(null);

    // Using the list query we created
    const broadcasts = useQuery(api.broadcasts.list, { search: searchTerm || undefined });
    const duplicateBroadcast = useMutation(api.broadcasts.duplicate);
    const deleteBroadcast = useMutation(api.broadcasts.deleteBroadcast);

    const handleDuplicate = async (id: Id<"broadcasts">) => {
        try {
            const newId = await duplicateBroadcast({ id });
            toast.success("Campagne dupliquée");
            router.push(`/dashboard/broadcasts/${newId}`);
        } catch (e) {
            toast.error("Erreur lors de la duplication");
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteBroadcast({ id: id as Id<"broadcasts"> });
            toast.success("Campagne supprimée");
            setBroadcastToDelete(null);
            // Clear selection if deleted item was selected
            if (selectedRows.has(id)) {
                const newSelected = new Set(selectedRows);
                newSelected.delete(id);
                setSelectedRows(newSelected);
            }
        } catch (e) {
            toast.error("Erreur lors de la suppression");
        }
    };

    const handleBatchDelete = async () => {
        if (!confirm(`Voulez-vous vraiment supprimer ${selectedRows.size} campagnes ?`)) return;

        try {
            await Promise.all(Array.from(selectedRows).map(id => deleteBroadcast({ id: id as Id<"broadcasts"> })));
            toast.success(`${selectedRows.size} campagnes supprimées`);
            setSelectedRows(new Set());
        } catch (e) {
            toast.error("Erreur lors de la suppression groupée");
        }
    };

    const toggleRow = (id: string) => {
        const newSelected = new Set(selectedRows);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedRows(newSelected);
    };

    const toggleAll = () => {
        if (!broadcasts) return;
        if (selectedRows.size === broadcasts.length) {
            setSelectedRows(new Set());
        } else {
            setSelectedRows(new Set(broadcasts.map(b => b._id)));
        }
    };

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
            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!broadcastToDelete} onOpenChange={(open) => !open && setBroadcastToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Cette action est irréversible. Cela supprimera définitivement la campagne et ses données associées.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={() => broadcastToDelete && handleDelete(broadcastToDelete)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Supprimer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <SearchInput
                        placeholder="Rechercher une campagne..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-[350px]"
                    />
                    {selectedRows.size > 0 && (
                        <div className="flex items-center ml-2">
                            <ButtonGroup>
                                <Button variant="destructive" size="sm" onClick={handleBatchDelete}>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Supprimer ({selectedRows.size})
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => setSelectedRows(new Set())}>
                                    Annuler
                                </Button>
                            </ButtonGroup>
                        </div>
                    )}
                </div>

                <Button onClick={() => router.push('/dashboard/broadcasts/new')}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nouvelle Campagne
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]">
                                <Checkbox
                                    checked={broadcasts.length > 0 && selectedRows.size === broadcasts.length}
                                    onCheckedChange={toggleAll}
                                />
                            </TableHead>
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
                            const isSelected = selectedRows.has(broadcast._id);

                            return (
                                <TableRow key={broadcast._id} className="cursor-pointer hover:bg-muted/50" onClick={() => router.push(`/dashboard/broadcasts/${broadcast._id}`)}>
                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                        <Checkbox
                                            checked={isSelected}
                                            onCheckedChange={() => toggleRow(broadcast._id)}
                                        />
                                    </TableCell>
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
                                                <DropdownMenuItem onClick={() => handleDuplicate(broadcast._id)}>
                                                    <Copy className="mr-2 h-4 w-4" /> Dupliquer
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => setBroadcastToDelete(broadcast._id)} className="text-destructive focus:text-destructive">
                                                    <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                                                </DropdownMenuItem>
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
