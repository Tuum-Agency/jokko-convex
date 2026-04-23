'use client';

import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ModeSelector } from '../components/ModeSelector';
import { GuidedFlowBuilder } from '../components/GuidedFlowBuilder';

type Mode = 'select' | 'guided' | 'diagram';

export default function NewAutomationClient() {
    const router = useRouter();
    const createFlow = useMutation(api.flows.create);
    const [mode, setMode] = useState<Mode>('select');

    const handleSelectMode = async (selected: 'guided' | 'diagram') => {
        if (selected === 'guided') {
            setMode('guided');
        } else {
            // Create an empty flow and redirect to the diagram editor
            try {
                const flowId = await createFlow({
                    name: 'Nouvelle automatisation',
                    triggerType: 'NEW_CONVERSATION',
                });
                router.push(`/dashboard/automatisations/${flowId}`);
            } catch {
                // Fallback: just switch to diagram mode
                router.push('/dashboard/automatisations');
            }
        }
    };

    if (mode === 'guided') {
        return <GuidedFlowBuilder />;
    }

    return (
        <div className="p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-6">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => mode === 'select' ? router.push('/dashboard/automatisations') : setMode('select')}
                    className="h-9 w-9 rounded-lg hover:bg-gray-100"
                >
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                        Nouvelle Automatisation
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Choisissez comment créer votre automatisation
                    </p>
                </div>
            </div>

            <ModeSelector onSelectMode={handleSelectMode} />
        </div>
    );
}
