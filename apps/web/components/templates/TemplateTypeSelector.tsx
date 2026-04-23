'use client'

import React from 'react';
import {
    TEMPLATE_TYPE_GROUPS,
    TEMPLATE_TYPE_CONFIGS,
    TemplateType
} from '@/convex/lib/templateTypes';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';

interface TemplateTypeSelectorProps {
    onSelect: (type: TemplateType) => void;
    selectedType?: TemplateType;
}

export const TemplateTypeSelector: React.FC<TemplateTypeSelectorProps> = ({
    onSelect,
    selectedType
}) => {
    return (
        <div className="space-y-6">
            {TEMPLATE_TYPE_GROUPS.map((group) => (
                <Card key={group.id} className="bg-white border-gray-100 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm sm:text-base font-semibold text-gray-900">
                            {group.titleFr}
                        </CardTitle>
                        <p className="text-xs sm:text-sm text-gray-500">{group.descriptionFr}</p>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {group.types.map((type) => {
                                const config = TEMPLATE_TYPE_CONFIGS[type];
                                const isSelected = selectedType === type;

                                return (
                                    <div
                                        key={type}
                                        className={cn(
                                            "group relative flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200",
                                            isSelected
                                                ? "border-green-600 bg-green-50/50 shadow-sm"
                                                : "border-gray-100 hover:border-green-200 hover:bg-green-50/30 hover:shadow-sm"
                                        )}
                                        onClick={() => onSelect(type)}
                                    >
                                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#14532d] to-[#059669] flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                                            <span className="text-lg">{config.icon}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-sm font-semibold text-gray-900">{config.labelFr}</h4>
                                                <ArrowRight className="h-3.5 w-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                            <p className="text-[11px] text-gray-500 line-clamp-2 mt-0.5">
                                                {config.descriptionFr}
                                            </p>
                                            <div className="flex gap-1.5 mt-2">
                                                {config.categories.map(cat => (
                                                    <span key={cat} className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                                                        {cat}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};
