import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, GripVertical } from 'lucide-react';

interface ListRow {
    id: string;
    title: string;
    description: string;
}

interface ListSection {
    title: string;
    rows: ListRow[];
}

interface TemplateListBuilderProps {
    sections: ListSection[];
    onChange: (sections: ListSection[]) => void;
    maxSections?: number;
}

export const TemplateListBuilder: React.FC<TemplateListBuilderProps> = ({
    sections = [],
    onChange,
    maxSections = 10
}) => {
    const handleAddSection = () => {
        if (sections.length < maxSections) {
            onChange([...sections, { title: '', rows: [] }]);
        }
    };

    const handleRemoveSection = (index: number) => {
        const newSections = [...sections];
        newSections.splice(index, 1);
        onChange(newSections);
    };

    const handleUpdateSection = (index: number, title: string) => {
        const newSections = [...sections];
        newSections[index].title = title;
        onChange(newSections);
    };

    const handleAddRow = (sectionIndex: number) => {
        const newSections = [...sections];
        newSections[sectionIndex].rows.push({ id: '', title: '', description: '' });
        onChange(newSections);
    };

    const handleUpdateRow = (sectionIndex: number, rowIndex: number, field: keyof ListRow, value: string) => {
        const newSections = [...sections];
        newSections[sectionIndex].rows[rowIndex] = { ...newSections[sectionIndex].rows[rowIndex], [field]: value };
        onChange(newSections);
    };

    const handleRemoveRow = (sectionIndex: number, rowIndex: number) => {
        const newSections = [...sections];
        newSections[sectionIndex].rows.splice(rowIndex, 1);
        onChange(newSections);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Label>Sections de la liste</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddSection}>
                    <Plus className="mr-2 h-3 w-3" />
                    Ajouter une section
                </Button>
            </div>

            {sections.map((section, sIndex) => (
                <Card key={sIndex} className="bg-muted/20">
                    <CardContent className="p-4 space-y-4">
                        <div className="flex items-start gap-4">
                            <div className="grid flex-1 gap-2">
                                <Label className="text-xs">Titre de la section</Label>
                                <Input
                                    value={section.title}
                                    onChange={(e) => handleUpdateSection(sIndex, e.target.value)}
                                    placeholder="Ex: Plats principaux"
                                    maxLength={24}
                                />
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="mt-6 text-destructive hover:bg-destructive/10"
                                onClick={() => handleRemoveSection(sIndex)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="space-y-3 pl-4 border-l-2">
                            {section.rows.map((row, rIndex) => (
                                <div key={rIndex} className="grid grid-cols-12 gap-3 items-start relative">
                                    <div className="col-span-3 space-y-1">
                                        <Label className="text-[10px] text-muted-foreground">ID (Unique)</Label>
                                        <Input
                                            value={row.id}
                                            onChange={(e) => handleUpdateRow(sIndex, rIndex, 'id', e.target.value)}
                                            className="h-8 text-xs"
                                            placeholder="unique_id"
                                            maxLength={200}
                                        />
                                    </div>
                                    <div className="col-span-4 space-y-1">
                                        <Label className="text-[10px] text-muted-foreground">Titre de l'option</Label>
                                        <Input
                                            value={row.title}
                                            onChange={(e) => handleUpdateRow(sIndex, rIndex, 'title', e.target.value)}
                                            className="h-8 text-xs"
                                            placeholder="Ex: Burger"
                                            maxLength={24}
                                        />
                                    </div>
                                    <div className="col-span-4 space-y-1">
                                        <Label className="text-[10px] text-muted-foreground">Description</Label>
                                        <Input
                                            value={row.description}
                                            onChange={(e) => handleUpdateRow(sIndex, rIndex, 'description', e.target.value)}
                                            className="h-8 text-xs"
                                            placeholder="Description courte..."
                                            maxLength={72}
                                        />
                                    </div>
                                    <div className="col-span-1 pt-6">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                            onClick={() => handleRemoveRow(sIndex, rIndex)}
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                            <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                className="w-full h-8 text-xs dashed-border"
                                onClick={() => handleAddRow(sIndex)}
                            >
                                <Plus className="mr-2 h-3 w-3" />
                                Ajouter une option
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};
