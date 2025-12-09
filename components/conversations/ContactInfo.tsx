
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

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
    X,
    Phone,
    Mail,
    Building2,
    Calendar,
    Tag,
    MessageSquare,
    Edit2,
    Save,
    Plus,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { cn } from '@/lib/utils'

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

function HistoryList({ contactId, conversationId }: { contactId: string, conversationId: string }) {
    // History is fetched relative to contact in the same org
    // We need to resolve org ID from conversation first, but this component is rendered ONLY when we have contact.
    // However, `listByContact` needs organizationId.
    // We can get it from contact.organizationId if we passed full contact object.

    // BUT here we only passed `contactId` and `conversationId`.
    // Let's assume we can fetch conversation again or use parent's data. 
    // Since `ContactInfo` fetches conversation to get contact, it could pass down organizationId.
    // For simplicity, let's fetch conversation here (cached).

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

    if (!history || history.length === 0) {
        return <p className="text-sm text-gray-500 italic">Aucun historique disponible</p>
    }

    // Filter out current conversation
    const filteredHistory = history.filter(h => h._id !== conversationId)

    if (filteredHistory.length === 0) {
        return <p className="text-sm text-gray-500 italic">Aucune autre conversation</p>
    }

    return (
        <div className="space-y-2">
            {filteredHistory.map((conv) => (
                <div
                    key={conv._id}
                    className={cn(
                        "flex flex-col p-2 rounded-lg border text-sm hover:bg-gray-50 transition-colors cursor-pointer",
                        conv.status === 'OPEN' ? "border-green-200 bg-green-50/50" : "border-gray-200"
                    )}
                // On click navigation logic could go here
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
                    <p className="text-gray-700 line-clamp-1 text-xs">
                        {conv.preview || "Aucun message"}
                    </p>
                </div>
            ))}
        </div>
    )
}

// ============================================
// CONTACT INFO
// ============================================

export function ContactInfo({ conversationId, onClose }: ContactInfoProps) {
    const [isEditingNotes, setIsEditingNotes] = useState(false)
    const [notes, setNotes] = useState('')
    const [newTag, setNewTag] = useState('')

    // 1. Get Conversation to resolve Contact ID
    const convId = conversationId as Id<"conversations">;
    const conversation = useQuery(api.conversations.getById, { id: convId });

    // 2. Get Contact Details
    const contactId = conversation?.contactId;
    const contact = useQuery(api.contacts.get, contactId ? { id: contactId } : "skip");

    const updateContact = useMutation(api.contacts.update);

    useEffect(() => {
        if (contact) {
            setNotes(contact.notes || '')
        }
    }, [contact]);

    const handleUpdateNotes = async () => {
        if (!contact) return;
        await updateContact({
            id: contact.id,
            notes: notes,
            tags: contact.tags // Required by mutation
        });
        setIsEditingNotes(false);
    };

    const handleAddTag = async (tag: string) => {
        if (!contact || !tag.trim()) return;
        // Check if exists
        if (contact.tags.includes(tag.trim())) return;

        await updateContact({
            id: contact.id,
            tags: [...contact.tags, tag.trim()]
        });
        setNewTag('');
    };

    const handleRemoveTag = async (tagToRemove: string) => {
        if (!contact) return;
        await updateContact({
            id: contact.id,
            tags: contact.tags.filter(t => t !== tagToRemove)
        });
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

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200/80">
                <h3 className="font-semibold text-gray-900">Informations</h3>
                <Button variant="ghost" size="icon" onClick={onClose}>
                    <X className="h-5 w-5" />
                </Button>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-4 space-y-6">
                    {/* Profile Section */}
                    <div className="flex flex-col items-center text-center">
                        <Avatar className="h-20 w-20 mb-3">
                            {/* {contact.profilePicture && (
                                <AvatarImage src={contact.profilePicture} alt={contact.name || ''} />
                            )} */}
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
                            {/* Message count not available yet in simplified schema */}
                            {/* <InfoRow
                                icon={MessageSquare}
                                label="Messages"
                                value={`${contact.messageCount} messages`}
                            /> */}
                        </div>
                    </div>

                    <Separator />

                    {/* History Section */}
                    <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Historique des conversations</h4>
                        <HistoryList contactId={contact.id} conversationId={conversationId} />
                    </div>

                    <Separator />

                    {/* Tags */}
                    <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Tags</h4>
                        <div className="flex flex-wrap gap-2">
                            {contact.tags.map((tag: string) => (
                                <Badge
                                    key={tag}
                                    variant="secondary"
                                    className="cursor-pointer hover:bg-red-100 hover:text-red-700 transition-colors"
                                    onClick={() => handleRemoveTag(tag)}
                                >
                                    {tag}
                                    <X className="h-3 w-3 ml-1" />
                                </Badge>
                            ))}
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
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    if (isEditingNotes) {
                                        handleUpdateNotes()
                                    } else {
                                        setIsEditingNotes(true)
                                    }
                                }}
                            >
                                {isEditingNotes ? (
                                    <>
                                        <Save className="h-4 w-4 mr-1" />
                                        Sauvegarder
                                    </>
                                ) : (
                                    <>
                                        <Edit2 className="h-4 w-4 mr-1" />
                                        Editer
                                    </>
                                )}
                            </Button>
                        </div>
                        {isEditingNotes ? (
                            <Textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Ajouter des notes..."
                                className="min-h-[100px]"
                            />
                        ) : (
                            <p className={cn(
                                'text-sm',
                                contact.notes ? 'text-gray-700' : 'text-gray-400 italic'
                            )}>
                                {contact.notes || 'Aucune note'}
                            </p>
                        )}
                    </div>
                </div>
            </ScrollArea>
        </div>
    )
}
