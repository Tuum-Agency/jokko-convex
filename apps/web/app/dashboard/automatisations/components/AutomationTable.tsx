'use client';

import React, { useState, useMemo } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SearchInput } from '@/components/ui/search-input';
import { Checkbox } from '@/components/ui/checkbox';
import { Pagination } from '@/components/ui/pagination';
import { toast } from 'sonner';
import { Id } from '@/convex/_generated/dataModel';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import {
    Plus, MoreHorizontal, Trash2, Edit, Play, Pause,
    Workflow, Sparkles, GitBranch
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
    Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyMedia,
} from '@/components/ui/empty';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
    AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const STAT_GRADIENTS = [
    'from-[#14532d] to-[#059669]',
    'from-[#166534] to-[#0d9488]',
    'from-[#15803d] to-[#10b981]',
    'from-[#14532d] to-[#34d399]',
];

const getTriggerLabel = (triggerType: string) => {
    switch (triggerType) {
        case 'NEW_CONVERSATION': return 'Nouveau message';
        case 'KEYWORD': return 'Mot-clé';
        default: return 'Nouveau message';
    }
};

interface Flow {
    _id: Id<"flows">;
    name: string;
    description?: string;
    triggerType: string;
    isActive: boolean;
    updatedAt: number;
}

interface AutomationTableProps {
    flows: Flow[];
    searchTerm: string;
    onSearchChange: (value: string) => void;
}

