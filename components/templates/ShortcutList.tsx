'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, usePaginatedQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Doc, Id } from '@/convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Plus, Pencil, Trash2, Search, MessageSquareDashed } from 'lucide-react';
import { toast } from 'sonner';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { ButtonGroup } from '@/components/ui/button-group';
import { SearchInput } from '@/components/ui/search-input';

export const ShortcutList = () => {
    // Filter
    const [searchTerm, setSearchTerm] = useState('');

    const { results: shortcuts, status, loadMore } = usePaginatedQuery(
        api.shortcuts.list,
        { search: searchTerm === '' ? undefined : searchTerm },
        { initialNumItems: 15 }
    );

    const createShortcut = useMutation(api.shortcuts.create);
    const updateShortcut = useMutation(api.shortcuts.update);
    const deleteShortcut = useMutation(api.shortcuts.deleteShortcut);

    // Dialog State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<Id<"shortcuts"> | null>(null);
    const [formData, setFormData] = useState({ shortcut: '', text: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingId) {
                await updateShortcut({ id: editingId, ...formData });
                toast.success('Raccourci mis à jour');
            } else {
                await createShortcut({ ...formData });
                toast.success('Raccourci créé');
            }
            setIsDialogOpen(false);
            resetForm();
        } catch (error: any) {
            toast.error(error.message || "Une erreur est survenue");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (shortcut: Doc<"shortcuts">) => {
        setEditingId(shortcut._id);
        setFormData({ shortcut: shortcut.shortcut, text: shortcut.text });
        setIsDialogOpen(true);
    };

    const handleDelete = async (id: Id<"shortcuts">) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce raccourci ?')) return;
        try {
            await deleteShortcut({ id });
            toast.success('Raccourci supprimé');
        } catch (error) {
            toast.error("Erreur lors de la suppression");
        }
    };

    const resetForm = () => {
        setEditingId(null);
        setFormData({ shortcut: '', text: '' });
    };

    // Auto-prefix / on shortcut input
    const handleShortcutChange = (val: string) => {
        let v = val;
        // Optional logic: enforce '/' start visually or on blur
        setFormData(prev => ({ ...prev, shortcut: v }));
    };

    if (status === "LoadingFirstPage") {
        return <div className="p-8 text-center text-muted-foreground">Chargement des raccourcis...</div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <SearchInput
                    placeholder="Rechercher..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />

                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                    setIsDialogOpen(open);
                    if (!open) resetForm();
                }}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Nouveau Raccourci
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingId ? 'Modifier le raccourci' : 'Créer un raccourci'}</DialogTitle>
                            <DialogDescription>
                                Définissez un déclencheur (ex: /intro) et le message associé.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="shortcut">Déclencheur</Label>
                                <Input
                                    id="shortcut"
                                    placeholder="/exemple"
                                    value={formData.shortcut}
                                    onChange={e => handleShortcutChange(e.target.value)}
                                    required
                                />
                                <p className="text-xs text-muted-foreground">Commencez par "/" pour l'utiliser facilement.</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="text">Message</Label>
                                <Textarea
                                    id="text"
                                    placeholder="Le texte à insérer..."
                                    value={formData.text}
                                    onChange={e => setFormData(prev => ({ ...prev, text: e.target.value }))}
                                    className="h-32"
                                    required
                                />
                            </div>
                            <DialogFooter>
                                <ButtonGroup>
                                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
                                    <Button type="submit" disabled={isSubmitting}>
                                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Enregistrer
                                    </Button>
                                </ButtonGroup>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[150px]">Déclencheur</TableHead>
                            <TableHead>Message</TableHead>
                            <TableHead className="w-[100px] text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {shortcuts?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="h-96 text-center">
                                    <Empty className="h-full border-0 shadow-none">
                                        <EmptyMedia variant="icon">
                                            <MessageSquareDashed className="size-6" />
                                        </EmptyMedia>
                                        <EmptyHeader>
                                            <EmptyTitle>Aucun raccourci</EmptyTitle>
                                            <EmptyDescription>
                                                {searchTerm ? "Aucun résultat pour votre recherche." : "Créez des raccourcis pour répondre plus rapidement à vos clients."}
                                            </EmptyDescription>
                                        </EmptyHeader>
                                    </Empty>
                                </TableCell>
                            </TableRow>
                        ) : (
                            shortcuts?.map(s => (
                                <TableRow key={s._id}>
                                    <TableCell className="font-medium font-mono text-blue-600">
                                        {s.shortcut}
                                    </TableCell>
                                    <TableCell className="max-w-[400px] truncate" title={s.text}>
                                        {s.text}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => handleEdit(s)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => handleDelete(s._id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {status === "CanLoadMore" && (
                <div className="flex justify-center pt-2">
                    <Button variant="outline" onClick={() => loadMore(15)}>
                        Charger plus
                    </Button>
                </div>
            )}
        </div>
    );
};
