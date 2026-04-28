'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Workflow, Play, FileEdit, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

const STAT_GRADIENTS = [
    'from-[#14532d] to-[#059669]',
    'from-[#166534] to-[#0d9488]',
    'from-[#15803d] to-[#10b981]',
    'from-[#14532d] to-[#34d399]',
];

interface AutomationStatsProps {
    total: number;
    active: number;
    draft: number;
}

export function AutomationStats({ total, active, draft }: AutomationStatsProps) {
    const stats = [
        { title: 'Total', value: total.toString(), icon: Workflow, gradient: STAT_GRADIENTS[0] },
        { title: 'Actives', value: active.toString(), icon: Play, gradient: STAT_GRADIENTS[1] },
        { title: 'Brouillons', value: draft.toString(), icon: FileEdit, gradient: STAT_GRADIENTS[2] },
        { title: 'Taux activation', value: total > 0 ? `${Math.round((active / total) * 100)}%` : '0%', icon: Zap, gradient: STAT_GRADIENTS[3] },
    ];

    return (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                    <Card key={stat.title} className="bg-white border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-4 sm:p-5">
                            <div className="flex items-center justify-between mb-3 sm:mb-4">
                                <div className={cn("h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-gradient-to-br flex items-center justify-center shadow-lg shadow-green-900/20", stat.gradient)}>
                                    <Icon className="h-[18px] w-[18px] sm:h-5 sm:w-5 text-white" />
                                </div>
                            </div>
                            <p className="text-xs sm:text-sm font-medium text-gray-500 mb-0.5">{stat.title}</p>
                            <span className="text-xl sm:text-3xl font-bold text-gray-900 tracking-tight">{stat.value}</span>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
