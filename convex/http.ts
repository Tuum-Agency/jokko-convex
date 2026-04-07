import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { auth } from "./auth";

const http = httpRouter();

auth.addHttpRoutes(http);

/**
 * Vérifie la signature HMAC-SHA256 du webhook WhatsApp via Web Crypto API.
 * Comparaison en temps constant pour prévenir les timing attacks.
 */
async function verifyWebhookSignature(
    rawBody: string,
    signature: string,
    appSecret: string
): Promise<boolean> {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(appSecret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
    );

    const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(rawBody));
    const expectedHex = "sha256=" + Array.from(new Uint8Array(sig))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

    // Comparaison en temps constant
    if (signature.length !== expectedHex.length) return false;
    let mismatch = 0;
    for (let i = 0; i < signature.length; i++) {
        mismatch |= signature.charCodeAt(i) ^ expectedHex.charCodeAt(i);
    }
    return mismatch === 0;
}

http.route({
    path: "/api/whatsapp/webhook",
    method: "GET",
    handler: httpAction(async (ctx, request) => {
        const url = new URL(request.url);
        const mode = url.searchParams.get("hub.mode");
        const token = url.searchParams.get("hub.verify_token");
        const challenge = url.searchParams.get("hub.challenge");

        const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
        if (!verifyToken) {
            console.error("[Webhook] WHATSAPP_WEBHOOK_VERIFY_TOKEN not configured");
            return new Response("Server misconfigured", { status: 500 });
        }

        if (mode === "subscribe" && token === verifyToken) {
            console.log("[Webhook] Verified!");
            return new Response(challenge, { status: 200 });
        }

        return new Response("Forbidden", { status: 403 });
    }),
});

http.route({
    path: "/api/whatsapp/webhook",
    method: "POST",
    handler: httpAction(async (ctx, request) => {
        try {
            // Vérification de la signature X-Hub-Signature-256
            const appSecret = process.env.FACEBOOK_APP_SECRET;
            if (!appSecret) {
                console.error("[Webhook] FACEBOOK_APP_SECRET not configured");
                return new Response("Server misconfigured", { status: 500 });
            }

            const signature = request.headers.get("x-hub-signature-256");
            const rawBody = await request.text();

            if (!signature) {
                console.error("[Webhook] Missing X-Hub-Signature-256 header");
                return new Response("Missing signature", { status: 401 });
            }

            const isValid = await verifyWebhookSignature(rawBody, signature, appSecret);
            if (!isValid) {
                console.error("[Webhook] Invalid signature");
                return new Response("Invalid signature", { status: 401 });
            }

            const body = JSON.parse(rawBody);

            const entry = body.entry?.[0];
            const changes = entry?.changes?.[0];
            const value = changes?.value;

            // Log structuré du payload
            console.log("[Webhook] 📩 Incoming", JSON.stringify({
                object: body.object,
                entryId: entry?.id,
                field: changes?.field,
                phoneNumberId: value?.metadata?.phone_number_id,
                displayPhone: value?.metadata?.display_phone_number,
                hasMessages: !!value?.messages,
                messageCount: value?.messages?.length ?? 0,
                hasStatuses: !!value?.statuses,
                statusCount: value?.statuses?.length ?? 0,
            }));

            if (!value) {
                console.log("[Webhook] ⏭️ No value in payload, skipping");
                return new Response("No value", { status: 200 });
            }

            // Case A: Messages entrants
            if (value.messages) {
                const contacts = value.contacts || [];
                for (const message of value.messages) {
                    const contact = contacts.find((c: any) => c.wa_id === message.from);
                    console.log("[Webhook] 💬 Message", JSON.stringify({
                        from: message.from,
                        contactName: contact?.profile?.name,
                        type: message.type,
                        waMessageId: message.id,
                        phoneNumberId: value.metadata?.phone_number_id,
                        text: message.text?.body?.slice(0, 100),
                        hasContext: !!message.context,
                    }));

                    try {
                        await ctx.runMutation(internal.webhook.handleIncomingMessage, {
                            message,
                            phoneNumberId: value.metadata?.phone_number_id,
                            contact,
                        });
                        console.log(`[Webhook] ✅ Message processed for ${message.from}`);
                    } catch (mutationError) {
                        console.error(`[Webhook] ❌ Mutation error`, JSON.stringify({
                            waMessageId: message.id,
                            from: message.from,
                            error: String(mutationError),
                        }));
                    }
                }
            }

            // Case B: Status updates
            if (value.statuses) {
                for (const status of value.statuses) {
                    console.log("[Webhook] 📊 Status", JSON.stringify({
                        waMessageId: status.id,
                        status: status.status,
                        recipientId: status.recipient_id,
                        timestamp: status.timestamp,
                        hasErrors: !!status.errors?.length,
                    }));

                    try {
                        await ctx.runMutation(internal.webhook.handleStatusUpdate, {
                            waMessageId: status.id,
                            status: status.status,
                            timestamp: status.timestamp,
                            errors: status.errors,
                        });
                    } catch (statusError) {
                        console.error("[Webhook] ❌ Status error", JSON.stringify({
                            waMessageId: status.id,
                            error: String(statusError),
                        }));
                    }
                }
            }

            return new Response("OK", { status: 200 });
        } catch (error) {
            console.error("[Webhook] ❌ Top-level error:", String(error));
            return new Response("Internal Error", { status: 500 });
        }
    }),
});