export function AutomationTable({ flows, searchTerm, onSearchChange }: AutomationTableProps) {
    const router = useRouter();
    const deleteFlow = useMutation(api.flows.deleteFlow);
    const updateFlow = useMutation(api.flows.update);
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
    const [flowToDelete, setFlowToDelete] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const PAGE_SIZE = 20;

    const totalPages = Math.ceil(flows.length / PAGE_SIZE);
    const paginatedFlows = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE;
        return flows.slice(start, start + PAGE_SIZE);
    }, [flows, currentPage]);

    // Reset to page 1 when search changes the list
    const prevFlowsLength = React.useRef(flows.length);
    if (flows.length !== prevFlowsLength.current) {
        prevFlowsLength.current = flows.length;
        if (currentPage > Math.ceil(flows.length / PAGE_SIZE)) {
            setCurrentPage(1);
        }
    }

    const handleDelete = async (id: string) => {
        try {
            await deleteFlow({ flowId: id as Id<"flows"> });
            toast.success("Automatisation supprimée");
            setFlowToDelete(null);
            if (selectedRows.has(id)) {
                const newSelected = new Set(selectedRows);
                newSelected.delete(id);
                setSelectedRows(newSelected);
            }
        } catch {
            toast.error("Erreur lors de la suppression");
        }
    };

    const handleBatchDelete = async () => {
        if (!confirm(`Voulez-vous vraiment supprimer ${selectedRows.size} automatisations ?`)) return;
        try {
            await Promise.all(Array.from(selectedRows).map(id => deleteFlow({ flowId: id as Id<"flows"> })));
            toast.success(`${selectedRows.size} automatisations supprimées`);
            setSelectedRows(new Set());
        } catch {
            toast.error("Erreur lors de la suppression groupée");
        }
    };

    const toggleStatus = async (id: string, currentStatus: boolean) => {
        try {
            await updateFlow({ flowId: id as Id<"flows">, isActive: !currentStatus });
            toast.success(currentStatus ? "Automatisation désactivée" : "Automatisation activée");
        } catch {
            toast.error("Erreur lors de la mise à jour");
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
        const pageIds = paginatedFlows.map(f => f._id);
        const allSelected = pageIds.every(id => selectedRows.has(id));
        if (allSelected) {
            const newSelected = new Set(selectedRows);
            pageIds.forEach(id => newSelected.delete(id));
            setSelectedRows(newSelected);
        } else {
            setSelectedRows(new Set([...selectedRows, ...pageIds]));
        }
    };

    if (flows.length === 0 && !searchTerm) {
        return (
            <Card className="bg-white border-gray-100 shadow-sm">
                <CardContent className="py-16">
                    <Empty>
                        <EmptyMedia variant="icon">
                            <div className={cn("h-14 w-14 rounded-full bg-gradient-to-br flex items-center justify-center shadow-lg shadow-green-900/20", STAT_GRADIENTS[0])}>
                                <Workflow className="h-7 w-7 text-white" />
                            </div>
                        </EmptyMedia>
                        <EmptyHeader>
                            <EmptyTitle className="text-gray-900">Aucune automatisation</EmptyTitle>
                            <EmptyDescription className="text-gray-500">
                                Créez votre première automatisation WhatsApp pour répondre automatiquement à vos clients.
                            </EmptyDescription>
                        </EmptyHeader>
                        <div className="mt-4">
                            <Button
                                size="sm"
                                onClick={() => router.push('/dashboard/automatisations/nouveau')}
                                className="h-8 gap-1.5 text-xs rounded-full cursor-pointer"
                            >
                                <Plus className="h-3.5 w-3.5" />
                                Nouvelle Automatisation
                            </Button>
                        </div>
                    </Empty>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <AlertDialog open={!!flowToDelete} onOpenChange={(open) => !open && setFlowToDelete(null)}>
                <AlertDialogContent className="bg-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-gray-900">Êtes-vous sûr ?</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-500">
                            Cette action est irréversible. Cela supprimera définitivement cette automatisation.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="cursor-pointer">Annuler</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => flowToDelete && handleDelete(flowToDelete)}
                            className="bg-red-600 text-white hover:bg-red-700 cursor-pointer"
                        >
                            Supprimer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Card className="bg-white border-gray-100 shadow-sm">
                <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 flex-1">
                            <SearchInput
                                placeholder="Rechercher une automatisation..."
                                value={searchTerm}
                                onChange={(e) => onSearchChange(e.target.value)}
                                className="w-full max-w-[350px]"
                            />
                            {selectedRows.size > 0 && (
                                <div className="flex items-center gap-2 ml-2">
                                    <Button variant="destructive" size="sm" onClick={handleBatchDelete} className="h-8 gap-1.5 text-xs rounded-full cursor-pointer">
                                        <Trash2 className="h-3.5 w-3.5" />
                                        Supprimer ({selectedRows.size})
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => setSelectedRows(new Set())} className="h-8 gap-1.5 text-xs rounded-full cursor-pointer">
                                        Annuler
                                    </Button>
                                </div>
                            )}
                        </div>
                        <Button
                            size="sm"
                            onClick={() => router.push('/dashboard/automatisations/nouveau')}
                            className="h-8 gap-1.5 text-xs rounded-full cursor-pointer"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Nouvelle Automatisation</span>
                            <span className="sm:hidden">Nouveau</span>
                        </Button>
                    </div>

                    <div className="mt-4 rounded-lg border border-gray-100 overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                                    <TableHead className="w-[44px]">
                                        <Checkbox
                                            checked={paginatedFlows.length > 0 && paginatedFlows.every(f => selectedRows.has(f._id))}
                                            onCheckedChange={toggleAll}
                                        />
                                    </TableHead>
                                    <TableHead className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Automatisation</TableHead>
                                    <TableHead className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Statut</TableHead>
                                    <TableHead className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Déclencheur</TableHead>
                                    <TableHead className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Modifié</TableHead>
                                    <TableHead className="w-[44px]" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {flows.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-sm text-gray-500">
                                            Aucun résultat pour &quot;{searchTerm}&quot;
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paginatedFlows.map((flow) => (
                                        <TableRow
                                            key={flow._id}
                                            className="hover:bg-gray-50/50 cursor-pointer"
                                            onClick={() => router.push(`/dashboard/automatisations/${flow._id}`)}
                                        >
                                            <TableCell onClick={(e) => e.stopPropagation()}>
                                                <Checkbox
                                                    checked={selectedRows.has(flow._id)}
                                                    onCheckedChange={() => toggleRow(flow._id)}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 truncate">{flow.name}</p>
                                                    <p className="text-[11px] text-gray-400 truncate max-w-[200px]">
                                                        {flow.description || "Automatisation WhatsApp"}
                                                    </p>
                                                </div>
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell">
                                                <span className={cn(
                                                    "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border",
                                                    flow.isActive
                                                        ? 'bg-green-50 text-green-700 border-green-200'
                                                        : 'bg-gray-50 text-gray-600 border-gray-200'
                                                )}>
                                                    <span className={cn(
                                                        "w-1.5 h-1.5 rounded-full",
                                                        flow.isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                                                    )} />
                                                    {flow.isActive ? 'Actif' : 'Brouillon'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="hidden lg:table-cell">
                                                <span className="text-xs text-gray-500">{getTriggerLabel(flow.triggerType)}</span>
                                            </TableCell>
                                            <TableCell className="hidden sm:table-cell">
                                                <span className="text-xs text-gray-400">
                                                    {formatDistanceToNow(flow.updatedAt, { addSuffix: true, locale: fr })}
                                                </span>
                                            </TableCell>
                                            <TableCell onClick={(e) => e.stopPropagation()}>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-gray-100">
                                                            <MoreHorizontal className="h-4 w-4 text-gray-500" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="rounded-xl border border-gray-100 shadow-lg w-48">
                                                        <DropdownMenuLabel className="text-[11px] text-gray-400 font-medium">Actions</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onClick={() => router.push(`/dashboard/automatisations/${flow._id}?mode=guided`)}
                                                            className="cursor-pointer text-sm"
                                                        >
                                                            <Sparkles className="w-4 h-4 mr-2" />
                                                            Modifier (Assistant IA)
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => router.push(`/dashboard/automatisations/${flow._id}`)}
                                                            className="cursor-pointer text-sm"
                                                        >
                                                            <GitBranch className="w-4 h-4 mr-2" />
                                                            Modifier (Diagramme)
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => toggleStatus(flow._id, flow.isActive)}
                                                            className="cursor-pointer text-sm"
                                                        >
                                                            {flow.isActive ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                                                            {flow.isActive ? 'Désactiver' : 'Activer'}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="text-red-600 focus:text-red-600 cursor-pointer text-sm"
                                                            onClick={() => setFlowToDelete(flow._id)}
                                                        >
                                                            <Trash2 className="w-4 h-4 mr-2" />
                                                            Supprimer
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Footer: count + pagination */}
                    <div className="flex items-center justify-between mt-4">
                        <p className="text-[11px] text-gray-400 font-medium">
                            {flows.length > PAGE_SIZE
                                ? `${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(currentPage * PAGE_SIZE, flows.length)} sur ${flows.length}`
                                : `${flows.length} résultat${flows.length > 1 ? 's' : ''}`
                            }
                        </p>
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                </CardContent>
            </Card>
        </>
    );
}
