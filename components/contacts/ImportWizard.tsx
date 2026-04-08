'use client';

import { useState } from 'react';
import {
    Upload,
    FileSpreadsheet,
    Check,
    ChevronRight,
    ChevronLeft,
    Loader2,
    Users,
    AlertTriangle,
    CheckCircle2,
    HelpCircle,
} from 'lucide-react';
import { ImportGuideDialog } from './ImportGuideDialog';

import { ButtonGroup } from '@/components/ui/button-group';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import Papa from 'papaparse';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';

type ImportStep = 'upload' | 'mapping' | 'preview' | 'complete';

interface ImportResult {
    created: number;
    updated: number;
    skipped: number;
    errors: Array<{ phone: string; error: string }>;
}

interface ImportWizardProps {
    onComplete?: (result: ImportResult) => void;
    onCancel?: () => void;
}

const STEPS: { id: ImportStep; title: string }[] = [
    { id: 'upload', title: 'Fichier' },
    { id: 'mapping', title: 'Mapping' },
    { id: 'preview', title: 'Aperçu' },
    { id: 'complete', title: 'Terminé' },
];

function StepIndicator({ currentStep, steps }: { currentStep: ImportStep; steps: typeof STEPS }) {
    const currentIndex = steps.findIndex((s) => s.id === currentStep);

    return (
        <div className="flex items-center justify-between">
            {steps.map((step, index) => {
                const isCompleted = index < currentIndex;
                const isCurrent = index === currentIndex;
                const isLast = index === steps.length - 1;

                return (
                    <div key={step.id} className="flex items-center flex-1">
                        <div className="flex flex-col items-center">
                            <div
                                className={cn(
                                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors border-2',
                                    isCompleted && 'bg-primary text-primary-foreground border-primary',
                                    isCurrent && 'bg-primary text-primary-foreground border-primary ring-4 ring-primary/20',
                                    !isCompleted && !isCurrent && 'bg-muted text-muted-foreground border-muted-foreground/30'
                                )}
                            >
                                {isCompleted ? <Check className="h-4 w-4" /> : index + 1}
                            </div>
                            <span
                                className={cn(
                                    'text-xs mt-2 font-medium',
                                    isCurrent ? 'text-primary' : 'text-muted-foreground'
                                )}
                            >
                                {step.title}
                            </span>
                        </div>
                        {!isLast && (
                            <div
                                className={cn(
                                    'h-0.5 flex-1 mx-4',
                                    index < currentIndex ? 'bg-primary' : 'bg-muted'
                                )}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

export function ImportWizard({ onComplete, onCancel }: ImportWizardProps) {
    const [currentStep, setCurrentStep] = useState<ImportStep>('upload');
    const [isLoading, setIsLoading] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [parsedContacts, setParsedContacts] = useState<any[]>([]);
    const [importStats, setImportStats] = useState<ImportResult | null>(null);
    const [showGuide, setShowGuide] = useState(false);

    const batchCreate = useMutation(api.contacts.batchCreate);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
        }
    };

    const handleUpload = () => {
        if (!file) return;
        setIsLoading(true);

        Papa.parse(file, {
            header: true,
            complete: (results: any) => {
                // Simplified mapping: map keys directly if they match, or guess
                const mapped = results.data.map((row: any) => {
                    // Basic normalization
                    const phone = row['phone'] || row['Phone'] || row['Mobile'] || row['Téléphone'];
                    if (!phone) return null; // Skip without phone

                    return {
                        phone: String(phone),
                        name: row['name'] || row['Name'] || row['Nom'] || (row['First Name'] ? `${row['First Name']} ${row['Last Name']}` : undefined),
                        firstName: row['firstName'] || row['First Name'] || row['Prénom'],
                        lastName: row['lastName'] || row['Last Name'] || row['Nom'],
                        email: row['email'] || row['Email'] || row['E-mail'],
                        company: row['company'] || row['Company'] || row['Entreprise'],
                        tags: row['tags'] ? String(row['tags']).split(',').map(t => t.trim()) : []
                    };
                }).filter(Boolean);

                setParsedContacts(mapped);
                setIsLoading(false);
                setCurrentStep('mapping'); // Skip custom mapping UI for now, assume auto-map
            },
            error: (err: any) => {
                console.error("Parse error", err);
                setIsLoading(false);
                alert("Erreur lors de la lecture du fichier");
            }
        });

    };

    const handleMapping = () => {
        setCurrentStep('preview');
    };

    const handleConfirm = async () => {
        setIsLoading(true);
        try {
            const result = await batchCreate({ contacts: parsedContacts });
            setImportStats({
                created: result.created,
                updated: 0,
                skipped: 0,
                errors: result.errors || []
            });
            setCurrentStep('complete');
            onComplete?.({
                created: result.created,
                updated: 0,
                skipped: 0,
                errors: result.errors || []
            });
        } catch (err: any) {
            console.error("Import failed", err);
            alert("Erreur lors de l'import: " + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const renderUploadStep = () => (
        <div className="py-8">
            <div
                className="border-2 border-dashed border-muted-foreground/25 rounded-xl p-8 text-center hover:bg-muted/30 transition-colors cursor-pointer relative"
            >
                <input
                    type="file"
                    accept=".csv"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={handleFileChange}
                />
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Upload className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-medium mb-1">
                    {file ? file.name : "Glissez-déposez votre fichier"}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                    CSV supporté
                </p>
                <Button variant="outline" size="sm" type="button" className="pointer-events-none">
                    Parcourir
                </Button>
            </div>

            <div className="mt-6 w-full grid gap-4">
                <Card className="p-4 w-full flex items-center gap-3 bg-muted/20">
                    <div className="p-2 rounded-lg bg-green-100 text-green-700">
                        <FileSpreadsheet className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="font-medium">Fichier CSV</p>
                        <p className="text-xs text-muted-foreground">Format recommandé</p>
                    </div>
                </Card>
            </div>

            <button
                type="button"
                onClick={() => setShowGuide(true)}
                className="mt-4 flex items-center gap-2 text-sm text-primary hover:underline mx-auto"
            >
                <HelpCircle className="h-4 w-4" />
                Comment récupérer mes contacts depuis mon smartphone ?
            </button>

            <ImportGuideDialog open={showGuide} onOpenChange={setShowGuide} />
        </div>
    );

    const renderMappingStep = () => (
        <div className="py-12 text-center text-muted-foreground">
            <div className="flex flex-col items-center justify-center mb-6">
                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-2">
                    <Check className="h-6 w-6" />
                </div>
                <p className="font-medium text-foreground">{parsedContacts.length} contacts détectés</p>
            </div>
            <p className="max-w-md mx-auto">
                Les colonnes ont été automatiquement associées. Cliquez sur continuer pour vérifier l'aperçu.
            </p>
        </div>
    );

    const renderPreviewStep = () => (
        <div className="py-12 text-center text-muted-foreground">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
            <p className="font-medium text-foreground">Prêt à importer {parsedContacts.length} contacts</p>
            <p className="text-sm">Veuillez confirmer l'importation</p>

            <div className="mt-4 max-h-40 overflow-y-auto border rounded-md text-left p-2 text-xs bg-muted/20">
                {parsedContacts.slice(0, 5).map((c, i) => (
                    <div key={i} className="mb-1 truncate">{c.name || c.phone} - {c.phone}</div>
                ))}
                {parsedContacts.length > 5 && <div className="text-center italic mt-2">...et {parsedContacts.length - 5} autres</div>}
            </div>
        </div>
    );

    const renderCompleteStep = () => (
        <div className="text-center space-y-4 py-8">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>

            <div>
                <h3 className="text-lg font-semibold">Import terminé</h3>
                <p className="text-sm text-muted-foreground mt-1">
                    {importStats?.created} contacts créés. {importStats?.errors?.length ? `${importStats.errors.length} erreurs.` : ''}
                </p>
            </div>

            {importStats?.errors && importStats.errors.length > 0 && (
                <div className="text-left bg-red-50 p-3 rounded-md text-xs text-red-600 mt-4 max-h-40 overflow-auto">
                    <p className="font-bold mb-1">Erreurs:</p>
                    {importStats.errors.map((e, i) => (
                        <div key={i}>{e.phone}: {e.error}</div>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <div className="flex flex-col h-full min-h-[480px]">
            <div className="px-6 pt-6 pb-4 border-b">
                <h2 className="text-lg font-semibold mb-4">Importer des contacts</h2>
                <StepIndicator currentStep={currentStep} steps={STEPS} />
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
                {currentStep === 'upload' && renderUploadStep()}
                {currentStep === 'mapping' && renderMappingStep()}
                {currentStep === 'preview' && renderPreviewStep()}
                {currentStep === 'complete' && renderCompleteStep()}
            </div>

            <div className="px-6 py-4 border-t bg-muted/30 flex justify-end">
                {currentStep !== 'complete' ? (
                    <ButtonGroup>
                        <Button
                            variant="outline"
                            disabled={isLoading}
                            onClick={() => {
                                if (currentStep === 'upload') onCancel?.();
                                else if (currentStep === 'mapping') setCurrentStep('upload');
                                else if (currentStep === 'preview') setCurrentStep('mapping');
                            }}
                        >
                            <ChevronLeft className="mr-1 h-4 w-4" />
                            {currentStep === 'upload' ? 'Annuler' : 'Retour'}
                        </Button>

                        <Button onClick={() => {
                            if (currentStep === 'upload') handleUpload();
                            else if (currentStep === 'mapping') handleMapping();
                            else if (currentStep === 'preview') handleConfirm();
                        }}
                            disabled={isLoading || (currentStep === 'upload' && !file)}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Traitement...
                                </>
                            ) : (
                                <>
                                    {currentStep === 'preview' ? 'Importer' : 'Continuer'}
                                    {currentStep !== 'preview' && <ChevronRight className="ml-1 h-4 w-4" />}
                                </>
                            )}
                        </Button>
                    </ButtonGroup>
                ) : (
                    <Button className="w-full" onClick={onCancel}>
                        <Users className="mr-2 h-4 w-4" />
                        Voir les contacts
                    </Button>
                )}
            </div>
        </div>
    );
}
