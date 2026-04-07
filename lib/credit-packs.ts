export interface CreditPack {
    id: string;
    amountFCFA: number;
    credits: number;
    label: string;
    messagesEstimated: number;
    popular?: boolean;
}

export const CREDIT_PACKS: CreditPack[] = [
    { id: "pack_5k", amountFCFA: 5_000, credits: 5_000, label: "5 000 FCFA", messagesEstimated: 83 },
    { id: "pack_10k", amountFCFA: 10_000, credits: 10_000, label: "10 000 FCFA", messagesEstimated: 166, popular: true },
    { id: "pack_25k", amountFCFA: 25_000, credits: 25_000, label: "25 000 FCFA", messagesEstimated: 416 },
    { id: "pack_50k", amountFCFA: 50_000, credits: 50_000, label: "50 000 FCFA", messagesEstimated: 833 },
    { id: "pack_100k", amountFCFA: 100_000, credits: 100_000, label: "100 000 FCFA", messagesEstimated: 1_666 },
];

export type PaymentProvider = "WAVE" | "ORANGE_MONEY" | "STRIPE";

export const PAYMENT_PROVIDERS: { id: PaymentProvider; name: string; description: string; available: boolean }[] = [
    { id: "WAVE", name: "Wave", description: "Mobile Money Wave", available: true },
    { id: "ORANGE_MONEY", name: "Orange Money", description: "Orange Money Sénégal", available: false },
    { id: "STRIPE", name: "Carte bancaire", description: "Visa, Mastercard", available: true },
];

/**
 * Convertit un montant FCFA (unités majeures) en montant provider.
 * - Stripe : XOF est une devise à 2 décimales → multiplier par 100
 * - Wave / Orange Money : unités majeures directement
 */
export function toProviderAmount(amountFCFA: number, provider: PaymentProvider): number {
    if (provider === "STRIPE") return amountFCFA * 100;
    return amountFCFA;
}

export function findPack(amountFCFA: number): CreditPack | undefined {
    return CREDIT_PACKS.find((p) => p.amountFCFA === amountFCFA);
}
