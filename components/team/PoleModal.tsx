'use client'

import { useState, useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
    Building2,
    Palette,
    Type,
    AlignLeft,
    Info,
    LayoutGrid,
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
    MoreHorizontal,
    Loader2,
} from 'lucide-react'
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import { ScrollArea } from '@/components/ui/scroll-area'

// ============================================
// SCHEMA
// ============================================

const poleSchema = z.object({
    name: z.string().min(2, 'Le nom doit contenir au moins 2 caracteres'),
    description: z.string().max(200, 'Description trop longue').optional(),
    color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Couleur invalide'),
    icon: z.string().min(1, 'Selectionnez une icone'),
})

type PoleFormValues = z.infer<typeof poleSchema>

// ============================================
// TYPES
// ============================================

interface Pole {
    id: Id<"poles">
    name: string
    description?: string
    color?: string
    icon?: string
    memberCount: number
}

interface PoleModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    pole?: Pole | null
    onSuccess: () => void
}

// ============================================
// CONSTANTS
// ============================================

const PRESET_COLORS = [
    '#ef4444', // red
    '#f97316', // orange
    '#f59e0b', // amber
    '#84cc16', // lime
    '#10b981', // emerald
    '#06b6d4', // cyan
    '#3b82f6', // blue
    '#6366f1', // indigo
    '#8b5cf6', // violet
    '#d946ef', // fuchsia
    '#f43f5e', // rose
    '#6b7280', // gray
]

const ICONS = [
    { name: 'Building2', icon: Building2 },
    { name: 'Users', icon: Users },
    { name: 'MessageSquare', icon: MessageSquare },
    { name: 'Phone', icon: Phone },
    { name: 'Settings', icon: Settings },
    { name: 'Shield', icon: Shield },
    { name: 'Briefcase', icon: Briefcase },
    { name: 'Headphones', icon: Headphones },
    { name: 'Laptop', icon: Laptop },
    { name: 'Truck', icon: Truck },
    { name: 'Wallet', icon: Wallet },
    { name: 'Globe', icon: Globe },
]

// ============================================
// COMPONENT
// ============================================

