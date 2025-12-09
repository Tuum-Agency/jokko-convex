'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePaginatedQuery, useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { ContactList, Tag } from '@/components/contacts/ContactList';
import { Contact } from '@/components/contacts/ContactCard';
import { ContactFormDialog } from '@/components/contacts/ContactFormDialog';
import { ImportDialog } from '@/components/contacts/ImportDialog';
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
export function ContactsPageClient() {
    const router = useRouter();
    const [search, setSearch] = useState('');
    const [tagFilter, setTagFilter] = useState<string | null>(null);

    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [editingContact, setEditingContact] = useState<Contact | null>(null);
    const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
    const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);

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

    const handleExport = () => {
        // Simple client-side CSV export
        // Create header row
        const headers = ["Phone", "Name", "FirstName", "LastName", "Email", "Company", "JobTitle", "Tags", "Notes"];
        const rows = contacts.map(c => [
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

    return (
        <div className="p-6">
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
            />

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
        </div>
    );
}
