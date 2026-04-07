'use client'

import React, { useState } from 'react';
import { TemplateList } from '@/components/templates/TemplateList';
import { TemplateTypeSelector } from '@/components/templates/TemplateTypeSelector';
import { TemplateBuilder } from '@/components/templates/TemplateBuilder';
import { TemplateType } from '@/convex/lib/templateTypes';
import { Button } from '@/components/ui/button';
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Loader2, ArrowLeft, AlertCircle, FileText, Zap } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Id } from '@/convex/_generated/dataModel';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShortcutList } from '@/components/templates/ShortcutList';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type ViewState = 'LIST' | 'SELECT_TYPE' | 'CREATE' | 'EDIT';

export default function TemplatesPage() {
    const [view, setView] = useState<ViewState>('LIST');
    const [selectedType, setSelectedType] = useState<TemplateType | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);

    const role = useQuery(api.users.currentUserRole);


    if (role === undefined) {
        return (
            <div className="space-y-6">
                <div>
                    <Skeleton className="h-7 w-64 mb-2" />
                    <Skeleton className="h-4 w-96" />
                </div>
                <div className="grid gap-4 grid-cols-2">
                    {[1, 2].map((i) => (
                        <Card key={i} className="bg-white border-gray-100 shadow-sm">
                            <CardContent className="p-5">
                                <Skeleton className="h-11 w-11 rounded-full mb-4" />
                                <Skeleton className="h-3 w-20 mb-2" />
                                <Skeleton className="h-7 w-14" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
                <Card className="bg-white border-gray-100 shadow-sm">
                    <CardContent className="p-6">
                        <Skeleton className="h-8 w-48 mb-4" />
                        <Skeleton className="h-[300px] w-full rounded-lg" />
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (role === 'AGENT') {
        return (
            <div className="p-6">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Acces refuse</AlertTitle>
                    <AlertDescription>
                        Vous n&apos;avez pas les autorisations necessaires pour acceder a cette page.
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
        setView('LIST');
    };

    const handleSuccess = () => {
        setView('LIST');
    };


    return (
        <div className="space-y-6">
            {/* ==================== HEADER ==================== */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                    {view !== 'LIST' && (
                        <Button variant="ghost" size="icon" onClick={handleBack} className="h-9 w-9 rounded-lg hover:bg-gray-100">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    )}
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                            {view === 'LIST' && "Mod\u00e8les et R\u00e9ponses Rapides"}
                            {view === 'SELECT_TYPE' && "Nouveau modele"}
                            {view === 'CREATE' && "Creer un modele"}
                            {view === 'EDIT' && "Modifier le modele"}
                        </h1>
                        <p className="text-sm text-gray-500 mt-0.5">
                            {view === 'LIST' && "Gerez vos modeles WhatsApp et raccourcis de reponse rapide."}
                            {view === 'SELECT_TYPE' && "Choisissez le type de modele que vous souhaitez creer."}
                            {view === 'CREATE' && "Configurez votre nouveau modele WhatsApp."}
                            {view === 'EDIT' && "Modifiez la configuration de votre modele."}
                        </p>
                    </div>
                </div>

            </div>

            {/* ==================== CONTENT ==================== */}
            {view === 'LIST' ? (
                <>
                    {/* Quick Stats */}
                    <div className="grid gap-4 grid-cols-2">
                        <Card className="bg-white border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                            <CardContent className="p-4 sm:p-5">
                                <div className="flex items-center justify-between mb-3 sm:mb-4">
                                    <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-gradient-to-br from-[#14532d] to-[#059669] flex items-center justify-center shadow-lg shadow-green-900/20">
                                        <FileText className="h-[18px] w-[18px] sm:h-5 sm:w-5 text-white" />
                                    </div>
                                </div>
                                <p className="text-xs sm:text-sm font-medium text-gray-500 mb-0.5">Modeles WhatsApp</p>
                                <p className="text-[11px] text-gray-400 mt-0.5">Modeles de messages approuves par Meta</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-white border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                            <CardContent className="p-4 sm:p-5">
                                <div className="flex items-center justify-between mb-3 sm:mb-4">
                                    <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-gradient-to-br from-[#166534] to-[#0d9488] flex items-center justify-center shadow-lg shadow-green-900/20">
                                        <Zap className="h-[18px] w-[18px] sm:h-5 sm:w-5 text-white" />
                                    </div>
                                </div>
                                <p className="text-xs sm:text-sm font-medium text-gray-500 mb-0.5">Reponses rapides</p>
                                <p className="text-[11px] text-gray-400 mt-0.5">Raccourcis pour repondre plus vite</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Tabs Content */}
                    <Card className="bg-white border-gray-100 shadow-sm">
                        <CardContent className="p-4 sm:p-6">
                            <Tabs defaultValue="templates" className="w-full">
                                <TabsList>
                                    <TabsTrigger value="templates">Modeles WhatsApp</TabsTrigger>
                                    <TabsTrigger value="shortcuts">Reponses rapides</TabsTrigger>
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
                        </CardContent>
                    </Card>
                </>
            ) : (
                <>
                    {view === 'SELECT_TYPE' && (
                        <TemplateTypeSelector onSelect={handleTypeSelect} />
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
    const data = useQuery(api.templates.queries.get, templateId ? { id: templateId as Id<"templates"> } : "skip");

    if (templateId && data === undefined) {
        return (
            <Card className="bg-white border-gray-100 shadow-sm">
                <CardContent className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </CardContent>
            </Card>
        );
    }

    return (
        <TemplateBuilder
            type={type}
            initialData={data}
            onSuccess={onSuccess}
            onCancel={onCancel}
        />
    );
};
