'use client'

import React, { useState } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Loader2, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Id } from '@/convex/_generated/dataModel';
import { Badge } from '@/components/ui/badge';
import { ButtonGroup } from '@/components/ui/button-group';

export default function NewBroadcastPage() {
    const router = useRouter();
    const createBroadcast = useMutation(api.broadcasts.create);
    const templates = useQuery(api.templates.queries.listAll); // Using listAll for dropdown
    const tagsData = useQuery(api.tags.list);
    const tags = tagsData?.tags || [];
    const availableCountries = useQuery(api.contacts.getAvailableCountryCodes) || [];

    const [name, setName] = useState('');
    const [templateId, setTemplateId] = useState<string>('');
    const [audienceType, setAudienceType] = useState<'ALL' | 'TAGS' | 'COUNTRIES'>('ALL');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const toggleTag = (tagId: string) => {
        setSelectedTags(prev =>
            prev.includes(tagId)
                ? prev.filter(id => id !== tagId)
                : [...prev, tagId]
        );
    };

    const toggleCountry = (country: string) => {
        setSelectedCountries(prev =>
            prev.includes(country)
                ? prev.filter(c => c !== country)
                : [...prev, country]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !templateId) return;

        setIsLoading(true);
        try {
            const id = await createBroadcast({
                name,
                templateId: templateId as Id<"templates">,
                audienceConfig: {
                    type: audienceType,
                    tags: audienceType === 'TAGS' ? selectedTags as Id<"tags">[] : undefined,
                    countries: audienceType === 'COUNTRIES' ? selectedCountries : undefined
                }
            });
            router.push(`/dashboard/broadcasts/${id}`);
        } catch (error) {
            console.error("Failed to create broadcast", error);
        } finally {
            setIsLoading(false);
        }
    };

    const hasTemplates = templates && templates.length > 0;

    return (
        <div className="w-full h-full p-6 space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-9 w-9">
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Nouvelle Campagne</h1>
                    <p className="text-sm text-muted-foreground">Configurez votre diffusion de messages en masse.</p>
                </div>
            </div>

            <Card className="border-border/50 shadow-sm w-full">
                <CardHeader className="pb-4">
                    <CardTitle className="text-lg">Configuration</CardTitle>
                    <CardDescription>
                        Définissez les paramètres de votre campagne.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nom de la campagne</Label>
                            <Input
                                id="name"
                                placeholder="ex: Newsletter Juin 2025"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Audience</Label>
                                <Select value={audienceType} onValueChange={(v) => setAudienceType(v as 'ALL' | 'TAGS')}>
                                    <SelectTrigger className="h-10">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">Tous les contacts</SelectItem>
                                        <SelectItem value="TAGS">Filtrer par tags</SelectItem>
                                        <SelectItem value="COUNTRIES">Filtrer par pays</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {audienceType === 'TAGS' && (
                                <div className="space-y-2 border rounded-md p-4 bg-muted/20">
                                    <Label className="text-sm text-muted-foreground mb-2 block">Sélectionnez les tags à cibler :</Label>
                                    {tags.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {tags.map(tag => {
                                                const isSelected = selectedTags.includes(tag._id);
                                                return (
                                                    <Badge
                                                        key={tag._id}
                                                        variant={isSelected ? "default" : "outline"}
                                                        className="cursor-pointer hover:opacity-80 transition-opacity select-none"
                                                        onClick={() => toggleTag(tag._id)}
                                                    >
                                                        {tag.name}
                                                    </Badge>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">Aucun tag disponible. Créez des tags dans la section Contacts.</p>
                                    )}
                                    {selectedTags.length > 0 && (
                                        <p className="text-xs text-muted-foreground mt-2">
                                            {selectedTags.length} tag(s) sélectionné(s)
                                        </p>
                                    )}
                                </div>
                            )}

                            {audienceType === 'COUNTRIES' && (
                                <div className="space-y-2 border rounded-md p-4 bg-muted/20">
                                    <Label className="text-sm text-muted-foreground mb-2 block">Sélectionnez les pays à cibler (indicatifs trouvés) :</Label>
                                    {availableCountries.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {availableCountries.map(country => {
                                                const isSelected = selectedCountries.includes(country);
                                                // Map standard prefixes to names roughly for UI
                                                let label = country;
                                                if (country === '+221') label = "🇸🇳 Sénégal (+221)";
                                                else if (country === '+33') label = "🇫🇷 France (+33)";
                                                else if (country === '+1') label = "🇺🇸/🇨🇦 USA/Canada (+1)";
                                                else if (country === '+44') label = "🇬🇧 UK (+44)";
                                                else if (country === '+212') label = "🇲🇦 Maroc (+212)";
                                                else if (country === '+225') label = "🇨🇮 Côte d'Ivoire (+225)";
                                                else if (country === '+223') label = "🇲🇱 Mali (+223)";
                                                else if (country === '+224') label = "🇬🇳 Guinée (+224)";
                                                else if (country === '+241') label = "🇬🇦 Gabon (+241)";
                                                else if (country === '+237') label = "🇨🇲 Cameroun (+237)";

                                                return (
                                                    <Badge
                                                        key={country}
                                                        variant={isSelected ? "default" : "outline"}
                                                        className="cursor-pointer hover:opacity-80 transition-opacity select-none"
                                                        onClick={() => toggleCountry(country)}
                                                    >
                                                        {label}
                                                    </Badge>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">Aucun indicatif de pays détecté.</p>
                                    )}
                                    {selectedCountries.length > 0 && (
                                        <p className="text-xs text-muted-foreground mt-2">
                                            {selectedCountries.length} pays sélectionné(s)
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="template">Template WhatsApp</Label>
                            <div className="flex gap-3 items-start">
                                <div className="flex-1">
                                    <Select value={templateId} onValueChange={setTemplateId} required disabled={!hasTemplates}>
                                        <SelectTrigger className="h-10">
                                            <SelectValue placeholder={hasTemplates ? "Choisir un modèle..." : "Aucun modèle disponible"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {hasTemplates ? templates?.map((t) => (
                                                <SelectItem key={t._id} value={t._id}>
                                                    {t.name} <span className="text-muted-foreground text-xs ml-2">({t.language})</span>
                                                </SelectItem>
                                            )) : (
                                                <div className="p-2 text-sm text-muted-foreground">Aucun template approuvé</div>
                                            )}
                                        </SelectContent>
                                    </Select>
                                    {!hasTemplates && templates !== undefined && (
                                        <p className="text-destructive text-xs mt-1.5 flex items-center gap-1">
                                            ⚠️ Vous n'avez aucun template approuvé pour le moment.
                                        </p>
                                    )}
                                    <p className="text-xs text-muted-foreground mt-1.5">
                                        Seuls les templates approuvés apparaissent ici.
                                    </p>
                                </div>
                                <Button type="button" variant="outline" onClick={() => router.push('/dashboard/templates')} className="h-10 pTempsx-4">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Créer un modèle
                                </Button>
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end">
                            <ButtonGroup>
                                <Button type="button" variant="outline" onClick={() => router.back()}>
                                    Annuler
                                </Button>
                                <Button type="submit" disabled={isLoading || !hasTemplates} className="min-w-[150px]">
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Lancer la campagne
                                </Button>
                            </ButtonGroup>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
