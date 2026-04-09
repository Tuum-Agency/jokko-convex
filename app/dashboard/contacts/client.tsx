'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePaginatedQuery, useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { ContactList, Tag } from '@/components/contacts/ContactList';
import { Contact, ContactTag, getInitials } from '@/components/contacts/ContactCard';
import { ContactFormDialog } from '@/components/contacts/ContactFormDialog';
import { ImportDialog } from '@/components/contacts/ImportDialog';
import { DuplicatesDialog } from '@/components/contacts/DuplicatesDialog';
import { usePermission } from '@/hooks/use-permission';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
    Phone,
    Mail,
    Building2,
    MapPin,
    Pencil,
    Trash2,
    MessageCircle,
    ArrowDownLeft,
    ArrowUpRight,
    Clock,
} from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { formatPhoneDisplay } from '@/lib/contacts/validation';

// ============================================
// RELATIVE TIME HELPER
// ============================================

function formatRelativeTime(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return "A l'instant";
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours}h`;
    if (days < 7) return `Il y a ${days}j`;
    return new Date(timestamp).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

// ============================================
// CONTACT DETAIL DRAWER
// ============================================

function ContactDetailDrawer({
    contactId,
    onClose,
    onEdit,
    onDelete,
    onMessage,
}: {
    contactId: string;
    onClose: () => void;
    onEdit: (contact: Contact) => void;
    onDelete: (contact: Contact) => void;
    onMessage: (contact: Contact) => void;
}) {
    const contactData = useQuery(api.contacts.get, { id: contactId as Id<"contacts"> });
    const timeline = useQuery(api.contacts.getContactTimeline, { contactId: contactId as Id<"contacts"> });

    if (!contactData) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
            </div>
        );
    }

    const displayName = contactData.name || [contactData.firstName, contactData.lastName].filter(Boolean).join(' ') || 'Sans nom';
    const initials = getInitials(contactData.name ?? null, contactData.firstName, contactData.lastName);
    const formattedPhone = formatPhoneDisplay(contactData.phone, 'international');

    // Build a Contact object for callbacks
    const contactForCallbacks: Contact = {
        id: contactData._id,
        phone: contactData.phone,
        name: contactData.name || null,
        firstName: contactData.firstName || null,
        lastName: contactData.lastName || null,
        email: contactData.email || null,
        company: contactData.company || null,
        jobTitle: contactData.jobTitle || null,
        countryCode: contactData.countryCode || null,
        address: contactData.address || null,
        city: contactData.city || null,
        country: contactData.country || null,
        notes: null,
        tags: (contactData.tags || []).map((t: any) => ({
            id: typeof t === 'string' ? t : t.id,
            name: typeof t === 'string' ? t : t.name,
            color: typeof t === 'string' ? '#808080' : t.color || '#808080',
        })),
        isWhatsApp: contactData.isWhatsApp || null,
        isBlocked: contactData.isBlocked || null,
        createdAt: contactData.createdAt,
    };

    const tags: ContactTag[] = contactForCallbacks.tags;

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Header with avatar */}
            <div className="flex flex-col items-center pt-2 pb-4">
                <div className="relative">
                    <Avatar className="h-16 w-16">
                        <AvatarImage src={undefined} alt={displayName} />
                        <AvatarFallback className="bg-gradient-to-br from-[#14532d] to-[#059669] text-white text-xl font-semibold">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                    {contactData.isBlocked && (
                        <span className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 border-2 border-white" title="Bloqué" />
                    )}
                    {!contactData.isBlocked && contactData.isWhatsApp && (
                        <span className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-green-500 border-2 border-white" title="WhatsApp" />
                    )}
                </div>
                <h2 className="text-lg font-semibold text-gray-900 mt-3">{displayName}</h2>
                <p className="text-sm text-gray-500 font-mono">{formattedPhone}</p>
                {contactData.isBlocked && (
                    <Badge variant="destructive" className="mt-1 text-[10px]">Bloqué</Badge>
                )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-center gap-2 pb-4 px-6">
                <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 text-xs rounded-full cursor-pointer"
                    onClick={() => { onMessage(contactForCallbacks); onClose(); }}
                >
                    <MessageCircle className="h-3.5 w-3.5" />
                    Envoyer un message
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 text-xs rounded-full cursor-pointer"
                    onClick={() => { onEdit(contactForCallbacks); onClose(); }}
                >
                    <Pencil className="h-3.5 w-3.5" />
                    Modifier
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 text-xs rounded-full text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                    onClick={() => { onDelete(contactForCallbacks); onClose(); }}
                >
                    <Trash2 className="h-3.5 w-3.5" />
                    Supprimer
                </Button>
            </div>

            <Separator />

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
                {/* Contact details */}
                <div className="space-y-3">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Informations</h3>

                    <div className="flex items-center gap-2.5 text-sm">
                        <Phone className="h-4 w-4 text-gray-400 shrink-0" />
                        <span className="text-gray-700 font-mono">{formattedPhone}</span>
                    </div>

                    {contactData.email && (
                        <div className="flex items-center gap-2.5 text-sm">
                            <Mail className="h-4 w-4 text-gray-400 shrink-0" />
                            <span className="text-gray-700 truncate">{contactData.email}</span>
                        </div>
                    )}

                    {contactData.company && (
                        <div className="flex items-center gap-2.5 text-sm">
                            <Building2 className="h-4 w-4 text-gray-400 shrink-0" />
                            <span className="text-gray-700 truncate">
                                {contactData.company}
                                {contactData.jobTitle && ` - ${contactData.jobTitle}`}
                            </span>
                        </div>
                    )}

                    {(contactData.address || contactData.city || contactData.country) && (
                        <div className="flex items-center gap-2.5 text-sm">
                            <MapPin className="h-4 w-4 text-gray-400 shrink-0" />
                            <span className="text-gray-700 truncate">
                                {[contactData.address, contactData.city, contactData.country].filter(Boolean).join(', ')}
                            </span>
                        </div>
                    )}

                    {!contactData.email && !contactData.company && !contactData.address && !contactData.city && !contactData.country && (
                        <p className="text-sm text-gray-400 italic">Aucune information supplémentaire</p>
                    )}
                </div>

                {/* Tags */}
                {tags.length > 0 && (
                    <div className="space-y-2">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tags</h3>
                        <div className="flex flex-wrap gap-1.5">
                            {tags.map((tag) => (
                                <Badge
                                    key={tag.id}
                                    variant="secondary"
                                    className="text-xs font-medium px-2 py-0.5"
                                    style={{
                                        backgroundColor: `${tag.color}15`,
                                        color: tag.color,
                                        borderColor: `${tag.color}40`,
                                    }}
                                >
                                    {tag.name}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}

                {/* Notes */}
                {contactData.notes && Array.isArray(contactData.notes) && contactData.notes.length > 0 && (
                    <div className="space-y-2">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Notes</h3>
                        <div className="space-y-2">
                            {contactData.notes.map((note: any, i: number) => (
                                <div key={i} className="bg-gray-50 rounded-lg p-3">
                                    <p className="text-sm text-gray-700">{note.content}</p>
                                    <div className="flex items-center gap-2 mt-1.5">
                                        {note.authorName && (
                                            <span className="text-[11px] text-gray-400">{note.authorName}</span>
                                        )}
                                        {note.createdAt && (
                                            <span className="text-[11px] text-gray-400">
                                                {formatRelativeTime(note.createdAt)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <Separator />

                {/* Activity Timeline */}
                <div className="space-y-3">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Activité</h3>

                    {!timeline ? (
                        <div className="flex items-center justify-center py-4">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600" />
                        </div>
                    ) : timeline.length === 0 ? (
                        <p className="text-sm text-gray-400 italic">Aucune activité récente</p>
                    ) : (
                        <div className="relative">
                            {/* Vertical line */}
                            <div className="absolute left-[9px] top-2 bottom-2 w-px bg-gray-200" />

                            <div className="space-y-3">
                                {timeline.map((entry, i) => (
                                    <div key={i} className="flex items-start gap-3 relative">
                                        {/* Dot */}
                                        <div className={`relative z-10 mt-1 h-[18px] w-[18px] rounded-full border-2 flex items-center justify-center shrink-0 ${
                                            entry.type === 'message_received'
                                                ? 'border-blue-400 bg-blue-50'
                                                : 'border-green-400 bg-green-50'
                                        }`}>
                                            {entry.type === 'message_received' ? (
                                                <ArrowDownLeft className="h-2.5 w-2.5 text-blue-500" />
                                            ) : (
                                                <ArrowUpRight className="h-2.5 w-2.5 text-green-600" />
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0 pb-1">
                                            <p className="text-sm text-gray-700">
                                                <span className="font-medium">
                                                    {entry.type === 'message_received' ? 'Message reçu' : 'Message envoyé'}
                                                </span>
                                                {': '}
                                                <span className="text-gray-500">{entry.content}</span>
                                            </p>
                                            <div className="flex items-center gap-1 mt-0.5">
                                                <Clock className="h-3 w-3 text-gray-300" />
                                                <span className="text-[11px] text-gray-400">
                                                    {formatRelativeTime(entry.timestamp)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ============================================
// MAIN PAGE CLIENT
// ============================================

export function ContactsPageClient() {
    const router = useRouter();
    const [search, setSearch] = useState('');
    const [tagFilter, setTagFilter] = useState<string | null>(null);

    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [editingContact, setEditingContact] = useState<Contact | null>(null);
    const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
    const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);
    const [bulkDeleteIds, setBulkDeleteIds] = useState<string[] | null>(null);
    const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
    const [isDuplicatesDialogOpen, setIsDuplicatesDialogOpen] = useState(false);

    // Permission checks
    const canDelete = usePermission('contacts:delete');
    const canExport = usePermission('contacts:export');

    // Fetch tags
    const tagsData = useQuery(api.tags.list);
    const tags: Tag[] = (tagsData?.tags || []).map(t => ({
        id: t._id,
        name: t.name,
        color: t.color || '#808080',
        contactCount: 0 // TODO: Implement count
    }));

    // Use paginated query for contacts
    const { results, status, loadMore, isLoading } = usePaginatedQuery(
        api.contacts.list,
        {
            search: search || undefined,
            tag: tagFilter || undefined
        },
        { initialNumItems: 30 }
    );

    // Transform results to match Contact interface
    const contacts: Contact[] = (results || []).map((c: any) => ({
        id: c._id,
        phone: c.phone,
        name: c.name || null,
        firstName: c.firstName || null,
        lastName: c.lastName || null,
        email: c.email || null,
        company: c.company || null,
        jobTitle: c.jobTitle || null,
        notes: c.notes || null,
        countryCode: c.countryCode || null,
        isWhatsApp: c.isWhatsApp || null,
        isBlocked: c.isBlocked || null,
        tags: c.tags?.map((t: any) => ({
            id: t._id,
            name: t.name,
            color: t.color || '#808080'
        })) || [],
        createdAt: c.createdAt
    }));

    const createContact = useMutation(api.contacts.create);
    const updateContact = useMutation(api.contacts.update);
    const deleteContact = useMutation(api.contacts.remove);
    const getOrCreateConversation = useMutation(api.conversations.getOrCreate);

    const handleLoadMore = () => {
        loadMore(30);
    };

    const handleCreateSubmit = async (data: any) => {
        try {
            await createContact(data);
            setIsCreateDialogOpen(false);
            // Success
        } catch (error: any) {
            console.error(error);
            if (error.data?.code === 'DUPLICATE_CONTACT') {
                alert(`Contact existant: ${error.data.message}`);
            } else {
                alert(`Erreur: ${error.message}`);
            }
        }
    };

    const handleEditSubmit = async (data: any) => {
        if (!editingContact) return;
        try {
            await updateContact({
                id: editingContact.id as Id<"contacts">,
                ...data
            });
            setEditingContact(null);
            // Success
        } catch (error: any) {
            console.error(error);
            alert(`Erreur: ${error.message}`);
        }
    };

    const handleDeleteClick = (contact: Contact) => {
        setContactToDelete(contact);
    };

    const confirmDelete = async () => {
        if (!contactToDelete) return;
        try {
            await deleteContact({ id: contactToDelete.id as Id<"contacts"> });
            // Close drawer if we deleted the selected contact
            if (selectedContactId === contactToDelete.id) {
                setSelectedContactId(null);
            }
            setContactToDelete(null);
            // Success
        } catch (error: any) {
            console.error(error);
            alert(`Erreur: ${error.message}`);
        }
    };

    const handleMessage = async (contact: Contact) => {
        try {
            const conversationId = await getOrCreateConversation({ contactId: contact.id as Id<"contacts"> });
            router.push(`/dashboard/conversations/${conversationId}`);
        } catch (error) {
            console.error("Failed to start conversation:", error);
            alert("Impossible de démarrer la conversation.");
        }
    };

    const handleContactClick = (contact: Contact) => {
        setSelectedContactId(contact.id);
    };

    const exportContactsAsCsv = (contactsToExport: Contact[]) => {
        const headers = ["Phone", "Name", "FirstName", "LastName", "Email", "Company", "JobTitle", "Tags", "Notes"];
        const rows = contactsToExport.map(c => [
            c.phone,
            c.name || "",
            c.firstName || "",
            c.lastName || "",
            c.email || "",
            c.company || "",
            c.jobTitle || "",
            c.tags.map(t => t.name).join(", "),
            c.notes || ""
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map(r => r.map(field => `"${String(field).replace(/"/g, '""')}"`).join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `contacts_export_${new Date().toISOString().slice(0, 10)}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExport = () => {
        exportContactsAsCsv(contacts);
    };

    const handleExportSelected = (selectedContacts: Contact[]) => {
        exportContactsAsCsv(selectedContacts);
    };

    const handleBulkDelete = (contactIds: string[]) => {
        setBulkDeleteIds(contactIds);
    };

    const confirmBulkDelete = async () => {
        if (!bulkDeleteIds) return;
        try {
            await Promise.all(
                bulkDeleteIds.map(id => deleteContact({ id: id as Id<"contacts"> }))
            );
            setBulkDeleteIds(null);
        } catch (error: any) {
            console.error(error);
            alert(`Erreur lors de la suppression: ${error.message}`);
        }
    };

    const handleBulkAddTag = async (contactIds: string[], tagName: string) => {
        try {
            await Promise.all(
                contactIds.map(id => {
                    const contact = contacts.find(c => c.id === id);
                    if (!contact) return Promise.resolve();
                    const existingTags = contact.tags.map(t => t.name);
                    if (existingTags.includes(tagName)) return Promise.resolve();
                    return updateContact({
                        id: id as Id<"contacts">,
                        tags: [...existingTags, tagName],
                    });
                })
            );
        } catch (error: any) {
            console.error(error);
            alert(`Erreur lors de l'ajout du tag: ${error.message}`);
        }
    };

    return (
        <div>
            <ContactList
                contacts={contacts}
                tags={tags}
                total={contacts.length}
                isLoading={isLoading && status === 'LoadingFirstPage'}
                hasMore={status === 'CanLoadMore'}
                onLoadMore={handleLoadMore}
                onSearch={setSearch}
                onFilterByTag={setTagFilter}
                onAddNew={() => setIsCreateDialogOpen(true)}
                onImport={() => setIsImportDialogOpen(true)}
                onExport={handleExport}
                onEdit={(c) => setEditingContact(c)}
                onDelete={handleDeleteClick}
                onMessage={handleMessage}
                onContactClick={handleContactClick}
                onExportSelected={handleExportSelected}
                onBulkDelete={handleBulkDelete}
                onBulkAddTag={handleBulkAddTag}
                canDelete={canDelete}
                canExport={canExport}
                onDuplicates={() => setIsDuplicatesDialogOpen(true)}
            />

            {/* Contact Detail Drawer (Sheet) */}
            <Sheet open={!!selectedContactId} onOpenChange={(open) => !open && setSelectedContactId(null)}>
                <SheetContent side="right" className="w-full sm:max-w-md p-0 overflow-hidden">
                    <SheetHeader className="sr-only">
                        <SheetTitle>Détail du contact</SheetTitle>
                        <SheetDescription>Informations et activité du contact</SheetDescription>
                    </SheetHeader>
                    {selectedContactId && (
                        <ContactDetailDrawer
                            contactId={selectedContactId}
                            onClose={() => setSelectedContactId(null)}
                            onEdit={(c) => setEditingContact(c)}
                            onDelete={handleDeleteClick}
                            onMessage={handleMessage}
                        />
                    )}
                </SheetContent>
            </Sheet>

            <ContactFormDialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
                mode="create"
                onSubmit={handleCreateSubmit}
            />

            {editingContact && (
                <ContactFormDialog
                    open={!!editingContact}
                    onOpenChange={(open) => !open && setEditingContact(null)}
                    mode="edit"
                    initialData={{
                        ...editingContact,
                        tags: editingContact.tags.map(t => t.name).join(', ') // Convert back to string for form
                    }}
                    onSubmit={handleEditSubmit}
                />
            )}

            <ImportDialog
                open={isImportDialogOpen}
                onOpenChange={setIsImportDialogOpen}
                onComplete={() => setIsImportDialogOpen(false)}
            />

            <AlertDialog open={!!contactToDelete} onOpenChange={(open) => !open && setContactToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Cette action est irréversible. Cela supprimera définitivement le contact
                            {contactToDelete?.name ? <strong> {contactToDelete.name} </strong> : " sélectionné "}
                            et toutes les données associées.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Supprimer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Bulk delete confirmation */}
            <AlertDialog open={!!bulkDeleteIds} onOpenChange={(open) => !open && setBulkDeleteIds(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer {bulkDeleteIds?.length} contact{(bulkDeleteIds?.length || 0) > 1 ? 's' : ''} ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Cette action est irréversible. Cela supprimera définitivement les {bulkDeleteIds?.length} contacts
                            sélectionnés et toutes les données associées.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Supprimer {bulkDeleteIds?.length} contact{(bulkDeleteIds?.length || 0) > 1 ? 's' : ''}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <DuplicatesDialog
                open={isDuplicatesDialogOpen}
                onOpenChange={setIsDuplicatesDialogOpen}
            />
        </div>
    );
}
