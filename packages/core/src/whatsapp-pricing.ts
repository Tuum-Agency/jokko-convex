/**
 * WhatsApp Business API — Marketing message pricing (per message delivered)
 * Source: Meta official rate card (updated July 2025)
 * https://business.whatsapp.com/products/platform-pricing
 *
 * Rates are in USD per message. Converted to FCFA at runtime.
 */

// 1 USD ≈ 605 FCFA (XOF) — update this periodically
export const USD_TO_FCFA = 605;

// Marketing message rates in USD per message, keyed by phone prefix
const COUNTRY_RATES: Record<string, number> = {
    // Africa — specific tiers
    "+234": 0.0593, // Nigeria
    "+27":  0.0436, // South Africa
    "+20":  0.0741, // Egypt

    // Rest of Africa (default for African prefixes)
    "+221": 0.0259, // Senegal
    "+225": 0.0259, // Côte d'Ivoire
    "+223": 0.0259, // Mali
    "+224": 0.0259, // Guinée
    "+237": 0.0259, // Cameroun
    "+241": 0.0259, // Gabon
    "+212": 0.0259, // Maroc
    "+216": 0.0259, // Tunisie
    "+213": 0.0259, // Algérie
    "+233": 0.0259, // Ghana
    "+254": 0.0259, // Kenya
    "+228": 0.0259, // Togo
    "+229": 0.0259, // Bénin
    "+226": 0.0259, // Burkina Faso
    "+227": 0.0259, // Niger
    "+235": 0.0259, // Tchad
    "+222": 0.0259, // Mauritanie
    "+220": 0.0259, // Gambie
    "+232": 0.0259, // Sierra Leone
    "+231": 0.0259, // Libéria
    "+245": 0.0259, // Guinée-Bissau
    "+242": 0.0259, // Congo
    "+243": 0.0259, // RDC
    "+250": 0.0259, // Rwanda
    "+257": 0.0259, // Burundi
    "+255": 0.0259, // Tanzanie
    "+256": 0.0259, // Ouganda
    "+258": 0.0259, // Mozambique
    "+260": 0.0259, // Zambie
    "+263": 0.0259, // Zimbabwe

    // Europe
    "+33":  0.0988, // France
    "+44":  0.0608, // UK
    "+49":  0.1570, // Allemagne
    "+34":  0.0707, // Espagne
    "+39":  0.0795, // Italie
    "+31":  0.1837, // Pays-Bas
    "+32":  0.0681, // Belgique
    "+41":  0.0681, // Suisse
    "+351": 0.0681, // Portugal

    // Amérique du Nord
    "+1":   0.0288, // USA / Canada

    // Amérique Latine
    "+55":  0.0719, // Brésil
    "+52":  0.0351, // Mexique
    "+57":  0.0144, // Colombie

    // Moyen-Orient
    "+966": 0.0576, // Arabie Saoudite
    "+971": 0.0574, // EAU
    "+972": 0.0406, // Israël
    "+90":  0.0125, // Turquie

    // Asie
    "+91":  0.0136, // Inde
    "+62":  0.0473, // Indonésie
    "+60":  0.0989, // Malaisie
    "+92":  0.0544, // Pakistan
};

/**
 * Pricing table for display in the UI (grouped by region)
 */
