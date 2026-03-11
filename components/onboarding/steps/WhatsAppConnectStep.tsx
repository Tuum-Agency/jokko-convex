'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle } from 'lucide-react';
import { useMutation, useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useFacebookSDK } from "@/hooks/useFacebookSDK";

interface WhatsAppConnectStepProps {
    onComplete: () => void;
}

interface WhatsAppNumber {
    id: string;
    display_phone_number: string;
    verified_name: string;
    quality_rating: string;
}

export function WhatsAppConnectStep({ onComplete }: WhatsAppConnectStepProps) {
    const [status, setStatus] = useState<'IDLE' | 'FETCHING' | 'SELECTING' | 'SAVING' | 'ERROR'>('IDLE');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Facebook SDK
    const { isReady: fbReady, login: fbLogin } = useFacebookSDK();

    // Data State
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [wabaId, setWabaId] = useState<string | null>(null);
    const [phoneNumbers, setPhoneNumbers] = useState<WhatsAppNumber[]>([]);
    const [selectedPhoneId, setSelectedPhoneId] = useState<string | null>(null);

    // Convex Actions
    const completeOnboarding = useMutation(api.users.completeOnboarding);
    const fetchNumbers = useAction(api.whatsapp.fetchWhatsAppPhoneNumbers);
    const finalizeRegistration = useAction(api.whatsapp.finalizeWhatsAppRegistration);

    const launchWhatsAppSignup = async () => {
        setErrorMessage(null);
        try {
            const { accessToken: token } = await fbLogin();
            handleFetchNumbers(token);
        } catch (err: any) {
            setErrorMessage(err.message || "Connexion annulée ou non autorisée.");
        }
    };

    // Step 1: Fetch Numbers
    async function handleFetchNumbers(token: string) {
        setStatus('FETCHING');
        setAccessToken(token);

        try {
            const data = await fetchNumbers({ accessToken: token });
            setWabaId(data.wabaId);
            setPhoneNumbers(data.phoneNumbers);

            if (data.phoneNumbers.length > 0) {
                setSelectedPhoneId(data.phoneNumbers[0].id);
                setStatus('SELECTING');
            } else {
                setErrorMessage("Aucun numéro WhatsApp trouvé sur ce compte.");
                setStatus('ERROR');
            }
        } catch (error: any) {
            console.error("Fetch failed", error);
            setErrorMessage("Impossible de récupérer vos numéros. Vérifiez vos permissions.");
            setStatus('ERROR');
        }
    }

    // Step 2: Finalize
    async function handleConfirmSelection() {
        if (!accessToken || !wabaId || !selectedPhoneId) return;

        setStatus('SAVING');
        try {
            await finalizeRegistration({
                accessToken,
                wabaId,
                phoneNumberId: selectedPhoneId
            });
            await completeOnboarding();
            onComplete();
        } catch (error) {
            console.error("Finalize failed", error);
            setErrorMessage("Erreur lors de la sauvegarde de la configuration.");
            setStatus('ERROR');
        }
    }

    // ==========================================
    // RENDER
    // ==========================================

    // Show selection UI if selecting OR saving (after selection)
    if (status === 'SELECTING' || status === 'SAVING') {
        return (
            <div className="space-y-6">
                <div className="text-center">
                    <h3 className="text-xl font-semibold text-gray-900">Choisissez votre numéro</h3>
                    <p className="text-sm text-gray-500">
                        Nous avons trouvé plusieurs numéros associés à ce compte Business.
                        Lequel souhaitez-vous connecter à Jokko ?
                    </p>
                </div>

                <div className="max-h-[300px] overflow-y-auto border rounded-md p-4 bg-gray-50">
                    <RadioGroup value={selectedPhoneId || ''} onValueChange={setSelectedPhoneId}>
                        {phoneNumbers.map((phone) => (
                            <div key={phone.id} className="flex items-center space-x-2 mb-2 last:mb-0">
                                <RadioGroupItem value={phone.id} id={phone.id} />
                                <Label htmlFor={phone.id} className="flex flex-col cursor-pointer w-full p-3 rounded-lg border bg-white hover:border-blue-500 transition-colors">
                                    <span className="font-semibold text-gray-900">{phone.verified_name || 'Numéro sans nom'}</span>
                                    <span className="text-sm text-gray-500">{phone.display_phone_number}</span>
                                    <span className="text-xs text-green-600 mt-1">Qualité: {phone.quality_rating}</span>
                                </Label>
                            </div>
                        ))}
                    </RadioGroup>
                </div>

                <Button
                    onClick={handleConfirmSelection}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    disabled={status === 'SAVING'}
                >
                    {status === 'SAVING' ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Connexion...</>
                    ) : (
                        "Confirmer ce numéro"
                    )}
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-6 text-center">
            <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">Connexion WhatsApp Business</h3>
                <p className="text-blue-700 text-sm mb-4">
                    Utilisez votre compte Facebook pour connecter votre numéro WhatsApp Business en quelques clics.
                </p>

                {errorMessage && (
                    <Alert variant="destructive" className="mb-4 text-left">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Erreur</AlertTitle>
                        <AlertDescription>{errorMessage}</AlertDescription>
                    </Alert>
                )}

                <div className="flex justify-center p-4">
                    <Button
                        onClick={launchWhatsAppSignup}
                        disabled={!fbReady || status === 'FETCHING'}
                        size="lg"
                        className="h-12 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-xl shadow-lg shadow-green-600/25 hover:shadow-green-600/40 transition-all duration-300 flex items-center gap-2"
                    >
                        {status === 'FETCHING' || !fbReady ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                            </svg>
                        )}
                        {status === 'FETCHING' ? "Récupération..." : !fbReady ? "Chargement..." : "Connecter WhatsApp Business"}
                    </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                    Une fenêtre popup va s'ouvrir. Assurez-vous de désactiver votre bloqueur de popups.
                </p>
            </div>

        </div>
    );
}
