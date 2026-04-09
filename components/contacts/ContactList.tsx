'use client'

import React, { useState, useCallback, useMemo } from 'react'
import {
    Users,
    Plus,
    Upload,
    Download,
    Search,
    Loader2,
    Globe,
    Tag as TagIcon,
    X,
    LayoutGrid,
    List,
    Phone,
    Mail,
    Building2,
    MoreVertical,
    MessageCircle,
    Pencil,
    Trash2,
    ChevronLeft,
    ChevronRight,
    ArrowUpDown,
    CheckSquare,
    Merge,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Checkbox } from '@/components/ui/checkbox'
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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
} from '@/components/ui/input-group'
import { ContactCard, Contact, getInitials } from './ContactCard'
import { ContactListSkeleton } from './ContactCardSkeleton'
import { SegmentSelector, type SegmentFilters } from './SegmentSelector'
import { cn } from '@/lib/utils'
import { formatPhoneDisplay } from '@/lib/contacts/validation'

// ============================================
// TYPES
// ============================================

export interface Tag {
    id: string
    name: string
    color: string
    contactCount: number
}

type ViewMode = 'grid' | 'table'
type SortOption = 'createdAt-desc' | 'createdAt-asc' | 'name-asc'

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
    onContactClick?: (contact: Contact) => void
    onAddNew?: () => void
    onImport?: () => void
    onExport?: () => void
    onExportSelected?: (contacts: Contact[]) => void
    onBulkDelete?: (contactIds: string[]) => void
    onBulkAddTag?: (contactIds: string[], tagName: string) => void
    canDelete?: boolean
    canExport?: boolean
    onDuplicates?: () => void
    className?: string
}

// ============================================
// COUNTRY CODE → LABEL MAP
// ============================================

const COUNTRY_LABELS: Record<string, string> = {
    '+221': 'Sénégal (+221)',
    '+223': 'Mali (+223)',
    '+224': 'Guinée (+224)',
    '+225': 'Côte d\'Ivoire (+225)',
    '+226': 'Burkina Faso (+226)',
    '+227': 'Niger (+227)',
    '+228': 'Togo (+228)',
    '+229': 'Bénin (+229)',
    '+230': 'Maurice (+230)',
    '+231': 'Liberia (+231)',
    '+232': 'Sierra Leone (+232)',
    '+233': 'Ghana (+233)',
    '+234': 'Nigeria (+234)',
    '+237': 'Cameroun (+237)',
    '+241': 'Gabon (+241)',
    '+242': 'Congo (+242)',
    '+243': 'RD Congo (+243)',
    '+244': 'Angola (+244)',
    '+245': 'Guinée-Bissau (+245)',
    '+251': 'Éthiopie (+251)',
    '+252': 'Somalie (+252)',
    '+253': 'Djibouti (+253)',
    '+254': 'Kenya (+254)',
    '+255': 'Tanzanie (+255)',
    '+256': 'Ouganda (+256)',
    '+260': 'Zambie (+260)',
    '+261': 'Madagascar (+261)',
    '+212': 'Maroc (+212)',
    '+213': 'Algérie (+213)',
    '+216': 'Tunisie (+216)',
    '+218': 'Libye (+218)',
    '+220': 'Gambie (+220)',
    '+33': 'France (+33)',
    '+32': 'Belgique (+32)',
    '+41': 'Suisse (+41)',
    '+1': 'États-Unis / Canada (+1)',
    '+44': 'Royaume-Uni (+44)',
    '+49': 'Allemagne (+49)',
    '+34': 'Espagne (+34)',
    '+39': 'Italie (+39)',
    '+351': 'Portugal (+351)',
    '+90': 'Turquie (+90)',
    '+966': 'Arabie Saoudite (+966)',
    '+971': 'Émirats Arabes Unis (+971)',
    '+86': 'Chine (+86)',
    '+91': 'Inde (+91)',
    '+55': 'Brésil (+55)',
}

