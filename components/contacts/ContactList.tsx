'use client'

import React, { useState, useCallback } from 'react'
import {
    Users,
    Plus,
    Upload,
    Download,
    Search,
    Filter,
    Loader2,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ButtonGroup } from '@/components/ui/button-group'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Card,
    CardContent,
    CardDescription,
    CardTitle,
} from '@/components/ui/card'
import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
} from '@/components/ui/input-group'
import { ContactCard, Contact } from './ContactCard'
import { ContactListSkeleton } from './ContactCardSkeleton'
import { cn } from '@/lib/utils'

// ============================================
// TYPES
// ============================================

export interface Tag {
    id: string
    name: string
    color: string
    contactCount: number
}

interface ContactListProps {
    contacts: Contact[]
    tags: Tag[]
    total: number
    isLoading?: boolean
    hasMore?: boolean
    onLoadMore?: () => void
    onSearch?: (query: string) => void
    onFilterByTag?: (tagName: string | null) => void
    onEdit?: (contact: Contact) => void
    onDelete?: (contact: Contact) => void
    onMessage?: (contact: Contact) => void
    onAddNew?: () => void
    onImport?: () => void
    onExport?: () => void
    className?: string
}

// ============================================
// COMPONENT
// ============================================

export function ContactList({
    contacts,
    tags,
    total,
    isLoading = false,
    hasMore = false,
    onLoadMore,
    onSearch,
    onFilterByTag,
    onEdit,
    onDelete,
    onMessage,
    onAddNew,
    onImport,
    onExport,
    className,
}: ContactListProps) {
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedTag, setSelectedTag] = useState<string | null>(null)

    const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value
        setSearchQuery(query)
        onSearch?.(query)
    }, [onSearch])

    const handleTagFilter = useCallback((value: string) => {
        const tagValue = value === 'all' ? null : value
        setSelectedTag(tagValue)
        onFilterByTag?.(tagValue)
    }, [onFilterByTag])

    const handleExport = () => {
        onExport?.()
    }

    return (
        <div className={cn('space-y-6', className)}>
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <Users className="h-6 w-6 text-primary" />
                        Contacts
                    </h1>
                    <div className="mt-1">
                        {isLoading ? (
                            <Skeleton className="h-5 w-32" />
                        ) : (
                            <p className="text-muted-foreground">
                                {total} contact{total > 1 ? 's' : ''} au total
                            </p>
                        )}
                    </div>
                </div>

                <ButtonGroup>
                    <Button onClick={onAddNew}>
                        <Plus className="mr-2 h-4 w-4" />
                        Nouveau
                    </Button>
                    <Button variant="outline" onClick={onImport}>
                        <Upload className="mr-2 h-4 w-4" />
                        Importer
                    </Button>
                    <Button variant="outline" onClick={handleExport}>
                        <Download className="mr-2 h-4 w-4" />
                        Exporter
                    </Button>
                </ButtonGroup>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col gap-4 sm:flex-row">
                        {/* Search */}
                        <div className="flex-1">
                            <InputGroup className="bg-white">
                                <InputGroupAddon>
                                    <Search className="h-4 w-4 text-muted-foreground" />
                                </InputGroupAddon>
                                <InputGroupInput
                                    placeholder="Rechercher par nom, téléphone, email..."
                                    value={searchQuery}
                                    onChange={handleSearch}
                                />
                            </InputGroup>
                        </div>

                        {/* Tag filter */}
                        <Select value={selectedTag || 'all'} onValueChange={handleTagFilter}>
                            <SelectTrigger className="w-full sm:w-[200px]">
                                <Filter className="mr-2 h-4 w-4" />
                                <SelectValue placeholder="Filtrer par tag" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tous les contacts</SelectItem>
                                {tags.map((tag) => (
                                    <SelectItem key={tag.id} value={tag.name}>
                                        <span className="flex items-center gap-2">
                                            {/* Color dot */}
                                            {tag.color && (
                                                <span
                                                    className="h-2 w-2 rounded-full"
                                                    style={{ backgroundColor: tag.color }}
                                                />
                                            )}
                                            {tag.name} ({tag.contactCount})
                                        </span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Active filters */}
                    {(searchQuery || selectedTag) && (
                        <div className="flex flex-wrap gap-2 mt-4">
                            {searchQuery && (
                                <Badge variant="secondary" className="gap-1">
                                    Recherche: {searchQuery}
                                    <button
                                        onClick={() => {
                                            setSearchQuery('')
                                            onSearch?.('')
                                        }}
                                        className="ml-1 hover:text-red-500"
                                    >
                                        ×
                                    </button>
                                </Badge>
                            )}
                            {selectedTag && (
                                <Badge variant="secondary" className="gap-1">
                                    Tag: {selectedTag}
                                    <button
                                        onClick={() => handleTagFilter('all')}
                                        className="ml-1 hover:text-red-500"
                                    >
                                        ×
                                    </button>
                                </Badge>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Contact Grid */}
            {isLoading && contacts.length === 0 ? (
                <ContactListSkeleton count={6} />
            ) : contacts.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
                        <CardTitle className="text-lg mb-2">Aucun contact</CardTitle>
                        <CardDescription className="text-center max-w-md">
                            {searchQuery || selectedTag
                                ? 'Aucun contact ne correspond à vos critères de recherche.'
                                : 'Commencez par ajouter vos premiers contacts ou importez-les depuis un fichier.'}
                        </CardDescription>
                        {!searchQuery && !selectedTag && (
                            <div className="mt-6">
                                <ButtonGroup>
                                    <Button onClick={onAddNew}>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Ajouter un contact
                                    </Button>
                                    <Button variant="outline" onClick={onImport}>
                                        <Upload className="mr-2 h-4 w-4" />
                                        Importer
                                    </Button>
                                </ButtonGroup>
                            </div>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {contacts.map((contact) => (
                            <ContactCard
                                key={contact.id}
                                contact={contact}
                                onEdit={onEdit}
                                onDelete={onDelete}
                                onMessage={onMessage}
                            />
                        ))}
                    </div>

                    {/* Load more */}
                    {hasMore && (
                        <div className="flex justify-center pt-4">
                            <Button
                                variant="outline"
                                onClick={onLoadMore}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Chargement...
                                    </>
                                ) : (
                                    'Charger plus'
                                )}
                            </Button>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
