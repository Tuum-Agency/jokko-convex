'use client';

import React, { useState, useRef } from 'react';
import { useQuery, useMutation, usePaginatedQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Doc, Id } from '@/convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Plus, Pencil, Trash2, Search, MessageSquareDashed, Image as ImageIcon, Video, FileText, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { ButtonGroup } from '@/components/ui/button-group';
import { SearchInput } from '@/components/ui/search-input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
    const generateUploadUrl = useMutation(api.files.generateUploadUrl);

    // Dialog State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<Id<"shortcuts"> | null>(null);
    const [formData, setFormData] = useState({
        shortcut: '',
        text: '',
        type: 'TEXT',
        mediaStorageId: undefined as Id<"_storage"> | undefined
    });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            let storageId = formData.mediaStorageId;

            // Handle file upload if present
            if (selectedFile) {
                const postUrl = await generateUploadUrl();
                const result = await fetch(postUrl, {
                    method: "POST",
                    headers: { "Content-Type": selectedFile.type },
                    body: selectedFile,
                });
                if (!result.ok) throw new Error("Upload failed");
                const { storageId: newStorageId } = await result.json();
                storageId = newStorageId;
            }

            if (editingId) {
                await updateShortcut({
                    id: editingId,
                    shortcut: formData.shortcut,
                    text: formData.text,
                    type: formData.type,
                    mediaStorageId: storageId
                });
                toast.success('Raccourci mis à jour');
            } else {
                await createShortcut({
                    shortcut: formData.shortcut,
                    text: formData.text,
                    type: formData.type, // 'TEXT', 'IMAGE', etc.
                    mediaStorageId: storageId
                });
                toast.success('Raccourci créé');
            }
            setIsDialogOpen(false);
            resetForm();
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Une erreur est survenue");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (shortcut: Doc<"shortcuts">) => {
        setEditingId(shortcut._id);
        setFormData({
            shortcut: shortcut.shortcut,
            text: shortcut.text || '',
            type: shortcut.type || 'TEXT',
            mediaStorageId: shortcut.mediaStorageId
        });
        setSelectedFile(null);
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
        setFormData({ shortcut: '', text: '', type: 'TEXT', mediaStorageId: undefined });
        setSelectedFile(null);
    };

    // Auto-prefix / on shortcut input
    const handleShortcutChange = (val: string) => {
        setFormData(prev => ({ ...prev, shortcut: val }));
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const getIconForType = (type?: string) => {
        switch (type) {
            case 'IMAGE': return <ImageIcon className="h-4 w-4 text-blue-500" />;
            case 'VIDEO': return <Video className="h-4 w-4 text-purple-500" />;
            case 'DOCUMENT': return <FileText className="h-4 w-4 text-orange-500" />;
            default: return null;
        }
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
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>{editingId ? 'Modifier le raccourci' : 'Créer un raccourci'}</DialogTitle>
                            <DialogDescription>
                                Définissez un déclencheur et le contenu (texte ou média).
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

                            <Tabs
                                value={formData.type}
                                onValueChange={(val) => setFormData(prev => ({ ...prev, type: val }))}
                                className="w-full"
                            >
                                <TabsList className="grid w-full grid-cols-4">
                                    <TabsTrigger value="TEXT">Texte</TabsTrigger>
                                    <TabsTrigger value="IMAGE">Image</TabsTrigger>
                                    <TabsTrigger value="VIDEO">Vidéo</TabsTrigger>
                                    <TabsTrigger value="DOCUMENT">Doc</TabsTrigger>
                                </TabsList>

                                <div className="mt-4 space-y-4">
                                    {formData.type !== 'TEXT' && (
                                        <div className="space-y-2">
                                            <Label>Fichier Média</Label>
                                            <div
                                                onClick={() => fileInputRef.current?.click()}
                                                className="border-2 border-dashed border-gray-200 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors"
                                            >
                                                {selectedFile ? (
                                                    <div className="text-center">
                                                        <p className="font-medium text-sm text-green-600">{selectedFile.name}</p>
                                                        <p className="text-xs text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                                    </div>
                                                ) : formData.mediaStorageId && !selectedFile ? (
                                                    <div className="text-center">
                                                        <p className="font-medium text-sm text-blue-600">Fichier existant</p>
                                                        <p className="text-xs text-gray-500">Cliquez pour remplacer</p>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <Upload className="h-8 w-8 text-gray-400 mb-2" />
                                                        <p className="text-sm text-gray-500">Cliquez pour sélectionner un fichier</p>
                                                    </>
                                                )}
                                            </div>
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                className="hidden"
                                                accept={
                                                    formData.type === 'IMAGE' ? "image/*" :
                                                        formData.type === 'VIDEO' ? "video/*" :
                                                            "*/*"
                                                }
                                                onChange={handleFileSelect}
                                            />
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <Label htmlFor="text">
                                            {formData.type === 'TEXT' ? 'Message' : 'Légende (Optionnel)'}
                                        </Label>
                                        <Textarea
                                            id="text"
                                            placeholder={formData.type === 'TEXT' ? "Le texte à insérer..." : "Ajouter une légende..."}
                                            value={formData.text}
                                            onChange={e => setFormData(prev => ({ ...prev, text: e.target.value }))}
                                            className="h-32"
                                            required={formData.type === 'TEXT'}
                                        />
                                    </div>
                                </div>
                            </Tabs>

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Enregistrer
                                </Button>
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
                            <TableHead>Type</TableHead>
                            <TableHead>Contenu</TableHead>
                            <TableHead className="w-[100px] text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {shortcuts?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-96 text-center">
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
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {getIconForType(s.type)}
                                            <span className="text-xs font-medium text-gray-500">{s.type || 'TEXT'}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="max-w-[400px] truncate" title={s.text}>
                                        {s.text || <span className="text-gray-400 italic">Sans texte</span>}
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
