
import React from 'react';
import {
    TEMPLATE_TYPE_GROUPS,
    TEMPLATE_TYPE_CONFIGS,
    TemplateType
} from '@/convex/lib/templateTypes';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';

interface TemplateTypeSelectorProps {
    onSelect: (type: TemplateType) => void;
    selectedType?: TemplateType;
}

export const TemplateTypeSelector: React.FC<TemplateTypeSelectorProps> = ({
    onSelect,
    selectedType
}) => {
    return (
        <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-8">
                {TEMPLATE_TYPE_GROUPS.map((group) => (
                    <div key={group.id} className="space-y-4">
                        <div>
                            <h3 className="text-lg font-semibold text-foreground">{group.titleFr}</h3>
                            <p className="text-sm text-muted-foreground">{group.descriptionFr}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {group.types.map((type) => {
                                const config = TEMPLATE_TYPE_CONFIGS[type];
                                const isSelected = selectedType === type;

                                return (
                                    <Card
                                        key={type}
                                        className={cn(
                                            "cursor-pointer transition-all hover:border-primary border-2",
                                            isSelected ? "border-primary bg-primary/5" : "border-transparent bg-card"
                                        )}
                                        onClick={() => onSelect(type)}
                                    >
                                        <CardContent className="p-4 flex items-start space-x-4">
                                            <div className="text-2xl pt-1">{config.icon}</div>
                                            <div className="space-y-1">
                                                <h4 className="font-medium leading-none">{config.labelFr}</h4>
                                                <p className="text-xs text-muted-foreground line-clamp-2">
                                                    {config.descriptionFr}
                                                </p>
                                                <div className="flex gap-2 pt-2">
                                                    {config.categories.map(cat => (
                                                        <span key={cat} className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground font-medium">
                                                            {cat}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </ScrollArea>
    );
};
