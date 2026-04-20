'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useRouter } from 'next/navigation';
import { Plus, MoreVertical, Play, Pause, Trash2, Edit, Workflow, Bot, ChevronLeft, AlertCircle, Sparkles } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SearchInput } from '@/components/ui/search-input';
import { Skeleton } from '@/components/ui/skeleton';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
    Empty,
    EmptyContent,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '@/components/ui/empty';
import { FeatureGate } from '@/components/plan/FeatureGate';
import { usePlanFeature } from '@/hooks/use-plan-feature';

export function FlowsPageClient() {
    const router = useRouter();
    const role = useQuery(api.users.currentUserRole);
    const { allowed: planAllowed, isLoading: planLoading } = usePlanFeature('flows');

    const flows = useQuery(api.flows.list);
    const createFlow = useMutation(api.flows.create);
    const deleteFlow = useMutation(api.flows.deleteFlow);
    const updateFlow = useMutation(api.flows.update);
    const [search, setSearch] = useState('');

    if (role === undefined) {
        return (
            <div className="p-8 space-y-8 h-full bg-gray-50/30">
                <Skeleton className="h-10 w-48" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                            <Skeleton className="h-6 w-16 mb-4" />
                            <Skeleton className="h-24 w-full" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (role === 'AGENT') {
        return (
            <div className="p-6">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Accès refusé</AlertTitle>
                    <AlertDescription>
                        Vous n'avez pas les autorisations nécessaires pour accéder à cette page.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    if (planLoading) {
        return (
            <div className="p-8 space-y-6">
                <Skeleton className="h-40 w-full" />
            </div>
        );
    }
    if (!planAllowed) {
        return (
            <div className="p-6">
                <FeatureGate feature="flows">{null}</FeatureGate>
            </div>
        );
    }

    const filteredFlows = flows?.filter(f =>
        f.name.toLowerCase().includes(search.toLowerCase())
    ) || [];

    const handleDelete = async (id: any) => {
        if (confirm('Êtes-vous sûr de vouloir supprimer ce flux ?')) {
            await deleteFlow({ flowId: id });
        }
    };

    const toggleStatus = async (id: any, currentStatus: boolean) => {
        await updateFlow({ flowId: id, isActive: !currentStatus });
    }

    return (
        <div className="p-8 space-y-8 h-screen overflow-y-auto bg-gray-50/30">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Automatisation/Flux</h1>
                    <p className="text-gray-500 mt-2 text-sm lg:text-base">Gérez vos séquences de messages et chatbots WhatsApp.</p>
                </div>
                <Button
                    className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 rounded-xl shadow-lg shadow-indigo-200 transition-all hover:scale-105"
                    onClick={() => router.push('/dashboard/flows/new')}
                >
                    <Sparkles className="w-4 h-4" />
                    Nouveau Flux IA
                </Button>
            </div>

            <div className="flex items-center justify-between gap-4 mb-6 sticky top-0 z-10 bg-gray-50/30 backdrop-blur-sm py-2">
                <SearchInput
                    placeholder="Rechercher un flux..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    containerClassName="max-w-md w-full"
                    className="bg-white border-gray-200 focus:border-indigo-300 focus:ring-indigo-100 rounded-xl"
                />
            </div>

            {flows === undefined ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                            <div className="flex justify-between items-start mb-4">
                                <Skeleton className="h-6 w-16 rounded-full" />
                                <Skeleton className="h-8 w-8 rounded-md" />
                            </div>
                            <Skeleton className="h-6 w-3/4 mb-2" />
                            <Skeleton className="h-4 w-full mb-1" />
                            <Skeleton className="h-4 w-2/3 mb-6" />
                            <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                                <Skeleton className="h-3 w-24" />
                                <Skeleton className="h-4 w-20" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : filteredFlows.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                    <Empty>
                        <EmptyHeader>
                            <EmptyMedia variant="icon" className="bg-indigo-100 text-indigo-600 rounded-full p-4 mb-4">
                                <Workflow className="w-8 h-8" />
                            </EmptyMedia>
                            <EmptyTitle className="text-xl font-bold text-gray-900">Aucun flux trouvé</EmptyTitle>
                            <EmptyDescription className="text-gray-500 max-w-sm mx-auto mt-2">
                                Commencez par créer votre premier flux d'automatisation pour répondre automatiquement à vos clients.
                            </EmptyDescription>
                        </EmptyHeader>
                        <EmptyContent className="mt-6">
                            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 rounded-xl" onClick={() => router.push('/dashboard/flows/new')}>
                                <Sparkles className="w-4 h-4" />
                                Créer avec l'IA
                            </Button>
                        </EmptyContent>
                    </Empty>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
                    {filteredFlows.map((flow) => (
                        <div
                            key={flow._id}
                            className="group relative bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 hover:border-indigo-100 flex flex-col"
                        >
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-gray-100">
                                            <MoreVertical className="w-4 h-4 text-gray-500" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="rounded-xl border border-gray-100 shadow-lg">
                                        <DropdownMenuItem onClick={() => router.push(`/dashboard/flows/${flow._id}`)} className="cursor-pointer">
                                            <Edit className="w-4 h-4 mr-2" />
                                            Modifier
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => toggleStatus(flow._id, flow.isActive)} className="cursor-pointer">
                                            {flow.isActive ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                                            {flow.isActive ? 'Désactiver' : 'Activer'}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="text-red-600 focus:text-red-600 cursor-pointer" onClick={() => handleDelete(flow._id)}>
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Supprimer
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            <div className="mb-4">
                                <div className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${flow.isActive
                                        ? 'bg-green-100 text-green-700 border border-green-200'
                                        : 'bg-gray-100 text-gray-600 border border-gray-200'
                                    }`}>
                                    {flow.isActive ? (
                                        <>
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse"></span>
                                            Actif
                                        </>
                                    ) : (
                                        <>
                                            <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mr-1.5"></span>
                                            Brouillon
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="mb-auto">
                                <h3 className="text-lg font-bold text-gray-900 mb-2 truncate pr-8 group-hover:text-indigo-700 transition-colors">
                                    {flow.name}
                                </h3>
                                <p className="text-sm text-gray-500 line-clamp-2 h-10 leading-relaxed">
                                    {flow.description || "Un flux automatisé pour gérer les interactions clients."}
                                </p>
                            </div>

                            <div className="flex items-center justify-between text-xs text-gray-400 mt-6 pt-4 border-t border-gray-50">
                                <span>{formatDistanceToNow(flow.updatedAt, { addSuffix: true, locale: fr })}</span>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 p-0 h-auto font-medium group/btn"
                                    onClick={() => router.push(`/dashboard/flows/${flow._id}`)}
                                >
                                    Ouvrir
                                    <ChevronLeft className="w-3 h-3 ml-1 rotate-180 transition-transform group-hover/btn:translate-x-1" />
                                </Button>
                            </div>
                        </div>
                    ))}

                    {/* Add New Card (Ghost) */}
                    <div
                        className="group relative rounded-2xl border-2 border-dashed border-gray-200 p-6 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/50 transition-all min-h-[220px]"
                        onClick={() => router.push('/dashboard/flows/new')}
                    >
                        <div className="h-12 w-12 rounded-full bg-gray-50 group-hover:bg-white flex items-center justify-center border border-gray-100 group-hover:scale-110 transition-transform shadow-sm">
                            <Plus className="w-6 h-6 text-gray-400 group-hover:text-indigo-600" />
                        </div>
                        <span className="font-semibold text-gray-500 group-hover:text-indigo-700">Créer un nouveau flux</span>
                    </div>
                </div>
            )}
        </div>
    );
}