// ============================================
// STRIPE WEBHOOK
// ============================================

/**
 * Verify Stripe webhook signature using Web Crypto API.
 * Stripe v1 signature: HMAC-SHA256(secret, timestamp + "." + payload)
 */
async function verifyStripeSignature(
    rawBody: string,
    sigHeader: string,
    secret: string
): Promise<boolean> {
    const parts = sigHeader.split(",");
    let timestamp = "";
    let signature = "";
    for (const part of parts) {
        const [key, val] = part.split("=");
        if (key === "t") timestamp = val;
        if (key === "v1") signature = val;
    }
    if (!timestamp || !signature) return false;

    // Reject old timestamps (> 5 min)
    const age = Math.floor(Date.now() / 1000) - parseInt(timestamp);
    if (age > 300) return false;

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
    );

    const signedPayload = `${timestamp}.${rawBody}`;
    const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(signedPayload));
    const expectedHex = Array.from(new Uint8Array(sig))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

    // Constant-time comparison
    if (signature.length !== expectedHex.length) return false;
    let mismatch = 0;
    for (let i = 0; i < signature.length; i++) {
        mismatch |= signature.charCodeAt(i) ^ expectedHex.charCodeAt(i);
    }
    return mismatch === 0;
}

http.route({
    path: "/api/stripe/webhook",
    method: "POST",
    handler: httpAction(async (ctx, request) => {
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
        if (!webhookSecret) {
            console.error("[Stripe Webhook] STRIPE_WEBHOOK_SECRET not configured");
            return new Response("Server misconfigured", { status: 500 });
        }

        const sigHeader = request.headers.get("stripe-signature");
        const rawBody = await request.text();

        if (!sigHeader) {
            return new Response("Missing signature", { status: 401 });
        }

        const isValid = await verifyStripeSignature(rawBody, sigHeader, webhookSecret);
        if (!isValid) {
            console.error("[Stripe Webhook] Invalid signature");
            return new Response("Invalid signature", { status: 401 });
        }

        const event = JSON.parse(rawBody);
        console.log("[Stripe Webhook]", JSON.stringify({ type: event.type, id: event.id }));

        try {
            switch (event.type) {
                case "checkout.session.completed": {
                    const session = event.data.object;

                    if (session.mode === "payment" && session.metadata?.type === "credits") {
                        // Credit recharge payment
                        const paymentSessionId = session.metadata?.paymentSessionId;
                        if (paymentSessionId) {
                            await ctx.runMutation(internal.payments.completePayment, {
                                sessionId: paymentSessionId,
                                providerTransactionId: typeof session.payment_intent === "string"
                                    ? session.payment_intent
                                    : session.payment_intent?.id,
                                webhookEventId: event.id,
                                providerMetadata: {
                                    stripeSessionId: session.id,
                                    paymentStatus: session.payment_status,
                                    amountTotal: session.amount_total,
                                    currency: session.currency,
                                },
                            });
                        } else {
                            console.error("[Stripe Webhook] Credits checkout missing paymentSessionId");
                        }
                        break;
                    }

                    if (session.mode === "subscription") {
                        const orgId = session.metadata?.organizationId;
                        if (!orgId) {
                            console.error("[Stripe Webhook] No organizationId in metadata");
                            break;
                        }

                        const subscriptionId = session.subscription;
                        const customerId = session.customer;

                        await ctx.runMutation(internal.stripe.handleCheckoutCompleted, {
                            organizationId: orgId,
                            stripeCustomerId: customerId,
                            subscriptionId: subscriptionId,
                            priceId: session.metadata?.priceId || "",
                            currentPeriodEnd: 0,
                            status: "active",
                        });
                    }
                    break;
                }

                case "checkout.session.async_payment_succeeded": {
                    const session = event.data.object;
                    if (session.metadata?.type === "credits" && session.metadata?.paymentSessionId) {
                        await ctx.runMutation(internal.payments.completePayment, {
                            sessionId: session.metadata.paymentSessionId,
                            providerTransactionId: typeof session.payment_intent === "string"
                                ? session.payment_intent
                                : session.payment_intent?.id,
                            webhookEventId: event.id,
                        });
                    }
                    break;
                }

                case "checkout.session.async_payment_failed": {
                    const session = event.data.object;
                    if (session.metadata?.type === "credits" && session.metadata?.paymentSessionId) {
                        await ctx.runMutation(internal.payments.failPayment, {
                            sessionId: session.metadata.paymentSessionId,
                            failureReason: "Async payment failed",
                            webhookEventId: event.id,
                        });
                    }
                    break;
                }

                case "customer.subscription.created":
                case "customer.subscription.updated": {
                    const sub = event.data.object;
                    const priceId = sub.items?.data?.[0]?.price?.id || "";

                    await ctx.runMutation(internal.stripe.updateSubscription, {
                        stripeCustomerId: sub.customer,
                        subscriptionId: sub.id,
                        priceId,
                        status: sub.status,
                        currentPeriodEnd: sub.current_period_end,
                        organizationId: sub.metadata?.organizationId || undefined,
                    });
                    break;
                }

                case "customer.subscription.deleted": {
                    const sub = event.data.object;
                    await ctx.runMutation(internal.stripe.cancelSubscription, {
                        stripeCustomerId: sub.customer,
                    });
                    break;
                }

                default:
                    console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
            }
        } catch (error) {
            console.error("[Stripe Webhook] Error processing event:", String(error));
        }

        return new Response("OK", { status: 200 });
    }),
});

