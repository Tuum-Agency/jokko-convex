'use client'

import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Bookmark,
    Plus,
    X,
    ChevronDown,
    Loader2,
    Save,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SegmentFilters {
    search?: string
    tags?: string[]
    country?: string
    sort?: string
}

interface SegmentSelectorProps {
    currentFilters: SegmentFilters
    onApplySegment: (filters: SegmentFilters) => void
    className?: string
}

export function SegmentSelector({
    currentFilters,
    onApplySegment,
    className,
}: SegmentSelectorProps) {
    const segments = useQuery(api.contacts.listSegments)
    const createSegment = useMutation(api.contacts.createSegment)
    const deleteSegment = useMutation(api.contacts.deleteSegment)

    const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false)
    const [segmentName, setSegmentName] = useState('')
    const [isSaving, setIsSaving] = useState(false)
    const [deletingId, setDeletingId] = useState<Id<"contactSegments"> | null>(null)

    const hasActiveFilters =
        !!currentFilters.search ||
        (currentFilters.tags && currentFilters.tags.length > 0) ||
        !!currentFilters.country

    const handleSave = async () => {
        if (!segmentName.trim()) return
        setIsSaving(true)
        try {
            await createSegment({
                name: segmentName.trim(),
                filters: {
                    search: currentFilters.search || undefined,
                    tags: currentFilters.tags?.length ? currentFilters.tags : undefined,
                    country: currentFilters.country || undefined,
                    sort: currentFilters.sort || undefined,
                },
            })
            setSegmentName('')
            setIsSaveDialogOpen(false)
        } catch (error) {
            console.error('Failed to save segment:', error)
        } finally {
            setIsSaving(false)
        }
    }

    const handleDelete = async (e: React.MouseEvent, id: Id<"contactSegments">) => {
        e.preventDefault()
        e.stopPropagation()
        setDeletingId(id)
        try {
            await deleteSegment({ id })
        } catch (error) {
            console.error('Failed to delete segment:', error)
        } finally {
            setDeletingId(null)
        }
    }

    const handleApply = (filters: SegmentFilters) => {
        onApplySegment(filters)
    }

    return (
        <>
            <div className={cn('flex items-center gap-2', className)}>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1.5 text-xs rounded-full cursor-pointer"
                        >
                            <Bookmark className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Segments</span>
                            <ChevronDown className="h-3 w-3 opacity-50" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-64">
                        {segments && segments.length > 0 ? (
                            <>
                                {segments.map((segment) => (
                                    <DropdownMenuItem
                                        key={segment._id}
                                        className="cursor-pointer flex items-center justify-between group"
                                        onClick={() => handleApply(segment.filters)}
                                    >
                                        <div className="flex items-center gap-2 min-w-0">
                                            <Bookmark className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                            <span className="truncate text-sm">{segment.name}</span>
                                        </div>
                                        <button
                                            onClick={(e) => handleDelete(e, segment._id)}
                                            className="opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all p-0.5 shrink-0"
                                            disabled={deletingId === segment._id}
                                        >
                                            {deletingId === segment._id ? (
                                                <Loader2 className="h-3 w-3 animate-spin" />
                                            ) : (
                                                <X className="h-3 w-3" />
                                            )}
                                        </button>
                                    </DropdownMenuItem>
                                ))}
                                <DropdownMenuSeparator />
                            </>
                        ) : (
                            <>
                                <div className="px-3 py-4 text-center">
                                    <p className="text-xs text-gray-500">Aucun segment sauvegarde</p>
                                    <p className="text-[10px] text-gray-400 mt-0.5">
                                        Appliquez des filtres puis sauvegardez-les
                                    </p>
                                </div>
                                <DropdownMenuSeparator />
                            </>
                        )}
                        <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() => setIsSaveDialogOpen(true)}
                            disabled={!hasActiveFilters}
                        >
                            <Plus className="h-3.5 w-3.5 mr-2" />
                            <span className="text-sm">
                                {hasActiveFilters
                                    ? 'Sauvegarder ce filtre'
                                    : 'Appliquez des filtres d\'abord'}
                            </span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Save Segment Dialog */}
            <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Save className="h-5 w-5 text-green-600" />
                            Sauvegarder le segment
                        </DialogTitle>
                        <DialogDescription>
                            Donnez un nom a cette combinaison de filtres pour la retrouver facilement.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label htmlFor="segment-name">Nom du segment</Label>
                            <Input
                                id="segment-name"
                                placeholder="Ex: Clients Senegal, Prospects VIP..."
                                value={segmentName}
                                onChange={(e) => setSegmentName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault()
                                        handleSave()
                                    }
                                }}
                                autoFocus
                            />
                        </div>

                        {/* Preview of current filters */}
                        <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
                            <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                                Filtres actifs
                            </p>
                            {currentFilters.search && (
                                <p className="text-xs text-gray-600">
                                    Recherche : <span className="font-medium">{currentFilters.search}</span>
                                </p>
                            )}
                            {currentFilters.tags && currentFilters.tags.length > 0 && (
                                <p className="text-xs text-gray-600">
                                    Tags : <span className="font-medium">{currentFilters.tags.join(', ')}</span>
                                </p>
                            )}
                            {currentFilters.country && (
                                <p className="text-xs text-gray-600">
                                    Pays : <span className="font-medium">{currentFilters.country}</span>
                                </p>
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsSaveDialogOpen(false)}
                            className="cursor-pointer"
                        >
                            Annuler
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={!segmentName.trim() || isSaving}
                            className="cursor-pointer"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    Sauvegarde...
                                </>
                            ) : (
                                'Sauvegarder'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
