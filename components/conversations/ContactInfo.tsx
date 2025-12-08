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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { cn } from '@/lib/utils'

// ============================================
// TYPES
// ============================================

interface ContactInfoProps {
    conversationId: string
    onClose: () => void
}

interface ContactDetails {
    id: string
    name: string | null
    firstName: string | null
    lastName: string | null
    phoneNumber: string
    email: string | null
    company: string | null
    profilePicture: string | null
    tags: string[]
    notes: string | null
    firstContactAt: string
    lastContactAt: string
    conversationCount: number
    messageCount: number
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
// CONTACT INFO
// ============================================

export function ContactInfo({ conversationId, onClose }: ContactInfoProps) {
    const queryClient = useQueryClient()
    const [isEditingNotes, setIsEditingNotes] = useState(false)
    const [notes, setNotes] = useState('')
    const [newTag, setNewTag] = useState('')

    // Fetch contact details
    const { data: contact, isLoading } = useQuery({
        queryKey: ['contact-details', conversationId],
        queryFn: async () => {
            const res = await fetch(`/api/conversations/${conversationId}/contact`)
            if (!res.ok) throw new Error('Failed to fetch contact')
            const data = await res.json() as ContactDetails
            setNotes(data.notes || '')
            return data
        },
    })

    // Update notes mutation
    const updateNotesMutation = useMutation({
        mutationFn: async (newNotes: string) => {
            const res = await fetch(`/api/contacts/${contact?.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notes: newNotes }),
            })
            if (!res.ok) throw new Error('Failed to update notes')
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contact-details', conversationId] })
            setIsEditingNotes(false)
        },
    })

    // Add tag mutation
    const addTagMutation = useMutation({
        mutationFn: async (tag: string) => {
            const res = await fetch(`/api/contacts/${contact?.id}/tags`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tag }),
            })
            if (!res.ok) throw new Error('Failed to add tag')
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contact-details', conversationId] })
            setNewTag('')
        },
    })

    // Remove tag mutation
    const removeTagMutation = useMutation({
        mutationFn: async (tag: string) => {
            const res = await fetch(`/api/contacts/${contact?.id}/tags`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tag }),
            })
            if (!res.ok) throw new Error('Failed to remove tag')
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contact-details', conversationId] })
        },
    })

    // Loading state
    if (isLoading || !contact) {
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

    const initials = contact.name
        ? contact.name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
        : contact.phoneNumber.slice(-2)

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
                            {contact.profilePicture && (
                                <AvatarImage src={contact.profilePicture} alt={contact.name || ''} />
                            )}
                            <AvatarFallback className="text-xl bg-linear-to-br from-gray-200 to-gray-300">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                        <h2 className="text-lg font-semibold text-gray-900">
                            {contact.name || 'Contact'}
                        </h2>
                        <p className="text-sm text-gray-500">{contact.phoneNumber}</p>
                    </div>

                    <Separator />

                    {/* Contact Details */}
                    <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Details</h4>
                        <div className="space-y-1">
                            <InfoRow icon={Phone} label="Telephone" value={contact.phoneNumber} />
                            <InfoRow icon={Mail} label="Email" value={contact.email} />
                            <InfoRow icon={Building2} label="Entreprise" value={contact.company} />
                            <InfoRow
                                icon={Calendar}
                                label="Premier contact"
                                value={format(new Date(contact.firstContactAt), 'PP', { locale: fr })}
                            />
                            <InfoRow
                                icon={MessageSquare}
                                label="Messages"
                                value={`${contact.messageCount} messages`}
                            />
                        </div>
                    </div>

                    <Separator />

                    {/* Tags */}
                    <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Tags</h4>
                        <div className="flex flex-wrap gap-2">
                            {contact.tags.map((tag) => (
                                <Badge
                                    key={tag}
                                    variant="secondary"
                                    className="cursor-pointer hover:bg-red-100 hover:text-red-700 transition-colors"
                                    onClick={() => removeTagMutation.mutate(tag)}
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
                                            addTagMutation.mutate(newTag.trim())
                                        }
                                    }}
                                />
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => {
                                        if (newTag.trim()) {
                                            addTagMutation.mutate(newTag.trim())
                                        }
                                    }}
                                    disabled={!newTag.trim() || addTagMutation.isPending}
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
                                        updateNotesMutation.mutate(notes)
                                    } else {
                                        setIsEditingNotes(true)
                                    }
                                }}
                                disabled={updateNotesMutation.isPending}
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
