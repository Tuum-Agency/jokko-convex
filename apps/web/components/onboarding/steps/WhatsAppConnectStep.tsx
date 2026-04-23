'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, SkipForward, MessageCircle } from 'lucide-react';
import { useMutation, useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { useFacebookSDK } from "@/hooks/useFacebookSDK";
import { cn } from '@/lib/utils';

interface WhatsAppConnectStepProps {
    onComplete: () => void;
}

interface WhatsAppNumber {
    id: string;
    display_phone_number: string;
    verified_name: string;
    quality_rating: string;
    wabaId: string;
}

export function WhatsAppConnectStep({ onComplete }: WhatsAppConnectStepProps) {
    const [status, setStatus] = useState<'IDLE' | 'FETCHING' | 'SELECTING' | 'SAVING' | 'SKIPPING' | 'ERROR'>('IDLE');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const { isReady: fbReady, login: fbLogin } = useFacebookSDK();

    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [phoneNumbers, setPhoneNumbers] = useState<WhatsAppNumber[]>([]);
    const [selectedPhoneId, setSelectedPhoneId] = useState<string | null>(null);

    const completeOnboarding = useMutation(api.users.completeOnboarding);
    const fetchNumbers = useAction(api.whatsapp.fetchWhatsAppPhoneNumbers);
    const addChannel = useAction(api.whatsapp.addChannel);

    const launchWhatsAppSignup = async () => {
        setErrorMessage(null);
        try {
            const { accessToken: token } = await fbLogin();
            handleFetchNumbers(token);
        } catch (err: any) {
            setErrorMessage(err.message || "Connexion annulée ou non autorisée.");
        }
    };

    async function handleFetchNumbers(token: string) {
        setStatus('FETCHING');
        setAccessToken(token);

        try {
            const data = await fetchNumbers({ accessToken: token });
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

    async function handleConfirmSelection() {
        if (!accessToken || !selectedPhoneId) return;

        const selectedPhone = phoneNumbers.find(p => p.id === selectedPhoneId);
        if (!selectedPhone?.wabaId) return;

        setStatus('SAVING');
        try {
            await addChannel({
                accessToken,
                wabaId: selectedPhone.wabaId,
                phoneNumberId: selectedPhoneId,
                displayPhoneNumber: selectedPhone.display_phone_number,
                verifiedName: selectedPhone.verified_name,
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
        setStatus('SKIPPING');
        try {
            await completeOnboarding();
            onComplete();
        } catch (error) {
            console.error("Skip failed", error);
            setStatus('IDLE');
        }
    }

    const qualityColor = (rating: string) => {
        const r = rating.toUpperCase();
        if (r === 'GREEN' || r === 'HIGH') return 'bg-green-100 text-green-700 border-green-200';
        if (r === 'YELLOW' || r === 'MEDIUM') return 'bg-amber-100 text-amber-700 border-amber-200';
        if (r === 'RED' || r === 'LOW') return 'bg-red-100 text-red-700 border-red-200';
        return 'bg-gray-100 text-gray-600 border-gray-200';
    };

    if (status === 'SELECTING' || status === 'SAVING') {
        return (
            <div className="space-y-5">
                <div className="text-center">
                    <h3 className="text-base font-semibold text-gray-900">Choisissez votre numéro</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Sélectionnez le numéro WhatsApp Business à connecter à Jokko.
                    </p>
                </div>

                <RadioGroup
                    value={selectedPhoneId || ''}
                    onValueChange={setSelectedPhoneId}
                    className="space-y-2 max-h-[320px] overflow-y-auto pr-1"
                >
                    {phoneNumbers.map((phone, index) => {
                        const isSelected = selectedPhoneId === phone.id;
                        return (
                            <motion.div
                                key={phone.id}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2, delay: index * 0.04 }}
                            >
                                <Label
                                    htmlFor={phone.id}
                                    className={cn(
                                        'flex items-center gap-3 cursor-pointer p-3.5 rounded-xl border bg-white transition-all',
                                        isSelected
                                            ? 'border-green-500 ring-4 ring-green-100 shadow-sm'
                                            : 'border-gray-200 hover:border-green-200 hover:bg-green-50/30'
                                    )}
                                >
                                    <RadioGroupItem value={phone.id} id={phone.id} className="mt-0.5" />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-sm font-semibold text-gray-900 truncate">
                                                {phone.verified_name || 'Numéro sans nom'}
                                            </span>
                                            <Badge
                                                variant="outline"
                                                className={cn('text-[10px] font-medium border', qualityColor(phone.quality_rating))}
                                            >
                                                {phone.quality_rating}
                                            </Badge>
                                        </div>
                                        <span className="block text-xs text-gray-500 mt-0.5 font-mono">
                                            {phone.display_phone_number}
                                        </span>
                                    </div>
                                </Label>
                            </motion.div>
                        );
                    })}
                </RadioGroup>

                <Button
                    onClick={handleConfirmSelection}
                    className="w-full h-12 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-xl shadow-sm hover:shadow-md transition-all"
                    disabled={status === 'SAVING'}
                >
                    {status === 'SAVING' ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Connexion...</>
                    ) : (
                        "Confirmer ce numéro"
                    )}
                </Button>

                <button
                    onClick={handleSkip}
                    disabled={status === 'SAVING'}
                    className="w-full text-center text-sm text-gray-500 hover:text-gray-900 transition-colors py-1"
                >
                    Passer cette étape
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="rounded-xl border border-green-100 bg-green-50/50 p-6 sm:p-8 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#25D366] to-[#128C7E] shadow-sm shadow-green-900/20">
                    <MessageCircle className="h-7 w-7 text-white" />
                </div>

                <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                    Connexion WhatsApp Business
                </h3>
                <p className="mt-1.5 text-sm text-gray-600 max-w-sm mx-auto">
                    Utilisez votre compte Facebook pour connecter votre numéro WhatsApp Business en quelques clics.
                </p>

                {errorMessage && (
                    <Alert variant="destructive" className="mt-5 border-red-200 bg-red-50 text-left">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle className="text-red-800">Erreur</AlertTitle>
                        <AlertDescription className="text-red-700">{errorMessage}</AlertDescription>
                    </Alert>
                )}

                <Button
                    onClick={launchWhatsAppSignup}
                    disabled={!fbReady || status === 'FETCHING' || status === 'SKIPPING'}
                    size="lg"
                    className="mt-5 h-12 w-full sm:w-auto px-6 bg-gradient-to-r from-[#25D366] to-[#128C7E] hover:from-[#20bd5a] hover:to-[#0f7a6e] text-white font-semibold rounded-xl shadow-sm hover:shadow-md transition-all"
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

                <p className="mt-3 text-[11px] text-gray-500">
                    Une fenêtre popup va s&apos;ouvrir. Assurez-vous de désactiver votre bloqueur de popups.
                </p>
            </div>

            <div className="text-center">
                <button
                    onClick={handleSkip}
                    disabled={status === 'FETCHING' || status === 'SKIPPING'}
                    className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors py-1"
                >
                    {status === 'SKIPPING' ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                        <SkipForward className="w-3.5 h-3.5" />
                    )}
                    Passer cette étape — je connecterai WhatsApp plus tard
                </button>
                <p className="mt-1 text-[11px] text-gray-400">
                    Vous pourrez connecter WhatsApp depuis Paramètres &gt; Canaux à tout moment.
                </p>
            </div>
        </div>
    );
}
