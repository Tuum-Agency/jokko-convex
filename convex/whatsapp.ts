import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

export const webhook = httpAction(async (ctx, request) => {
    const { method } = request;

    if (method === "GET") {
        const url = new URL(request.url);
        const mode = url.searchParams.get("hub.mode");
        const token = url.searchParams.get("hub.verify_token");
        const challenge = url.searchParams.get("hub.challenge");

        console.log(`Webhook verify: mode=${mode}, token=${token}`);

        if (mode === "subscribe" && token === "jokko_webhook_verify_2024") {
            return new Response(challenge, { status: 200 });
        }
        return new Response("Forbidden", { status: 403 });
    }

    if (method === "POST") {
        try {
            const body = await request.json();
            const entry = body.entry?.[0];
            const changes = entry?.changes?.[0];
            const value = changes?.value;

            if (!value) return new Response("No value", { status: 200 });

            if (value.messages) {
                const contacts = value.contacts || [];
                for (const message of value.messages) {
                    const contact = contacts.find((c: any) => c.wa_id === message.from);
                    const phoneNumberId = value.metadata?.phone_number_id;

                    console.log(`Received message from ${message.from}`);

                    await ctx.runMutation(api.webhook.handleIncomingMessage, {
                        message,
                        phoneNumberId,
                        contact
                    });
                }
            }

            if (value.statuses) {
                for (const status of value.statuses) {
                    await ctx.runMutation(api.webhook.handleStatusUpdate, {
                        waMessageId: status.id,
                        status: status.status,
                        timestamp: status.timestamp,
                        errors: status.errors
                    });
                }
            }

            return new Response("OK", { status: 200 });
        } catch (error) {
            console.error("Webhook error:", error);
            return new Response("Internal Error", { status: 500 });
        }
    }

    return new Response("Method not allowed", { status: 405 });
});
