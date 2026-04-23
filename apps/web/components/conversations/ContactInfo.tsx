
/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║          components/conversations/ContactInfo.tsx             ║
 * ╠═══════════════════════════════════════════════════════════════╣
 * ║                                                               ║
 * ║     ┌─────────────────────────────────────────────────────┐   ║
 * ║     │  [X]              Contact Info                      │   ║
 * ║     ├─────────────────────────────────────────────────────┤   ║
 * ║     │              👤                                     │   ║
 * ║     │           John Doe                                  │   ║
 * ║     │        +221 77 123 4567                             │   ║
 * ║     ├─────────────────────────────────────────────────────┤   ║
 * ║     │  Details                                            │   ║
 * ║     │  📧 Email: john@example.com                         │   ║
 * ║     │  🏢 Company: Acme Inc                               │   ║
 * ║     ├─────────────────────────────────────────────────────┤   ║
 * ║     │  Tags                                               │   ║
 * ║     │  [VIP] [Support] [+]                                │   ║
 * ║     ├─────────────────────────────────────────────────────┤   ║
 * ║     │  Notes                                              │   ║
 * ║     │  Important client, needs priority support           │   ║
 * ║     └─────────────────────────────────────────────────────┘   ║
 * ║                                                               ║
 * ╠═══════════════════════════════════════════════════════════════╣
 * ║ DESCRIPTION:                                                  ║
 * ║   Panneau d'informations du contact avec details et tags.     ║
 * ╚═══════════════════════════════════════════════════════════════╝
 */

'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    X,
    Phone,
    Mail,
    Building2,
    Calendar,
    Edit2,
    Plus,
    Trash2,
    Eye,
    Trash,
    Send,
    Image as ImageIcon,
    Video,
    FileText,
    Link as LinkIcon,
    Download
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { cn } from '@/lib/utils'
import { ConversationHistoryDialog } from './ConversationHistoryDialog'
import { toast } from 'sonner'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

// ============================================
// MEDIA GALLERY COMPONENTS
// ============================================

function MediaThumbnail({ item }: { item: any }) {
    if (item.type === 'IMAGE') {
        return (
            <a href={item.mediaUrl} target="_blank" rel="noopener noreferrer" className="relative aspect-square bg-gray-100 rounded-md overflow-hidden group block border hover:border-blue-500 transition-colors">
                <img src={item.mediaUrl} alt="Media" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
            </a>
        )
    }
    if (item.type === 'VIDEO') {
        return (
            <a href={item.mediaUrl} target="_blank" rel="noopener noreferrer" className="relative aspect-square bg-black rounded-md overflow-hidden group flex items-center justify-center border hover:border-blue-500 transition-colors">
                <Video className="text-white h-8 w-8 opacity-80 group-hover:scale-110 transition-transform" />
                <div className="absolute top-1 right-1 bg-black/50 text-white text-[9px] px-1 rounded">Vidéo</div>
            </a>
        )
    }
    return (
        <a href={item.mediaUrl} target="_blank" rel="noopener noreferrer" className="relative aspect-square bg-slate-50 border rounded-md flex flex-col items-center justify-center p-2 text-center hover:bg-slate-100 hover:border-blue-500 transition-colors group">
            <div className="bg-white p-2 rounded-full shadow-sm mb-1 group-hover:shadow transition-shadow">
                <FileText className="h-5 w-5 text-slate-500" />
            </div>
            <span className="text-[10px] text-gray-600 truncate w-full px-1 font-medium">{item.fileName || 'Fichier'}</span>
            <span className="text-[9px] text-gray-400 capitalize">{item.type.toLowerCase()}</span>
        </a>
    )
}

