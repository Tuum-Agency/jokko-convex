/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║            components/team/PolesSection.tsx                   ║
 * ╠═══════════════════════════════════════════════════════════════╣
 * ║                                                               ║
 * ║     Section de gestion des poles/services de l'organisation.  ║
 * ║                                                               ║
 * ║     - Liste des poles avec leurs membres                      ║
 * ║     - Creation, edition et suppression de poles               ║
 * ║     - Assignation/retrait de membres aux poles                ║
 * ║                                                               ║
 * ╚═══════════════════════════════════════════════════════════════╝
 */

'use client'

import { useState } from 'react'
import {
    Building2,
    Plus,
    Pencil,
    Trash2,
    MoreVertical,
    Loader2,
    Users,
    MessageSquare,
    Phone,
    Settings,
    Shield,
    Briefcase,
    Headphones,
    Laptop,
    Truck,
    Wallet,
    Globe,
    LayoutGrid,
} from 'lucide-react'
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"

import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
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

import { type Role } from '@/lib/team/roles'
import { PoleModal } from './PoleModal'

// ============================================
// TYPES
// ============================================

export interface Pole {
    id: Id<"poles">
    name: string
    description?: string
    color?: string
    icon?: string
    memberCount: number
}

interface PolesSectionProps {
    poles: Pole[]
    currentUserRole: Role
}

// ============================================
// ICONS HELPER
// ============================================

const ICONS_MAP: Record<string, any> = {
    Building2,
    Users,
    MessageSquare,
    Phone,
    Settings,
    Shield,
    Briefcase,
    Headphones,
    Laptop,
    Truck,
    Wallet,
    Globe,
}

// ============================================
// COMPONENT
// ============================================

// ============================================
// COMPONENT
// ============================================

export function PolesSection({
    poles,
    currentUserRole,
}: PolesSectionProps) {
    const [editingPole, setEditingPole] = useState<Pole | null>(null)
    const [deletingPole, setDeletingPole] = useState<Pole | null>(null)
    const [deleteLoading, setDeleteLoading] = useState(false)

    const removePole = useMutation(api.poles.remove)

    const canManagePoles = ['owner', 'admin'].includes(currentUserRole)

    const handleDelete = async () => {
        if (!deletingPole) return

        setDeleteLoading(true)
        try {
            await removePole({ id: deletingPole.id })
        } catch (error) {
            console.error('Delete pole error:', error)
            alert("Erreur lors de la suppression")
        } finally {
            setDeleteLoading(false)
            setDeletingPole(null)
        }
    }

    const getPoleIcon = (iconName: string | undefined) => {
        if (!iconName) return Building2
        return ICONS_MAP[iconName] || LayoutGrid
    }

    if (poles.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                    <Building2 className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Aucun pole cree
                </h3>
                <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                    Les pôles permettent d'organiser vos agents par service ou département
                    (ex: Service Client, SAV, Commercial).
                </p>
                {/* Create action is now in the page header */}
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Poles list */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {poles.map((pole) => {
                    const PoleIcon = getPoleIcon(pole.icon)
                    return (
                        <div
                            key={pole.id}
                            className="bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors shadow-sm group hover:shadow-md"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div
                                    className="p-3 rounded-xl transition-colors"
                                    style={{ backgroundColor: `${pole.color || '#6366f1'}15` }}
                                >
                                    <PoleIcon
                                        className="h-6 w-6"
                                        style={{ color: pole.color || '#6366f1' }}
                                    />
                                </div>

                                {canManagePoles && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => setEditingPole(pole)}>
                                                <Pencil className="h-4 w-4 mr-2" />
                                                Modifier
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => setDeletingPole(pole)}
                                                className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Supprimer
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                            </div>

                            <div>
                                <h3 className="font-semibold text-gray-900 text-lg mb-1">{pole.name}</h3>
                                <p className="text-sm text-gray-500 line-clamp-2 h-[40px] mb-4">
                                    {pole.description || "Aucune description"}
                                </p>
                            </div>

                            <div className="flex items-center gap-2 pt-4 border-t border-gray-100 mt-2">
                                <div className="flex -space-x-2">
                                    {/* Fake avatars for visual effect if we don't have members list in this view yet */}
                                    {[1, 2, 3].slice(0, Math.min(3, pole.memberCount)).map(i => (
                                        <div key={i} className="h-6 w-6 rounded-full ring-2 ring-white bg-gray-200 flex items-center justify-center text-[10px] text-gray-500 font-medium">
                                            {/* Placeholder */}
                                        </div>
                                    ))}
                                </div>
                                <span className="text-xs font-medium text-gray-500">
                                    {pole.memberCount} membre{pole.memberCount !== 1 ? 's' : ''}
                                </span>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Edit Modal */}
            {editingPole && (
                <PoleModal
                    open={!!editingPole}
                    onOpenChange={(open: boolean) => !open && setEditingPole(null)}
                    pole={editingPole}
                    onSuccess={() => { }}
                />
            )}

            {/* Delete Confirmation */}
            <Dialog open={!!deletingPole} onOpenChange={(open) => !open && setDeletingPole(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-red-600 flex items-center gap-2">
                            <Trash2 className="h-5 w-5" />
                            Supprimer le pole
                        </DialogTitle>
                        <DialogDescription className="space-y-4 pt-2">
                            <p>Etes-vous sur de vouloir supprimer le pole <span className="font-semibold text-gray-900">"{deletingPole?.name}"</span> ?</p>
                            {deletingPole && deletingPole.memberCount > 0 && (
                                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                                    <span className="font-semibold">Attention :</span> Les {deletingPole.memberCount} membres assignes seront retires du pole mais resteront dans l'equipe.
                                </div>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeletingPole(null)}
                            disabled={deleteLoading}
                        >
                            Annuler
                        </Button>
                        <Button
                            onClick={handleDelete}
                            disabled={deleteLoading}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {deleteLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Supprimer le pole
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
