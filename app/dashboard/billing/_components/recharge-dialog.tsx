'use client'

import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { Loader2, CreditCard, Smartphone, ChevronRight, ChevronLeft, Wallet, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CREDIT_PACKS, PAYMENT_PROVIDERS, type CreditPack, type PaymentProvider } from "@/lib/credit-packs";

interface RechargeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function RechargeDialog({ open, onOpenChange }: RechargeDialogProps) {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [selectedPack, setSelectedPack] = useState<CreditPack | null>(null);
    const [selectedProvider, setSelectedProvider] = useState<PaymentProvider | null>(null);
    const [loading, setLoading] = useState(false);

    const initiateWave = useAction(api.payment_actions.initiateWavePayment);
    const initiateStripe = useAction(api.stripe_actions.createCreditsCheckoutSession);

    const resetAndClose = () => {
        setStep(1);
        setSelectedPack(null);
        setSelectedProvider(null);
        setLoading(false);
        onOpenChange(false);
    };

    const handlePay = async () => {
        if (!selectedPack || !selectedProvider) return;

        setLoading(true);
        try {
            let result: { url: string };

            switch (selectedProvider) {
                case "WAVE":
                    result = await initiateWave({ amount: selectedPack.amountFCFA });
                    break;
                case "STRIPE":
                    result = await initiateStripe({ amount: selectedPack.amountFCFA });
                    break;
                case "ORANGE_MONEY":
                    toast.error("Orange Money n'est pas encore disponible.");
                    setLoading(false);
                    return;
                default:
                    throw new Error("Provider non supporté");
            }

            // Redirect to provider checkout
            window.location.href = result.url;
        } catch (error: any) {
            toast.error("Erreur", {
                description: error.message || "Impossible de créer la session de paiement.",
            });
            setLoading(false);
        }
    };

    const providerIcon = (id: PaymentProvider) => {
        switch (id) {
            case "WAVE": return <Wallet className="h-5 w-5" />;
            case "ORANGE_MONEY": return <Smartphone className="h-5 w-5" />;
            case "STRIPE": return <CreditCard className="h-5 w-5" />;
        }
    };

    return (
        <Dialog open={open} onOpenChange={resetAndClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {step === 1 && "Choisir un montant"}
                        {step === 2 && "Mode de paiement"}
                        {step === 3 && "Confirmer le paiement"}
                    </DialogTitle>
                    <DialogDescription>
                        {step === 1 && "Sélectionnez le pack de crédits à acheter."}
                        {step === 2 && "Comment souhaitez-vous payer ?"}
                        {step === 3 && "Vérifiez les détails avant de procéder."}
                    </DialogDescription>
                </DialogHeader>

                {/* Step 1: Choose amount */}
                {step === 1 && (
                    <div className="space-y-3">
                        <div className="grid grid-cols-1 gap-2">
                            {CREDIT_PACKS.map((pack) => (
                                <button
                                    key={pack.id}
                                    onClick={() => setSelectedPack(pack)}
                                    className={cn(
                                        "relative flex items-center justify-between p-4 rounded-lg border-2 transition-all text-left",
                                        selectedPack?.id === pack.id
                                            ? "border-green-500 bg-green-50"
                                            : "border-gray-200 hover:border-gray-300 bg-white"
                                    )}
                                >
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-gray-900">{pack.label}</span>
                                            {pack.popular && (
                                                <Badge className="bg-green-100 text-green-700 text-[10px]">
                                                    Populaire
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                                            <MessageSquare className="h-3.5 w-3.5" />
                                            <span>~ {pack.messagesEstimated} messages</span>
                                        </div>
                                    </div>
                                    <div className={cn(
                                        "h-5 w-5 rounded-full border-2 flex items-center justify-center",
                                        selectedPack?.id === pack.id
                                            ? "border-green-500 bg-green-500"
                                            : "border-gray-300"
                                    )}>
                                        {selectedPack?.id === pack.id && (
                                            <div className="h-2 w-2 rounded-full bg-white" />
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                        <Button
                            className="w-full bg-green-600 hover:bg-green-700"
                            disabled={!selectedPack}
                            onClick={() => setStep(2)}
                        >
                            Continuer
                            <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                )}

                {/* Step 2: Choose provider */}
                {step === 2 && (
                    <div className="space-y-3">
                        <div className="grid grid-cols-1 gap-2">
                            {PAYMENT_PROVIDERS.map((provider) => (
                                <button
                                    key={provider.id}
                                    onClick={() => {
                                        if (provider.available) setSelectedProvider(provider.id);
                                    }}
                                    disabled={!provider.available}
                                    className={cn(
                                        "relative flex items-center gap-3 p-4 rounded-lg border-2 transition-all text-left",
                                        !provider.available && "opacity-50 cursor-not-allowed",
                                        selectedProvider === provider.id
                                            ? "border-green-500 bg-green-50"
                                            : provider.available
                                                ? "border-gray-200 hover:border-gray-300 bg-white"
                                                : "border-gray-200 bg-gray-50"
                                    )}
                                >
                                    <div className={cn(
                                        "flex items-center justify-center h-10 w-10 rounded-lg",
                                        selectedProvider === provider.id
                                            ? "bg-green-100 text-green-700"
                                            : "bg-gray-100 text-gray-500"
                                    )}>
                                        {providerIcon(provider.id)}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-gray-900">{provider.name}</span>
                                            {!provider.available && (
                                                <Badge variant="outline" className="text-[10px] text-gray-400">
                                                    Bientôt
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-500">{provider.description}</p>
                                    </div>
                                    {provider.available && (
                                        <div className={cn(
                                            "h-5 w-5 rounded-full border-2 flex items-center justify-center",
                                            selectedProvider === provider.id
                                                ? "border-green-500 bg-green-500"
                                                : "border-gray-300"
                                        )}>
                                            {selectedProvider === provider.id && (
                                                <div className="h-2 w-2 rounded-full bg-white" />
                                            )}
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => setStep(1)}
                            >
                                <ChevronLeft className="mr-2 h-4 w-4" />
                                Retour
                            </Button>
                            <Button
                                className="flex-1 bg-green-600 hover:bg-green-700"
                                disabled={!selectedProvider}
                                onClick={() => setStep(3)}
                            >
                                Continuer
                                <ChevronRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step 3: Confirm */}
                {step === 3 && selectedPack && selectedProvider && (
                    <div className="space-y-4">
                        <div className="rounded-lg border border-gray-200 p-4 space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-500">Montant</span>
                                <span className="font-semibold text-gray-900">{selectedPack.label}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-500">Crédits</span>
                                <span className="font-medium text-green-600">
                                    +{new Intl.NumberFormat("fr-FR").format(selectedPack.credits)} crédits
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-500">Messages estimés</span>
                                <span className="text-sm text-gray-700">~ {selectedPack.messagesEstimated}</span>
                            </div>
                            <div className="border-t pt-3 flex justify-between items-center">
                                <span className="text-sm text-gray-500">Paiement via</span>
                                <div className="flex items-center gap-2">
                                    {providerIcon(selectedProvider)}
                                    <span className="font-medium text-gray-900">
                                        {PAYMENT_PROVIDERS.find((p) => p.id === selectedProvider)?.name}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => setStep(2)}
                                disabled={loading}
                            >
                                <ChevronLeft className="mr-2 h-4 w-4" />
                                Retour
                            </Button>
                            <Button
                                className="flex-1 bg-green-600 hover:bg-green-700"
                                onClick={handlePay}
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Redirection...
                                    </>
                                ) : (
                                    <>
                                        Payer {selectedPack.label}
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