function MediaGallery({ conversationId }: { conversationId: string }) {
    const media = useQuery(api.messages.getConversationMedia, { conversationId: conversationId as Id<"conversations"> });

    if (media === undefined) return <div className="h-24 bg-gray-50 rounded animate-pulse" />;

    if (media.length === 0) return <p className="text-sm text-gray-400 italic text-center py-4">Aucun média partagé.</p>;

    const images = media.filter(m => m.type === 'IMAGE');
    const videos = media.filter(m => m.type === 'VIDEO');
    const documents = media.filter(m => m.type === 'DOCUMENT' || m.type === 'AUDIO');

    const renderGrid = (items: any[]) => {
        if (items.length === 0) return <p className="text-xs text-gray-400 py-4 text-center">Aucun element.</p>;
        return (
            <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto p-1">
                {items.map((m) => (
                    <MediaThumbnail key={m._id} item={m} />
                ))}
            </div>
        )
    }

    return (
        <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4 h-8 bg-gray-100 p-0.5 rounded-lg mb-2">
                <TabsTrigger value="all" className="text-xs h-7 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">Tout ({media.length})</TabsTrigger>
                <TabsTrigger value="images" className="text-xs h-7 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">Photos</TabsTrigger>
                <TabsTrigger value="videos" className="text-xs h-7 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">Vidéos</TabsTrigger>
                <TabsTrigger value="docs" className="text-xs h-7 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">Docs</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-0">
                {renderGrid(media)}
            </TabsContent>
            <TabsContent value="images" className="mt-0">
                {renderGrid(images)}
            </TabsContent>
            <TabsContent value="videos" className="mt-0">
                {renderGrid(videos)}
            </TabsContent>
            <TabsContent value="docs" className="mt-0">
                {renderGrid(documents)}
            </TabsContent>
        </Tabs>
    )
}

// ============================================
// TYPES
// ============================================

interface ContactInfoProps {
    conversationId: string
    onClose: () => void
}

// ============================================
// INFO ROW
// ============================================

function InfoRow({
    icon: Icon,
    label,
    value,
}: {
    icon: React.ElementType
    label: string
    value: string | null | undefined
}) {
    if (!value) return null

    return (
        <div className="flex items-start gap-3 py-2">
            <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                <Icon className="h-4 w-4 text-gray-500" />
            </div>
            <div className="min-w-0">
                <p className="text-xs text-gray-500">{label}</p>
                <p className="text-sm text-gray-900 wrap-break-word">{value}</p>
            </div>
        </div>
    )
}

// ============================================
// HISTORY LIST
// ============================================

// ============================================
// HISTORY LIST
// ============================================

