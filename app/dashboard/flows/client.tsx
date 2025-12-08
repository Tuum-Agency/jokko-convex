'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useRouter } from 'next/navigation';
import { Plus, MoreVertical, Play, Pause, Trash2, Edit, Workflow, Bot, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SearchInput } from '@/components/ui/search-input';
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

export function FlowsPageClient() {
    const router = useRouter();
    const flows = useQuery(api.flows.list);
    const createFlow = useMutation(api.flows.create);
    const deleteFlow = useMutation(api.flows.deleteFlow);
    const updateFlow = useMutation(api.flows.update);

    const [search, setSearch] = useState('');

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
        <div className="p-8 space-y-8 h-full">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Automatisation</h1>
                    <p className="text-gray-500 mt-2">Créez des flux de conversation automatisés pour répondre à vos clients.</p>
                </div>
            </div>

            <div className="flex items-center justify-between gap-4 mb-6">
                <SearchInput
                    placeholder="Rechercher un flux..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    containerClassName="max-w-md"
                />

                <Button
                    className="bg-green-600 hover:bg-green-700 text-white gap-2"
                    onClick={() => router.push('/dashboard/flows/new')}
                >
                    <Plus className="w-4 h-4" />
                    Nouveau Flux
                </Button>
            </div>

            {flows === undefined ? (
                <div className="text-center py-12">Chargement...</div>
            ) : filteredFlows.length === 0 ? (
                <Empty>
                    <EmptyHeader>
                        <EmptyMedia variant="icon">
                            <Workflow className="w-5 h-5" />
                        </EmptyMedia>
                        <EmptyTitle>Aucun flux trouvé</EmptyTitle>
                        <EmptyDescription>
                            Commencez par créer votre premier flux d'automatisation pour répondre automatiquement à vos clients.
                        </EmptyDescription>
                    </EmptyHeader>
                    <EmptyContent>
                        <Button className="bg-green-600 hover:bg-green-700 text-white gap-2" onClick={() => router.push('/dashboard/flows/new')}>
                            <Plus className="w-4 h-4" />
                            Créer un flux
                        </Button>
                    </EmptyContent>
                </Empty>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredFlows.map((flow) => (
                        <div key={flow._id} className="group relative bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all hover:border-green-200">
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <MoreVertical className="w-4 h-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => router.push(`/dashboard/flows/${flow._id}`)}>
                                            <Edit className="w-4 h-4 mr-2" />
                                            Modifier
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => toggleStatus(flow._id, flow.isActive)}>
                                            {flow.isActive ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                                            {flow.isActive ? 'Désactiver' : 'Activer'}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => handleDelete(flow._id)}>
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Supprimer
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            <div className="mb-4">
                                <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${flow.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                    }`}>
                                    {flow.isActive ? 'Actif' : 'Brouillon'}
                                </div>
                            </div>

                            <h3 className="text-lg font-semibold text-gray-900 mb-1">{flow.name}</h3>
                            <p className="text-sm text-gray-500 line-clamp-2 mb-4 h-10">
                                {flow.description || "Aucune description"}
                            </p>

                            <div className="flex items-center justify-between text-xs text-gray-400 mt-auto pt-4 border-t border-gray-100">
                                <span>Modifié {formatDistanceToNow(flow.updatedAt, { addSuffix: true, locale: fr })}</span>
                                <Button size="sm" variant="ghost" className="text-green-600 hover:text-green-700 hover:bg-green-50 p-0 h-auto font-medium" onClick={() => router.push(`/dashboard/flows/${flow._id}`)}>
                                    Ouvrir l'éditeur →
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
