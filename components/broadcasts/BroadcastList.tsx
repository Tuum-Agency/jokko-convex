'use client'

import React, { useState } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SearchInput } from '@/components/ui/search-input';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { MoreHorizontal, Plus, RadioTower, ExternalLink, Trash2, Copy, Send, CheckCircle, Eye, MessageSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
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
} from "@/components/ui/alert-dialog";

const STAT_GRADIENTS = [
    'from-[#14532d] to-[#059669]',
    'from-[#166534] to-[#0d9488]',
    'from-[#15803d] to-[#10b981]',
    'from-[#14532d] to-[#34d399]',
];

export const BroadcastList: React.FC = () => {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
    const [broadcastToDelete, setBroadcastToDelete] = useState<string | null>(null);

    const broadcasts = useQuery(api.broadcasts.list, { search: searchTerm || undefined });
    const duplicateBroadcast = useMutation(api.broadcasts.duplicate);
    const deleteBroadcast = useMutation(api.broadcasts.deleteBroadcast);

    const handleDuplicate = async (id: Id<"broadcasts">) => {
        try {
            const newId = await duplicateBroadcast({ id });
            toast.success("Campagne dupliquée");
            router.push(`/dashboard/campagnes/${newId}`);
        } catch {
            toast.error("Erreur lors de la duplication");
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteBroadcast({ id: id as Id<"broadcasts"> });
            toast.success("Campagne supprimée");
            setBroadcastToDelete(null);
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
        if (!confirm(`Voulez-vous vraiment supprimer ${selectedRows.size} campagnes ?`)) return;

        try {
            await Promise.all(Array.from(selectedRows).map(id => deleteBroadcast({ id: id as Id<"broadcasts"> })));
            toast.success(`${selectedRows.size} campagnes supprimées`);
            setSelectedRows(new Set());
        } catch {
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

    // Aggregate stats
    const totalSent = broadcasts?.reduce((sum, b) => sum + b.sentCount, 0) ?? 0;
    const totalDelivered = broadcasts?.reduce((sum, b) => sum + b.deliveredCount, 0) ?? 0;
    const totalRead = broadcasts?.reduce((sum, b) => sum + b.readCount, 0) ?? 0;
    const totalReplied = broadcasts?.reduce((sum, b) => sum + b.repliedCount, 0) ?? 0;

    const summaryStats = [
        { title: 'Envoyés', value: totalSent.toString(), icon: Send, gradient: STAT_GRADIENTS[0] },
        { title: 'Délivrés', value: totalDelivered.toString(), icon: CheckCircle, gradient: STAT_GRADIENTS[1] },
        { title: 'Lus', value: totalRead.toString(), icon: Eye, gradient: STAT_GRADIENTS[2] },
        { title: 'Réponses', value: totalReplied.toString(), icon: MessageSquare, gradient: STAT_GRADIENTS[3] },
    ];

    if (broadcasts === undefined) {
        return (
            <div className="space-y-4">
                <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Card key={i} className="bg-white border-gray-100 shadow-sm">
                            <CardContent className="p-4 sm:p-5">
                                <Skeleton className="h-10 w-10 rounded-full mb-3" />
                                <Skeleton className="h-3 w-16 mb-2" />
                                <Skeleton className="h-6 w-12" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
                <Card className="bg-white border-gray-100 shadow-sm">
                    <CardContent className="p-4">
                        <Skeleton className="h-10 w-full mb-3" />
                        <Skeleton className="h-16 w-full mb-2" />
                        <Skeleton className="h-16 w-full mb-2" />
                        <Skeleton className="h-16 w-full" />
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (broadcasts.length === 0 && !searchTerm) {
        return (
            <Card className="bg-white border-gray-100 shadow-sm">
                <CardContent className="py-16">
                    <Empty>
                        <EmptyMedia variant="icon">
                            <div className={cn("h-14 w-14 rounded-full bg-gradient-to-br flex items-center justify-center shadow-lg shadow-green-900/20", STAT_GRADIENTS[0])}>
                                <RadioTower className="h-7 w-7 text-white" />
                            </div>
                        </EmptyMedia>
                        <EmptyHeader>
                            <EmptyTitle className="text-gray-900">Aucune campagne</EmptyTitle>
                            <EmptyDescription className="text-gray-500">
                                Créez votre première campagne de diffusion WhatsApp pour toucher vos clients.
                            </EmptyDescription>
                        </EmptyHeader>
                        <div className="mt-4">
                            <Button
                                size="sm"
                                onClick={() => router.push('/dashboard/campagnes/new')}
                                className="h-8 gap-1.5 text-xs rounded-full cursor-pointer"
                            >
                                <Plus className="h-3.5 w-3.5" />
                                Nouvelle Campagne
                            </Button>
                        </div>
                    </Empty>
                </CardContent>
            </Card>
        );
    }

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'COMPLETED': return { label: 'Terminée', className: 'bg-green-50 text-green-700 border-green-200' };
            case 'FAILED': return { label: 'Échouée', className: 'bg-red-50 text-red-700 border-red-200' };
            case 'SENDING': return { label: 'En cours', className: 'bg-blue-50 text-blue-700 border-blue-200' };
            case 'SCHEDULED': return { label: 'Planifiée', className: 'bg-amber-50 text-amber-700 border-amber-200' };
            case 'DRAFT': return { label: 'Brouillon', className: 'bg-gray-50 text-gray-600 border-gray-200' };
            case 'CANCELLED': return { label: 'Annulée', className: 'bg-gray-50 text-gray-500 border-gray-200' };
            default: return { label: status, className: 'bg-gray-50 text-gray-600 border-gray-200' };
        }
    };

    return (
        <div className="space-y-5">
            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!broadcastToDelete} onOpenChange={(open) => !open && setBroadcastToDelete(null)}>
                <AlertDialogContent className="bg-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-gray-900">Êtes-vous sûr ?</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-500">
                            Cette action est irréversible. Cela supprimera définitivement la campagne et ses données associées.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="cursor-pointer">Annuler</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => broadcastToDelete && handleDelete(broadcastToDelete)}
                            className="bg-red-600 text-white hover:bg-red-700 cursor-pointer"
                        >
                            Supprimer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Summary Stats */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                {summaryStats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <Card key={stat.title} className="bg-white border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                            <CardContent className="p-4 sm:p-5">
                                <div className="flex items-center justify-between mb-3 sm:mb-4">
                                    <div className={cn("h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-gradient-to-br flex items-center justify-center shadow-lg shadow-green-900/20", stat.gradient)}>
                                        <Icon className="h-[18px] w-[18px] sm:h-5 sm:w-5 text-white" />
                                    </div>
                                </div>
                                <p className="text-xs sm:text-sm font-medium text-gray-500 mb-0.5">{stat.title}</p>
                                <span className="text-xl sm:text-3xl font-bold text-gray-900 tracking-tight">{stat.value}</span>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Toolbar */}
            <Card className="bg-white border-gray-100 shadow-sm">
                <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 flex-1">
                            <SearchInput
                                placeholder="Rechercher une campagne..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
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
                            onClick={() => router.push('/dashboard/campagnes/new')}
                            className="h-8 gap-1.5 text-xs rounded-full cursor-pointer"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Nouvelle Campagne</span>
                            <span className="sm:hidden">Nouveau</span>
                        </Button>
                    </div>

                    {/* Table */}
                    <div className="mt-4 rounded-lg border border-gray-100 overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                                    <TableHead className="w-[44px]">
                                        <Checkbox
                                            checked={broadcasts.length > 0 && selectedRows.size === broadcasts.length}
                                            onCheckedChange={toggleAll}
                                        />
                                    </TableHead>
                                    <TableHead className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Campagne</TableHead>
                                    <TableHead className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Statut</TableHead>
                                    <TableHead className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Envoyés</TableHead>
                                    <TableHead className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Taux d&apos;ouverture</TableHead>
                                    <TableHead className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-right">Date</TableHead>
                                    <TableHead className="w-[44px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {broadcasts.length === 0 && searchTerm ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-32 text-center text-sm text-gray-400">
                                            Aucun résultat pour &quot;{searchTerm}&quot;
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    broadcasts.map((broadcast) => {
                                        const openRate = broadcast.deliveredCount > 0 ? Math.round((broadcast.readCount / broadcast.deliveredCount) * 100) : 0;
                                        const isSelected = selectedRows.has(broadcast._id);
                                        const statusConfig = getStatusConfig(broadcast.status);

                                        return (
                                            <TableRow
                                                key={broadcast._id}
                                                className="cursor-pointer hover:bg-gray-50/50 transition-colors"
                                                onClick={() => router.push(`/dashboard/campagnes/${broadcast._id}`)}
                                            >
                                                <TableCell onClick={(e) => e.stopPropagation()}>
                                                    <Checkbox
                                                        checked={isSelected}
                                                        onCheckedChange={() => toggleRow(broadcast._id)}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn("h-9 w-9 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-sm font-semibold shrink-0 shadow-sm", STAT_GRADIENTS[0])}>
                                                            {broadcast.name.substring(0, 1).toUpperCase()}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">{broadcast.name}</p>
                                                            <p className="text-[11px] text-gray-400 truncate max-w-[200px]">
                                                                {broadcast.templateName || 'Template inconnu'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border", statusConfig.className)}>
                                                        {statusConfig.label}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium text-gray-900">{broadcast.sentCount}</span>
                                                        {broadcast.failedCount > 0 && (
                                                            <span className="text-[11px] text-red-500">{broadcast.failedCount} échecs</span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="hidden lg:table-cell">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium text-gray-900">{openRate}%</span>
                                                        <span className="text-[11px] text-gray-400">({broadcast.readCount}/{broadcast.deliveredCount})</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <span className="text-[11px] text-gray-400 font-medium">
                                                        {format(new Date(broadcast.createdAt), 'dd MMM yyyy', { locale: fr })}
                                                    </span>
                                                </TableCell>
                                                <TableCell onClick={(e) => e.stopPropagation()}>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600 cursor-pointer">
                                                                <span className="sr-only">Menu</span>
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-40">
                                                            <DropdownMenuLabel className="text-[11px] text-gray-400 font-medium">Actions</DropdownMenuLabel>
                                                            <DropdownMenuItem onClick={() => router.push(`/dashboard/campagnes/${broadcast._id}`)} className="cursor-pointer text-sm">
                                                                <ExternalLink className="mr-2 h-3.5 w-3.5" /> Détails
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleDuplicate(broadcast._id)} className="cursor-pointer text-sm">
                                                                <Copy className="mr-2 h-3.5 w-3.5" /> Dupliquer
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem onClick={() => setBroadcastToDelete(broadcast._id)} className="text-red-600 focus:text-red-600 cursor-pointer text-sm">
                                                                <Trash2 className="mr-2 h-3.5 w-3.5" /> Supprimer
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
