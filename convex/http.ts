import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";
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

            if (!value) return new Response("No value", { status: 200 });

            // Case A: Messages entrants
            if (value.messages) {
                const contacts = value.contacts || [];
                for (const message of value.messages) {
                    console.log(`[Webhook] Received message from ${message.from}`);

                    await ctx.runMutation(api.webhook.handleIncomingMessage, {
                        message,
                        phoneNumberId: value.metadata?.phone_number_id,
                        contact: contacts.find((c: any) => c.wa_id === message.from),
                    });
                }
            }

            // Case B: Status updates
            if (value.statuses) {
                for (const status of value.statuses) {
                    console.log(`[Webhook] Status update: ${status.status}`);

                    await ctx.runMutation(api.webhook.handleStatusUpdate, {
                        waMessageId: status.id,
                        status: status.status,
                        timestamp: status.timestamp,
                        errors: status.errors,
                    });
                }
            }

            return new Response("OK", { status: 200 });
        } catch (error) {
            console.error("[Webhook] Error:", error);
            return new Response("Internal Error", { status: 500 });
        }
    }),
});

export default http;
