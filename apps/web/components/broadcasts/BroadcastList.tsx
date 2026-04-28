'use client'

import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SearchInput } from '@/components/ui/search-input';
import { Skeleton } from '@/components/ui/skeleton';
import { Pagination } from '@/components/ui/pagination';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { MoreHorizontal, Plus, RadioTower, ExternalLink, Trash2, Copy, Send, CheckCircle, Eye, MessageSquare, Download, Archive, ArrowUpDown } from 'lucide-react';
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

const STATUS_FILTERS = [
    { value: "ALL", label: "Tous" },
    { value: "DRAFT", label: "Brouillon" },
    { value: "SCHEDULED", label: "Planifi\u00e9e" },
    { value: "SENDING", label: "En cours" },
    { value: "COMPLETED", label: "Termin\u00e9e" },
    { value: "FAILED", label: "\u00c9chou\u00e9e" },
    { value: "CANCELLED", label: "Annul\u00e9e" },
];

type SortOption = "newest" | "oldest" | "name_asc" | "best_rate";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
    { value: "newest", label: "Plus r\u00e9cente" },
    { value: "oldest", label: "Plus ancienne" },
    { value: "name_asc", label: "Nom A-Z" },
    { value: "best_rate", label: "Meilleur taux" },
];

const ITEMS_PER_PAGE = 10;

