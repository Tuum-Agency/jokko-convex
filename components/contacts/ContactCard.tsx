'use client'

import { Phone, Mail, Building2, MoreVertical, Pencil, Trash2, MessageCircle } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
} from '@/components/ui/card'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { formatPhoneDisplay } from '@/lib/contacts/validation'

// ============================================
// TYPES
// ============================================

export interface ContactTag {
    id: string
    name: string
    color: string
}

export interface Contact {
    id: string
    phone: string
    name: string | null
    firstName?: string | null
    lastName?: string | null
    email?: string | null
    company?: string | null
    jobTitle?: string | null
    avatarUrl?: string | null
    tags: ContactTag[]
    lastContactedAt?: Date | string | null
    createdAt: Date | string | number
    notes?: string | null
}

interface ContactCardProps {
    contact: Contact
    onEdit?: (contact: Contact) => void
    onDelete?: (contact: Contact) => void
    onMessage?: (contact: Contact) => void
    className?: string
}

// ============================================
// HELPERS
// ============================================

function getInitials(name: string | null, firstName?: string | null, lastName?: string | null): string {
    if (name) {
        const parts = name.split(' ')
        return parts.map(p => p[0]).slice(0, 2).join('').toUpperCase()
    }
    if (firstName || lastName) {
        return [firstName?.[0], lastName?.[0]].filter(Boolean).join('').toUpperCase()
    }
    return '?'
}

// ============================================
// COMPONENT
// ============================================

export function ContactCard({
    contact,
    onEdit,
    onDelete,
    onMessage,
    className,
}: ContactCardProps) {
    const displayName = contact.name || [contact.firstName, contact.lastName].filter(Boolean).join(' ') || 'Sans nom'
    const initials = getInitials(contact.name, contact.firstName, contact.lastName)
    const formattedPhone = formatPhoneDisplay(contact.phone, 'international')

    return (
        <Card className={cn('hover:shadow-md transition-shadow', className)}>
            <CardContent className="p-4">
                <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <Avatar className="h-12 w-12">
                        <AvatarImage src={contact.avatarUrl || undefined} alt={displayName} />
                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                            {initials}
                        </AvatarFallback>
                    </Avatar>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                            <h3 className="font-medium text-foreground truncate">
                                {displayName}
                            </h3>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                                        <MoreVertical className="h-4 w-4" />
                                        <span className="sr-only">Actions</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    {onMessage && (
                                        <DropdownMenuItem onClick={() => onMessage(contact)}>
                                            <MessageCircle className="mr-2 h-4 w-4" />
                                            Envoyer un message
                                        </DropdownMenuItem>
                                    )}
                                    {onEdit && (
                                        <DropdownMenuItem onClick={() => onEdit(contact)}>
                                            <Pencil className="mr-2 h-4 w-4" />
                                            Modifier
                                        </DropdownMenuItem>
                                    )}
                                    {onDelete && (
                                        <>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                onClick={() => onDelete(contact)}
                                                className="text-red-600 focus:text-red-600"
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Supprimer
                                            </DropdownMenuItem>
                                        </>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        {/* Phone */}
                        <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
                            <Phone className="h-3.5 w-3.5" />
                            <span className="font-mono">{formattedPhone}</span>
                        </div>

                        {/* Email */}
                        {contact.email && (
                            <div className="flex items-center gap-1.5 mt-0.5 text-sm text-muted-foreground">
                                <Mail className="h-3.5 w-3.5" />
                                <span className="truncate">{contact.email}</span>
                            </div>
                        )}

                        {/* Company */}
                        {contact.company && (
                            <div className="flex items-center gap-1.5 mt-0.5 text-sm text-muted-foreground">
                                <Building2 className="h-3.5 w-3.5" />
                                <span className="truncate">
                                    {contact.company}
                                    {contact.jobTitle && ` - ${contact.jobTitle}`}
                                </span>
                            </div>
                        )}

                        {/* Tags */}
                        {contact.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                                {contact.tags.slice(0, 3).map((tag) => (
                                    <Badge
                                        key={tag.id}
                                        variant="secondary"
                                        className="text-xs"
                                        style={{
                                            backgroundColor: `${tag.color}20`,
                                            color: tag.color,
                                            borderColor: tag.color,
                                        }}
                                    >
                                        {tag.name}
                                    </Badge>
                                ))}
                                {contact.tags.length > 3 && (
                                    <Badge variant="secondary" className="text-xs">
                                        +{contact.tags.length - 3}
                                    </Badge>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card >
    )
}

export default ContactCard