export function PoleModal({
    open,
    onOpenChange,
    pole,
    onSuccess,
}: PoleModalProps) {
    const [error, setError] = useState<string | null>(null)

    // Convex
    const createPole = useMutation(api.poles.create)
    const updatePole = useMutation(api.poles.update)

    const isEditing = !!pole

    const form = useForm<PoleFormValues>({
        resolver: zodResolver(poleSchema),
        defaultValues: {
            name: '',
            description: '',
            color: '#10b981',
            icon: 'Building2',
        },
    })

    // Watch for preview
    const formValues = useWatch({ control: form.control })

    // Reset form when opening/changing pole
    useEffect(() => {
        if (open) {
            if (pole) {
                form.reset({
                    name: pole.name,
                    description: pole.description || '',
                    color: pole.color || '#10b981',
                    icon: pole.icon || 'Building2',
                })
            } else {
                form.reset({
                    name: '',
                    description: '',
                    color: '#10b981',
                    icon: 'Building2',
                })
            }
            setError(null)
        }
    }, [open, pole, form])

    const onSubmit = async (values: PoleFormValues) => {
        setError(null)

        try {
            if (isEditing && pole) {
                await updatePole({
                    id: pole.id,
                    name: values.name,
                    description: values.description,
                    color: values.color,
                    icon: values.icon,
                })
            } else {
                await createPole({
                    name: values.name,
                    description: values.description,
                    color: values.color,
                    icon: values.icon,
                })
            }

            onSuccess()
            onOpenChange(false)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Une erreur est survenue')
        }
    }

    const isLoading = form.formState.isSubmitting

    // Icon Component Helper
    const SelectedIcon = ICONS.find(i => i.name === formValues.icon)?.icon || Building2

    return (
        <Dialog open={open} onOpenChange={(val) => {
            if (!isLoading) onOpenChange(val)
        }}>
            <DialogContent className="sm:max-w-[900px] overflow-hidden p-0 gap-0">
                <div className="flex h-[600px] flex-col md:flex-row">
                    {/* Main Form Area */}
                    <div className="flex-1 overflow-y-auto p-6 md:p-8">
                        <DialogHeader className="mb-6">
                            <DialogTitle className="flex items-center gap-2 text-2xl">
                                <div className="h-10 w-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
                                    {isEditing ? <Palette className="h-5 w-5" /> : <Building2 className="h-5 w-5" />}
                                </div>
                                {isEditing ? 'Modifier le pole' : 'Nouveau pole'}
                            </DialogTitle>
                            <DialogDescription className="text-base text-gray-500">
                                {isEditing
                                    ? 'Modifiez les informations du service ou departement.'
                                    : 'Creez un nouveau service pour organiser vos agents.'}
                            </DialogDescription>
                        </DialogHeader>

                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                {/* Name */}
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2 text-gray-700">
                                                <Type className="h-3.5 w-3.5" />
                                                Nom du pole
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Ex: Service Commercial"
                                                    className="h-11 rounded-xl border-gray-200"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Description */}
                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2 text-gray-700">
                                                <AlignLeft className="h-3.5 w-3.5" />
                                                Description courte
                                            </FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Decrivez le role de ce service..."
                                                    className="min-h-[80px] rounded-xl border-gray-200 resize-none"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormDescription className="text-xs">
                                                Cette description apparaitra dans les tooltips.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Color Picker */}
                                    <FormField
                                        control={form.control}
                                        name="color"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center gap-2 text-gray-700">
                                                    <Palette className="h-3.5 w-3.5" />
                                                    Couleur distinctive
                                                </FormLabel>
                                                <FormControl>
                                                    <div className="grid grid-cols-6 gap-2">
                                                        {PRESET_COLORS.map((color) => (
                                                            <button
                                                                key={color}
                                                                type="button"
                                                                onClick={() => field.onChange(color)}
                                                                className={`
                                                                    h-8 w-8 rounded-full transition-all duration-200
                                                                    hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-green-600
                                                                    ${field.value === color ? 'scale-110 ring-2 ring-offset-1 ring-green-600 shadow-sm' : ''}
                                                                `}
                                                                style={{ backgroundColor: color }}
                                                                title={color}
                                                            />
                                                        ))}
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Icon Picker */}
                                    <FormField
                                        control={form.control}
                                        name="icon"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center gap-2 text-gray-700">
                                                    <LayoutGrid className="h-3.5 w-3.5" />
                                                    Icone
                                                </FormLabel>
                                                <FormControl>
                                                    <ScrollArea className="h-[120px] rounded-xl border border-gray-200 p-2">
                                                        <div className="grid grid-cols-4 gap-2">
                                                            {ICONS.map((item) => (
                                                                <button
                                                                    key={item.name}
                                                                    type="button"
                                                                    onClick={() => field.onChange(item.name)}
                                                                    className={`
                                                                        flex flex-col items-center justify-center p-2 rounded-lg transition-all
                                                                        hover:bg-gray-100 focus:outline-none
                                                                        ${field.value === item.name ? 'bg-green-50 text-green-600 ring-1 ring-green-200' : 'text-gray-500'}
                                                                    `}
                                                                >
                                                                    <item.icon className="h-5 w-5" />
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </ScrollArea>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {error && (
                                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex items-center gap-2">
                                        <Info className="h-4 w-4 flex-shrink-0" />
                                        {error}
                                    </div>
                                )}

                                {/* Footer */}
                                <div className="pt-2 flex items-center justify-end gap-3 border-t border-gray-100 mt-6">
                                    <ButtonGroup>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => onOpenChange(false)}
                                            disabled={isLoading}
                                        >
                                            Annuler
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={isLoading}
                                            className="bg-green-600 hover:bg-green-700 text-white min-w-[140px]"
                                        >
                                            {isLoading ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Traitement...
                                                </>
                                            ) : isEditing ? 'Mettre a jour' : 'Creer le pole'}
                                        </Button>
                                    </ButtonGroup>
                                </div>
                            </form>
                        </Form>
                    </div>

                    {/* Preview Sidebar */}
                    <div className="hidden md:flex w-[300px] bg-gray-50/50 border-l border-gray-200/50 p-8 flex-col items-center justify-center">
                        <div className="w-full max-w-[240px]">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest text-center mb-6">
                                Apercu en direct
                            </p>

                            {/* Card Preview */}
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 transition-all duration-300 group hover:shadow-md hover:border-gray-300">
                                <div className="flex items-start justify-between mb-4">
                                    <div
                                        className="h-12 w-12 rounded-xl flex items-center justify-center transition-colors duration-300"
                                        style={{
                                            backgroundColor: `${formValues.color}15`,
                                            color: formValues.color
                                        }}
                                    >
                                        <SelectedIcon className="h-6 w-6" />
                                    </div>
                                    <div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </div>
                                </div>

                                <h3 className="font-bold text-gray-900 text-lg mb-1 break-words">
                                    {formValues.name || 'Nom du pole'}
                                </h3>

                                <p className="text-sm text-gray-500 line-clamp-2 min-h-[40px] mb-4">
                                    {formValues.description || 'La description du service s\'affichera ici...'}
                                </p>

                                <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                                    <div className="flex -space-x-2">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="h-6 w-6 rounded-full ring-2 ring-white bg-gray-200" />
                                        ))}
                                    </div>
                                    <span className="text-xs font-medium text-gray-400 ml-1">
                                        + 5 membres
                                    </span>
                                </div>
                            </div>

                            {/* List Preview */}
                            <div className="mt-8 opacity-60 scale-95">
                                <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200">
                                    <div
                                        className="h-8 w-8 rounded-lg flex items-center justify-center"
                                        style={{
                                            backgroundColor: `${formValues.color}15`,
                                            color: formValues.color
                                        }}
                                    >
                                        <SelectedIcon className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                            {formValues.name || 'Nom du pole'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
