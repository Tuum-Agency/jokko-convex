'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle } from 'lucide-react';
import { useMutation, useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

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

    // Data State
    const [sdkLoaded, setSdkLoaded] = useState(false);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [wabaId, setWabaId] = useState<string | null>(null);
    const [phoneNumbers, setPhoneNumbers] = useState<WhatsAppNumber[]>([]);
    const [selectedPhoneId, setSelectedPhoneId] = useState<string | null>(null);

    // Convex Actions
    const completeOnboarding = useMutation(api.users.completeOnboarding);
    const fetchNumbers = useAction(api.whatsapp.fetchWhatsAppPhoneNumbers);
    const finalizeRegistration = useAction(api.whatsapp.finalizeWhatsAppRegistration);

    // Load Facebook SDK
    useEffect(() => {
        if ((window as any).FB) {
            setSdkLoaded(true);
            return;
        }

        (window as any).fbAsyncInit = function () {
            (window as any).FB.init({
                appId: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || '',
                autoLogAppEvents: true,
                xfbml: true,
                version: 'v19.0'
            });
            setSdkLoaded(true);
        };

        const script = document.createElement('script');
        script.src = "https://connect.facebook.net/en_US/sdk.js";
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
        }
    }, []);

    const launchWhatsAppSignup = () => {
        if (!sdkLoaded) return;
        setErrorMessage(null);

        (window as any).FB.login(function (response: any) {
            if (response.authResponse) {
                handleFetchNumbers(response.authResponse.accessToken);
            } else {
                console.log('User cancelled login or did not fully authorize.');
            }
        }, {
            scope: 'whatsapp_business_management, whatsapp_business_messaging'
        });
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
                // Pre-select first one for convenience
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

    async function handleSkip() {
        await completeOnboarding();
        onComplete();
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
                        disabled={!sdkLoaded || status === 'FETCHING'}
                        className="bg-[#1877F2] hover:bg-[#166fe5] text-white font-bold py-2 px-4 rounded shadow-md flex items-center gap-2"
                    >
                        {status === 'FETCHING' ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.791-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                            </svg>
                        )}
                        {status === 'FETCHING' ? "Récupération..." : "Se connecter avec Facebook"}
                    </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                    Une fenêtre popup va s'ouvrir. Assurez-vous de désactiver votre bloqueur de popups.
                </p>
            </div>

            <div className="flex gap-4 justify-center">
                <Button
                    onClick={handleSkip}
                    variant="ghost"
                    className='text-gray-500'
                >
                    Passer cette étape (Mode Démo)
                </Button>
            </div>
        </div>
    );
}
