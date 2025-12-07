
'use client'

import React from 'react';
import { TemplateType, TemplateTypeConfig, TEMPLATE_TYPE_CONFIGS, SUPPORTED_LANGUAGES } from '@/convex/lib/templateTypes';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { ButtonGroup } from '../ui/button-group';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Loader2 } from 'lucide-react';
import { TemplatePreview } from './previews/TemplatePreview';
import { TemplateButtonsBuilder } from './builders/TemplateButtonsBuilder';
import { TemplateListBuilder } from './builders/TemplateListBuilder';
import { TemplateCarouselBuilder } from './builders/TemplateCarouselBuilder';
import { useTemplateBuilder } from '@/hooks/useTemplateBuilder';

interface TemplateBuilderProps {
    type: TemplateType;
    initialData?: any;
    onSuccess: () => void;
    onCancel: () => void;
}

export const TemplateBuilder: React.FC<TemplateBuilderProps> = ({
    type,
    initialData,
    onSuccess,
    onCancel
}) => {
    const config = TEMPLATE_TYPE_CONFIGS[type];
    const { formData, loading, isPublishing, handleChange, submit, publish } = useTemplateBuilder({
        type,
        initialData,
        onSuccess,
        config
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await submit();
    };

    return (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Configuration - {config.labelFr}</CardTitle>
                        <CardDescription>
                            {config.descriptionFr}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* General Info */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2 md:col-span-1 space-y-2">
                                <Label htmlFor="name">Nom du template</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={e => handleChange('name', e.target.value)}
                                    placeholder="ex: welcome_message"
                                    required
                                    maxLength={512}
                                />
                                <p className="text-xs text-muted-foreground">Uniquement minuscules, chiffres et underscores.</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="language">Langue</Label>
                                <Select value={formData.language} onValueChange={v => handleChange('language', v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Choisir une langue" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {SUPPORTED_LANGUAGES.map(lang => (
                                            <SelectItem key={lang.code} value={lang.code}>
                                                {lang.native} ({lang.name})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="category">Catégorie</Label>
                                <Select value={formData.category} onValueChange={v => handleChange('category', v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Choisir une catégorie" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {config.categories.map(cat => (
                                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* CAROUSEL Specific Logic: Replaces standard Body/Header in some flows, but usually has intro body */}

                        {/* Header */}
                        {config.features.hasHeader && type !== 'CAROUSEL' && (
                            <div className="space-y-2 border-t pt-4">
                                <Label>En-tête (Header)</Label>
                                <Select
                                    value={formData.header?.type || 'NONE'}
                                    onValueChange={v => handleChange('header', { ...formData.header, type: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {config.features.headerTypes.map(t => (
                                            <SelectItem key={t} value={t}>{t}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {formData.header?.type === 'TEXT' && (
                                    <Input
                                        value={formData.header?.text || ''}
                                        onChange={e => handleChange('header', { ...formData.header, text: e.target.value })}
                                        placeholder="Texte de l'en-tête"
                                        maxLength={60}
                                    />
                                )}

                                {['IMAGE', 'VIDEO', 'DOCUMENT'].includes(formData.header?.type || '') && (
                                    <div className="space-y-1">
                                        <div className="flex justify-between items-center">
                                            <Label className="text-xs text-muted-foreground">URL du média</Label>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="h-5 px-2 text-[10px] text-blue-600 hover:text-blue-700"
                                                onClick={() => handleChange('header', { ...formData.header, url: (formData.header?.url || '') + '{{1}}' })}
                                            >
                                                + Variable
                                            </Button>
                                        </div>
                                        <Input
                                            value={formData.header?.url || ''}
                                            onChange={e => handleChange('header', { ...formData.header, url: e.target.value })}
                                            placeholder="https://example.com/image-{{1}}.jpg"
                                        />
                                        <p className="text-[10px] text-muted-foreground">
                                            Utilisez des variables (ex: {"{{1}}"}) pour rendre l'URL dynamique.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Body */}
                        {config.features.hasBody && (
                            <div className="space-y-2 border-t pt-4">
                                <div className="flex justify-between items-center">
                                    <Label htmlFor="body">Message principal (Body)</Label>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-5 px-2 text-[10px] text-blue-600 hover:text-blue-700"
                                        onClick={() => {
                                            const currentBody = formData.body || '';
                                            const match = currentBody.match(/\{\{(\d+)\}\}/g);
                                            const nextVar = match ? match.length + 1 : 1;
                                            handleChange('body', currentBody + ` {{${nextVar}}} `);
                                        }}
                                    >
                                        + Variable
                                    </Button>
                                </div>
                                <Textarea
                                    id="body"
                                    value={formData.body}
                                    onChange={e => handleChange('body', e.target.value)}
                                    placeholder="Votre message ici... Utilisez {{1}}, {{2}} pour les variables."
                                    className="h-32"
                                    required={config.features.bodyRequired}
                                />
                            </div>
                        )}

                        {/* Footer */}
                        {config.features.hasFooter && type !== 'CAROUSEL' && (
                            <div className="space-y-2 border-t pt-4">
                                <Label htmlFor="footer">Pied de page (Footer)</Label>
                                <Input
                                    id="footer"
                                    value={formData.footer}
                                    onChange={e => handleChange('footer', e.target.value)}
                                    placeholder="Texte gris en bas du message"
                                    maxLength={60}
                                />
                            </div>
                        )}

                        {/* LIST Specific Builder */}
                        {type === 'LIST' && (
                            <div className="space-y-4 border-t pt-4">
                                <div className="space-y-2">
                                    <Label>Bouton du menu</Label>
                                    <Input
                                        value={formData.buttons?.[0]?.text || ''}
                                        onChange={e => {
                                            const newButtons = [...(formData.buttons || [])];
                                            if (!newButtons[0]) newButtons[0] = { type: 'QUICK_REPLY', text: '' };
                                            newButtons[0].text = e.target.value;
                                            handleChange('buttons', newButtons);
                                        }}
                                        placeholder="Ex: Afficher le menu"
                                        maxLength={20}
                                    />
                                </div>
                                <TemplateListBuilder
                                    sections={formData.sections || []}
                                    onChange={sections => handleChange('sections', sections)}
                                />
                            </div>
                        )}

                        {/* CAROUSEL Specific Builder */}
                        {type === 'CAROUSEL' && (
                            <div className="space-y-4 border-t pt-4">
                                <Label className="text-base font-semibold">Cartes du Carrousel</Label>
                                <TemplateCarouselBuilder
                                    cards={formData.cards || []}
                                    onChange={cards => handleChange('cards', cards)}
                                />
                            </div>
                        )}

                        {/* Standard Buttons (excluding List/Carousel which handle their own) */}
                        {config.features.hasButtons && type !== 'LIST' && type !== 'CAROUSEL' && (
                            <div className="space-y-2 border-t pt-4">
                                <TemplateButtonsBuilder
                                    buttons={formData.buttons || []}
                                    onChange={btns => handleChange('buttons', btns)}
                                    allowedTypes={config.features.buttonTypes}
                                    maxButtons={config.features.maxButtons}
                                />
                            </div>
                        )}

                    </CardContent>
                </Card>

                <div className="flex justify-end gap-2">
                    {initialData && (
                        <Button
                            type="button"
                            variant="default" /* Or a specific WhatsApp brand color */
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={async () => {
                                await publish();
                            }}
                            disabled={loading || isPublishing}
                        >
                            {isPublishing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : '🚀 '}
                            Envoyer à WhatsApp
                        </Button>
                    )}
                    <ButtonGroup>
                        <Button type="button" variant="outline" onClick={onCancel} disabled={loading || isPublishing}>Annuler</Button>
                        <Button type="submit" disabled={loading || isPublishing}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {initialData ? 'Enregistrer (Brouillon)' : 'Créer le brouillon'}
                        </Button>
                    </ButtonGroup>
                </div>
            </div>

            {/* Preview Column */}
            <div className="lg:col-span-5">
                <div className="sticky top-6">
                    <div className="mb-4">
                        <Label className="text-muted-foreground">Aperçu</Label>
                    </div>
                    <TemplatePreview
                        data={{
                            header: formData.header,
                            body: formData.body,
                            footer: formData.footer,
                            buttons: formData.buttons,
                            sections: formData.sections,
                            cards: formData.cards,
                        }}
                        config={config}
                    />
                </div>
            </div>
        </form>
    );
};
