import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";
import { auth } from "./auth";

const http = httpRouter();

auth.addHttpRoutes(http);

http.route({
    path: "/api/whatsapp/webhook",
    method: "GET",
    handler: httpAction(async (ctx, request) => {
        const url = new URL(request.url);
        const mode = url.searchParams.get("hub.mode");
        const token = url.searchParams.get("hub.verify_token");
        const challenge = url.searchParams.get("hub.challenge");

        console.log(`[Convex Webhook] Verify attempt: mode=${mode}, token=${token}`);

        if (mode === "subscribe" && token === "jokko_webhook_verify_2024") {
            console.log("[Convex Webhook] Verified!");
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
            const body = await request.json();
            const entry = body.entry?.[0];
            const changes = entry?.changes?.[0];
            const value = changes?.value;

            if (!value) return new Response("No value", { status: 200 });

            // Case A: Messages entrants
            if (value.messages) {
                const contacts = value.contacts || [];
                for (const message of value.messages) {
                    console.log(`[Convex Webhook] Received message from ${message.from}`);

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
                    console.log(`[Convex Webhook] Status update: ${status.status}`);

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
            console.error("[Convex Webhook] Error:", error);
            return new Response("Internal Error", { status: 500 });
        }
    }),
});

export default http;
