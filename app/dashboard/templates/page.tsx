
'use client'

import React, { useState } from 'react';
import { TemplateList } from '@/components/templates/TemplateList';
import { TemplateTypeSelector } from '@/components/templates/TemplateTypeSelector';
import { TemplateBuilder } from '@/components/templates/TemplateBuilder';
import { TemplateType } from '@/convex/lib/templateTypes';
import { Button } from '@/components/ui/button';
import { Plus, ArrowLeft } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

type ViewState = 'LIST' | 'SELECT_TYPE' | 'CREATE' | 'EDIT';

export default function TemplatesPage() {
    const [view, setView] = useState<ViewState>('LIST');
    const [selectedType, setSelectedType] = useState<TemplateType | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);

    const handleCreateClick = () => {
        setView('SELECT_TYPE');
        setSelectedType(null);
        setEditingId(null);
    };

    const handleTypeSelect = (type: TemplateType) => {
        setSelectedType(type);
        setView('CREATE');
    };

    const handleEdit = (id: string, type: TemplateType) => {
        setEditingId(id);
        setSelectedType(type);
        setView('EDIT');
    };

    const handleBack = () => {
        if (view === 'CREATE' || view === 'EDIT') {
            setView('LIST'); // Or SELECT_TYPE if we want back step navigation
        } else {
            setView('LIST');
        }
    };

    const handleSuccess = () => {
        setView('LIST');
        // Toast?
    };

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
                <div className="flex items-start gap-4">
                    {view !== 'LIST' && (
                        <Button variant="ghost" size="icon" onClick={handleBack}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    )}
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Templates WhatsApp</h1>
                        <p className="text-muted-foreground">
                            Gérez vos modèles de messages pour l'API WhatsApp Business.
                        </p>
                    </div>
                </div>
                {view === 'LIST' && (
                    <Button onClick={handleCreateClick}>
                        <Plus className="mr-2 h-4 w-4" />
                        Nouveau Template
                    </Button>
                )}
            </div>

            {view === 'LIST' && (
                <TemplateList
                    onEdit={handleEdit}
                    onDelete={(id) => {
                        // Ideally confirm dialog then mutation
                        console.log("Delete", id);
                    }}
                />
            )}

            {view === 'SELECT_TYPE' && (
                <Card>
                    <CardHeader>
                        <CardTitle>Choisir un type de template</CardTitle>
                        <CardDescription>Sélectionnez le type de message que vous souhaitez créer.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <TemplateTypeSelector onSelect={handleTypeSelect} />
                    </CardContent>
                </Card>
            )}

            {(view === 'CREATE' || view === 'EDIT') && selectedType && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                    {/* Fetch data if editing - For now assume TemplateBuilder fetches or we pass id */}
                    {/* Since TemplateBuilder fetches initialData if we implemented it that way, or we fetch here.
                         For simplicity in this step, I'll let TemplateBuilder handle 'initialData' logic if I fetch it here, 
                         BUT I didn't verify if TemplateBuilder fetches by ID.
                         Looking at my code for TemplateBuilder, it takes 'initialData' prop.
                         So I should fetch it here if EDIT.
                         
                         For now, to avoid complexity of fetching in parent component (requires another query),
                         I'll render TemplateBuilder and assume for EDIT we might need to refactor slightly 
                         or I'll just skip pre-filling for this verification step if complex.
                         
                         Actually, `useQuery(api.templates.queries.get, {id: editingId})` would verify efficiently.
                     */}
                    <BuilderWrapper
                        type={selectedType}
                        templateId={editingId}
                        onSuccess={handleSuccess}
                        onCancel={handleBack}
                    />
                </div>
            )}
        </div>
    );
}

// Helper wrapper to handle fetching if editing
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

const BuilderWrapper = ({ type, templateId, onSuccess, onCancel }: {
    type: TemplateType,
    templateId: string | null,
    onSuccess: () => void,
    onCancel: () => void
}) => {
    // If templateId is null, skip query.
    // If not null, fetch.
    const data = useQuery(api.templates.queries.get, templateId ? { id: templateId as Id<"templates"> } : "skip");

    if (templateId && data === undefined) {
        return <div>Chargement...</div>;
    }

    return (
        <TemplateBuilder
            type={type}
            initialData={data} // null if creating
            onSuccess={onSuccess}
            onCancel={onCancel}
        />
    );
};
