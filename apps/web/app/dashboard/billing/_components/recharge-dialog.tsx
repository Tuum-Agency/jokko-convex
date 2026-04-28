'use client'

import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import {
    Loader2,
    CreditCard,
    Smartphone,
    Wallet,
    MessageSquare,
    Sparkles,
    Check,
    Coins,
    ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { CREDIT_PACKS, PAYMENT_PROVIDERS, type CreditPack, type PaymentProvider } from "@/lib/credit-packs";

interface RechargeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const STEP_LABELS = ["Montant", "Paiement", "Confirmation"] as const;

function StepIndicator({ currentStep }: { currentStep: 1 | 2 | 3 }) {
    return (
        <div className="flex items-center justify-center gap-2 pb-1">
            {STEP_LABELS.map((label, i) => {
                const stepNum = i + 1;
                const isActive = stepNum === currentStep;
                const isCompleted = stepNum < currentStep;
                return (
                    <div key={label} className="flex items-center gap-2">
                        {i > 0 && (
                            <div className={cn(
                                "h-px w-6 sm:w-8 transition-colors",
                                isCompleted ? "bg-green-500" : "bg-gray-200"
                            )} />
                        )}
                        <div className="flex items-center gap-1.5">
                            <div className={cn(
                                "h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all",
                                isActive
                                    ? "bg-gradient-to-br from-[#14532d] to-[#059669] text-white shadow-sm"
                                    : isCompleted
                                        ? "bg-green-500 text-white"
                                        : "bg-gray-100 text-gray-400"
                            )}>
                                {isCompleted ? <Check className="h-3 w-3" /> : stepNum}
                            </div>
                            <span className={cn(
                                "text-[11px] font-medium hidden sm:inline",
                                isActive ? "text-gray-900" : isCompleted ? "text-green-600" : "text-gray-400"
                            )}>
                                {label}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

const PROVIDER_ICONS: Record<PaymentProvider, React.ElementType> = {
    WAVE: Wallet,
    ORANGE_MONEY: Smartphone,
    STRIPE: CreditCard,
};

const PROVIDER_GRADIENTS: Record<PaymentProvider, string> = {
    WAVE: "from-[#1B98F0] to-[#0D7AD4]",
    ORANGE_MONEY: "from-[#FF6600] to-[#E55C00]",
    STRIPE: "from-[#14532d] to-[#059669]",
};

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

            window.location.href = result.url;
        } catch (error: any) {
            toast.error("Erreur", {
                description: error.message || "Impossible de créer la session de paiement.",
            });
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={resetAndClose}>
            <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
                {/* Header with gradient accent */}
                <div className="px-6 pt-6 pb-4 space-y-4">
                    <DialogHeader className="space-y-1.5">
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#14532d] to-[#059669] flex items-center justify-center shadow-sm">
                                <Coins className="h-4 w-4 text-white" />
                            </div>
                            <div>
                                <DialogTitle className="text-sm sm:text-base font-semibold text-gray-900">
                                    {step === 1 && "Choisir un montant"}
                                    {step === 2 && "Mode de paiement"}
                                    {step === 3 && "Confirmer le paiement"}
                                </DialogTitle>
                                <DialogDescription className="text-[11px] text-gray-400 mt-0">
                                    {step === 1 && "Sélectionnez le pack de crédits à acheter."}
                                    {step === 2 && "Comment souhaitez-vous payer ?"}
                                    {step === 3 && "Vérifiez les détails avant de procéder."}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                    <StepIndicator currentStep={step} />
                </div>

                <Separator className="bg-gray-100" />

                {/* Step Content */}
                <div className="px-6 py-5">
                    {/* Step 1: Choose amount */}
                    {step === 1 && (
                        <div className="space-y-3">
                            <div className="grid grid-cols-1 gap-2">
                                {CREDIT_PACKS.map((pack) => (
                                    <button
                                        key={pack.id}
                                        onClick={() => setSelectedPack(pack)}
                                        className={cn(
                                            "relative flex items-center justify-between p-3.5 rounded-xl border transition-all text-left cursor-pointer group",
                                            selectedPack?.id === pack.id
                                                ? "border-green-300 bg-green-50/50 ring-2 ring-green-500/10"
                                                : "border-gray-100 hover:border-gray-200 hover:bg-gray-50/50 bg-white"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "h-9 w-9 rounded-full flex items-center justify-center transition-all text-xs font-bold",
                                                selectedPack?.id === pack.id
                                                    ? "bg-gradient-to-br from-[#14532d] to-[#059669] text-white shadow-sm"
                                                    : "bg-gray-100 text-gray-500 group-hover:bg-gray-200"
                                            )}>
                                                {new Intl.NumberFormat('fr-FR', { notation: 'compact' }).format(pack.amountFCFA)}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-semibold text-gray-900">{pack.label}</span>
                                                    {pack.popular && (
                                                        <Badge className="bg-green-50 text-green-700 border-green-200 text-[10px] px-1.5 py-0 font-medium gap-0.5">
                                                            <Sparkles className="h-2.5 w-2.5" />
                                                            Populaire
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1 mt-0.5 text-[11px] text-gray-400">
                                                    <MessageSquare className="h-3 w-3" />
                                                    <span>~ {pack.messagesEstimated} messages</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className={cn(
                                            "h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                                            selectedPack?.id === pack.id
                                                ? "border-green-500 bg-green-500"
                                                : "border-gray-200 group-hover:border-gray-300"
                                        )}>
                                            {selectedPack?.id === pack.id && (
                                                <Check className="h-3 w-3 text-white" />
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 2: Choose provider */}
                    {step === 2 && (
                        <div className="space-y-3">
                            <div className="grid grid-cols-1 gap-2">
                                {PAYMENT_PROVIDERS.map((provider) => {
                                    const Icon = PROVIDER_ICONS[provider.id];
                                    const gradient = PROVIDER_GRADIENTS[provider.id];
                                    return (
                                        <button
                                            key={provider.id}
                                            onClick={() => {
                                                if (provider.available) setSelectedProvider(provider.id);
                                            }}
                                            disabled={!provider.available}
                                            className={cn(
                                                "relative flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left cursor-pointer group",
                                                !provider.available && "opacity-50 cursor-not-allowed",
                                                selectedProvider === provider.id
                                                    ? "border-green-300 bg-green-50/50 ring-2 ring-green-500/10"
                                                    : provider.available
                                                        ? "border-gray-100 hover:border-gray-200 hover:bg-gray-50/50 bg-white"
                                                        : "border-gray-100 bg-gray-50/30"
                                            )}
                                        >
                                            <div className={cn(
                                                "h-10 w-10 rounded-full flex items-center justify-center transition-all shadow-sm",
                                                selectedProvider === provider.id
                                                    ? `bg-gradient-to-br ${gradient}`
                                                    : "bg-gray-100 group-hover:bg-gray-200"
                                            )}>
                                                <Icon className={cn(
                                                    "h-[18px] w-[18px] transition-colors",
                                                    selectedProvider === provider.id
                                                        ? "text-white"
                                                        : "text-gray-500"
                                                )} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-semibold text-gray-900">{provider.name}</span>
                                                    {!provider.available && (
                                                        <Badge variant="secondary" className="text-[10px] text-gray-400 bg-gray-100 font-medium">
                                                            Bient&ocirc;t
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-[11px] text-gray-400 mt-0.5">{provider.description}</p>
                                            </div>
                                            {provider.available && (
                                                <div className={cn(
                                                    "h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                                                    selectedProvider === provider.id
                                                        ? "border-green-500 bg-green-500"
                                                        : "border-gray-200 group-hover:border-gray-300"
                                                )}>
                                                    {selectedProvider === provider.id && (
                                                        <Check className="h-3 w-3 text-white" />
                                                    )}
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Step 3: Confirm */}
                    {step === 3 && selectedPack && selectedProvider && (() => {
                        const ProviderIcon = PROVIDER_ICONS[selectedProvider];
                        const providerName = PAYMENT_PROVIDERS.find((p) => p.id === selectedProvider)?.name;
                        return (
                            <div className="space-y-4">
                                <div className="rounded-xl border border-gray-100 bg-gray-50/30 overflow-hidden">
                                    <div className="p-4 space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-medium text-gray-500">Montant</span>
                                            <span className="text-sm font-bold text-gray-900">{selectedPack.label}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-medium text-gray-500">Cr&eacute;dits</span>
                                            <span className="text-sm font-semibold text-green-600">
                                                +{new Intl.NumberFormat("fr-FR").format(selectedPack.credits)} cr&eacute;dits
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-medium text-gray-500">Messages estim&eacute;s</span>
                                            <span className="text-xs text-gray-600">~ {selectedPack.messagesEstimated}</span>
                                        </div>
                                    </div>
                                    <Separator className="bg-gray-100" />
                                    <div className="p-4 flex justify-between items-center">
                                        <span className="text-xs font-medium text-gray-500">Paiement via</span>
                                        <div className="flex items-center gap-2">
                                            <div className={cn(
                                                "h-6 w-6 rounded-full bg-gradient-to-br flex items-center justify-center",
                                                PROVIDER_GRADIENTS[selectedProvider]
                                            )}>
                                                <ProviderIcon className="h-3 w-3 text-white" />
                                            </div>
                                            <span className="text-sm font-semibold text-gray-900">{providerName}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 text-[11px] text-gray-400 justify-center">
                                    <ShieldCheck className="h-3.5 w-3.5" />
                                    <span>Paiement s&eacute;curis&eacute; et chiffr&eacute;</span>
                                </div>
                            </div>
                        );
                    })()}
                </div>

                {/* Footer with actions */}
                <div className="px-6 pb-6 pt-0">
                    {step === 1 && (
                        <Button
                            className="w-full h-9 text-xs font-medium bg-gradient-to-r from-[#14532d] to-[#059669] hover:from-[#14532d]/90 hover:to-[#059669]/90 cursor-pointer rounded-full"
                            disabled={!selectedPack}
                            onClick={() => setStep(2)}
                        >
                            Continuer
                        </Button>
                    )}

                    {step === 2 && (
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 h-9 text-xs rounded-full cursor-pointer"
                                onClick={() => setStep(1)}
                            >
                                Retour
                            </Button>
                            <Button
                                size="sm"
                                className="flex-1 h-9 text-xs font-medium bg-gradient-to-r from-[#14532d] to-[#059669] hover:from-[#14532d]/90 hover:to-[#059669]/90 cursor-pointer rounded-full"
                                disabled={!selectedProvider}
                                onClick={() => setStep(3)}
                            >
                                Continuer
                            </Button>
                        </div>
                    )}

                    {step === 3 && selectedPack && (
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 h-9 text-xs rounded-full cursor-pointer"
                                onClick={() => setStep(2)}
                                disabled={loading}
                            >
                                Retour
                            </Button>
                            <Button
                                size="sm"
                                className="flex-1 h-9 text-xs font-medium bg-gradient-to-r from-[#14532d] to-[#059669] hover:from-[#14532d]/90 hover:to-[#059669]/90 cursor-pointer rounded-full"
                                onClick={handlePay}
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                        Redirection...
                                    </>
                                ) : (
                                    <>Payer {selectedPack.label}</>
                                )}
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
