/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║            components/team/InviteMemberModal.tsx              ║
 * ╠═══════════════════════════════════════════════════════════════╣
 * ║                                                               ║
 * ║     Modal d'invitation avec verification de limite            ║
 * ║                                                               ║
 * ║     Design coherent avec l'application:                       ║
 * ║     - Input avec style h-12, rounded-xl                       ║
 * ║     - Couleurs vertes (green-500, green-600)                  ║
 * ║     - Selection de role avec cartes visuelles                 ║
 * ║                                                               ║
 * ╚═══════════════════════════════════════════════════════════════╝
 */

'use client'

import { useState, useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
    Loader2,
    UserPlus,
    AlertTriangle,
    Shield,
    MessageSquare,
    Building2,
} from 'lucide-react'
import { useAction, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import { Progress } from '@/components/ui/progress'

import { type Role, ROLE_DEFINITIONS, getAssignableRoles } from '@/lib/team/roles'

// ============================================
// SCHEMA
// ============================================

const inviteSchema = z.object({
    name: z.string().min(2, 'Le nom doit contenir au moins 2 caracteres'), // Note: We only send email via backend, name is just for UI or unused
    email: z.string().email('Email invalide'),
    role: z.enum(['admin', 'agent']),
    poleId: z.string().optional(),
})

type InviteFormValues = z.infer<typeof inviteSchema>

// ============================================
// TYPES
// ============================================

interface InviteMemberModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
    currentUserRole: Role
    teamUsage?: { current: number; limit: number }
}

// ============================================
// ROLE ICON
// ============================================

function RoleIcon({ role, className }: { role: string; className?: string }) {
    switch (role) {
        case 'admin':
            return <Shield className={className} />
        case 'agent':
            return <MessageSquare className={className} />
        default:
            return <Shield className={className} />
    }
}

// ============================================
// COMPONENT
// ============================================

