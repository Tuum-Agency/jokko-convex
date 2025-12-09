'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    User,
    Mail,
    Building2,
    MapPin,
    Tag,
    FileText,
    Loader2
} from 'lucide-react';
import { useState } from 'react';

import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { PhoneInput } from './PhoneInput';
import { detectCountry } from '@/lib/contacts/validation';

// Helper to wrap input with icon
function InputWithIcon({ leftIcon, className, ...props }: any) {
    return (
        <div className="relative">
            {leftIcon && (
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                    {leftIcon}
                </div>
            )}
            <Input className={`pl-10 ${className}`} {...props} />
        </div>
    );
}


const formSchema = z.object({
    phone: z.string().min(8, "Numéro requis"),
    name: z.string().optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    email: z.string().email("Email invalide").optional().or(z.literal('')),
    company: z.string().optional(),
    jobTitle: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    notes: z.string().optional(),

    // tags handled separately in state, or part of form?
    // reference form handles tags in state `const [tags, setTags]`.
});

interface ContactFormProps {
    initialData?: any;
    mode: 'create' | 'edit';
    tags: string[]; // Available tags for autocomplete? Reference form only shows tags in badges.
    onSubmit: (data: any) => Promise<void>;
    isLoading?: boolean;
    onCancel?: () => void;
}

