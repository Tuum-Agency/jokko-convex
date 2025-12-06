'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, ArrowRight, Globe, CheckIcon, XIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

import {
    businessInfoSchema,
    type BusinessInfoData,
    BUSINESS_SECTORS,
    TIMEZONES,
    LANGUAGES,
} from '@/lib/onboarding/steps';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

interface BusinessInfoStepProps {
    onComplete: () => void;
}

export function BusinessInfoStep({ onComplete }: BusinessInfoStepProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const form = useForm<BusinessInfoData>({
        resolver: zodResolver(businessInfoSchema),
        defaultValues: {
            businessName: '',
            slug: '',
            businessWebsite: '',
            businessPhone: '',
            timezone: 'UTC',
            locale: 'fr',
        },
    });

    const createOrg = useMutation(api.organizations.create);

    // Slug check logic
    const slug = form.watch('slug');
    const checkSlug = useQuery(api.organizations.checkSlug, slug && slug.length >= 3 ? { slug } : "skip");
    const [slugStatus, setSlugStatus] = useState<'checking' | 'available' | 'taken' | null>(null);

    useEffect(() => {
        if (!slug || slug.length < 3) {
            setSlugStatus(null);
            return;
        }

        if (checkSlug === undefined) {
            setSlugStatus('checking');
            return;
        }

        const timer = setTimeout(() => {
            setSlugStatus(checkSlug ? 'available' : 'taken');
        }, 300);

        return () => clearTimeout(timer);
    }, [slug, checkSlug]);

    async function onSubmit(values: BusinessInfoData) {
        setIsLoading(true);
        setError(null);

        if (slugStatus === 'taken') {
            setError("Le slug choisi est déjà pris. Veuillez en choisir un autre.");
            setIsLoading(false);
            return;
        }

        try {
            await createOrg({
                name: values.businessName,
                slug: values.slug,
                businessSector: values.businessSector,
                website: values.businessWebsite || undefined,
                phone: values.businessPhone || undefined,
                timezone: values.timezone,
                locale: values.locale,
            });

            onComplete();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur inconnue');
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Business Name */}
                <FormField
                    control={form.control}
                    name="businessName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nom de l&apos;entreprise *</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="Ma Super Entreprise"
                                    disabled={isLoading}
                                    {...field}
                                    onChange={(e) => {
                                        field.onChange(e);
                                        // Auto-generate slug if not manually edited
                                        const slug = e.target.value
                                            .toLowerCase()
                                            .replace(/\s+/g, '-')
                                            .replace(/[^a-z0-9-]/g, '');
                                        form.setValue('slug', slug);
                                    }}
                                />
                            </FormControl>
                            <FormDescription>
                                Le nom qui sera affiché dans vos messages WhatsApp
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Slug (subdomain) */}
                <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Identifiant unique (slug) *</FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <Input
                                        placeholder="mon-entreprise"
                                        disabled={isLoading}
                                        className="pr-10"
                                        {...field}
                                        onChange={(e) => {
                                            const value = e.target.value
                                                .toLowerCase()
                                                .replace(/\s+/g, '-')
                                                .replace(/[^a-z0-9-]/g, '');
                                            field.onChange(value);
                                        }}
                                    />
                                    <Globe className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                </div>
                            </FormControl>
                            {field.value && (
                                <div className={`flex items-center gap-2 mt-2 p-2 rounded-md border text-xs
                                    ${slugStatus === 'available' ? 'bg-green-50 border-green-100 text-green-700' : ''}
                                    ${slugStatus === 'taken' ? 'bg-red-50 border-red-100 text-red-700' : ''}
                                    ${slugStatus === 'checking' ? 'bg-gray-50 border-gray-100 text-gray-500' : ''}
                                `}>
                                    {slugStatus === 'checking' && <Loader2 className="h-3 w-3 animate-spin" />}
                                    {slugStatus === 'available' && <CheckIcon className="h-3 w-3" />}
                                    {slugStatus === 'taken' && <XIcon className="h-3 w-3" />}

                                    <span className="font-medium">
                                        {field.value}.jokko.com
                                    </span>

                                    <span className="ml-auto">
                                        {slugStatus === 'checking' && 'Vérification...'}
                                        {slugStatus === 'available' && 'Disponible'}
                                        {slugStatus === 'taken' && 'Déjà pris'}
                                    </span>
                                </div>
                            )}
                            <FormDescription>
                                Votre URL d&apos;accès au dashboard.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Business Sector */}
                <FormField
                    control={form.control}
                    name="businessSector"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Secteur d&apos;activité *</FormLabel>
                            <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                disabled={isLoading}
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Sélectionnez votre secteur" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {BUSINESS_SECTORS.map((sector) => (
                                        <SelectItem key={sector.value} value={sector.value}>
                                            <div className="flex items-center gap-2">
                                                <sector.icon className="h-4 w-4 text-muted-foreground" />
                                                <span>{sector.label}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Website */}
                <FormField
                    control={form.control}
                    name="businessWebsite"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Site web (optionnel)</FormLabel>
                            <FormControl>
                                <Input
                                    type="url"
                                    placeholder="https://www.example.com"
                                    disabled={isLoading}
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Phone */}
                <FormField
                    control={form.control}
                    name="businessPhone"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Téléphone (optionnel)</FormLabel>
                            <FormControl>
                                <Input
                                    type="tel"
                                    placeholder="+221 77 123 45 67"
                                    disabled={isLoading}
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Timezone & Locale row */}
                <div className="grid gap-4 sm:grid-cols-2">
                    {/* Timezone */}
                    <FormField
                        control={form.control}
                        name="timezone"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Fuseau horaire</FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    disabled={isLoading}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Sélectionnez" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {TIMEZONES.map((tz) => (
                                            <SelectItem key={tz.value} value={tz.value}>
                                                {tz.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Locale */}
                    <FormField
                        control={form.control}
                        name="locale"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Langue</FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    disabled={isLoading}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Sélectionnez" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {LANGUAGES.map((lang) => (
                                            <SelectItem key={lang.value} value={lang.value}>
                                                {lang.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* Error */}
                {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</p>}

                {/* Submit */}
                <Button
                    type="submit"
                    size="lg"
                    disabled={isLoading}
                    className="w-full h-12 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-xl shadow-lg shadow-green-600/25 hover:shadow-green-600/40 transition-all duration-300 group"
                >
                    {isLoading ? (
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                        <>
                            Continuer
                            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </Button>
            </form>
        </Form>
    );
}
