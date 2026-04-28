'use client';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { Smartphone, ChevronRight } from 'lucide-react';

interface ImportGuideDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

function StepList({ steps }: { steps: string[] }) {
    return (
        <ol className="space-y-3 mt-3">
            {steps.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                        {i + 1}
                    </span>
                    <span className="text-muted-foreground leading-6">{step}</span>
                </li>
            ))}
        </ol>
    );
}

const IPHONE_ICLOUD_STEPS = [
    'Ouvrez l\'app Réglages sur votre iPhone.',
    'Appuyez sur votre nom (Apple ID) en haut, puis sur iCloud.',
    'Vérifiez que Contacts est activé pour la synchronisation iCloud.',
    'Sur votre ordinateur, allez sur icloud.com et connectez-vous.',
    'Cliquez sur Contacts.',
    'Sélectionnez tous les contacts (⌘+A ou Ctrl+A).',
    'Cliquez sur l\'icône ⚙️ en bas à gauche, puis "Exporter en vCard...".',
    'Un fichier .vcf sera téléchargé. Convertissez-le en CSV avec un outil en ligne gratuit (ex: vcard-to-csv.com).',
    'Importez le fichier CSV dans Jokko.',
];

const IPHONE_DIRECT_STEPS = [
    'Ouvrez l\'app Contacts sur votre iPhone.',
    'Appuyez sur Listes en haut à gauche.',
    'Appuyez longuement sur la liste "Tous les contacts".',
    'Sélectionnez "Exporter" dans le menu.',
    'Choisissez de vous envoyer le fichier par e-mail ou AirDrop.',
    'Récupérez le fichier .vcf sur votre ordinateur.',
    'Convertissez le fichier .vcf en CSV (ex: vcard-to-csv.com).',
    'Importez le fichier CSV dans Jokko.',
];

const ANDROID_GOOGLE_STEPS = [
    'Sur votre ordinateur, allez sur contacts.google.com.',
    'Connectez-vous avec le même compte Google que votre téléphone.',
    'Dans le menu à gauche, cliquez sur "Exporter".',
    'Sélectionnez les contacts à exporter (ou tous).',
    'Choisissez le format "Google CSV".',
    'Cliquez sur "Exporter" pour télécharger le fichier.',
    'Importez le fichier CSV dans Jokko.',
];

const ANDROID_DIRECT_STEPS = [
    'Ouvrez l\'app Contacts sur votre téléphone Android.',
    'Appuyez sur le menu ☰ ou les 3 points ⋮.',
    'Sélectionnez "Paramètres" ou "Gérer les contacts".',
    'Appuyez sur "Exporter les contacts".',
    'Choisissez l\'emplacement de sauvegarde (stockage interne ou carte SD).',
    'Le fichier .vcf sera enregistré. Transférez-le sur votre ordinateur (câble USB, e-mail, ou Google Drive).',
    'Convertissez le fichier .vcf en CSV si nécessaire.',
    'Importez le fichier CSV dans Jokko.',
];

export function ImportGuideDialog({ open, onOpenChange }: ImportGuideDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Smartphone className="h-5 w-5 text-primary" />
                        Comment récupérer mes contacts ?
                    </DialogTitle>
                    <DialogDescription>
                        Suivez ces étapes pour exporter vos contacts depuis votre smartphone, puis importez le fichier CSV dans Jokko.
                    </DialogDescription>
                </DialogHeader>

                <Accordion type="single" collapsible className="w-full">
                    {/* iPhone Section */}
                    <AccordionItem value="iphone-icloud">
                        <AccordionTrigger className="text-sm">
                            <span className="flex items-center gap-2">
                                <span className="text-lg">🍎</span>
                                iPhone — via iCloud (recommandé)
                            </span>
                        </AccordionTrigger>
                        <AccordionContent>
                            <StepList steps={IPHONE_ICLOUD_STEPS} />
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="iphone-direct">
                        <AccordionTrigger className="text-sm">
                            <span className="flex items-center gap-2">
                                <span className="text-lg">🍎</span>
                                iPhone — export direct (iOS 16+)
                            </span>
                        </AccordionTrigger>
                        <AccordionContent>
                            <StepList steps={IPHONE_DIRECT_STEPS} />
                        </AccordionContent>
                    </AccordionItem>

                    {/* Android Section */}
                    <AccordionItem value="android-google">
                        <AccordionTrigger className="text-sm">
                            <span className="flex items-center gap-2">
                                <span className="text-lg">🤖</span>
                                Android — via Google Contacts (recommandé)
                            </span>
                        </AccordionTrigger>
                        <AccordionContent>
                            <StepList steps={ANDROID_GOOGLE_STEPS} />
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="android-direct">
                        <AccordionTrigger className="text-sm">
                            <span className="flex items-center gap-2">
                                <span className="text-lg">🤖</span>
                                Android — export depuis l&apos;app Contacts
                            </span>
                        </AccordionTrigger>
                        <AccordionContent>
                            <StepList steps={ANDROID_DIRECT_STEPS} />
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>

                {/* Tips */}
                <div className="rounded-lg bg-blue-50 border border-blue-100 p-4 mt-2">
                    <p className="text-sm font-medium text-blue-900 mb-2">💡 Conseils</p>
                    <ul className="text-xs text-blue-800 space-y-1.5">
                        <li className="flex items-start gap-1.5">
                            <ChevronRight className="h-3 w-3 mt-0.5 shrink-0" />
                            Le fichier CSV doit contenir au minimum une colonne <strong>phone</strong> ou <strong>Téléphone</strong>.
                        </li>
                        <li className="flex items-start gap-1.5">
                            <ChevronRight className="h-3 w-3 mt-0.5 shrink-0" />
                            Les colonnes <strong>name</strong>, <strong>email</strong> et <strong>company</strong> seront automatiquement détectées.
                        </li>
                        <li className="flex items-start gap-1.5">
                            <ChevronRight className="h-3 w-3 mt-0.5 shrink-0" />
                            Les numéros doivent inclure l&apos;indicatif pays (ex: +221 77 123 45 67).
                        </li>
                    </ul>
                </div>
            </DialogContent>
        </Dialog>
    );
}
