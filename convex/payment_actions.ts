import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id } from "./_generated/dataModel";

// Valid credit pack amounts (must match lib/credit-packs.ts)
const VALID_AMOUNTS = [5_000, 10_000, 25_000, 50_000, 100_000];

function getAppUrl(): string {
    return process.env.APP_URL || "https://app.jokko.co";
}

/**
 * Initiate a Wave payment for credit recharge.
 * Uses Wave Checkout API: https://docs.wave.com/
 */
export const initiateWavePayment = action({
    args: {
        amount: v.number(),
    },
    handler: async (ctx, args): Promise<{ url: string; paymentSessionId: string }> => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Non authentifié");

        // Validate amount
        if (!VALID_AMOUNTS.includes(args.amount)) {
            throw new Error("Montant invalide");
        }

        // Get current org
        const session = await ctx.runQuery(internal.sessions.getCurrentSession, {});
        if (!session?.organizationId) throw new Error("Aucune organisation active");

        const organizationId = session.organizationId as Id<"organizations">;
        const appUrl = getAppUrl();

        // Create payment session
        const { sessionId, publicReference } = await ctx.runMutation(
            internal.payments.createPaymentSession,
            {
                organizationId,
                userId,
                amount: args.amount,
                credits: args.amount, // 1:1 mapping FCFA → crédits
                provider: "WAVE",
            }
        );

        // Call Wave Checkout API
        const waveApiKey = process.env.WAVE_API_KEY;
        if (!waveApiKey) {
            throw new Error("Wave API non configurée. Contactez le support.");
        }

        const response = await fetch("https://api.wave.com/v1/checkout/sessions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${waveApiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                amount: String(args.amount), // Wave attend un string
                currency: "XOF",
                client_reference: publicReference,
                success_url: `${appUrl}/dashboard/billing/recharge?session=${sessionId}&status=success`,
                error_url: `${appUrl}/dashboard/billing/recharge?session=${sessionId}&status=error`,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("[Wave] Checkout creation failed:", response.status, errorText);
            await ctx.runMutation(internal.payments.failPayment, {
                sessionId,
                failureReason: `Wave API error: ${response.status}`,
                providerMetadata: { status: response.status, body: errorText },
            });
            throw new Error("Erreur lors de la création du paiement Wave. Réessayez.");
        }

        const data = await response.json();

        // Wave returns wave_launch_url for the checkout page
        const checkoutUrl = data.wave_launch_url;
        if (!checkoutUrl) {
            console.error("[Wave] No wave_launch_url in response:", JSON.stringify(data));
            await ctx.runMutation(internal.payments.failPayment, {
                sessionId,
                failureReason: "No wave_launch_url in Wave response",
                providerMetadata: data,
            });
            throw new Error("Erreur Wave : URL de paiement non reçue.");
        }

        // Update session with provider details
        await ctx.runMutation(internal.payments.updatePaymentSession, {
            sessionId,
            providerSessionId: data.id,
            checkoutUrl,
            providerMetadata: {
                wave_id: data.id,
                checkout_status: data.checkout_status,
            },
        });

        return { url: checkoutUrl, paymentSessionId: sessionId };
    },
});

/**
 * Initiate an Orange Money payment.
 *
 * TODO: Orange Money integration pending merchant account validation in Senegal.
 *
 * Expected flow once validated:
 * 1. POST OAuth token: https://api.orange.com/oauth/v3/token
 *    - Body: grant_type=client_credentials
 *    - Auth: Basic(ORANGE_MONEY_CLIENT_ID:ORANGE_MONEY_CLIENT_SECRET)
 *
 * 2. POST initiate payment: https://api.orange.com/orange-money-webpay/dev/v1/webpayment
 *    - Body: { merchant_key, currency: "OUV", order_id, amount, return_url, cancel_url, notif_url }
 *    - Auth: Bearer {oauth_token}
 *    - Response: { payment_url, pay_token, notif_token }
 *
 * 3. Redirect user to payment_url
 * 4. Receive webhook at notif_url with payment status
 * 5. Call completePayment on success
 *
 * Environment variables needed:
 * - ORANGE_MONEY_CLIENT_ID
 * - ORANGE_MONEY_CLIENT_SECRET
 * - ORANGE_MONEY_MERCHANT_KEY
 */
export const initiateOrangeMoneyPayment = action({
    args: {
        amount: v.number(),
    },
    handler: async (): Promise<{ url: string; paymentSessionId: string }> => {
        throw new Error(
            "Orange Money n'est pas encore disponible. " +
            "Ce mode de paiement sera activé prochainement."
        );
    },
});