export function InviteMemberModal({
    open,
    onOpenChange,
    onSuccess,
    currentUserRole,
    teamUsage,
}: InviteMemberModalProps) {
    const [error, setError] = useState<string | null>(null)

    // Convex
    const sendInvitation = useAction(api.invitations.create)
    const polesData = useQuery(api.poles.list, {})
    const poles = polesData?.poles || []
    const polesLoading = polesData === undefined

    const form = useForm<InviteFormValues>({
        resolver: zodResolver(inviteSchema),
        defaultValues: {
            name: '',
            email: '',
            role: 'agent',
            poleId: undefined,
        },
    })

    // Watch role to conditionally show pole selection
    const selectedRole = useWatch({ control: form.control, name: 'role' })

    // Clear poleId when role changes to admin
    useEffect(() => {
        if (selectedRole === 'admin') {
            form.setValue('poleId', undefined)
        }
    }, [selectedRole, form])

    // Roles that current user can assign
    const assignableRoles = getAssignableRoles(currentUserRole)

    // Check if limit reached
    const isLimitReached = teamUsage
        ? teamUsage.current >= teamUsage.limit
        : false

    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen) {
            form.reset({
                name: '',
                email: '',
                role: 'agent',
                poleId: undefined,
            })
            setError(null)
        }
        onOpenChange(newOpen)
    }

    const onSubmit = async (values: InviteFormValues) => {
        if (isLimitReached) {
            setError('Limite de membres atteinte. Passez a un plan superieur.')
            return
        }

        setError(null)

        try {
            await sendInvitation({
                email: values.email,
                name: values.name, // Send the name to backend
                role: values.role.toUpperCase(),
                poleId: values.poleId as any, // Cast ID
                // OrganizationId is inferred on backend or we could pass it if needed
            })

            onSuccess()
            handleOpenChange(false)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Une erreur est survenue')
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[500px] overflow-y-auto max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5 text-green-600" />
                        Inviter un membre
                    </DialogTitle>
                    <DialogDescription>
                        Envoyez une invitation par email pour rejoindre votre organisation.
                    </DialogDescription>
                </DialogHeader>

                {isLimitReached && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                        <div>
                            <p className="font-medium text-amber-800 text-sm">Limite atteinte</p>
                            <p className="text-amber-700 text-xs mt-0.5">
                                Vous avez atteint la limite de votre plan. Supprimez des membres ou passez au plan superieur.
                            </p>
                        </div>
                    </div>
                )}

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                        {/* Name - Optional for backend but kept for UI */}
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-gray-700">Nom complet</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Ex: Jean Dupont"
                                            className="h-11 rounded-xl"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Email */}
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-gray-700">Adresse email</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="email"
                                            placeholder="jean@example.com"
                                            className="h-11 rounded-xl"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Role Selection */}
                        <FormField
                            control={form.control}
                            name="role"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-gray-700">Role</FormLabel>
                                    <FormControl>
                                        <div className="space-y-2">
                                            {assignableRoles.map((role) => {
                                                const roleConfig = ROLE_DEFINITIONS[role]
                                                const isSelected = field.value === role

                                                if (!roleConfig) return null

                                                return (
                                                    <button
                                                        key={role}
                                                        type="button"
                                                        onClick={() => field.onChange(role)}
                                                        className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${isSelected
                                                            ? 'border-green-500 bg-green-50'
                                                            : 'border-gray-200 hover:border-gray-300 bg-white'
                                                            }`}
                                                    >
                                                        <div className={`p-2 rounded-lg ${roleConfig.bgColor}`}>
                                                            <RoleIcon role={role} className={`h-5 w-5 ${roleConfig.color}`} />
                                                        </div>
                                                        <div className="flex-1 text-left">
                                                            <p className={`font-medium ${isSelected ? 'text-green-700' : 'text-gray-900'}`}>
                                                                {roleConfig.label}
                                                            </p>
                                                            <p className="text-sm text-gray-500">
                                                                {roleConfig.description}
                                                            </p>
                                                        </div>
                                                        {isSelected && (
                                                            <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center">
                                                                <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                                </svg>
                                                            </div>
                                                        )}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Pole Selection - Only for agents */}
                        {selectedRole === 'agent' && poles.length > 0 && (
                            <FormField
                                control={form.control}
                                name="poleId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-gray-700">
                                            Pole / Service
                                            <span className="ml-1 text-gray-400 font-normal">(optionnel)</span>
                                        </FormLabel>
                                        <FormControl>
                                            <div className="space-y-2">
                                                {polesLoading ? (
                                                    <div className="flex items-center justify-center p-4 text-gray-500">
                                                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                                        Chargement des poles...
                                                    </div>
                                                ) : (
                                                    <>
                                                        {/* No pole option */}
                                                        <button
                                                            type="button"
                                                            onClick={() => field.onChange(undefined)}
                                                            className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${!field.value
                                                                ? 'border-green-500 bg-green-50'
                                                                : 'border-gray-200 hover:border-gray-300 bg-white'
                                                                }`}
                                                        >
                                                            <div className="p-2 rounded-lg bg-gray-100">
                                                                <Building2 className="h-5 w-5 text-gray-500" />
                                                            </div>
                                                            <div className="flex-1 text-left">
                                                                <p className={`font-medium ${!field.value ? 'text-green-700' : 'text-gray-900'}`}>
                                                                    Aucun pole
                                                                </p>
                                                                <p className="text-sm text-gray-500">
                                                                    L'agent n'est affecte a aucun pole specifique
                                                                </p>
                                                            </div>
                                                            {!field.value && (
                                                                <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center">
                                                                    <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                                    </svg>
                                                                </div>
                                                            )}
                                                        </button>

                                                        {/* Pole options */}
                                                        {poles.map((pole) => {
                                                            const isSelected = field.value === pole.id
                                                            return (
                                                                <button
                                                                    key={pole.id}
                                                                    type="button"
                                                                    onClick={() => field.onChange(pole.id)}
                                                                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${isSelected
                                                                        ? 'border-green-500 bg-green-50'
                                                                        : 'border-gray-200 hover:border-gray-300 bg-white'
                                                                        }`}
                                                                >
                                                                    <div
                                                                        className="p-2 rounded-lg"
                                                                        style={{ backgroundColor: `${pole.color}20` }}
                                                                    >
                                                                        <Building2
                                                                            className="h-5 w-5"
                                                                            style={{ color: pole.color || '#6366f1' }}
                                                                        />
                                                                    </div>
                                                                    <div className="flex-1 text-left">
                                                                        <p className={`font-medium ${isSelected ? 'text-green-700' : 'text-gray-900'}`}>
                                                                            {pole.name}
                                                                        </p>
                                                                        {pole.description && (
                                                                            <p className="text-sm text-gray-500">
                                                                                {pole.description}
                                                                            </p>
                                                                        )}
                                                                        <p className="text-xs text-gray-400 mt-0.5">
                                                                            {pole.memberCount} {pole.memberCount === 1 ? 'membre' : 'membres'}
                                                                        </p>
                                                                    </div>
                                                                    {isSelected && (
                                                                        <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center">
                                                                            <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                                            </svg>
                                                                        </div>
                                                                    )}
                                                                </button>
                                                            )
                                                        })}
                                                    </>
                                                )}
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        {/* Error */}
                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                                {error}
                            </div>
                        )}

                        <DialogFooter>
                            <ButtonGroup>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => handleOpenChange(false)}
                                >
                                    Annuler
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={form.formState.isSubmitting || isLimitReached}
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Envoyer l'invitation
                                </Button>
                            </ButtonGroup>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
