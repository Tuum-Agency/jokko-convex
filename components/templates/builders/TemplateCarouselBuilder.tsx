import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, ArrowLeft, ArrowRight } from 'lucide-react';
import { TemplateButtonsBuilder } from './TemplateButtonsBuilder';

interface CarouselCard {
    title?: string;
    headerUrl?: string;
    body: string;
    buttons: any[];
}

interface TemplateCarouselBuilderProps {
    cards: CarouselCard[];
    onChange: (cards: CarouselCard[]) => void;
}

export const TemplateCarouselBuilder: React.FC<TemplateCarouselBuilderProps> = ({
    cards = [],
    onChange
}) => {
    const handleAddCard = () => {
        if (cards.length < 10) {
            onChange([...cards, { title: '', body: '', buttons: [] }]);
        }
    };

    const handleRemoveCard = (index: number) => {
        const newCards = [...cards];
        newCards.splice(index, 1);
        onChange(newCards);
    };

    const handleUpdateCard = (index: number, field: keyof CarouselCard, value: any) => {
        const newCards = [...cards];
        newCards[index] = { ...newCards[index], [field]: value };
        onChange(newCards);
    };

    // Helper to scroll carousel view if needed, but for now we list them vertically for editing
    // The user image shows "Card priority" which implies order.

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <Label>Cartes du Carrousel ({cards.length}/10)</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddCard}>
                    <Plus className="mr-2 h-3 w-3" />
                    Ajouter une carte
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cards.map((card, index) => (
                    <Card key={index} className="relative group hover:border-primary transition-colors">
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => handleRemoveCard(index)}
                            >
                                <Trash2 className="h-3 w-3" />
                            </Button>
                        </div>
                        <CardContent className="p-3 space-y-3">
                            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Carte {index + 1}
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs">Titre (Optionnel)</Label>
                                <Input
                                    value={card.title || ''}
                                    onChange={(e) => handleUpdateCard(index, 'title', e.target.value)}
                                    className="h-8"
                                    placeholder="Titre en gras..."
                                />
                            </div>

                            <div className="space-y-1">
                                <div className="flex justify-between items-center">
                                    <Label className="text-xs">URL Média (Image/Vidéo)</Label>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-5 px-2 text-[10px] text-blue-600 hover:text-blue-700"
                                        onClick={() => handleUpdateCard(index, 'headerUrl', (card.headerUrl || '') + '{{1}}')}
                                    >
                                        + Variable
                                    </Button>
                                </div>
                                <Input
                                    value={card.headerUrl || ''}
                                    onChange={(e) => handleUpdateCard(index, 'headerUrl', e.target.value)}
                                    className="h-8"
                                    placeholder="https://example.com/media-{{1}}.jpg"
                                />
                                <p className="text-[10px] text-muted-foreground">
                                    Supporte les variables {"{{1}}"}
                                </p>
                            </div>

                            <div className="space-y-1">
                                <div className="flex justify-between items-center">
                                    <Label className="text-xs">Contenu (Body)</Label>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-5 px-2 text-[10px] text-blue-600 hover:text-blue-700"
                                        onClick={() => {
                                            const currentBody = card.body || '';
                                            const match = currentBody.match(/\{\{(\d+)\}\}/g);
                                            const nextVar = match ? match.length + 1 : 1;
                                            handleUpdateCard(index, 'body', currentBody + ` {{${nextVar}}} `);
                                        }}
                                    >
                                        + Variable
                                    </Button>
                                </div>
                                <Textarea
                                    value={card.body}
                                    onChange={(e) => handleUpdateCard(index, 'body', e.target.value)}
                                    className="h-20 text-sm resize-none"
                                    placeholder="Description de la carte..."
                                    maxLength={160}
                                />
                            </div>

                            <div className="space-y-1 pt-2 border-t">
                                <Label className="text-xs mb-1 block">Boutons (Max 2)</Label>
                                <TemplateButtonsBuilder
                                    buttons={card.buttons}
                                    onChange={btns => handleUpdateCard(index, 'buttons', btns)}
                                    allowedTypes={['QUICK_REPLY', 'URL', 'PHONE_NUMBER']}
                                    maxButtons={2}
                                />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
            {cards.length === 0 && (
                <div className="text-center py-8 border-2 border-dashed rounded-lg text-muted-foreground">
                    Aucune carte. Ajoutez votre première carte pour le carrousel.
                </div>
            )}
        </div>
    );
};