// ============================================
// WAVE WEBHOOK
// ============================================

/**
 * Verify Wave webhook signature.
 * Wave sends: Wave-Signature header containing HMAC-SHA256 of timestamp + body.
 * Format: "t={timestamp},v1={signature}"
 */
async function verifyWaveSignature(
    rawBody: string,
    sigHeader: string,
    secret: string
): Promise<boolean> {
    const parts = sigHeader.split(",");
    let timestamp = "";
    let signature = "";
    for (const part of parts) {
        const trimmed = part.trim();
        if (trimmed.startsWith("t=")) timestamp = trimmed.slice(2);
        if (trimmed.startsWith("v1=")) signature = trimmed.slice(3);
    }
    if (!timestamp || !signature) return false;

    // Reject old timestamps (> 5 min)
    const age = Math.floor(Date.now() / 1000) - parseInt(timestamp);
    if (age > 300) return false;

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
    );

    const signedPayload = `${timestamp}.${rawBody}`;
    const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(signedPayload));
    const expectedHex = Array.from(new Uint8Array(sig))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

    // Constant-time comparison
    if (signature.length !== expectedHex.length) return false;
    let mismatch = 0;
    for (let i = 0; i < signature.length; i++) {
        mismatch |= signature.charCodeAt(i) ^ expectedHex.charCodeAt(i);
    }
    return mismatch === 0;
}

http.route({
    path: "/api/wave/webhook",
    method: "POST",
    handler: httpAction(async (ctx, request) => {
        const webhookSecret = process.env.WAVE_WEBHOOK_SECRET;
        if (!webhookSecret) {
            console.error("[Wave Webhook] WAVE_WEBHOOK_SECRET not configured");
            return new Response("Server misconfigured", { status: 500 });
        }

        const sigHeader = request.headers.get("Wave-Signature");
        const rawBody = await request.text();

        if (!sigHeader) {
            return new Response("Missing signature", { status: 401 });
        }

        const isValid = await verifyWaveSignature(rawBody, sigHeader, webhookSecret);
        if (!isValid) {
            console.error("[Wave Webhook] Invalid signature");
            return new Response("Invalid signature", { status: 401 });
        }

        const data = JSON.parse(rawBody);
        console.log("[Wave Webhook]", JSON.stringify({
            type: data.type,
            id: data.id,
            checkout_session_id: data.data?.checkout_session_id,
            payment_status: data.data?.payment_status,
            client_reference: data.data?.client_reference,
        }));

        try {
            const eventData = data.data;
            if (!eventData?.checkout_session_id) {
                console.log("[Wave Webhook] No checkout_session_id, skipping");
                return new Response("OK", { status: 200 });
            }

            // Lookup payment session by Wave checkout session ID
            const paymentSession = await ctx.runQuery(
                internal.payments.getPaymentSessionByProviderSessionId,
                { providerSessionId: eventData.checkout_session_id }
            );

            if (!paymentSession) {
                console.error("[Wave Webhook] No matching payment session for:", eventData.checkout_session_id);
                return new Response("OK", { status: 200 });
            }

            if (eventData.payment_status === "succeeded") {
                await ctx.runMutation(internal.payments.completePayment, {
                    sessionId: paymentSession._id,
                    providerTransactionId: eventData.transaction_id || data.id,
                    webhookEventId: data.id,
                    providerMetadata: eventData,
                });
            } else if (eventData.payment_status === "failed" || eventData.payment_status === "cancelled") {
                await ctx.runMutation(internal.payments.failPayment, {
                    sessionId: paymentSession._id,
                    failureReason: `Wave payment ${eventData.payment_status}`,
                    webhookEventId: data.id,
                    providerMetadata: eventData,
                });
            }
        } catch (error) {
            console.error("[Wave Webhook] Error processing event:", String(error));
        }

        return new Response("OK", { status: 200 });
    }),
});

export default http;
