'use client'

import React, { useState } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Loader2, Plus, Phone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Id } from '@/convex/_generated/dataModel';
import { Badge } from '@/components/ui/badge';
import { useChannels } from '@/hooks/useChannels';
import { Switch } from '@/components/ui/switch';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export default function NewBroadcastPage() {
    const router = useRouter();
    const createBroadcast = useMutation(api.broadcasts.create);
    const templates = useQuery(api.templates.queries.listAll);
    const tagsData = useQuery(api.tags.list);
    const tags = tagsData?.tags || [];
    const availableCountries = useQuery(api.contacts.getAvailableCountryCodes) || [];

    const { channels } = useChannels();
    const hasMultipleChannels = channels.length > 1;

    const [name, setName] = useState('');
    const [templateId, setTemplateId] = useState<string>('');
    const [channelId, setChannelId] = useState<string>('');
    const [audienceType, setAudienceType] = useState<'ALL' | 'TAGS' | 'COUNTRIES'>('ALL');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const [isScheduled, setIsScheduled] = useState(false);
    const [date, setDate] = useState<Date>();
    const [time, setTime] = useState<string>("09:00");

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
                whatsappChannelId: channelId ? channelId as Id<"whatsappChannels"> : undefined,
                audienceConfig: {
                    type: audienceType,
                    countries: audienceType === 'COUNTRIES' ? selectedCountries : undefined
                },
                scheduledAt: isScheduled && date ? (() => {
                    const [hours, minutes] = time.split(':').map(Number);
                    const scheduledDate = new Date(date);
                    scheduledDate.setHours(hours, minutes, 0, 0);
                    return scheduledDate.getTime();
                })() : undefined
            });
            router.push(`/dashboard/campagnes/${id}`);
        } catch (error) {
            console.error("Failed to create broadcast", error);
        } finally {
            setIsLoading(false);
        }
    };

    const hasTemplates = templates && templates.length > 0;

    return (
        <div className="space-y-6 p-4 sm:p-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.back()}
                    className="h-9 w-9 text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer"
                >
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                        Nouvelle Campagne
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Configurez votre diffusion de messages en masse
                    </p>
                </div>
            </div>

            <Card className="bg-white border-gray-100 shadow-sm">
                <CardHeader className="pb-4">
                    <CardTitle className="text-sm sm:text-base font-semibold text-gray-900">Configuration</CardTitle>
                    <CardDescription className="text-[11px] text-gray-400">
                        Définissez les paramètres de votre campagne
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Campaign Name */}
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-sm font-medium text-gray-700">Nom de la campagne</Label>
                            <Input
                                id="name"
                                placeholder="ex: Newsletter Juin 2025"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="h-10 border-gray-200 focus:border-green-500 focus:ring-green-500/20"
                            />
                        </div>

                        {/* Audience */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-700">Audience</Label>
                                <Select value={audienceType} onValueChange={(v) => setAudienceType(v as 'ALL' | 'TAGS' | 'COUNTRIES')}>
                                    <SelectTrigger className="h-10 border-gray-200">
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
                                <div className="space-y-2 rounded-lg border border-gray-100 p-4 bg-gray-50/50">
                                    <Label className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">Sélectionnez les tags à cibler</Label>
                                    {tags.length > 0 ? (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {tags.map(tag => {
                                                const isSelected = selectedTags.includes(tag._id);
                                                return (
                                                    <Badge
                                                        key={tag._id}
                                                        variant="outline"
                                                        className={cn(
                                                            "cursor-pointer transition-all select-none text-xs",
                                                            isSelected
                                                                ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                                                                : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                                                        )}
                                                        onClick={() => toggleTag(tag._id)}
                                                    >
                                                        {tag.name}
                                                    </Badge>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-400">Aucun tag disponible. Créez des tags dans la section Contacts.</p>
                                    )}
                                    {selectedTags.length > 0 && (
                                        <p className="text-[11px] text-gray-400 mt-2">
                                            {selectedTags.length} tag(s) sélectionné(s)
                                        </p>
                                    )}
                                </div>
                            )}

                            {audienceType === 'COUNTRIES' && (
                                <div className="space-y-2 rounded-lg border border-gray-100 p-4 bg-gray-50/50">
                                    <Label className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">Sélectionnez les pays à cibler</Label>
                                    {availableCountries.length > 0 ? (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {availableCountries.map(country => {
                                                const isSelected = selectedCountries.includes(country);
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
                                                        variant="outline"
                                                        className={cn(
                                                            "cursor-pointer transition-all select-none text-xs",
                                                            isSelected
                                                                ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                                                                : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                                                        )}
                                                        onClick={() => toggleCountry(country)}
                                                    >
                                                        {label}
                                                    </Badge>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-400">Aucun indicatif de pays détecté.</p>
                                    )}
                                    {selectedCountries.length > 0 && (
                                        <p className="text-[11px] text-gray-400 mt-2">
                                            {selectedCountries.length} pays sélectionné(s)
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Channel selector */}
                        {hasMultipleChannels && (
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-700">Canal d&apos;envoi</Label>
                                <Select value={channelId} onValueChange={setChannelId}>
                                    <SelectTrigger className="h-10 border-gray-200">
                                        <Phone className="h-4 w-4 mr-2 text-green-600" />
                                        <SelectValue placeholder="Canal par défaut" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {channels
                                            .filter((ch: any) => ch.status === 'active')
                                            .map((ch: any) => (
                                                <SelectItem key={ch._id} value={ch._id}>
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-2 w-2 rounded-full bg-green-500" />
                                                        {ch.label} — {ch.displayPhoneNumber}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-[11px] text-gray-400">
                                    Choisissez depuis quel numéro WhatsApp envoyer la campagne.
                                </p>
                            </div>
                        )}

                        {/* Template */}
                        <div className="space-y-2">
                            <Label htmlFor="template" className="text-sm font-medium text-gray-700">Template WhatsApp</Label>
                            <div className="flex gap-3 items-start">
                                <div className="flex-1">
                                    <Select value={templateId} onValueChange={setTemplateId} required disabled={!hasTemplates}>
                                        <SelectTrigger className="h-10 border-gray-200">
                                            <SelectValue placeholder={hasTemplates ? "Choisir un modèle..." : "Aucun modèle disponible"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {hasTemplates ? templates?.map((t) => (
                                                <SelectItem key={t._id} value={t._id}>
                                                    {t.name} <span className="text-gray-400 text-xs ml-2">({t.language})</span>
                                                </SelectItem>
                                            )) : (
                                                <div className="p-2 text-sm text-gray-400">Aucun template approuvé</div>
                                            )}
                                        </SelectContent>
                                    </Select>
                                    {!hasTemplates && templates !== undefined && (
                                        <p className="text-red-500 text-[11px] mt-1.5">
                                            Vous n&apos;avez aucun template approuvé pour le moment.
                                        </p>
                                    )}
                                    <p className="text-[11px] text-gray-400 mt-1.5">
                                        Seuls les templates approuvés apparaissent ici.
                                    </p>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => router.push('/dashboard/modeles')}
                                    className="h-10 gap-1.5 text-xs rounded-full cursor-pointer shrink-0"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    <span className="hidden sm:inline">Créer un modèle</span>
                                </Button>
                            </div>
                        </div>

                        {/* Scheduling */}
                        <div className="space-y-4 rounded-lg border border-gray-100 p-4 bg-gray-50/50">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-sm font-medium text-gray-700">Programmer l&apos;envoi</Label>
                                    <p className="text-[11px] text-gray-400">Activez pour planifier l&apos;envoi à une date ultérieure.</p>
                                </div>
                                <Switch
                                    checked={isScheduled}
                                    onCheckedChange={setIsScheduled}
                                />
                            </div>

                            {isScheduled && (
                                <div className="flex gap-4 items-end animate-in fade-in slide-in-from-top-2">
                                    <div className="flex-1 space-y-2">
                                        <Label className="text-sm font-medium text-gray-700">Date</Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    className={cn(
                                                        "w-full justify-start text-left font-normal h-10 border-gray-200",
                                                        !date && "text-gray-400"
                                                    )}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {date ? format(date, "PPP", { locale: fr }) : <span>Choisir une date</span>}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <Calendar
                                                    mode="single"
                                                    selected={date}
                                                    onSelect={setDate}
                                                    initialFocus
                                                    disabled={(date: Date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                    <div className="w-full sm:w-[120px] space-y-2">
                                        <Label className="text-sm font-medium text-gray-700">Heure</Label>
                                        <Input
                                            type="time"
                                            value={time}
                                            onChange={(e) => setTime(e.target.value)}
                                            className="h-10 border-gray-200"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="pt-4 flex items-center justify-end gap-2 border-t border-gray-100">
                            <Button type="button" variant="outline" size="sm" onClick={() => router.back()} className="h-8 gap-1.5 text-xs rounded-full cursor-pointer">
                                Annuler
                            </Button>
                            <Button
                                type="submit"
                                size="sm"
                                disabled={isLoading || !hasTemplates}
                                className="h-8 gap-1.5 text-xs rounded-full cursor-pointer"
                            >
                                {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                Lancer la campagne
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
