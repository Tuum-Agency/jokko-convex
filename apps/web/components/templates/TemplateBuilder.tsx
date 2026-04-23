'use client'

import React from 'react';
import { TemplateType, TEMPLATE_TYPE_CONFIGS, SUPPORTED_LANGUAGES } from '@/convex/lib/templateTypes';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { ButtonGroup } from '../ui/button-group';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Loader2, Info, AlertTriangle, XCircle } from 'lucide-react';
import { TemplatePreview } from './previews/TemplatePreview';
import { TemplateButtonsBuilder } from './builders/TemplateButtonsBuilder';
import { TemplateListBuilder } from './builders/TemplateListBuilder';
import { TemplateCarouselBuilder } from './builders/TemplateCarouselBuilder';
import { useTemplateBuilder } from '@/hooks/useTemplateBuilder';
import { cn } from '@/lib/utils';

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
    const { formData, loading, isPublishing, handleChange, submit, publish, validationResult } = useTemplateBuilder({
        type,
        initialData,
        onSuccess,
        config
    });

    const isReadOnly = ['PENDING', 'APPROVED'].includes(initialData?.status);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await submit();
    };

    return (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 space-y-4">
                {/* Status Banner */}
                {isReadOnly && (
                    <Card className="bg-blue-50 border-blue-200 shadow-sm">
                        <CardContent className="p-4 flex items-start gap-3">
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                                <Info className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-blue-900">
                                    {initialData?.status === 'APPROVED' ? "Modele valide" : "En attente de validation"}
                                </p>
                                <p className="text-xs text-blue-700 mt-0.5">
                                    {initialData?.status === 'APPROVED'
                                        ? "Ce modele est valide et ne peut plus etre modifie."
                                        : "Ce modele est en attente de validation par WhatsApp. Vous ne pouvez pas le modifier pour le moment."}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Validation Errors */}
                {!isReadOnly && validationResult.errors.length > 0 && (
                    <Card className="bg-red-50 border-red-200 shadow-sm">
                        <CardContent className="p-4 flex items-start gap-3">
                            <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                                <XCircle className="h-4 w-4 text-red-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-red-900">Erreurs bloquantes</p>
                                <ul className="mt-1.5 space-y-1">
                                    {validationResult.errors.map((err, i) => (
                                        <li key={i} className="text-xs text-red-700 flex items-start gap-1.5">
                                            <span className="h-1 w-1 rounded-full bg-red-400 mt-1.5 shrink-0" />
                                            {err}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Validation Warnings */}
                {!isReadOnly && validationResult.warnings.length > 0 && (
                    <Card className="bg-amber-50 border-amber-200 shadow-sm">
                        <CardContent className="p-4 flex items-start gap-3">
                            <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                                <AlertTriangle className="h-4 w-4 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-amber-900">Attention (risque de rejet)</p>
                                <ul className="mt-1.5 space-y-1">
                                    {validationResult.warnings.map((warn, i) => (
                                        <li key={i} className="text-xs text-amber-700 flex items-start gap-1.5">
                                            <span className="h-1 w-1 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                                            {warn}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Main Configuration Card */}
                <Card className="bg-white border-gray-100 shadow-sm">
                    <CardHeader className="pb-2">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#14532d] to-[#059669] flex items-center justify-center shadow-sm">
                                <span className="text-lg">{config.icon}</span>
                            </div>
                            <div>
                                <CardTitle className="text-sm sm:text-base font-semibold text-gray-900">
                                    {config.labelFr}
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    {config.descriptionFr}
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <fieldset disabled={isReadOnly} className="space-y-5">
                            {/* General Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2 md:col-span-1 space-y-2">
                                    <Label htmlFor="name" className="text-xs font-medium text-gray-700">Nom du modele</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={e => handleChange('name', e.target.value)}
                                        placeholder="ex: welcome_message"
                                        required
                                        maxLength={512}
                                        className="h-9"
                                    />
                                    <p className="text-[10px] text-gray-400">Uniquement minuscules, chiffres et underscores.</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="language" className="text-xs font-medium text-gray-700">Langue</Label>
                                    <Select value={formData.language} onValueChange={v => handleChange('language', v)} disabled={isReadOnly}>
                                        <SelectTrigger className="h-9">
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
                                    <Label htmlFor="category" className="text-xs font-medium text-gray-700">Categorie</Label>
                                    <Select value={formData.category} onValueChange={v => handleChange('category', v)} disabled={isReadOnly}>
                                        <SelectTrigger className="h-9">
                                            <SelectValue placeholder="Choisir une categorie" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {config.categories.map(cat => (
                                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Header */}
                            {config.features.hasHeader && type !== 'CAROUSEL' && (
                                <div className="space-y-3 border-t border-gray-100 pt-5">
                                    <Label className="text-xs font-medium text-gray-700">En-tete (Header)</Label>
                                    <Select
                                        value={formData.header?.type || 'NONE'}
                                        onValueChange={v => handleChange('header', { ...formData.header, type: v })}
                                        disabled={isReadOnly}
                                    >
                                        <SelectTrigger className="h-9">
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
                                            placeholder="Texte de l'en-tete"
                                            maxLength={60}
                                            className="h-9"
                                        />
                                    )}

                                    {['IMAGE', 'VIDEO', 'DOCUMENT'].includes(formData.header?.type || '') && (
                                        <div className="space-y-1.5">
                                            <div className="flex justify-between items-center">
                                                <Label className="text-[10px] text-gray-500">URL du media</Label>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-5 px-2 text-[10px] text-green-700 hover:text-green-800 hover:bg-green-50"
                                                    onClick={() => handleChange('header', { ...formData.header, url: (formData.header?.url || '') + '{{1}}' })}
                                                >
                                                    + Variable
                                                </Button>
                                            </div>
                                            <Input
                                                value={formData.header?.url || ''}
                                                onChange={e => handleChange('header', { ...formData.header, url: e.target.value })}
                                                placeholder="https://example.com/image-{{1}}.jpg"
                                                className="h-9"
                                            />
                                            <p className="text-[10px] text-gray-400">
                                                Utilisez des variables (ex: {"{{1}}"}) pour rendre l&apos;URL dynamique.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Body */}
                            {config.features.hasBody && (
                                <div className="space-y-3 border-t border-gray-100 pt-5">
                                    <div className="flex justify-between items-center">
                                        <Label htmlFor="body" className="text-xs font-medium text-gray-700">Message principal (Body)</Label>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-5 px-2 text-[10px] text-green-700 hover:text-green-800 hover:bg-green-50"
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
                                        className="h-32 resize-none"
                                        required={config.features.bodyRequired}
                                    />
                                </div>
                            )}

                            {/* Footer */}
                            {config.features.hasFooter && type !== 'CAROUSEL' && (
                                <div className="space-y-3 border-t border-gray-100 pt-5">
                                    <Label htmlFor="footer" className="text-xs font-medium text-gray-700">Pied de page (Footer)</Label>
                                    <Input
                                        id="footer"
                                        value={formData.footer}
                                        onChange={e => handleChange('footer', e.target.value)}
                                        placeholder="Texte gris en bas du message"
                                        maxLength={60}
                                        className="h-9"
                                    />
                                </div>
                            )}

                            {/* LIST Specific Builder */}
                            {type === 'LIST' && (
                                <div className="space-y-4 border-t border-gray-100 pt-5">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-medium text-gray-700">Bouton du menu</Label>
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
                                            className="h-9"
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
                                <div className="space-y-4 border-t border-gray-100 pt-5">
                                    <Label className="text-sm font-semibold text-gray-900">Cartes du Carrousel</Label>
                                    <TemplateCarouselBuilder
                                        cards={formData.cards || []}
                                        onChange={cards => handleChange('cards', cards)}
                                    />
                                </div>
                            )}

                            {/* Standard Buttons */}
                            {config.features.hasButtons && type !== 'LIST' && type !== 'CAROUSEL' && (
                                <div className="space-y-3 border-t border-gray-100 pt-5">
                                    <TemplateButtonsBuilder
                                        buttons={formData.buttons || []}
                                        onChange={btns => handleChange('buttons', btns)}
                                        allowedTypes={config.features.buttonTypes}
                                        maxButtons={config.features.maxButtons}
                                    />
                                </div>
                            )}
                        </fieldset>
                    </CardContent>
                </Card>

                {/* Action Buttons */}
                <Card className="bg-white border-gray-100 shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                            <Button type="button" variant="ghost" onClick={onCancel} disabled={loading || isPublishing} className="text-gray-500 hover:text-gray-700">
                                Annuler
                            </Button>

                            <div className="flex gap-2">
                                {!isReadOnly && (
                                    <ButtonGroup>
                                        {initialData && (
                                            <Button
                                                type="button"
                                                className="bg-gradient-to-r from-[#14532d] to-[#059669] hover:from-[#14532d] hover:to-[#047857] text-white shadow-sm"
                                                onClick={async () => {
                                                    await publish();
                                                    onSuccess();
                                                }}
                                                disabled={loading || isPublishing}
                                            >
                                                {isPublishing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                Soumettre pour approbation
                                            </Button>
                                        )}

                                        <Button type="submit" variant="outline" disabled={loading || isPublishing}>
                                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            {initialData ? 'Enregistrer (Brouillon)' : 'Creer le brouillon'}
                                        </Button>
                                    </ButtonGroup>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Preview Column */}
            <div className="lg:col-span-5">
                <div className="sticky top-6 space-y-3">
                    <Card className="bg-white border-gray-100 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold text-gray-900">
                                Apercu
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Visualisez votre modele tel qu&apos;il apparaitra sur WhatsApp
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0 flex justify-center pb-4">
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
                        </CardContent>
                    </Card>
                </div>
            </div>
        </form>
    );
};
