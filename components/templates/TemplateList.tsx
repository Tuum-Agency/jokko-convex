
'use client'

import React, { useState } from 'react';
import { useQuery, usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { InputGroup, InputGroupAddon, InputGroupInput } from '../ui/input-group';
import { SearchInput } from '../ui/search-input';
import { Skeleton } from '../ui/skeleton';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { TEMPLATE_TYPE_CONFIGS, TemplateType } from '@/convex/lib/templateTypes';
import { Edit, Trash2, FileStack, MoreHorizontal, Search, Plus } from 'lucide-react';
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

    const { results: templates, status, loadMore } = usePaginatedQuery(
        api.templates.queries.list,
        { search: searchTerm === '' ? undefined : searchTerm },
        { initialNumItems: 15 }
    );

    if (status === "LoadingFirstPage") {
        return (
            <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
            </div>
        );
    }

    if (templates?.length === 0) {
        return (
            <Empty>
                <EmptyMedia variant="icon">
                    <FileStack className="size-6" />
                </EmptyMedia>
                <EmptyHeader>
                    <EmptyTitle>Aucun template trouvé</EmptyTitle>
                    <EmptyDescription>
                        Vous n'avez pas encore créé de modèles de messages.
                        Commencez par en créer un nouveau pour engager vos clients.
                    </EmptyDescription>
                </EmptyHeader>
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
            case 'APPROVED': return 'Approuvé';
            case 'REJECTED': return 'Rejeté';
            case 'PAUSED': return 'En pause';
            case 'DRAFT': return 'Brouillon';
            case 'PENDING': return 'En attente';
            case 'DELETED': return 'Supprimé';
            default: return status;
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <SearchInput
                    placeholder="Rechercher un template..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Button onClick={onCreate} className="ml-4">
                    <Plus className="mr-2 h-4 w-4" />
                    Nouveau Template
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[300px]">Nom</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead>Langue</TableHead>
                            <TableHead>Catégorie</TableHead>
                            <TableHead className="text-right">Dernière mise à jour</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {templates?.map((template) => {
                            const config = TEMPLATE_TYPE_CONFIGS[template.type as TemplateType];
                            const StatusBadgeVariant = getStatusColor(template.status) as "default" | "destructive" | "outline" | "secondary";

                            return (
                                <TableRow key={template._id}>
                                    <TableCell className="font-medium">
                                        <div className="flex flex-col">
                                            <span className="truncate max-w-[250px]" title={template.name}>{template.name}</span>
                                            {template.name !== template.slug && (
                                                <span className="text-xs text-muted-foreground truncate max-w-[250px]">
                                                    {template.slug}
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2" title={config?.labelFr}>
                                            <div className="text-lg">{config?.icon || '📄'}</div>
                                            <span className="hidden xl:inline text-sm text-muted-foreground">
                                                {config?.labelFr}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Badge variant={StatusBadgeVariant} className="gap-1 pr-2.5">
                                                {template.status === 'APPROVED' && <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />}
                                                {template.status === 'PENDING' && <div className="h-1.5 w-1.5 rounded-full bg-yellow-500" />}
                                                {template.status === 'REJECTED' && <div className="h-1.5 w-1.5 rounded-full bg-red-500" />}
                                                {getStatusLabel(template.status)}
                                            </Badge>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="uppercase text-[10px]">
                                            {template.language}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm capitalize text-muted-foreground">
                                            {template.category.toLowerCase()}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right text-sm text-muted-foreground">
                                        {format(new Date(template.updatedAt || template.createdAt), 'dd MMM yyyy', { locale: fr })}
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => onEdit(template._id, template.type as TemplateType)}>
                                                    <Edit className="mr-2 h-4 w-4" /> Modifier
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-destructive focus:text-destructive"
                                                    onClick={() => onDelete(template._id)}
                                                >
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
                {status === "CanLoadMore" && (
                    <div className="flex justify-center p-4 border-t">
                        <Button variant="outline" onClick={() => loadMore(15)}>
                            Charger plus
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};