export function ContactForm({
    initialData,
    mode,
    tags: availableTags, // Not used in reference snippet for selection?
    onSubmit,
    isLoading,
    onCancel
}: ContactFormProps) {

    // Extract tags from initialData if present
    const initialTags = initialData?.tags
        ? (Array.isArray(initialData.tags) ? initialData.tags : initialData.tags.split(',').map((t: string) => t.trim()))
        : [];

    const [tags, setTags] = useState<string[]>(initialTags);
    const [tagInput, setTagInput] = useState('');

    // Handle initial notes
    const existingNotes = Array.isArray(initialData?.notes) ? initialData.notes : [];
    const initialNoteValue = typeof initialData?.notes === 'string' ? initialData.notes : '';

    // Logic to split the name if firstName and lastName are missing but name exists.
    let initialFirstName = initialData?.firstName || '';
    let initialLastName = initialData?.lastName || '';

    if (!initialFirstName && !initialLastName && initialData?.name) {
        const parts = initialData.name.trim().split(' ');
        if (parts.length > 0) {
            initialFirstName = parts[0];
            initialLastName = parts.slice(1).join(' '); // Remainder as last name
        }
    }

    const defaultValues = {
        phone: initialData?.phone || '',
        firstName: initialFirstName,
        lastName: initialLastName,
        email: initialData?.email || '',
        company: initialData?.company || '',
        jobTitle: initialData?.jobTitle || '',
        address: initialData?.address || '',
        city: initialData?.city || '',
        country: initialData?.country || '',
        notes: mode === 'create' ? initialNoteValue : '', // Empty for edit mode (add new note)
    };

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues,
    });

    const handleAddTag = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const val = tagInput.trim();
            if (val && !tags.includes(val)) {
                setTags([...tags, val]);
                setTagInput('');
            }
        }
    }

    const handleRemoveTag = (tag: string) => {
        setTags(tags.filter(t => t !== tag));
    }

    const handleSubmit = async (values: z.infer<typeof formSchema>) => {
        const payload: any = {
            ...values,
            tags
        };

        if (mode === 'edit') {
            // For edit mode, 'notes' field in form is actually for adding a new note
            if (values.notes) {
                payload.addNote = values.notes;
            }
            delete payload.notes; // Prevent overwriting entire notes history
        }

        await onSubmit(payload);
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)}>
                <Card className="border-0 shadow-none">
                    <CardContent className="space-y-4 px-0 pb-0">
                        {/* Phone */}
                        <FormField
                            control={form.control}
                            name="phone"
                            render={({ field, fieldState }) => (
                                <FormItem>
                                    <FormLabel>Téléphone *</FormLabel>
                                    <FormControl>
                                        <PhoneInput
                                            indicator={detectCountry(field.value)}
                                            value={field.value}
                                            onChange={(val) => field.onChange(val)}
                                            onBlur={field.onBlur}
                                            error={fieldState.error?.message}
                                            disabled={isLoading}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Format international recommandé pour WhatsApp
                                    </FormDescription>
                                </FormItem>
                            )}
                        />

                        {/* Name fields */}
                        <div className="grid gap-4 sm:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="firstName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Prénom</FormLabel>
                                        <FormControl>
                                            <InputWithIcon
                                                placeholder="Amadou"
                                                leftIcon={<User className="h-4 w-4" />}
                                                disabled={isLoading}
                                                {...field}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="lastName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nom</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Diallo"
                                                disabled={isLoading}
                                                {...field}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Email */}
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field, fieldState }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <InputWithIcon
                                            type="email"
                                            placeholder="amadou@example.com"
                                            leftIcon={<Mail className="h-4 w-4" />}
                                            disabled={isLoading}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Company fields */}
                        <div className="grid gap-4 sm:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="company"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Entreprise</FormLabel>
                                        <FormControl>
                                            <InputWithIcon
                                                placeholder="Jokko SAS"
                                                leftIcon={<Building2 className="h-4 w-4" />}
                                                disabled={isLoading}
                                                {...field}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="jobTitle"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Fonction</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Directeur commercial"
                                                disabled={isLoading}
                                                {...field}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Address fields */}
                        <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Adresse</FormLabel>
                                    <FormControl>
                                        <InputWithIcon
                                            placeholder="123 Rue de Dakar"
                                            leftIcon={<MapPin className="h-4 w-4" />}
                                            disabled={isLoading}
                                            {...field}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <div className="grid gap-4 sm:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="city"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Ville</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Dakar"
                                                disabled={isLoading}
                                                {...field}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="country"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Pays</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Sénégal"
                                                disabled={isLoading}
                                                {...field}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Tags */}
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <Tag className="h-4 w-4" />
                                Tags
                            </Label>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {tags.map((tag) => (
                                    <Badge
                                        key={tag}
                                        variant="secondary"
                                        className="cursor-pointer hover:bg-red-100"
                                        onClick={() => handleRemoveTag(tag)}
                                    >
                                        {tag} ×
                                    </Badge>
                                ))}
                            </div>
                            <Input
                                placeholder="Ajouter un tag (Entrée pour valider)"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={handleAddTag}
                                disabled={isLoading}
                            />
                        </div>

                        {/* Notes */}
                        <div className="space-y-2">
                            <FormLabel className="flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                Notes
                            </FormLabel>

                            {/* Existing Notes Display */}
                            {existingNotes.length > 0 && (
                                <div className="space-y-2 mb-2 max-h-40 overflow-y-auto bg-gray-50 p-2 rounded border">
                                    {existingNotes.map((note: any, i: number) => (
                                        <div key={i} className="text-xs border-b border-gray-100 last:border-0 pb-1 mb-1">
                                            <div className="flex justify-between text-gray-400">
                                                <span>{note.authorName || 'Agent'}</span>
                                                <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-gray-700">{note.content}</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <FormField
                                control={form.control}
                                name="notes"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <Textarea
                                                placeholder={mode === 'create' ? "Notes sur le contact..." : "Ajouter une nouvelle note..."}
                                                className="min-h-[100px]"
                                                disabled={isLoading}
                                                {...field}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </div>

                    </CardContent>

                    <CardFooter className="flex justify-end border-t pt-6 px-0 mt-6">
                        <ButtonGroup>
                            {onCancel && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={onCancel}
                                    disabled={isLoading}
                                >
                                    Annuler
                                </Button>
                            )}
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="min-w-[120px]"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {mode === 'create' ? 'Création...' : 'Enregistrement...'}
                                    </>
                                ) : (
                                    mode === 'create' ? 'Créer le contact' : 'Enregistrer'
                                )}
                            </Button>
                        </ButtonGroup>
                    </CardFooter>
                </Card>
            </form>
        </Form>
    );
}

export default ContactForm;
