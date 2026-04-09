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
    countryCode?: string | null
    address?: string | null
    city?: string | null
    country?: string | null
    tags: ContactTag[]
    lastContactedAt?: Date | string | null
    createdAt: Date | string | number
    notes?: string | null
    isWhatsApp?: boolean | null
    isBlocked?: boolean | null
}

interface ContactCardProps {
    contact: Contact
    onEdit?: (contact: Contact) => void
    onDelete?: (contact: Contact) => void
    onMessage?: (contact: Contact) => void
    onClick?: (contact: Contact) => void
    className?: string
}

// ============================================
// HELPERS
// ============================================

export function getInitials(name: string | null, firstName?: string | null, lastName?: string | null): string {
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
    onClick,
    className,
}: ContactCardProps) {
    const displayName = contact.name || [contact.firstName, contact.lastName].filter(Boolean).join(' ') || 'Sans nom'
    const initials = getInitials(contact.name, contact.firstName, contact.lastName)
    const formattedPhone = formatPhoneDisplay(contact.phone, 'international')

    return (
        <Card
            className={cn('bg-white border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer', className)}
            onClick={() => onClick?.(contact)}
        >
            <CardContent className="p-4 sm:p-5">
                <div className="flex items-start gap-3">
                    {/* Avatar with activity indicator */}
                    <div className="relative shrink-0">
                        <Avatar className="h-10 w-10 sm:h-11 sm:w-11">
                            <AvatarImage src={contact.avatarUrl || undefined} alt={displayName} />
                            <AvatarFallback className="bg-gradient-to-br from-[#14532d] to-[#059669] text-white text-sm font-semibold shadow-sm">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                        {contact.isBlocked && (
                            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-red-500 border-2 border-white" title="Bloqué" />
                        )}
                        {!contact.isBlocked && contact.isWhatsApp && (
                            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-white" title="WhatsApp" />
                        )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                            <h3 className="text-sm font-semibold text-gray-900 truncate">
                                {displayName}
                            </h3>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 shrink-0 text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <MoreVertical className="h-4 w-4" />
                                        <span className="sr-only">Actions</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    {onMessage && (
                                        <DropdownMenuItem onClick={() => onMessage(contact)} className="cursor-pointer">
                                            <MessageCircle className="mr-2 h-4 w-4" />
                                            Envoyer un message
                                        </DropdownMenuItem>
                                    )}
                                    {onEdit && (
                                        <DropdownMenuItem onClick={() => onEdit(contact)} className="cursor-pointer">
                                            <Pencil className="mr-2 h-4 w-4" />
                                            Modifier
                                        </DropdownMenuItem>
                                    )}
                                    {onDelete && (
                                        <>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                onClick={() => onDelete(contact)}
                                                className="text-red-600 focus:text-red-600 cursor-pointer"
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
                        <div className="flex items-center gap-1.5 mt-1 text-[11px] sm:text-xs text-gray-500">
                            <Phone className="h-3 w-3 text-gray-400" />
                            <span className="font-mono">{formattedPhone}</span>
                        </div>

                        {/* Email */}
                        {contact.email && (
                            <div className="flex items-center gap-1.5 mt-0.5 text-[11px] sm:text-xs text-gray-500">
                                <Mail className="h-3 w-3 text-gray-400" />
                                <span className="truncate">{contact.email}</span>
                            </div>
                        )}

                        {/* Company */}
                        {contact.company && (
                            <div className="flex items-center gap-1.5 mt-0.5 text-[11px] sm:text-xs text-gray-500">
                                <Building2 className="h-3 w-3 text-gray-400" />
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
                                        className="text-[10px] font-medium px-1.5 py-0"
                                        style={{
                                            backgroundColor: `${tag.color}15`,
                                            color: tag.color,
                                            borderColor: `${tag.color}40`,
                                        }}
                                    >
                                        {tag.name}
                                    </Badge>
                                ))}
                                {contact.tags.length > 3 && (
                                    <Badge variant="secondary" className="text-[10px] bg-gray-100 text-gray-600 font-medium px-1.5 py-0">
                                        +{contact.tags.length - 3}
                                    </Badge>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export default ContactCard
