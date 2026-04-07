'use client';

import React, { useState, useRef } from 'react';
import { useMutation, usePaginatedQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Doc, Id } from '@/convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Plus, Pencil, Trash2, MessageSquareDashed, Image as ImageIcon, Video, FileText, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { SearchInput } from '@/components/ui/search-input';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export const ShortcutList = () => {
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
                toast.success('Raccourci mis a jour');
            } else {
                await createShortcut({
                    shortcut: formData.shortcut,
                    text: formData.text,
                    type: formData.type,
                    mediaStorageId: storageId
                });
                toast.success('Raccourci cree');
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
        if (!confirm('Supprimer ce raccourci ?')) return;
        try {
            await deleteShortcut({ id });
            toast.success('Raccourci supprime');
        } catch (error) {
            toast.error("Erreur lors de la suppression");
        }
    };

    const resetForm = () => {
        setEditingId(null);
        setFormData({ shortcut: '', text: '', type: 'TEXT', mediaStorageId: undefined });
        setSelectedFile(null);
    };

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
            case 'IMAGE': return <ImageIcon className="h-3.5 w-3.5 text-blue-500" />;
            case 'VIDEO': return <Video className="h-3.5 w-3.5 text-purple-500" />;
            case 'DOCUMENT': return <FileText className="h-3.5 w-3.5 text-orange-500" />;
            default: return null;
        }
    };

    if (status === "LoadingFirstPage") {
        return (
            <div className="space-y-3">
                <div className="h-9 w-full bg-gray-100 rounded-lg animate-pulse" />
                <div className="h-16 w-full bg-gray-50 rounded-lg animate-pulse" />
                <div className="h-16 w-full bg-gray-50 rounded-lg animate-pulse" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
                <SearchInput
                    placeholder="Rechercher un raccourci..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />

                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                    setIsDialogOpen(open);
                    if (!open) resetForm();
                }}>
                    <DialogTrigger asChild>
                        <Button
                            size="sm"
                            className="h-8 gap-1.5 text-xs shrink-0 bg-gradient-to-r from-[#14532d] to-[#059669] hover:from-[#14532d] hover:to-[#047857] text-white shadow-sm"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Nouveau raccourci</span>
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle className="text-base font-semibold text-gray-900">
                                {editingId ? 'Modifier le raccourci' : 'Nouveau raccourci'}
                            </DialogTitle>
                            <DialogDescription className="text-xs text-gray-500">
                                Definissez un declencheur et le contenu (texte ou media).
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="shortcut" className="text-xs font-medium text-gray-700">Declencheur</Label>
                                <Input
                                    id="shortcut"
                                    placeholder="/exemple"
                                    value={formData.shortcut}
                                    onChange={e => handleShortcutChange(e.target.value)}
                                    required
                                    className="h-9"
                                />
                                <p className="text-[10px] text-gray-400">Commencez par &quot;/&quot; pour l&apos;utiliser facilement.</p>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-xs font-medium text-gray-700">Type de contenu</Label>
                                <Tabs
                                    value={formData.type}
                                    onValueChange={(val) => setFormData(prev => ({ ...prev, type: val }))}
                                    className="w-full"
                                >
                                    <TabsList className="grid w-full grid-cols-4">
                                        <TabsTrigger value="TEXT" className="text-xs">Texte</TabsTrigger>
                                        <TabsTrigger value="IMAGE" className="text-xs">Image</TabsTrigger>
                                        <TabsTrigger value="VIDEO" className="text-xs">Video</TabsTrigger>
                                        <TabsTrigger value="DOCUMENT" className="text-xs">Doc</TabsTrigger>
                                    </TabsList>
                                </Tabs>
                            </div>

                            {formData.type !== 'TEXT' && (
                                <div className="space-y-2">
                                    <Label className="text-xs font-medium text-gray-700">Fichier media</Label>
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className={cn(
                                            "border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all",
                                            selectedFile
                                                ? "border-green-300 bg-green-50/50"
                                                : "border-gray-200 hover:border-green-300 hover:bg-green-50/30"
                                        )}
                                    >
                                        {selectedFile ? (
                                            <div className="text-center">
                                                <p className="text-sm font-medium text-green-700">{selectedFile.name}</p>
                                                <p className="text-[10px] text-gray-500 mt-0.5">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                            </div>
                                        ) : formData.mediaStorageId && !selectedFile ? (
                                            <div className="text-center">
                                                <p className="text-sm font-medium text-blue-600">Fichier existant</p>
                                                <p className="text-[10px] text-gray-500 mt-0.5">Cliquez pour remplacer</p>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                                                    <Upload className="h-5 w-5 text-gray-400" />
                                                </div>
                                                <p className="text-xs text-gray-500">Cliquez pour selectionner un fichier</p>
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
                                <Label htmlFor="text" className="text-xs font-medium text-gray-700">
                                    {formData.type === 'TEXT' ? 'Message' : 'Legende (optionnel)'}
                                </Label>
                                <Textarea
                                    id="text"
                                    placeholder={formData.type === 'TEXT' ? "Le texte a inserer..." : "Ajouter une legende..."}
                                    value={formData.text}
                                    onChange={e => setFormData(prev => ({ ...prev, text: e.target.value }))}
                                    className="h-28 resize-none"
                                    required={formData.type === 'TEXT'}
                                />
                            </div>

                            <DialogFooter className="gap-2">
                                <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="text-gray-500">
                                    Annuler
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="bg-gradient-to-r from-[#14532d] to-[#059669] hover:from-[#14532d] hover:to-[#047857] text-white shadow-sm"
                                >
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {editingId ? 'Enregistrer' : 'Creer'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="rounded-lg border border-gray-100 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-50/50">
                            <TableHead className="w-[150px] text-xs font-medium text-gray-500">Declencheur</TableHead>
                            <TableHead className="text-xs font-medium text-gray-500">Type</TableHead>
                            <TableHead className="text-xs font-medium text-gray-500">Contenu</TableHead>
                            <TableHead className="w-[100px] text-right text-xs font-medium text-gray-500">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {shortcuts?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-64 text-center">
                                    <Empty className="h-full border-0 shadow-none">
                                        <EmptyMedia variant="icon">
                                            <MessageSquareDashed className="size-6" />
                                        </EmptyMedia>
                                        <EmptyHeader>
                                            <EmptyTitle>Aucun raccourci</EmptyTitle>
                                            <EmptyDescription>
                                                {searchTerm ? "Aucun resultat pour votre recherche." : "Creez des raccourcis pour repondre plus rapidement."}
                                            </EmptyDescription>
                                        </EmptyHeader>
                                    </Empty>
                                </TableCell>
                            </TableRow>
                        ) : (
                            shortcuts?.map(s => (
                                <TableRow key={s._id} className="hover:bg-gray-50/50 transition-colors">
                                    <TableCell className="font-medium font-mono text-sm text-green-700">
                                        {s.shortcut}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1.5">
                                            {getIconForType(s.type)}
                                            <span className="text-[11px] font-medium text-gray-500">{s.type || 'TEXT'}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="max-w-[400px]">
                                        <span className="text-sm text-gray-700 truncate block" title={s.text}>
                                            {s.text || <span className="text-gray-400 italic text-xs">Sans texte</span>}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100" onClick={() => handleEdit(s)}>
                                                <Pencil className="h-3.5 w-3.5 text-gray-400" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(s._id)}>
                                                <Trash2 className="h-3.5 w-3.5" />
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
                <div className="flex justify-center pt-1">
                    <Button variant="ghost" size="sm" onClick={() => loadMore(15)} className="text-xs text-gray-500 hover:text-gray-700">
                        Charger plus
                    </Button>
                </div>
            )}
        </div>
    );
};