function exportBroadcastsCsv(broadcasts: Array<{
    name: string;
    status: string;
    templateName: string;
    channelName: string | null;
    sentCount: number;
    deliveredCount: number;
    readCount: number;
    repliedCount: number;
    failedCount: number;
    createdAt: number;
}>) {
    const headers = ["Nom", "Statut", "Template", "Canal", "Envoy\u00e9s", "D\u00e9livr\u00e9s", "Lus", "R\u00e9ponses", "\u00c9checs", "Date de cr\u00e9ation"];
    const rows = broadcasts.map(b => [
        `"${b.name.replace(/"/g, '""')}"`,
        b.status,
        `"${b.templateName.replace(/"/g, '""')}"`,
        b.channelName || "Par d\u00e9faut",
        b.sentCount,
        b.deliveredCount,
        b.readCount,
        b.repliedCount,
        b.failedCount,
        format(new Date(b.createdAt), 'dd/MM/yyyy HH:mm', { locale: fr }),
    ]);

    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `campagnes_export_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

export const BroadcastList: React.FC = () => {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
    const [broadcastToDelete, setBroadcastToDelete] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<string>("ALL");
    const [sortBy, setSortBy] = useState<SortOption>("newest");
    const [currentPage, setCurrentPage] = useState(1);

    const broadcasts = useQuery(api.broadcasts.list, { search: searchTerm || undefined });
    const duplicateBroadcast = useMutation(api.broadcasts.duplicate);
    const deleteBroadcast = useMutation(api.broadcasts.deleteBroadcast);
    const archiveBroadcast = useMutation(api.broadcasts.archiveBroadcast);

    // Reset page when filter/search/sort changes
    const handleSearchChange = useCallback((value: string) => {
        setSearchTerm(value);
        setCurrentPage(1);
    }, []);

    const handleStatusFilterChange = useCallback((value: string) => {
        setStatusFilter(value);
        setCurrentPage(1);
        setSelectedRows(new Set());
    }, []);

    const handleSortChange = useCallback((value: SortOption) => {
        setSortBy(value);
        setCurrentPage(1);
    }, []);

    // Filter by status
    const filteredBroadcasts = useMemo(() => {
        if (!broadcasts) return [];
        if (statusFilter === "ALL") return broadcasts;
        return broadcasts.filter(b => b.status === statusFilter);
    }, [broadcasts, statusFilter]);

    // Sort
    const sortedBroadcasts = useMemo(() => {
        const arr = [...filteredBroadcasts];
        switch (sortBy) {
            case "newest":
                return arr.sort((a, b) => b.createdAt - a.createdAt);
            case "oldest":
                return arr.sort((a, b) => a.createdAt - b.createdAt);
            case "name_asc":
                return arr.sort((a, b) => a.name.localeCompare(b.name, 'fr'));
            case "best_rate": {
                const getRate = (b: typeof arr[number]) =>
                    b.deliveredCount > 0 ? (b.readCount / b.deliveredCount) : 0;
                return arr.sort((a, b) => getRate(b) - getRate(a));
            }
            default:
                return arr;
        }
    }, [filteredBroadcasts, sortBy]);

    // Pagination
    const totalItems = sortedBroadcasts.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
    const safePage = Math.min(currentPage, totalPages);
    const startIndex = (safePage - 1) * ITEMS_PER_PAGE;
    const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalItems);
    const paginatedBroadcasts = sortedBroadcasts.slice(startIndex, endIndex);

    // Status counts for tab badges
    const statusCounts = useMemo(() => {
        if (!broadcasts) return {} as Record<string, number>;
        const counts: Record<string, number> = { ALL: broadcasts.length };
        for (const b of broadcasts) {
            counts[b.status] = (counts[b.status] || 0) + 1;
        }
        return counts;
    }, [broadcasts]);

    const handleDuplicate = async (id: Id<"broadcasts">) => {
        try {
            const newId = await duplicateBroadcast({ id });
            toast.success("Campagne dupliqu\u00e9e");
            router.push(`/dashboard/campagnes/${newId}`);
        } catch {
            toast.error("Erreur lors de la duplication");
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteBroadcast({ id: id as Id<"broadcasts"> });
            toast.success("Campagne supprim\u00e9e");
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
            toast.success(`${selectedRows.size} campagnes supprim\u00e9es`);
            setSelectedRows(new Set());
        } catch {
            toast.error("Erreur lors de la suppression group\u00e9e");
        }
    };

    const handleBatchDuplicate = async () => {
        try {
            await Promise.all(Array.from(selectedRows).map(id => duplicateBroadcast({ id: id as Id<"broadcasts"> })));
            toast.success(`${selectedRows.size} campagnes dupliqu\u00e9es`);
            setSelectedRows(new Set());
        } catch {
            toast.error("Erreur lors de la duplication group\u00e9e");
        }
    };

    const handleBatchArchive = async () => {
        const archivable = Array.from(selectedRows).filter(id => {
            const b = broadcasts?.find(br => br._id === id);
            return b && (b.status === "DRAFT" || b.status === "COMPLETED");
        });

        if (archivable.length === 0) {
            toast.error("Seuls les brouillons et campagnes termin\u00e9es peuvent \u00eatre archiv\u00e9s");
            return;
        }

        try {
            await Promise.all(archivable.map(id => archiveBroadcast({ id: id as Id<"broadcasts"> })));
            toast.success(`${archivable.length} campagnes archiv\u00e9es`);
            setSelectedRows(new Set());
        } catch {
            toast.error("Erreur lors de l'archivage group\u00e9");
        }
    };

    const handleExportCsv = () => {
        if (!broadcasts) return;
        const selected = broadcasts.filter(b => selectedRows.has(b._id));
        if (selected.length === 0) return;
        exportBroadcastsCsv(selected);
        toast.success(`${selected.length} campagnes export\u00e9es`);
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
        if (paginatedBroadcasts.length === 0) return;
        const allPageIds = paginatedBroadcasts.map(b => b._id);
        const allSelected = allPageIds.every(id => selectedRows.has(id));
        if (allSelected) {
            const newSelected = new Set(selectedRows);
            allPageIds.forEach(id => newSelected.delete(id));
            setSelectedRows(newSelected);
        } else {
            const newSelected = new Set(selectedRows);
            allPageIds.forEach(id => newSelected.add(id));
            setSelectedRows(newSelected);
        }
    };

    // Aggregate stats
    const totalSent = broadcasts?.reduce((sum, b) => sum + b.sentCount, 0) ?? 0;
    const totalDelivered = broadcasts?.reduce((sum, b) => sum + b.deliveredCount, 0) ?? 0;
    const totalRead = broadcasts?.reduce((sum, b) => sum + b.readCount, 0) ?? 0;
    const totalReplied = broadcasts?.reduce((sum, b) => sum + b.repliedCount, 0) ?? 0;

    const summaryStats = [
        { title: 'Envoy\u00e9s', value: totalSent.toString(), icon: Send, gradient: STAT_GRADIENTS[0] },
        { title: 'D\u00e9livr\u00e9s', value: totalDelivered.toString(), icon: CheckCircle, gradient: STAT_GRADIENTS[1] },
        { title: 'Lus', value: totalRead.toString(), icon: Eye, gradient: STAT_GRADIENTS[2] },
        { title: 'R\u00e9ponses', value: totalReplied.toString(), icon: MessageSquare, gradient: STAT_GRADIENTS[3] },
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

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'COMPLETED': return { label: 'Termin\u00e9e', className: 'bg-green-50 text-green-700 border-green-200' };
            case 'FAILED': return { label: '\u00c9chou\u00e9e', className: 'bg-red-50 text-red-700 border-red-200' };
            case 'SENDING': return { label: 'En cours', className: 'bg-blue-50 text-blue-700 border-blue-200' };
            case 'SCHEDULED': return { label: 'Planifi\u00e9e', className: 'bg-amber-50 text-amber-700 border-amber-200' };
            case 'DRAFT': return { label: 'Brouillon', className: 'bg-gray-50 text-gray-600 border-gray-200' };
            case 'CANCELLED': return { label: 'Annul\u00e9e', className: 'bg-gray-50 text-gray-500 border-gray-200' };
            default: return { label: status, className: 'bg-gray-50 text-gray-600 border-gray-200' };
        }
    };

    // Contextual empty state
    const getEmptyState = () => {
        if (statusFilter === "ALL" && searchTerm) {
            return {
                title: `Aucun r\u00e9sultat pour \u00ab ${searchTerm} \u00bb`,
                description: "Essayez de modifier votre recherche.",
                showCta: false,
            };
        }
        if (statusFilter === "ALL") {
            return {
                title: "Aucune campagne",
                description: "Cr\u00e9ez votre premi\u00e8re campagne de diffusion WhatsApp pour toucher vos clients.",
                showCta: true,
            };
        }
        const messages: Record<string, { title: string; description: string }> = {
            DRAFT: { title: "Aucun brouillon", description: "Vos campagnes en pr\u00e9paration appara\u00eetront ici." },
            SCHEDULED: { title: "Aucune campagne planifi\u00e9e", description: "Les campagnes programm\u00e9es appara\u00eetront ici." },
            SENDING: { title: "Aucun envoi en cours", description: "Les campagnes en cours d'envoi appara\u00eetront ici." },
            COMPLETED: { title: "Aucune campagne termin\u00e9e", description: "Les campagnes termin\u00e9es appara\u00eetront ici." },
            FAILED: { title: "Aucune campagne \u00e9chou\u00e9e", description: "Les campagnes \u00e9chou\u00e9es appara\u00eetront ici." },
            CANCELLED: { title: "Aucune campagne annul\u00e9e", description: "Les campagnes annul\u00e9es appara\u00eetront ici." },
        };
        return {
            ...(messages[statusFilter] || { title: "Aucune campagne", description: "" }),
            showCta: false,
        };
    };

    const allPageSelected = paginatedBroadcasts.length > 0 && paginatedBroadcasts.every(b => selectedRows.has(b._id));

    return (
        <div className="space-y-5">
            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!broadcastToDelete} onOpenChange={(open) => !open && setBroadcastToDelete(null)}>
                <AlertDialogContent className="bg-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-gray-900">\u00cates-vous s\u00fbr ?</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-500">
                            Cette action est irr\u00e9versible. Cela supprimera d\u00e9finitivement la campagne et ses donn\u00e9es associ\u00e9es.
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
                {summaryStats.map((stat) => {
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

            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1.5 flex-wrap">
                {STATUS_FILTERS.map((filter) => {
                    const count = statusCounts[filter.value] ?? 0;
                    const isActive = statusFilter === filter.value;
                    return (
                        <button
                            key={filter.value}
                            onClick={() => handleStatusFilterChange(filter.value)}
                            className={cn(
                                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer",
                                isActive
                                    ? "bg-green-50 text-green-700 border-green-200"
                                    : "text-gray-500 hover:text-gray-700 border-transparent hover:border-gray-200"
                            )}
                        >
                            {filter.label}
                            <span className={cn(
                                "inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full px-1 text-[10px] font-semibold",
                                isActive
                                    ? "bg-green-100 text-green-700"
                                    : "bg-gray-100 text-gray-500"
                            )}>
                                {count}
                            </span>
                        </button>
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
                                onChange={(e) => handleSearchChange(e.target.value)}
                                className="w-full max-w-[350px]"
                            />

                            {/* Sort Dropdown */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs rounded-full cursor-pointer">
                                        <ArrowUpDown className="h-3.5 w-3.5" />
                                        <span className="hidden sm:inline">{SORT_OPTIONS.find(o => o.value === sortBy)?.label}</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="w-40">
                                    <DropdownMenuLabel className="text-[11px] text-gray-400 font-medium">Trier par</DropdownMenuLabel>
                                    {SORT_OPTIONS.map((option) => (
                                        <DropdownMenuItem
                                            key={option.value}
                                            onClick={() => handleSortChange(option.value)}
                                            className={cn("cursor-pointer text-sm", sortBy === option.value && "font-semibold text-green-700")}
                                        >
                                            {option.label}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {/* Bulk Actions */}
                            {selectedRows.size > 0 && (
                                <div className="flex items-center gap-2 ml-2">
                                    <Button variant="outline" size="sm" onClick={handleBatchDuplicate} className="h-8 gap-1.5 text-xs rounded-full cursor-pointer">
                                        <Copy className="h-3.5 w-3.5" />
                                        Dupliquer ({selectedRows.size})
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={handleExportCsv} className="h-8 gap-1.5 text-xs rounded-full cursor-pointer">
                                        <Download className="h-3.5 w-3.5" />
                                        Exporter CSV
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={handleBatchArchive} className="h-8 gap-1.5 text-xs rounded-full cursor-pointer">
                                        <Archive className="h-3.5 w-3.5" />
                                        Archiver ({selectedRows.size})
                                    </Button>
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
                                            checked={allPageSelected}
                                            onCheckedChange={toggleAll}
                                        />
                                    </TableHead>
                                    <TableHead className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Campagne</TableHead>
                                    <TableHead className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Statut</TableHead>
                                    <TableHead className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Canal</TableHead>
                                    <TableHead className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Envoy&eacute;s</TableHead>
                                    <TableHead className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Taux d&apos;ouverture</TableHead>
                                    <TableHead className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-right">Date</TableHead>
                                    <TableHead className="w-[44px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedBroadcasts.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="h-48">
                                            {(() => {
                                                const emptyState = getEmptyState();
                                                return (
                                                    <Empty>
                                                        <EmptyMedia variant="icon">
                                                            <div className={cn("h-14 w-14 rounded-full bg-gradient-to-br flex items-center justify-center shadow-lg shadow-green-900/20", STAT_GRADIENTS[0])}>
                                                                <RadioTower className="h-7 w-7 text-white" />
                                                            </div>
                                                        </EmptyMedia>
                                                        <EmptyHeader>
                                                            <EmptyTitle className="text-gray-900">{emptyState.title}</EmptyTitle>
                                                            <EmptyDescription className="text-gray-500">
                                                                {emptyState.description}
                                                            </EmptyDescription>
                                                        </EmptyHeader>
                                                        {emptyState.showCta && (
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
                                                        )}
                                                    </Empty>
                                                );
                                            })()}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paginatedBroadcasts.map((broadcast) => {
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
                                                    <span className="text-sm text-gray-600">
                                                        {broadcast.channelName || "Par d\u00e9faut"}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium text-gray-900">{broadcast.sentCount}</span>
                                                        {broadcast.failedCount > 0 && (
                                                            <span className="text-[11px] text-red-500">{broadcast.failedCount} \u00e9checs</span>
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
                                                            {(broadcast.status === "DRAFT" || broadcast.status === "COMPLETED") && (
                                                                <DropdownMenuItem
                                                                    onClick={() => archiveBroadcast({ id: broadcast._id }).then(() => toast.success("Campagne archiv\u00e9e")).catch(() => toast.error("Erreur lors de l'archivage"))}
                                                                    className="cursor-pointer text-sm"
                                                                >
                                                                    <Archive className="mr-2 h-3.5 w-3.5" /> Archiver
                                                                </DropdownMenuItem>
                                                            )}
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

                    {/* Pagination */}
                    {totalItems > 0 && (
                        <div className="mt-4 flex items-center justify-between">
                            <p className="text-xs text-gray-500">
                                Affichage {startIndex + 1}-{endIndex} sur {totalItems} campagnes
                            </p>
                            <Pagination
                                currentPage={safePage}
                                totalPages={totalPages}
                                onPageChange={setCurrentPage}
                            />
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};
