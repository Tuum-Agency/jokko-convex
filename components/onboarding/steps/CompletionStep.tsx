'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CompletionStepProps {
    onComplete: () => void;
}

export function CompletionStep({ onComplete }: CompletionStepProps) {
    const router = useRouter();

    useEffect(() => {
        // Automatically redirect after a short delay
        const timer = setTimeout(() => {
            router.push('/dashboard');
        }, 2000);
        return () => clearTimeout(timer);
    }, [router]);

    return (
        <div className="flex flex-col items-center justify-center space-y-6 py-12 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center animate-bounce">
                <CheckCircle className="w-10 h-10 text-green-600" />
            </div>

            <div className="space-y-2">
                <h2 className="text-2xl font-bold text-gray-900">Tout est prêt !</h2>
                <p className="text-gray-500">
                    Redirection vers votre tableau de bord...
                </p>
            </div>

            <Loader2 className="w-6 h-6 text-green-600 animate-spin" />
        </div>
    );
}
