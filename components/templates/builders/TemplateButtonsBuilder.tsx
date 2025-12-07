import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ButtonType } from '@/convex/lib/templateTypes';
import { Plus, Trash2 } from 'lucide-react';

interface ButtonData {
    type: ButtonType;
    text: string;
    url?: string;
    phoneNumber?: string;
}

interface TemplateButtonsBuilderProps {
    buttons: ButtonData[];
    onChange: (buttons: ButtonData[]) => void;
    allowedTypes: ButtonType[];
    maxButtons: number;
}

export const TemplateButtonsBuilder: React.FC<TemplateButtonsBuilderProps> = ({
    buttons,
    onChange,
    allowedTypes,
    maxButtons,
}) => {
    const handleAddButton = () => {
        if (buttons.length < maxButtons) {
            onChange([...buttons, { type: allowedTypes[0], text: '' }]);
        }
    };

    const handleRemoveButton = (index: number) => {
        const newButtons = [...buttons];
        newButtons.splice(index, 1);
        onChange(newButtons);
    };

    const handleUpdateButton = (index: number, field: keyof ButtonData, value: any) => {
        const newButtons = [...buttons];
        newButtons[index] = { ...newButtons[index], [field]: value };
        onChange(newButtons);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Label>Boutons ({buttons.length}/{maxButtons})</Label>
                {buttons.length < maxButtons && (
                    <Button type="button" variant="outline" size="sm" onClick={handleAddButton}>
                        <Plus className="mr-2 h-3 w-3" />
                        Ajouter
                    </Button>
                )}
            </div>

            {buttons.map((btn, index) => (
                <div key={index} className="flex gap-4 items-start p-3 bg-muted/40 rounded-md border">
                    <div className="flex-1 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs">Type</Label>
                                <Select
                                    value={btn.type}
                                    onValueChange={(v) => handleUpdateButton(index, 'type', v as ButtonType)}
                                >
                                    <SelectTrigger className="h-8">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {allowedTypes.map(t => (
                                            <SelectItem key={t} value={t}>{t}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Texte du bouton</Label>
                                <Input
                                    value={btn.text}
                                    onChange={(e) => handleUpdateButton(index, 'text', e.target.value)}
                                    className="h-8"
                                    placeholder="Ex: Visiter le site"
                                    maxLength={25}
                                />
                            </div>
                        </div>

                        {btn.type === 'URL' && (
                            <div className="space-y-1">
                                <Label className="text-xs">URL</Label>
                                <Input
                                    value={btn.url || ''}
                                    onChange={(e) => handleUpdateButton(index, 'url', e.target.value)}
                                    className="h-8"
                                    placeholder="https://example.com"
                                />
                            </div>
                        )}

                        {btn.type === 'PHONE_NUMBER' && (
                            <div className="space-y-1">
                                <Label className="text-xs">Numéro de téléphone</Label>
                                <Input
                                    value={btn.phoneNumber || ''}
                                    onChange={(e) => handleUpdateButton(index, 'phoneNumber', e.target.value)}
                                    className="h-8"
                                    placeholder="+221..."
                                />
                            </div>
                        )}
                    </div>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleRemoveButton(index)}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ))}

            {buttons.length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-4 border rounded-md border-dashed">
                    Aucun bouton configuré.
                </div>
            )}
        </div>
    );
};
