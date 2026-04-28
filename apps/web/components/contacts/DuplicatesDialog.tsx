'use client'

import { useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import {
    Loader2,
    Merge,
    CheckCircle2,
    Users,
    Phone,
    Mail,
    Building2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatPhoneDisplay } from '@/lib/contacts/validation'

interface DuplicatesDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

type DuplicateContact = {
    _id: Id<"contacts">
    phone: string
    name?: string | null
    firstName?: string | null
    lastName?: string | null
    email?: string | null
    company?: string | null
    countryCode?: string | null
    tags: string[]
    createdAt: number
}

function getInitials(name?: string | null, firstName?: string | null, lastName?: string | null): string {
    if (name) return name.slice(0, 2).toUpperCase()
    const f = firstName?.[0]?.toUpperCase() || ''
    const l = lastName?.[0]?.toUpperCase() || ''
    return f + l || '?'
}

function getDisplayName(c: DuplicateContact): string {
    return c.name || [c.firstName, c.lastName].filter(Boolean).join(' ') || 'Sans nom'
}

export function DuplicatesDialog({ open, onOpenChange }: DuplicatesDialogProps) {
    const duplicateGroups = useQuery(
        api.contacts.detectDuplicates,
        open ? {} : "skip"
    )
    const mergeDuplicates = useMutation(api.contacts.mergeDuplicates)

    const [mergingGroup, setMergingGroup] = useState<number | null>(null)
    const [mergedGroups, setMergedGroups] = useState<Set<number>>(new Set())
    const [mergingAll, setMergingAll] = useState(false)

    const isLoading = duplicateGroups === undefined

    const handleMergeGroup = async (groupIndex: number, group: DuplicateContact[]) => {
        if (group.length < 2) return
        setMergingGroup(groupIndex)
        try {
            // Use first contact as primary (oldest by createdAt)
            const sorted = [...group].sort((a, b) => a.createdAt - b.createdAt)
            const primary = sorted[0]
            const duplicateIds = sorted.slice(1).map(c => c._id)
            await mergeDuplicates({
                primaryId: primary._id,
                duplicateIds,
            })
            setMergedGroups(prev => new Set(prev).add(groupIndex))
        } catch (error) {
            console.error('Merge failed:', error)
        } finally {
            setMergingGroup(null)
        }
    }

    const handleMergeAll = async () => {
        if (!duplicateGroups) return
        setMergingAll(true)
        for (let i = 0; i < duplicateGroups.length; i++) {
            if (mergedGroups.has(i)) continue
            await handleMergeGroup(i, duplicateGroups[i] as DuplicateContact[])
        }
        setMergingAll(false)
    }

    const handleOpenChange = (value: boolean) => {
        if (!value) {
            setMergedGroups(new Set())
            setMergingGroup(null)
            setMergingAll(false)
        }
        onOpenChange(value)
    }

    const pendingGroups = duplicateGroups
        ? duplicateGroups.filter((_, i) => !mergedGroups.has(i))
        : []

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Merge className="h-5 w-5 text-orange-500" />
                        Doublons de contacts
                    </DialogTitle>
                    <DialogDescription>
                        Contacts potentiellement en double, regroupes par numero de telephone ou nom identique.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 mt-4">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                            <p className="text-sm text-gray-500">Analyse des contacts en cours...</p>
                        </div>
                    ) : duplicateGroups.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                                <CheckCircle2 className="h-6 w-6 text-green-600" />
                            </div>
                            <p className="text-sm font-medium text-gray-900">Aucun doublon detecte</p>
                            <p className="text-xs text-gray-500 text-center max-w-sm">
                                Tous vos contacts sont uniques. La detection se base sur le numero de telephone et le nom.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Summary + Merge All */}
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-gray-600">
                                    <span className="font-semibold text-gray-900">
                                        {pendingGroups.length}
                                    </span>{' '}
                                    groupe{pendingGroups.length > 1 ? 's' : ''} de doublons
                                    {mergedGroups.size > 0 && (
                                        <span className="text-green-600 ml-2">
                                            ({mergedGroups.size} fusionne{mergedGroups.size > 1 ? 's' : ''})
                                        </span>
                                    )}
                                </p>
                                {pendingGroups.length > 1 && (
                                    <Button
                                        size="sm"
                                        onClick={handleMergeAll}
                                        disabled={mergingAll || mergingGroup !== null}
                                        className="h-8 gap-1.5 text-xs rounded-full cursor-pointer"
                                    >
                                        {mergingAll ? (
                                            <>
                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                Fusion en cours...
                                            </>
                                        ) : (
                                            <>
                                                <Merge className="h-3.5 w-3.5" />
                                                Tout fusionner
                                            </>
                                        )}
                                    </Button>
                                )}
                            </div>

                            {/* Duplicate groups */}
                            {duplicateGroups.map((group, groupIndex) => {
                                const isMerged = mergedGroups.has(groupIndex)
                                const isMerging = mergingGroup === groupIndex
                                const typedGroup = group as DuplicateContact[]

                                return (
                                    <Card
                                        key={groupIndex}
                                        className={cn(
                                            'border transition-all',
                                            isMerged
                                                ? 'bg-green-50/50 border-green-200 opacity-60'
                                                : 'bg-white border-gray-100'
                                        )}
                                    >
                                        <CardContent className="p-4">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <Users className="h-4 w-4 text-gray-400" />
                                                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        {typedGroup.length} contacts similaires
                                                    </span>
                                                </div>
                                                {isMerged ? (
                                                    <Badge className="bg-green-100 text-green-700 text-[10px]">
                                                        <CheckCircle2 className="h-3 w-3 mr-1" />
                                                        Fusionne
                                                    </Badge>
                                                ) : (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleMergeGroup(groupIndex, typedGroup)}
                                                        disabled={isMerging || mergingAll}
                                                        className="h-7 gap-1 text-[11px] rounded-full cursor-pointer"
                                                    >
                                                        {isMerging ? (
                                                            <Loader2 className="h-3 w-3 animate-spin" />
                                                        ) : (
                                                            <Merge className="h-3 w-3" />
                                                        )}
                                                        Fusionner
                                                    </Button>
                                                )}
                                            </div>

                                            <div className="grid gap-2">
                                                {typedGroup.map((contact, contactIndex) => (
                                                    <div
                                                        key={String(contact._id)}
                                                        className={cn(
                                                            'flex items-center gap-3 p-2 rounded-lg',
                                                            contactIndex === 0
                                                                ? 'bg-blue-50/50 border border-blue-100'
                                                                : 'bg-gray-50 border border-gray-100'
                                                        )}
                                                    >
                                                        <Avatar className="h-8 w-8 shrink-0">
                                                            <AvatarFallback className={cn(
                                                                'text-white text-xs font-semibold',
                                                                contactIndex === 0
                                                                    ? 'bg-gradient-to-br from-blue-600 to-blue-400'
                                                                    : 'bg-gradient-to-br from-gray-500 to-gray-400'
                                                            )}>
                                                                {getInitials(contact.name, contact.firstName, contact.lastName)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                                    {getDisplayName(contact)}
                                                                </p>
                                                                {contactIndex === 0 && (
                                                                    <Badge variant="secondary" className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0 shrink-0">
                                                                        Principal
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-3 mt-0.5">
                                                                <span className="text-[11px] text-gray-500 flex items-center gap-1">
                                                                    <Phone className="h-3 w-3" />
                                                                    {formatPhoneDisplay(contact.phone, 'international')}
                                                                </span>
                                                                {contact.email && (
                                                                    <span className="text-[11px] text-gray-500 flex items-center gap-1 truncate">
                                                                        <Mail className="h-3 w-3" />
                                                                        {contact.email}
                                                                    </span>
                                                                )}
                                                                {contact.company && (
                                                                    <span className="text-[11px] text-gray-500 flex items-center gap-1 truncate">
                                                                        <Building2 className="h-3 w-3" />
                                                                        {contact.company}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {contact.tags.length > 0 && (
                                                            <div className="flex gap-1 shrink-0">
                                                                {contact.tags.slice(0, 2).map((tag) => (
                                                                    <Badge
                                                                        key={tag}
                                                                        variant="secondary"
                                                                        className="text-[9px] px-1.5 py-0"
                                                                    >
                                                                        {tag}
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )
                            })}
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