export const PRICING_TABLE = [
    { region: "Afrique de l'Ouest", countries: [
        { flag: "🇸🇳", name: "Sénégal", prefix: "+221", rateUSD: 0.0259 },
        { flag: "🇨🇮", name: "Côte d'Ivoire", prefix: "+225", rateUSD: 0.0259 },
        { flag: "🇲🇱", name: "Mali", prefix: "+223", rateUSD: 0.0259 },
        { flag: "🇬🇳", name: "Guinée", prefix: "+224", rateUSD: 0.0259 },
        { flag: "🇨🇲", name: "Cameroun", prefix: "+237", rateUSD: 0.0259 },
        { flag: "🇬🇦", name: "Gabon", prefix: "+241", rateUSD: 0.0259 },
        { flag: "🇧🇫", name: "Burkina Faso", prefix: "+226", rateUSD: 0.0259 },
        { flag: "🇹🇬", name: "Togo", prefix: "+228", rateUSD: 0.0259 },
        { flag: "🇧🇯", name: "Bénin", prefix: "+229", rateUSD: 0.0259 },
        { flag: "🇳🇪", name: "Niger", prefix: "+227", rateUSD: 0.0259 },
    ]},
    { region: "Afrique (autres)", countries: [
        { flag: "🇲🇦", name: "Maroc", prefix: "+212", rateUSD: 0.0259 },
        { flag: "🇳🇬", name: "Nigeria", prefix: "+234", rateUSD: 0.0593 },
        { flag: "🇿🇦", name: "Afrique du Sud", prefix: "+27", rateUSD: 0.0436 },
        { flag: "🇪🇬", name: "Égypte", prefix: "+20", rateUSD: 0.0741 },
        { flag: "🇬🇭", name: "Ghana", prefix: "+233", rateUSD: 0.0259 },
        { flag: "🇰🇪", name: "Kenya", prefix: "+254", rateUSD: 0.0259 },
    ]},
    { region: "Europe", countries: [
        { flag: "🇫🇷", name: "France", prefix: "+33", rateUSD: 0.0988 },
        { flag: "🇬🇧", name: "Royaume-Uni", prefix: "+44", rateUSD: 0.0608 },
        { flag: "🇩🇪", name: "Allemagne", prefix: "+49", rateUSD: 0.1570 },
        { flag: "🇪🇸", name: "Espagne", prefix: "+34", rateUSD: 0.0707 },
        { flag: "🇮🇹", name: "Italie", prefix: "+39", rateUSD: 0.0795 },
        { flag: "🇧🇪", name: "Belgique", prefix: "+32", rateUSD: 0.0681 },
    ]},
    { region: "Amérique", countries: [
        { flag: "🇺🇸", name: "USA / Canada", prefix: "+1", rateUSD: 0.0288 },
        { flag: "🇧🇷", name: "Brésil", prefix: "+55", rateUSD: 0.0719 },
        { flag: "🇲🇽", name: "Mexique", prefix: "+52", rateUSD: 0.0351 },
    ]},
    { region: "Moyen-Orient & Asie", countries: [
        { flag: "🇮🇳", name: "Inde", prefix: "+91", rateUSD: 0.0136 },
        { flag: "🇹🇷", name: "Turquie", prefix: "+90", rateUSD: 0.0125 },
        { flag: "🇸🇦", name: "Arabie Saoudite", prefix: "+966", rateUSD: 0.0576 },
        { flag: "🇦🇪", name: "EAU", prefix: "+971", rateUSD: 0.0574 },
    ]},
];

// Regional fallback rates in USD
const REGION_FALLBACKS: Record<string, number> = {
    AFRICA:         0.0259,
    WESTERN_EUROPE: 0.0681,
    EASTERN_EUROPE: 0.0989,
    NORTH_AMERICA:  0.0288,
    LATIN_AMERICA:  0.0851,
    MIDDLE_EAST:    0.0392,
    ASIA_PACIFIC:   0.0842,
    OTHER:          0.0695,
};

/**
 * Get the marketing message rate in USD for a phone number
 */
export function getMessageRateUSD(phone: string): number {
    // Try exact prefix matches (longest first)
    const prefixes = Object.keys(COUNTRY_RATES).sort((a, b) => b.length - a.length);
    for (const prefix of prefixes) {
        if (phone.startsWith(prefix)) {
            return COUNTRY_RATES[prefix];
        }
    }

    // Fallback by region based on first digits
    if (phone.startsWith("+2")) return REGION_FALLBACKS.AFRICA;
    if (phone.startsWith("+3")) return REGION_FALLBACKS.WESTERN_EUROPE;
    if (phone.startsWith("+4")) return REGION_FALLBACKS.EASTERN_EUROPE;
    if (phone.startsWith("+1")) return REGION_FALLBACKS.NORTH_AMERICA;
    if (phone.startsWith("+5")) return REGION_FALLBACKS.LATIN_AMERICA;
    if (phone.startsWith("+6") || phone.startsWith("+8")) return REGION_FALLBACKS.ASIA_PACIFIC;
    if (phone.startsWith("+9")) return REGION_FALLBACKS.MIDDLE_EAST;

    return REGION_FALLBACKS.OTHER;
}

/**
 * Get the marketing message cost in FCFA for a phone number
 */
export function getMessageCostFCFA(phone: string): number {
    return Math.ceil(getMessageRateUSD(phone) * USD_TO_FCFA);
}

/**
 * Calculate total cost in FCFA for a list of phone numbers
 */
export function calculateBroadcastCost(phones: string[]): {
    totalCostFCFA: number;
    breakdown: Record<string, { count: number; rateFCFA: number; subtotal: number }>;
} {
    const breakdown: Record<string, { count: number; rateFCFA: number; subtotal: number }> = {};
    let totalCostFCFA = 0;

    for (const phone of phones) {
        const costFCFA = getMessageCostFCFA(phone);
        const rateUSD = getMessageRateUSD(phone);
        const key = `${rateUSD}`;

        if (!breakdown[key]) {
            breakdown[key] = { count: 0, rateFCFA: costFCFA, subtotal: 0 };
        }
        breakdown[key].count++;
        breakdown[key].subtotal += costFCFA;
        totalCostFCFA += costFCFA;
    }

    return { totalCostFCFA, breakdown };
}
