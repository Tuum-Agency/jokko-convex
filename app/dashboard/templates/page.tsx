
'use client'

import React, { useState } from 'react';
import { TemplateList } from '@/components/templates/TemplateList';
import { TemplateTypeSelector } from '@/components/templates/TemplateTypeSelector';
import { TemplateBuilder } from '@/components/templates/TemplateBuilder';
import { TemplateType } from '@/convex/lib/templateTypes';
import { Button } from '@/components/ui/button';
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Loader2, Plus, ArrowLeft, Download, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
// ... imports
import { Id } from '@/convex/_generated/dataModel';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

type ViewState = 'LIST' | 'SELECT_TYPE' | 'CREATE' | 'EDIT';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShortcutList } from '@/components/templates/ShortcutList';

// ... imports

export default function TemplatesPage() {
    const [view, setView] = useState<ViewState>('LIST');
    const [selectedType, setSelectedType] = useState<TemplateType | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);

    const role = useQuery(api.users.currentUserRole);

    const seedStandard = useMutation(api.templates.mutations.seedStandard);
    const [isSeeding, setIsSeeding] = useState(false);

    if (role === undefined) {
        return (
            <div className="space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2" />
                        <div className="h-4 w-64 bg-gray-100 rounded animate-pulse" />
                    </div>
                </div>
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
            </div>
        );
    }

    if (role === 'AGENT') {
        return (
            <div className="p-6">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Accès refusé</AlertTitle>
                    <AlertDescription>
                        Vous n'avez pas les autorisations nécessaires pour accéder à cette page.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

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



    const handleSeed = async () => {
        setIsSeeding(true);
        try {
            await seedStandard();
            // Optional: toast success
        } catch (error) {
            console.error("Failed to seed standard templates", error);
        } finally {
            setIsSeeding(false);
        }
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
                        <h1 className="text-3xl font-bold tracking-tight">Templates & Raccourcis</h1>
                        <p className="text-muted-foreground">
                            Gérez vos modèles WhatsApp et raccourcis de réponse rapide.
                        </p>
                    </div>
                </div>
                {view === 'LIST' && (
                    <Button variant="outline" onClick={handleSeed} disabled={isSeeding}>
                        {isSeeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                        Charger les standards
                    </Button>
                )}
            </div>

            {view === 'LIST' ? (
                <Tabs defaultValue="templates" className="w-full">
                    <TabsList>
                        <TabsTrigger value="templates">Templates WhatsApp</TabsTrigger>
                        <TabsTrigger value="shortcuts">Raccourcis Messages</TabsTrigger>
                    </TabsList>

                    <TabsContent value="templates" className="space-y-4 pt-4">
                        <TemplateList
                            onCreate={handleCreateClick}
                            onEdit={handleEdit}
                            onDelete={(id) => {
                                console.log("Delete", id);
                            }}
                        />
                    </TabsContent>

                    <TabsContent value="shortcuts" className="pt-4">
                        <ShortcutList />
                    </TabsContent>
                </Tabs>
            ) : (
                <>
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
                            <BuilderWrapper
                                type={selectedType}
                                templateId={editingId}
                                onSuccess={handleSuccess}
                                onCancel={handleBack}
                            />
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

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