const COUNTRY_SHORT: Record<string, string> = {
    '+221': 'SN', '+223': 'ML', '+224': 'GN', '+225': 'CI', '+226': 'BF',
    '+227': 'NE', '+228': 'TG', '+229': 'BJ', '+233': 'GH', '+234': 'NG',
    '+237': 'CM', '+243': 'CD', '+254': 'KE', '+255': 'TZ', '+212': 'MA',
    '+213': 'DZ', '+216': 'TN', '+220': 'GM', '+33': 'FR', '+32': 'BE',
    '+41': 'CH', '+1': 'US', '+44': 'GB', '+49': 'DE', '+34': 'ES',
    '+39': 'IT', '+91': 'IN', '+55': 'BR', '+86': 'CN',
}

// ============================================
// TABLE VIEW
// ============================================

function ContactTableView({
    contacts,
    onEdit,
    onDelete,
    onMessage,
    onContactClick,
    bulkMode,
    selectedIds,
    onToggleSelect,
}: {
    contacts: Contact[]
    onEdit?: (contact: Contact) => void
    onDelete?: (contact: Contact) => void
    onMessage?: (contact: Contact) => void
    onContactClick?: (contact: Contact) => void
    bulkMode: boolean
    selectedIds: Set<string>
    onToggleSelect: (id: string) => void
}) {
    return (
        <Card className="bg-white border-gray-100 shadow-sm overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-transparent">
                        {bulkMode && (
                            <TableHead className="w-[40px]"><span className="sr-only">Sélection</span></TableHead>
                        )}
                        <TableHead className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Contact</TableHead>
                        <TableHead className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Téléphone</TableHead>
                        <TableHead className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Email</TableHead>
                        <TableHead className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Entreprise</TableHead>
                        <TableHead className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Pays</TableHead>
                        <TableHead className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Tags</TableHead>
                        <TableHead className="w-[50px]"><span className="sr-only">Actions</span></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {contacts.map((contact) => {
                        const displayName = contact.name || [contact.firstName, contact.lastName].filter(Boolean).join(' ') || 'Sans nom'
                        const initials = getInitials(contact.name, contact.firstName, contact.lastName)
                        const formattedPhone = formatPhoneDisplay(contact.phone, 'international')
                        const countryShort = contact.countryCode ? (COUNTRY_SHORT[contact.countryCode] || contact.countryCode) : null

                        return (
                            <TableRow
                                key={contact.id}
                                className={cn(
                                    "hover:bg-gray-50/50 cursor-pointer",
                                    bulkMode && selectedIds.has(contact.id) && "bg-green-50/50"
                                )}
                                onClick={() => {
                                    if (bulkMode) {
                                        onToggleSelect(contact.id)
                                    } else {
                                        onContactClick?.(contact)
                                    }
                                }}
                            >
                                {/* Bulk checkbox */}
                                {bulkMode && (
                                    <TableCell className="py-3 w-[40px]">
                                        <Checkbox
                                            checked={selectedIds.has(contact.id)}
                                            onCheckedChange={() => onToggleSelect(contact.id)}
                                            className="cursor-pointer"
                                        />
                                    </TableCell>
                                )}
                                {/* Contact name + avatar */}
                                <TableCell className="py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="relative shrink-0">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={contact.avatarUrl || undefined} alt={displayName} />
                                                <AvatarFallback className="bg-gradient-to-br from-[#14532d] to-[#059669] text-white text-xs font-semibold">
                                                    {initials}
                                                </AvatarFallback>
                                            </Avatar>
                                            {contact.isBlocked && (
                                                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-white" title="Bloqué" />
                                            )}
                                            {!contact.isBlocked && contact.isWhatsApp && (
                                                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-white" title="WhatsApp" />
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">{displayName}</p>
                                            <p className="text-[11px] text-gray-400 sm:hidden font-mono">{formattedPhone}</p>
                                        </div>
                                    </div>
                                </TableCell>

                                {/* Phone */}
                                <TableCell className="py-3 hidden sm:table-cell">
                                    <span className="text-sm text-gray-600 font-mono">{formattedPhone}</span>
                                </TableCell>

                                {/* Email */}
                                <TableCell className="py-3 hidden md:table-cell">
                                    {contact.email ? (
                                        <span className="text-sm text-gray-600 truncate block max-w-[200px]">{contact.email}</span>
                                    ) : (
                                        <span className="text-[11px] text-gray-300">—</span>
                                    )}
                                </TableCell>

                                {/* Company */}
                                <TableCell className="py-3 hidden lg:table-cell">
                                    {contact.company ? (
                                        <span className="text-sm text-gray-600 truncate block max-w-[160px]">
                                            {contact.company}
                                        </span>
                                    ) : (
                                        <span className="text-[11px] text-gray-300">—</span>
                                    )}
                                </TableCell>

                                {/* Country */}
                                <TableCell className="py-3 hidden md:table-cell">
                                    {countryShort ? (
                                        <Badge variant="secondary" className="text-[10px] bg-gray-100 text-gray-600 font-medium px-1.5 py-0">
                                            {countryShort}
                                        </Badge>
                                    ) : (
                                        <span className="text-[11px] text-gray-300">—</span>
                                    )}
                                </TableCell>

                                {/* Tags */}
                                <TableCell className="py-3 hidden lg:table-cell">
                                    {contact.tags.length > 0 ? (
                                        <div className="flex flex-wrap gap-1">
                                            {contact.tags.slice(0, 2).map((tag) => (
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
                                            {contact.tags.length > 2 && (
                                                <Badge variant="secondary" className="text-[10px] bg-gray-100 text-gray-600 font-medium px-1.5 py-0">
                                                    +{contact.tags.length - 2}
                                                </Badge>
                                            )}
                                        </div>
                                    ) : (
                                        <span className="text-[11px] text-gray-300">—</span>
                                    )}
                                </TableCell>

                                {/* Actions */}
                                <TableCell className="py-3" onClick={(e) => e.stopPropagation()}>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer">
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
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        </Card>
    )
}

// ============================================
// TABLE SKELETON
// ============================================

function ContactTableSkeleton({ count = 6 }: { count?: number }) {
    return (
        <Card className="bg-white border-gray-100 shadow-sm overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-transparent">
                        <TableHead className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Contact</TableHead>
                        <TableHead className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Téléphone</TableHead>
                        <TableHead className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Email</TableHead>
                        <TableHead className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Entreprise</TableHead>
                        <TableHead className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Pays</TableHead>
                        <TableHead className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Tags</TableHead>
                        <TableHead className="w-[50px]" />
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {Array.from({ length: count }).map((_, i) => (
                        <TableRow key={i} className="hover:bg-transparent">
                            <TableCell className="py-3">
                                <div className="flex items-center gap-3">
                                    <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                                    <Skeleton className="h-4 w-24" />
                                </div>
                            </TableCell>
                            <TableCell className="py-3 hidden sm:table-cell"><Skeleton className="h-3.5 w-28" /></TableCell>
                            <TableCell className="py-3 hidden md:table-cell"><Skeleton className="h-3.5 w-32" /></TableCell>
                            <TableCell className="py-3 hidden lg:table-cell"><Skeleton className="h-3.5 w-20" /></TableCell>
                            <TableCell className="py-3 hidden md:table-cell"><Skeleton className="h-4 w-8 rounded-full" /></TableCell>
                            <TableCell className="py-3 hidden lg:table-cell">
                                <div className="flex gap-1"><Skeleton className="h-4 w-12 rounded-full" /><Skeleton className="h-4 w-10 rounded-full" /></div>
                            </TableCell>
                            <TableCell className="py-3"><Skeleton className="h-7 w-7 rounded" /></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Card>
    )
}

// ============================================
// MAIN COMPONENT
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
    onContactClick,
    onAddNew,
    onImport,
    onExport,
    onExportSelected,
    onBulkDelete,
    onBulkAddTag,
    canDelete = false,
    canExport = false,
    onDuplicates,
    className,
}: ContactListProps) {
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedTag, setSelectedTag] = useState<string | null>(null)
    const [selectedCountry, setSelectedCountry] = useState<string | null>(null)
    const [viewMode, setViewMode] = useState<ViewMode>('grid')
    const [currentPage, setCurrentPage] = useState(1)
    const [sortOption, setSortOption] = useState<SortOption>('createdAt-desc')
    const [bulkMode, setBulkMode] = useState(false)
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const PAGE_SIZE = 20

    const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value
        setSearchQuery(query)
        setCurrentPage(1)
        onSearch?.(query)
    }, [onSearch])

    const handleTagFilter = useCallback((value: string) => {
        const tagValue = value === 'all' ? null : value
        setSelectedTag(tagValue)
        setCurrentPage(1)
        onFilterByTag?.(tagValue)
    }, [onFilterByTag])

    const handleCountryFilter = useCallback((value: string) => {
        setSelectedCountry(value === 'all' ? null : value)
        setCurrentPage(1)
    }, [])

    const handleSortChange = useCallback((value: string) => {
        setSortOption(value as SortOption)
        setCurrentPage(1)
    }, [])

    const toggleBulkMode = useCallback(() => {
        setBulkMode(prev => {
            if (prev) setSelectedIds(new Set())
            return !prev
        })
    }, [])

    const toggleSelect = useCallback((id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev)
            if (next.has(id)) {
                next.delete(id)
            } else {
                next.add(id)
            }
            return next
        })
    }, [])

    const selectAll = useCallback((allContacts: Contact[]) => {
        setSelectedIds(new Set(allContacts.map(c => c.id)))
    }, [])

    const clearSelection = useCallback(() => {
        setSelectedIds(new Set())
        setBulkMode(false)
    }, [])

    const clearFilters = useCallback(() => {
        setSearchQuery('')
        setSelectedTag(null)
        setSelectedCountry(null)
        setCurrentPage(1)
        onSearch?.('')
        onFilterByTag?.(null)
    }, [onSearch, onFilterByTag])

    const handleApplySegment = useCallback((filters: SegmentFilters) => {
        if (filters.search !== undefined) {
            setSearchQuery(filters.search || '')
            onSearch?.(filters.search || '')
        }
        if (filters.tags && filters.tags.length > 0) {
            setSelectedTag(filters.tags[0])
            onFilterByTag?.(filters.tags[0])
        } else {
            setSelectedTag(null)
            onFilterByTag?.(null)
        }
        if (filters.country) {
            setSelectedCountry(filters.country)
        } else {
            setSelectedCountry(null)
        }
        if (filters.sort) {
            setSortOption(filters.sort as SortOption)
        }
        setCurrentPage(1)
    }, [onSearch, onFilterByTag])

    const currentFilters: SegmentFilters = useMemo(() => ({
        search: searchQuery || undefined,
        tags: selectedTag ? [selectedTag] : undefined,
        country: selectedCountry || undefined,
        sort: sortOption !== 'createdAt-desc' ? sortOption : undefined,
    }), [searchQuery, selectedTag, selectedCountry, sortOption])

    // Derive available countries from contacts
    const availableCountries = useMemo(() => {
        const codes = new Map<string, number>()
        for (const c of contacts) {
            const code = c.countryCode
            if (code) {
                codes.set(code, (codes.get(code) || 0) + 1)
            }
        }
        return Array.from(codes.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([code, count]) => ({
                code,
                label: COUNTRY_LABELS[code] || code,
                count,
            }))
    }, [contacts])

    // Compute tag counts from loaded contacts
    const tagCounts = useMemo(() => {
        const counts = new Map<string, number>()
        for (const c of contacts) {
            for (const t of c.tags) {
                counts.set(t.name, (counts.get(t.name) || 0) + 1)
            }
        }
        return counts
    }, [contacts])

    // Apply country filter client-side
    const countryFilteredContacts = useMemo(() => {
        if (!selectedCountry) return contacts
        return contacts.filter(c => c.countryCode === selectedCountry)
    }, [contacts, selectedCountry])

    // Apply sorting client-side
    const filteredContacts = useMemo(() => {
        const sorted = [...countryFilteredContacts]
        switch (sortOption) {
            case 'createdAt-desc':
                sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                break
            case 'createdAt-asc':
                sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                break
            case 'name-asc': {
                sorted.sort((a, b) => {
                    const nameA = (a.name || [a.firstName, a.lastName].filter(Boolean).join(' ') || '').toLowerCase()
                    const nameB = (b.name || [b.firstName, b.lastName].filter(Boolean).join(' ') || '').toLowerCase()
                    return nameA.localeCompare(nameB, 'fr')
                })
                break
            }
        }
        return sorted
    }, [countryFilteredContacts, sortOption])

    // Pagination
    const totalPages = Math.ceil(filteredContacts.length / PAGE_SIZE)
    const paginatedContacts = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE
        return filteredContacts.slice(start, start + PAGE_SIZE)
    }, [filteredContacts, currentPage])
    const showPagination = filteredContacts.length > PAGE_SIZE

    const activeFilterCount = [searchQuery, selectedTag, selectedCountry].filter(Boolean).length

    return (
        <div className={cn('space-y-6', className)}>
            {/* ==================== HEADER ==================== */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                        Contacts
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {isLoading ? (
                            <Skeleton className="h-4 w-32 inline-block" />
                        ) : (
                            <>{total} contact{total > 1 ? 's' : ''} au total</>
                        )}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button onClick={onAddNew} size="sm" className="h-8 gap-1.5 text-xs rounded-full cursor-pointer">
                        <Plus className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Nouveau</span>
                    </Button>
                    <Button variant="outline" onClick={onImport} size="sm" className="h-8 gap-1.5 text-xs rounded-full cursor-pointer">
                        <Upload className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Importer</span>
                    </Button>
                    <Button variant="outline" onClick={onExport} size="sm" className="h-8 gap-1.5 text-xs rounded-full cursor-pointer">
                        <Download className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Exporter</span>
                    </Button>
                    {onDuplicates && (
                        <Button variant="outline" onClick={onDuplicates} size="sm" className="h-8 gap-1.5 text-xs rounded-full cursor-pointer">
                            <Merge className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Doublons</span>
                        </Button>
                    )}
                </div>
            </div>

            {/* ==================== FILTERS ==================== */}
            <Card className="bg-white border-gray-100 shadow-sm">
                <CardContent className="p-4">
                    <div className="flex flex-col gap-3 sm:flex-row">
                        {/* Search */}
                        <div className="flex-1">
                            <InputGroup className="bg-white">
                                <InputGroupAddon>
                                    <Search className="h-4 w-4 text-gray-400" />
                                </InputGroupAddon>
                                <InputGroupInput
                                    placeholder="Rechercher par nom, numéro, email..."
                                    value={searchQuery}
                                    onChange={handleSearch}
                                />
                            </InputGroup>
                        </div>

                        {/* Sort */}
                        <Select value={sortOption} onValueChange={handleSortChange}>
                            <SelectTrigger className="w-full sm:w-[200px]">
                                <ArrowUpDown className="mr-2 h-4 w-4 text-gray-400" />
                                <SelectValue placeholder="Trier par" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="createdAt-desc">Plus récents</SelectItem>
                                <SelectItem value="createdAt-asc">Plus anciens</SelectItem>
                                <SelectItem value="name-asc">Nom (A-Z)</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Country filter */}
                        <Select value={selectedCountry || 'all'} onValueChange={handleCountryFilter}>
                            <SelectTrigger className="w-full sm:w-[200px]">
                                <Globe className="mr-2 h-4 w-4 text-gray-400" />
                                <SelectValue placeholder="Pays" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tous les pays</SelectItem>
                                {availableCountries.map((country) => (
                                    <SelectItem key={country.code} value={country.code}>
                                        {country.label} ({country.count})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Tag filter */}
                        <Select value={selectedTag || 'all'} onValueChange={handleTagFilter}>
                            <SelectTrigger className="w-full sm:w-[200px]">
                                <TagIcon className="mr-2 h-4 w-4 text-gray-400" />
                                <SelectValue placeholder="Tag" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tous les tags</SelectItem>
                                {tags.map((tag) => (
                                    <SelectItem key={tag.id} value={tag.name}>
                                        <span className="flex items-center gap-2">
                                            <span
                                                className="h-2 w-2 rounded-full shrink-0"
                                                style={{ backgroundColor: tag.color }}
                                            />
                                            {tag.name}
                                            <Badge variant="secondary" className="text-[10px] bg-gray-100 text-gray-500 font-medium px-1.5 py-0 ml-auto">
                                                {tagCounts.get(tag.name) || 0}
                                            </Badge>
                                        </span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Segments */}
                    <div className="mt-3">
                        <SegmentSelector
                            currentFilters={currentFilters}
                            onApplySegment={handleApplySegment}
                        />
                    </div>

                    {/* Active filters */}
                    {activeFilterCount > 0 && (
                        <div className="flex flex-wrap items-center gap-2 mt-3">
                            {searchQuery && (
                                <Badge variant="secondary" className="gap-1 text-xs bg-green-50 text-green-700 border-green-200">
                                    <Search className="h-3 w-3" />
                                    {searchQuery}
                                    <button
                                        onClick={() => {
                                            setSearchQuery('')
                                            onSearch?.('')
                                        }}
                                        className="ml-0.5 hover:text-red-500 transition-colors"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            )}
                            {selectedCountry && (
                                <Badge variant="secondary" className="gap-1 text-xs bg-green-50 text-green-700 border-green-200">
                                    <Globe className="h-3 w-3" />
                                    {COUNTRY_LABELS[selectedCountry] || selectedCountry}
                                    <button
                                        onClick={() => setSelectedCountry(null)}
                                        className="ml-0.5 hover:text-red-500 transition-colors"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            )}
                            {selectedTag && (
                                <Badge variant="secondary" className="gap-1 text-xs bg-green-50 text-green-700 border-green-200">
                                    <TagIcon className="h-3 w-3" />
                                    {selectedTag}
                                    <button
                                        onClick={() => handleTagFilter('all')}
                                        className="ml-0.5 hover:text-red-500 transition-colors"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            )}
                            {activeFilterCount > 1 && (
                                <button
                                    onClick={clearFilters}
                                    className="text-[11px] text-gray-400 hover:text-red-500 font-medium transition-colors ml-1"
                                >
                                    Tout effacer
                                </button>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* ==================== VIEW TOGGLE + CONTENT ==================== */}
            {!isLoading && filteredContacts.length > 0 && (
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <p className="text-[11px] text-gray-400 font-medium">
                            {showPagination
                                ? `${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(currentPage * PAGE_SIZE, filteredContacts.length)} sur ${filteredContacts.length}`
                                : `${filteredContacts.length} résultat${filteredContacts.length > 1 ? 's' : ''}`
                            }
                        </p>
                        {/* Total count badge */}
                        <Badge variant="secondary" className="text-[10px] bg-green-50 text-green-700 border-green-200 font-medium">
                            {total} contact{total > 1 ? 's' : ''}
                        </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Bulk mode toggle */}
                        <Button
                            variant={bulkMode ? "default" : "outline"}
                            size="sm"
                            onClick={toggleBulkMode}
                            className="h-7 gap-1.5 text-[11px] rounded-full cursor-pointer"
                        >
                            <CheckSquare className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">{bulkMode ? 'Annuler' : 'Sélectionner'}</span>
                        </Button>
                        <div className="flex items-center rounded-full border border-gray-200 bg-gray-50 p-0.5">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={cn(
                                    "h-7 w-7 flex items-center justify-center rounded-full transition-all cursor-pointer",
                                    viewMode === 'grid'
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-400 hover:text-gray-600'
                                )}
                                title="Vue en cartes"
                            >
                                <LayoutGrid className="h-3.5 w-3.5" />
                            </button>
                            <button
                                onClick={() => setViewMode('table')}
                                className={cn(
                                    "h-7 w-7 flex items-center justify-center rounded-full transition-all cursor-pointer",
                                    viewMode === 'table'
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-400 hover:text-gray-600'
                                )}
                                title="Vue en tableau"
                            >
                                <List className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isLoading && contacts.length === 0 ? (
                viewMode === 'grid' ? (
                    <ContactListSkeleton count={6} />
                ) : (
                    <ContactTableSkeleton count={6} />
                )
            ) : paginatedContacts.length === 0 && filteredContacts.length === 0 ? (
                <Card className="bg-white border-gray-100 shadow-sm">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <div className="h-14 w-14 rounded-full bg-gradient-to-br from-[#14532d] to-[#059669] flex items-center justify-center shadow-lg shadow-green-900/20 mb-4">
                            <Users className="h-7 w-7 text-white" />
                        </div>
                        <CardTitle className="text-base font-semibold text-gray-900 mb-1.5">
                            Aucun contact
                        </CardTitle>
                        <CardDescription className="text-center max-w-md text-sm text-gray-500">
                            {activeFilterCount > 0
                                ? 'Aucun contact ne correspond à vos critères de recherche.'
                                : 'Commencez par ajouter vos premiers contacts ou importez-les depuis un fichier.'}
                        </CardDescription>
                        {activeFilterCount === 0 && (
                            <div className="flex items-center gap-2 mt-6">
                                <Button onClick={onAddNew} size="sm" className="h-8 gap-1.5 text-xs rounded-full cursor-pointer">
                                    <Plus className="h-3.5 w-3.5" />
                                    Ajouter un contact
                                </Button>
                                <Button variant="outline" onClick={onImport} size="sm" className="h-8 gap-1.5 text-xs rounded-full cursor-pointer">
                                    <Upload className="h-3.5 w-3.5" />
                                    Importer
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <>
                    {viewMode === 'grid' ? (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {paginatedContacts.map((contact) => (
                                <div
                                    key={contact.id}
                                    className="relative h-full"
                                    {...(bulkMode ? {
                                        onClick: () => toggleSelect(contact.id),
                                        role: 'button',
                                        tabIndex: 0,
                                        onKeyDown: (e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') toggleSelect(contact.id) },
                                    } : {})}
                                >
                                    {bulkMode && (
                                        <div className="absolute top-3 left-3 z-10" onClick={(e) => e.stopPropagation()}>
                                            <Checkbox
                                                checked={selectedIds.has(contact.id)}
                                                onCheckedChange={() => toggleSelect(contact.id)}
                                                className="cursor-pointer bg-white"
                                            />
                                        </div>
                                    )}
                                    <ContactCard
                                        contact={contact}
                                        onEdit={bulkMode ? undefined : onEdit}
                                        onDelete={bulkMode ? undefined : onDelete}
                                        onMessage={bulkMode ? undefined : onMessage}
                                        onClick={bulkMode ? () => toggleSelect(contact.id) : onContactClick ? () => onContactClick(contact) : undefined}
                                        className={cn(
                                            bulkMode && "cursor-pointer",
                                            bulkMode && selectedIds.has(contact.id) && "ring-2 ring-green-500/50 bg-green-50/30"
                                        )}
                                    />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <ContactTableView
                            contacts={paginatedContacts}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onMessage={onMessage}
                            onContactClick={onContactClick}
                            bulkMode={bulkMode}
                            selectedIds={selectedIds}
                            onToggleSelect={toggleSelect}
                        />
                    )}

                    {/* Pagination */}
                    {showPagination && (
                        <div className="flex items-center justify-center gap-2 pt-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => p - 1)}
                                disabled={currentPage === 1}
                                className="h-8 w-8 p-0 rounded-full cursor-pointer"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>

                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter(page => {
                                    if (totalPages <= 7) return true
                                    if (page === 1 || page === totalPages) return true
                                    if (Math.abs(page - currentPage) <= 1) return true
                                    return false
                                })
                                .reduce<(number | 'ellipsis')[]>((acc, page, i, arr) => {
                                    if (i > 0 && page - (arr[i - 1] as number) > 1) {
                                        acc.push('ellipsis')
                                    }
                                    acc.push(page)
                                    return acc
                                }, [])
                                .map((item, i) =>
                                    item === 'ellipsis' ? (
                                        <span key={`e-${i}`} className="text-[11px] text-gray-400 px-1">...</span>
                                    ) : (
                                        <Button
                                            key={item}
                                            variant={currentPage === item ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => setCurrentPage(item)}
                                            className={cn(
                                                "h-8 w-8 p-0 rounded-full text-xs cursor-pointer",
                                                currentPage === item && "pointer-events-none"
                                            )}
                                        >
                                            {item}
                                        </Button>
                                    )
                                )}

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => p + 1)}
                                disabled={currentPage === totalPages}
                                className="h-8 w-8 p-0 rounded-full cursor-pointer"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    )}

                    {/* Load more from backend */}
                    {hasMore && currentPage === totalPages && (
                        <div className="flex justify-center pt-2">
                            <Button
                                variant="outline"
                                onClick={onLoadMore}
                                disabled={isLoading}
                                size="sm"
                                className="h-8 gap-1.5 text-xs rounded-full cursor-pointer"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        Chargement...
                                    </>
                                ) : (
                                    'Charger plus de contacts'
                                )}
                            </Button>
                        </div>
                    )}
                </>
            )}

            {/* ==================== BULK ACTION BAR ==================== */}
            {bulkMode && selectedIds.size > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
                    <div className="flex items-center gap-2 bg-gray-900 text-white rounded-full px-4 py-2.5 shadow-2xl border border-gray-700">
                        <span className="text-xs font-medium whitespace-nowrap">
                            {selectedIds.size} sélectionné{selectedIds.size > 1 ? 's' : ''}
                        </span>

                        <div className="w-px h-5 bg-gray-600" />

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => selectAll(filteredContacts)}
                            className="h-7 text-[11px] text-gray-300 hover:text-white hover:bg-gray-700 rounded-full cursor-pointer"
                        >
                            Tout sélectionner
                        </Button>

                        {canDelete && onBulkDelete && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onBulkDelete(Array.from(selectedIds))}
                                className="h-7 text-[11px] text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded-full gap-1 cursor-pointer"
                            >
                                <Trash2 className="h-3 w-3" />
                                Supprimer
                            </Button>
                        )}

                        {onBulkAddTag && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 text-[11px] text-gray-300 hover:text-white hover:bg-gray-700 rounded-full gap-1 cursor-pointer"
                                    >
                                        <TagIcon className="h-3 w-3" />
                                        Ajouter tag
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="center" side="top" className="mb-2">
                                    {tags.map((tag) => (
                                        <DropdownMenuItem
                                            key={tag.id}
                                            onClick={() => onBulkAddTag(Array.from(selectedIds), tag.name)}
                                            className="cursor-pointer"
                                        >
                                            <span className="flex items-center gap-2">
                                                <span
                                                    className="h-2 w-2 rounded-full shrink-0"
                                                    style={{ backgroundColor: tag.color }}
                                                />
                                                {tag.name}
                                            </span>
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}

                        {canExport && onExportSelected && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    const selectedContacts = contacts.filter(c => selectedIds.has(c.id))
                                    onExportSelected(selectedContacts)
                                }}
                                className="h-7 text-[11px] text-gray-300 hover:text-white hover:bg-gray-700 rounded-full gap-1 cursor-pointer"
                            >
                                <Download className="h-3 w-3" />
                                Exporter
                            </Button>
                        )}

                        <div className="w-px h-5 bg-gray-600" />

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearSelection}
                            className="h-7 text-[11px] text-gray-300 hover:text-white hover:bg-gray-700 rounded-full cursor-pointer"
                        >
                            <X className="h-3 w-3" />
                            Annuler
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
