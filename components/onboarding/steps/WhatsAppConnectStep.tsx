'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowRight } from 'lucide-react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';

interface WhatsAppConnectStepProps {
    onComplete: () => void;
}

export function WhatsAppConnectStep({ onComplete }: WhatsAppConnectStepProps) {
    const [isLoading, setIsLoading] = useState(false);
    const completeOnboarding = useMutation(api.users.completeOnboarding);

    async function handleSkip() {
        setIsLoading(true);
        // For now, we just complete onboarding as this is a placeholder step
        // In future, this will prompt for WhatsApp connection
        await completeOnboarding();
        onComplete();
        setIsLoading(false);
    }

    return (
        <div className="space-y-6 text-center">
            <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">Connexion WhatsApp Business</h3>
                <p className="text-blue-700 text-sm mb-4">
                    Connectez votre numéro de téléphone pour commencer à envoyer des messages.
                    Cette étape nécessite un compte Meta Business.
                </p>

                {/* Placeholder for future implementation */}
                <div className="opacity-50 pointer-events-none filter blur-xs p-4 border border-dashed border-blue-300 rounded bg-white">
                    [Bouton Facebook Connect Placeholder]
                </div>
            </div>

            <div className="flex gap-4 justify-center">
                <Button
                    onClick={handleSkip}
                    disabled={isLoading}
                    variant="outline"
                >
                    Passer cette étape pour le moment
                </Button>
                <Button
                    onClick={handleSkip}
                    disabled={isLoading}
                    className="bg-green-600 hover:bg-green-700"
                >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Continuer
                </Button>
            </div>
        </div>
    );
}
