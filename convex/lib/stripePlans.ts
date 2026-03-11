/**
 * Stripe plan-to-price mapping utilities.
 * No Stripe SDK import - usable in both edge and Node runtimes.
 *
 * NOTE: Les prix doivent correspondre à lib/plans.ts (PLAN_PRICING).
 */

export const PLAN_PRICES: Record<string, { name: string; monthlyFCFA: number; yearlyFCFA: number }> = {
    STARTER: { name: "Starter", monthlyFCFA: 10_000, yearlyFCFA: 96_000 },
    BUSINESS: { name: "Business", monthlyFCFA: 30_000, yearlyFCFA: 288_000 },
    PRO: { name: "Pro", monthlyFCFA: 70_000, yearlyFCFA: 672_000 },
};

export function planFromPriceId(priceId: string): string {
    const map: Record<string, string> = {};
    if (process.env.STRIPE_PRICE_STARTER) map[process.env.STRIPE_PRICE_STARTER] = "STARTER";
    if (process.env.STRIPE_PRICE_BUSINESS) map[process.env.STRIPE_PRICE_BUSINESS] = "BUSINESS";
    if (process.env.STRIPE_PRICE_PRO) map[process.env.STRIPE_PRICE_PRO] = "PRO";
    // Yearly prices map to the same plans
    if (process.env.STRIPE_PRICE_STARTER_YEARLY) map[process.env.STRIPE_PRICE_STARTER_YEARLY] = "STARTER";
    if (process.env.STRIPE_PRICE_BUSINESS_YEARLY) map[process.env.STRIPE_PRICE_BUSINESS_YEARLY] = "BUSINESS";
    if (process.env.STRIPE_PRICE_PRO_YEARLY) map[process.env.STRIPE_PRICE_PRO_YEARLY] = "PRO";
    return map[priceId] || "FREE";
}

export function priceIdFromPlan(plan: string, interval: "month" | "year" = "month"): string | null {
    if (interval === "year") {
        const map: Record<string, string | undefined> = {
            STARTER: process.env.STRIPE_PRICE_STARTER_YEARLY,
            BUSINESS: process.env.STRIPE_PRICE_BUSINESS_YEARLY,
            PRO: process.env.STRIPE_PRICE_PRO_YEARLY,
        };
        return map[plan] || null;
    }
    const map: Record<string, string | undefined> = {
        STARTER: process.env.STRIPE_PRICE_STARTER,
        BUSINESS: process.env.STRIPE_PRICE_BUSINESS,
        PRO: process.env.STRIPE_PRICE_PRO,
    };
    return map[plan] || null;
}
