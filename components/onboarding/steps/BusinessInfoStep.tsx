'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, ArrowRight, Globe, CheckIcon, XIcon, AlertCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { cn } from '@/lib/utils';

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

    const inputClass = "h-11 rounded-xl border-gray-200 bg-gray-50 focus-visible:bg-white focus-visible:border-green-500 focus-visible:ring-green-500/20 transition-colors";
    const selectTriggerClass = "h-11 rounded-xl border-gray-200 bg-gray-50 data-[state=open]:bg-white hover:bg-white focus:bg-white focus:border-green-500 focus:ring-green-500/20 transition-colors";

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                    control={form.control}
                    name="businessName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-sm font-medium text-gray-700">
                                Nom de l&apos;entreprise <span className="text-green-600">*</span>
                            </FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="Ma Super Entreprise"
                                    disabled={isLoading}
                                    className={inputClass}
                                    {...field}
                                    onChange={(e) => {
                                        field.onChange(e);
                                        const slug = e.target.value
                                            .toLowerCase()
                                            .replace(/\s+/g, '-')
                                            .replace(/[^a-z0-9-]/g, '');
                                        form.setValue('slug', slug);
                                    }}
                                />
                            </FormControl>
                            <FormDescription className="text-xs text-gray-500">
                                Le nom qui sera affiché dans vos messages WhatsApp
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-sm font-medium text-gray-700">
                                Identifiant unique (slug) <span className="text-green-600">*</span>
                            </FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <Input
                                        placeholder="mon-entreprise"
                                        disabled={isLoading}
                                        className={cn(inputClass, 'pr-10')}
                                        {...field}
                                        onChange={(e) => {
                                            const value = e.target.value
                                                .toLowerCase()
                                                .replace(/\s+/g, '-')
                                                .replace(/[^a-z0-9-]/g, '');
                                            field.onChange(value);
                                        }}
                                    />
                                    <Globe className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                </div>
                            </FormControl>
                            {field.value && (
                                <div className={cn(
                                    'flex items-center gap-2 mt-2 px-3 py-2 rounded-lg border text-xs transition-colors',
                                    slugStatus === 'available' && 'bg-green-50 border-green-200 text-green-700',
                                    slugStatus === 'taken' && 'bg-red-50 border-red-200 text-red-700',
                                    slugStatus === 'checking' && 'bg-gray-50 border-gray-200 text-gray-500',
                                )}>
                                    {slugStatus === 'checking' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                    {slugStatus === 'available' && <CheckIcon className="h-3.5 w-3.5" strokeWidth={2.5} />}
                                    {slugStatus === 'taken' && <XIcon className="h-3.5 w-3.5" strokeWidth={2.5} />}

                                    <span className="font-medium">
                                        {field.value}.jokko.com
                                    </span>

                                    <span className="ml-auto font-medium">
                                        {slugStatus === 'checking' && 'Vérification...'}
                                        {slugStatus === 'available' && 'Disponible'}
                                        {slugStatus === 'taken' && 'Déjà pris'}
                                    </span>
                                </div>
                            )}
                            <FormDescription className="text-xs text-gray-500">
                                Votre URL d&apos;accès au dashboard.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="businessSector"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-sm font-medium text-gray-700">
                                Secteur d&apos;activité <span className="text-green-600">*</span>
                            </FormLabel>
                            <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                disabled={isLoading}
                            >
                                <FormControl>
                                    <SelectTrigger className={selectTriggerClass}>
                                        <SelectValue placeholder="Sélectionnez votre secteur" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {BUSINESS_SECTORS.map((sector) => (
                                        <SelectItem key={sector.value} value={sector.value}>
                                            <div className="flex items-center gap-2">
                                                <sector.icon className="h-4 w-4 text-gray-500" />
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

                <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="businessWebsite"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-sm font-medium text-gray-700">
                                    Site web
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        type="url"
                                        placeholder="https://www.example.com"
                                        disabled={isLoading}
                                        className={inputClass}
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="businessPhone"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-sm font-medium text-gray-700">
                                    Téléphone
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        type="tel"
                                        placeholder="+221 77 123 45 67"
                                        disabled={isLoading}
                                        className={inputClass}
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="timezone"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-sm font-medium text-gray-700">
                                    Fuseau horaire
                                </FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    disabled={isLoading}
                                >
                                    <FormControl>
                                        <SelectTrigger className={selectTriggerClass}>
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

                    <FormField
                        control={form.control}
                        name="locale"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-sm font-medium text-gray-700">
                                    Langue
                                </FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    disabled={isLoading}
                                >
                                    <FormControl>
                                        <SelectTrigger className={selectTriggerClass}>
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

                {error && (
                    <Alert variant="destructive" className="border-red-200 bg-red-50">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-red-700">{error}</AlertDescription>
                    </Alert>
                )}

                <Button
                    type="submit"
                    size="lg"
                    disabled={isLoading || slugStatus === 'taken' || slugStatus === 'checking'}
                    className="w-full h-12 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-xl shadow-sm hover:shadow-md transition-all group"
                >
                    {isLoading ? (
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                        <>
                            Continuer
                            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-0.5 transition-transform" />
                        </>
                    )}
                </Button>
            </form>
        </Form>
    );
}
