'use client'

import React, { useState } from 'react';
import { usePaginatedQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { SearchInput } from '../ui/search-input';
import { Skeleton } from '../ui/skeleton';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { TEMPLATE_TYPE_CONFIGS, TemplateType } from '@/convex/lib/templateTypes';
import { Edit, Trash2, FileStack, MoreHorizontal, Plus, RefreshCcw } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
    Empty,
    EmptyHeader,
    EmptyTitle,
    EmptyDescription,
    EmptyMedia
} from '../ui/empty';

interface TemplateListProps {
    onCreate: () => void;
    onEdit: (id: string, type: TemplateType) => void;
    onDelete: (id: string) => void;
}

export const TemplateList: React.FC<TemplateListProps> = ({ onCreate, onEdit, onDelete }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isSyncing, setIsSyncing] = useState(false);
    const syncTemplates = useAction(api.templates.actions.syncFromMeta);

    const handleSync = async () => {
        setIsSyncing(true);
        try {
            await syncTemplates({});
        } catch (error) {
            console.error("Sync error:", error);
        } finally {
            setIsSyncing(false);
        }
    };

    const { results: templates, status, loadMore } = usePaginatedQuery(
        api.templates.queries.list,
        { search: searchTerm === '' ? undefined : searchTerm },
        { initialNumItems: 15 }
    );

    if (status === "LoadingFirstPage") {
        return (
            <div className="space-y-3">
                <Skeleton className="h-9 w-full rounded-lg" />
                <Skeleton className="h-16 w-full rounded-lg" />
                <Skeleton className="h-16 w-full rounded-lg" />
                <Skeleton className="h-16 w-full rounded-lg" />
            </div>
        );
    }

    if (templates?.length === 0 && !searchTerm) {
        return (
            <Empty>
                <EmptyMedia variant="icon">
                    <FileStack className="size-6" />
                </EmptyMedia>
                <EmptyHeader>
                    <EmptyTitle>Aucun modele trouve</EmptyTitle>
                    <EmptyDescription>
                        Vous n&apos;avez pas encore cree de modeles de messages.
                        Commencez par en creer un nouveau pour engager vos clients.
                    </EmptyDescription>
                </EmptyHeader>
                <Button
                    onClick={onCreate}
                    className="mt-4 bg-gradient-to-r from-[#14532d] to-[#059669] hover:from-[#14532d] hover:to-[#047857] text-white shadow-sm"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Creer un modele
                </Button>
            </Empty>
        );
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'APPROVED': return 'default';
            case 'REJECTED': return 'destructive';
            case 'PAUSED': return 'secondary';
            case 'DRAFT': return 'outline';
            case 'PENDING': return 'secondary';
            default: return 'secondary';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'APPROVED': return 'Approuve';
            case 'REJECTED': return 'Rejete';
            case 'PAUSED': return 'En pause';
            case 'DRAFT': return 'Brouillon';
            case 'PENDING': return 'En attente';
            case 'DELETED': return 'Supprime';
            default: return status;
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
                <SearchInput
                    placeholder="Rechercher un modele..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="flex items-center gap-2 shrink-0">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSync}
                        disabled={isSyncing}
                        className="h-8 gap-1.5 text-xs"
                    >
                        <RefreshCcw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                        <span className="hidden sm:inline">Synchroniser</span>
                    </Button>
                    <Button
                        size="sm"
                        onClick={onCreate}
                        className="h-8 gap-1.5 text-xs bg-gradient-to-r from-[#14532d] to-[#059669] hover:from-[#14532d] hover:to-[#047857] text-white shadow-sm"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Nouveau modele</span>
                    </Button>
                </div>
            </div>

            <div className="rounded-lg border border-gray-100 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-50/50">
                            <TableHead className="w-[300px] text-xs font-medium text-gray-500">Nom</TableHead>
                            <TableHead className="text-xs font-medium text-gray-500">Type</TableHead>
                            <TableHead className="text-xs font-medium text-gray-500">Statut</TableHead>
                            <TableHead className="text-xs font-medium text-gray-500">Langue</TableHead>
                            <TableHead className="text-xs font-medium text-gray-500">Categorie</TableHead>
                            <TableHead className="text-right text-xs font-medium text-gray-500">Mise a jour</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {templates?.length === 0 && searchTerm && (
                            <TableRow>
                                <TableCell colSpan={7} className="h-32 text-center">
                                    <p className="text-sm text-gray-400">Aucun resultat pour &quot;{searchTerm}&quot;</p>
                                </TableCell>
                            </TableRow>
                        )}
                        {templates?.map((template) => {
                            const config = TEMPLATE_TYPE_CONFIGS[template.type as TemplateType];
                            const StatusBadgeVariant = getStatusColor(template.status) as "default" | "destructive" | "outline" | "secondary";

                            return (
                                <TableRow key={template._id} className="hover:bg-gray-50/50 transition-colors">
                                    <TableCell className="font-medium">
                                        <div className="flex flex-col">
                                            <span className="truncate max-w-[250px] text-sm text-gray-900" title={template.name}>{template.name}</span>
                                            {template.name !== template.slug && (
                                                <span className="text-[11px] text-gray-400 truncate max-w-[250px]">
                                                    {template.slug}
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2" title={config?.labelFr}>
                                            <div className="text-base">{config?.icon || '\uD83D\uDCC4'}</div>
                                            <span className="hidden xl:inline text-xs text-gray-500">
                                                {config?.labelFr}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={StatusBadgeVariant} className="gap-1 pr-2.5 text-[10px]">
                                            {template.status === 'APPROVED' && <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />}
                                            {template.status === 'PENDING' && <div className="h-1.5 w-1.5 rounded-full bg-yellow-500" />}
                                            {template.status === 'REJECTED' && <div className="h-1.5 w-1.5 rounded-full bg-red-500" />}
                                            {getStatusLabel(template.status)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="uppercase text-[10px]">
                                            {template.language}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-xs capitalize text-gray-500">
                                            {template.category.toLowerCase()}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right text-xs text-gray-400">
                                        {format(new Date(template.updatedAt || template.createdAt), 'dd MMM yyyy', { locale: fr })}
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-100">
                                                    <span className="sr-only">Menu</span>
                                                    <MoreHorizontal className="h-4 w-4 text-gray-400" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel className="text-xs text-gray-500">Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => onEdit(template._id, template.type as TemplateType)}>
                                                    <Edit className="mr-2 h-3.5 w-3.5" /> Modifier
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-destructive focus:text-destructive"
                                                    onClick={() => onDelete(template._id)}
                                                >
                                                    <Trash2 className="mr-2 h-3.5 w-3.5" /> Supprimer
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
                {status === "CanLoadMore" && (
                    <div className="flex justify-center p-3 border-t border-gray-100">
                        <Button variant="ghost" size="sm" onClick={() => loadMore(15)} className="text-xs text-gray-500 hover:text-gray-700">
                            Charger plus
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};