function HistoryList({
    contactId,
    conversationId,
    onView,
    onDelete,
    isDeletingId
}: {
    contactId: string
    conversationId: string
    onView: (id: string) => void
    onDelete: (id: string) => void
    isDeletingId: string | null
}) {
    const convId = conversationId as Id<"conversations">;
    const currentConv = useQuery(api.conversations.getById, { id: convId });

    const history = useQuery(api.conversations.listByContact,
        (currentConv && currentConv.contactId) ? {
            contactId: currentConv.contactId,
            organizationId: currentConv.organizationId
        } : "skip"
    );

    if (history === undefined) {
        return <div className="space-y-2">
            <div className="h-10 w-full bg-gray-100 rounded animate-pulse" />
            <div className="h-10 w-full bg-gray-100 rounded animate-pulse" />
        </div>
    }

    // Filter out current conversation
    const filteredHistory = (history || []).filter(h => h._id !== conversationId)

    if (filteredHistory.length === 0) {
        return <p className="text-sm text-gray-500 italic">Aucune autre conversation</p>
    }

    return (
        <div className="space-y-2">
            {filteredHistory.map((conv) => (
                <div
                    key={conv._id}
                    className="group flex flex-col p-2 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all"
                >
                    <div className="flex justify-between items-start mb-1">
                        <Badge variant="outline" className={cn(
                            "text-[10px] h-5 px-1.5",
                            conv.status === 'OPEN' ? "bg-green-100 text-green-700 border-green-200" :
                                conv.status === 'RESOLVED' ? "bg-blue-100 text-blue-700 border-blue-200" :
                                    "bg-gray-100 text-gray-700 border-gray-200"
                        )}>
                            {conv.status}
                        </Badge>
                        <span className="text-xs text-gray-400">
                            {format(new Date(conv.lastMessageAt), 'PP', { locale: fr })}
                        </span>
                    </div>

                    <div className="flex justify-between items-end gap-2">
                        <p className="text-gray-700 line-clamp-1 text-xs flex-1">
                            {conv.preview || "Aucun message"}
                        </p>

                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-gray-400 hover:text-blue-600"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onView(conv._id)
                                }}
                            >
                                <Eye className="h-3 w-3" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-gray-400 hover:text-red-600"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onDelete(conv._id)
                                }}
                                disabled={isDeletingId === conv._id}
                            >
                                {isDeletingId === conv._id ? (
                                    <span className="animate-spin">⌛</span>
                                ) : (
                                    <Trash2 className="h-3 w-3" />
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}

// ============================================
// CONTACT INFO
// ============================================

export function ContactInfo({ conversationId, onClose }: ContactInfoProps) {
    const [newNoteContent, setNewNoteContent] = useState('')
    const [newTag, setNewTag] = useState('')

    // Note Editing State
    const [editingNoteTimestamp, setEditingNoteTimestamp] = useState<number | null>(null)
    const [editNoteContent, setEditNoteContent] = useState('')

    // Note Deletion State
    const [noteToDeleteTimestamp, setNoteToDeleteTimestamp] = useState<number | null>(null);

    // History Dialog State
    const [viewHistoryId, setViewHistoryId] = useState<string | null>(null)
    const [isDeletingId, setIsDeletingId] = useState<string | null>(null)
    const [isClearingHistory, setIsClearingHistory] = useState(false)

    // 1. Get Conversation to resolve Contact ID
    const convId = conversationId as Id<"conversations">;
    const conversation = useQuery(api.conversations.getById, { id: convId });

    // 2. Get Contact Details
    const contactId = conversation?.contactId;
    const contact = useQuery(api.contacts.get, contactId ? { id: contactId } : "skip");

    // 3. Current User & Role (for permissions)
    const me = useQuery(api.users.me);
    const teamInfo = useQuery(api.team.listMembers, conversation ? { organizationId: conversation.organizationId } : "skip");
    const currentUserRole = teamInfo?.currentUserRole;

    const updateContact = useMutation(api.contacts.update);
    const updateNote = useMutation(api.contacts.updateNote);
    const removeNote = useMutation(api.contacts.removeNote);
    const clearAllNotes = useMutation(api.contacts.clearAllNotes);

    const removeConversation = useMutation(api.conversations.remove);
    const clearHistory = useMutation(api.conversations.clearHistory);

    const isAdmin = currentUserRole === 'admin' || currentUserRole === 'owner';
    const [isClearingNotes, setIsClearingNotes] = useState(false);

    const handleAddNote = async () => {
        if (!contact || !newNoteContent.trim()) return;

        try {
            await updateContact({
                id: contact.id,
                tags: contact.tags.map((t: any) => typeof t === 'string' ? t : t.name),
                addNote: newNoteContent.trim()
            });
            setNewNoteContent('');
            toast.success("Note ajoutée");
        } catch (err) {
            toast.error("Erreur lors de l'ajout de la note");
        }
    };

    const handleClearAllNotes = async () => {
        if (!contact) return;
        setIsClearingNotes(true);
        try {
            await clearAllNotes({ contactId: contact.id });
            toast.success("Toutes les notes ont été effacées");
        } catch (err) {
            toast.error("Erreur lors de la suppression des notes");
        } finally {
            setIsClearingNotes(false);
        }
    };

    const handleSaveNote = async (timestamp: number) => {
        if (!contact || !editNoteContent.trim()) return;
        try {
            await updateNote({
                contactId: contact.id,
                noteTimestamp: timestamp,
                newContent: editNoteContent.trim()
            });
            setEditingNoteTimestamp(null);
            setEditNoteContent('');
            toast.success("Note modifiée");
        } catch (err) {
            toast.error("Erreur lors de la modification");
        }
    };

    const handleDeleteNotePrompt = (timestamp: number) => {
        setNoteToDeleteTimestamp(timestamp);
    };

    const confirmDeleteNote = async () => {
        if (!contact || !noteToDeleteTimestamp) return;
        try {
            await removeNote({
                contactId: contact.id,
                noteTimestamp: noteToDeleteTimestamp
            });
            toast.success("Note supprimée");
        } catch (err) {
            toast.error("Erreur lors de la suppression");
        } finally {
            setNoteToDeleteTimestamp(null);
        }
    };

    const handleAddTag = async (tag: string) => {
        if (!contact || !tag.trim()) return;
        const tagNames = contact.tags.map((t: any) => typeof t === 'string' ? t : t.name);
        if (tagNames.includes(tag.trim())) return;

        await updateContact({
            id: contact.id,
            tags: [...tagNames, tag.trim()]
        });
        setNewTag('');
    };

    const handleRemoveTag = async (tagToRemove: string) => {
        if (!contact) return;
        const tagNames = contact.tags.map((t: any) => typeof t === 'string' ? t : t.name);
        await updateContact({
            id: contact.id,
            tags: tagNames.filter((t: string) => t !== tagToRemove)
        });
    };

    const handleDeleteConversation = async (id: string) => {
        if (!confirm("Etes-vous sur de vouloir supprimer ce ticket ?")) return;

        setIsDeletingId(id);
        try {
            await removeConversation({ id: id as Id<"conversations"> });
            toast.success("Ticket supprime");
        } catch (error) {
            toast.error("Erreur lors de la suppression");
        } finally {
            setIsDeletingId(null);
        }
    };

    const handleClearHistory = async () => {
        if (!contact || !conversation) return;

        // Use Dialog confirm? 
        // For simplicity using built-in confirm or custom simple confirm.
        // But user asked for dialog to VIEW ticket, not necessarily for delete confirm.
        // But "Standard" is to confirm.

        setIsClearingHistory(true);
        try {
            await clearHistory({
                contactId: contact.id,
                organizationId: conversation.organizationId,
                excludeIds: [conversationId as Id<"conversations">] // Keep current
            });
            toast.success("Historique efface");
        } catch (error) {
            toast.error("Erreur lors de la suppression de l'historique");
        } finally {
            setIsClearingHistory(false);
        }
    };


    // Loading state
    if (conversation === undefined || contact === undefined) {
        return (
            <div className="flex flex-col h-full">
                <div className="flex items-center justify-between p-4 border-b border-gray-200/80">
                    <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>
                <div className="flex-1 p-4 space-y-4">
                    <div className="flex flex-col items-center">
                        <div className="h-20 w-20 rounded-full bg-gray-200 animate-pulse" />
                        <div className="h-5 w-32 bg-gray-200 rounded mt-3 animate-pulse" />
                        <div className="h-4 w-24 bg-gray-100 rounded mt-2 animate-pulse" />
                    </div>
                </div>
            </div>
        )
    }

    if (!contact) {
        return (
            <div className="flex flex-col h-full items-center justify-center p-4">
                <p className="text-gray-500">Contact introuvable.</p>
                <Button variant="ghost" onClick={onClose}>Fermer</Button>
            </div>
        )
    }

    const initials = contact.name
        ? contact.name
            .split(' ')
            .map((n: string) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
        : contact.phone.slice(-2)

    // Notes casting (safe due to backend update)
    const notesList: any[] = Array.isArray(contact.notes) ? contact.notes : [];

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200/80">
                <h3 className="font-semibold text-gray-900">Informations</h3>
                <Button variant="ghost" size="icon" onClick={onClose}>
                    <X className="h-5 w-5" />
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto">
                <div className="p-4 space-y-6">
                    {/* Profile Section */}
                    <div className="flex flex-col items-center text-center">
                        <Avatar className="h-20 w-20 mb-3">
                            <AvatarFallback className="text-xl bg-linear-to-br from-gray-200 to-gray-300">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                        <h2 className="text-lg font-semibold text-gray-900">
                            {contact.name || 'Contact'}
                        </h2>
                        <p className="text-sm text-gray-500">{contact.phone}</p>
                    </div>

                    <Separator />

                    {/* Contact Details */}
                    <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Details</h4>
                        <div className="space-y-1">
                            <InfoRow icon={Phone} label="Telephone" value={contact.phone} />
                            <InfoRow icon={Mail} label="Email" value={contact.email} />
                            <InfoRow icon={Building2} label="Entreprise" value={contact.company} />
                            <InfoRow
                                icon={Calendar}
                                label="Premier contact"
                                value={format(new Date(contact.createdAt), 'PP', { locale: fr })}
                            />
                        </div>
                    </div>

                    <Separator />

                    {/* Media Gallery */}
                    <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Médias & Fichiers</h4>
                        <MediaGallery conversationId={conversationId} />
                    </div>

                    <Separator />

                    {/* History Section */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-medium text-gray-900">Historique</h4>

                            {isAdmin && (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 px-2 text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
                                            disabled={isClearingHistory}
                                        >
                                            <Trash className="h-3 w-3 mr-1" />
                                            Tout effacer
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Effacer tout l'historique ?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Cette action est irreversible. Tous les tickets terminés pour ce contact seront supprimés définitivement.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleClearHistory} className="bg-red-600 hover:bg-red-700">
                                                Confirmer
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}
                        </div>

                        <HistoryList
                            contactId={contact.id}
                            conversationId={conversationId}
                            onView={(id) => setViewHistoryId(id)}
                            onDelete={handleDeleteConversation}
                            isDeletingId={isDeletingId}
                        />
                    </div>

                    <Separator />

                    {/* Tags */}
                    <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Tags</h4>
                        <div className="flex flex-wrap gap-2">
                            {contact.tags.map((tag: any) => {
                                const tagName = typeof tag === 'string' ? tag : tag.name
                                return (
                                    <Badge
                                        key={tagName}
                                        variant="secondary"
                                        className="cursor-pointer hover:bg-red-100 hover:text-red-700 transition-colors"
                                        onClick={() => handleRemoveTag(tagName)}
                                    >
                                        {tagName}
                                        <X className="h-3 w-3 ml-1" />
                                    </Badge>
                                )
                            })}
                            <div className="flex items-center gap-1">
                                <Input
                                    value={newTag}
                                    onChange={(e) => setNewTag(e.target.value)}
                                    placeholder="Nouveau tag"
                                    className="h-7 w-24 text-xs"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && newTag.trim()) {
                                            handleAddTag(newTag.trim())
                                        }
                                    }}
                                />
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => {
                                        if (newTag.trim()) {
                                            handleAddTag(newTag.trim())
                                        }
                                    }}
                                    disabled={!newTag.trim()}
                                >
                                    <Plus className="h-3 w-3" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Notes */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-medium text-gray-900">Notes</h4>
                            {isAdmin && (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 px-2 text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
                                            disabled={isClearingNotes}
                                        >
                                            <Trash className="h-3 w-3 mr-1" />
                                            Tout effacer
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Effacer toutes les notes ?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Cette action est irreversible. Toutes les notes pour ce contact seront supprimées.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleClearAllNotes} className="bg-red-600 hover:bg-red-700">
                                                Confirmer
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}
                        </div>
                        <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                            {notesList.length === 0 && (
                                <p className="text-sm text-gray-400 italic">Aucune note pour le moment.</p>
                            )}
                            {notesList.map((note, index) => {
                                const isAuthor = me?._id && note.authorId === me._id;
                                const canEdit = isAuthor;
                                const canDelete = isAuthor || isAdmin;
                                const isEditing = editingNoteTimestamp === note.createdAt;

                                return (
                                    <div key={index} className="bg-gray-50 border border-gray-100 p-2 rounded-md text-sm group">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-semibold text-xs text-gray-700">
                                                {note.authorName || 'Agent'}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-gray-400">
                                                    {format(new Date(note.createdAt), 'PP p', { locale: fr })}
                                                </span>
                                                {!isEditing && (
                                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {canEdit && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-4 w-4 text-gray-400 hover:text-blue-600"
                                                                onClick={() => {
                                                                    setEditingNoteTimestamp(note.createdAt);
                                                                    setEditNoteContent(note.content);
                                                                }}
                                                            >
                                                                <Edit2 className="h-3 w-3" />
                                                            </Button>
                                                        )}
                                                        {canDelete && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-4 w-4 text-gray-400 hover:text-red-600"
                                                                onClick={() => handleDeleteNotePrompt(note.createdAt)}
                                                            >
                                                                <Trash2 className="h-3 w-3" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {isEditing ? (
                                            <div className="space-y-2">
                                                <Textarea
                                                    value={editNoteContent}
                                                    onChange={e => setEditNoteContent(e.target.value)}
                                                    className="min-h-[60px] text-xs"
                                                />
                                                <div className="flex justify-end gap-1">
                                                    <Button size="sm" variant="ghost" onClick={() => setEditingNoteTimestamp(null)} className="h-7 text-xs">Annuler</Button>
                                                    <Button size="sm" onClick={() => handleSaveNote(note.createdAt)} className="h-7 text-xs">Enregistrer</Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-gray-600 whitespace-pre-wrap">{note.content}</p>
                                        )}
                                    </div>
                                )
                            })}
                        </div>

                        <div className="relative">
                            <Textarea
                                value={newNoteContent}
                                onChange={(e) => setNewNoteContent(e.target.value)}
                                placeholder="Ajouter une note..."
                                className="min-h-[80px] pr-10 resize-none"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleAddNote();
                                    }
                                }}
                            />
                            <Button
                                size="icon"
                                className="absolute bottom-2 right-2 h-7 w-7"
                                onClick={handleAddNote}
                                disabled={!newNoteContent.trim()}
                            >
                                <Send className="h-3 w-3" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* History Dialog */}
            <ConversationHistoryDialog
                open={!!viewHistoryId}
                onOpenChange={(open) => !open && setViewHistoryId(null)}
                conversationId={viewHistoryId as Id<"conversations"> | null}
            />

            {/* Note Delete Confirmation */}
            <AlertDialog open={!!noteToDeleteTimestamp} onOpenChange={(open) => !open && setNoteToDeleteTimestamp(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer cette note ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Cette action est irréversible.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDeleteNote} className="bg-red-600 hover:bg-red-700">
                            Supprimer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
