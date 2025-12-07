import { httpAction } from "../_generated/server";
import { api } from "../_generated/api";

export const handleWebhook = httpAction(async (ctx, request) => {
    const { method } = request;

    // 1. Verification Challenge (GET)
    if (method === "GET") {
        const url = new URL(request.url);
        const mode = url.searchParams.get("hub.mode");
        const token = url.searchParams.get("hub.verify_token");
        const challenge = url.searchParams.get("hub.challenge");

        if (mode === "subscribe" && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
            return new Response(challenge, { status: 200 });
        }
        return new Response("Forbidden", { status: 403 });
    }

    // 2. Event Notification (POST)
    if (method === "POST") {
        const body = await request.json();

        // Check if it's a template status update
        // According to Meta docs: entry[].changes[].field = 'message_template_status_update'
        const entry = body.entry?.[0];
        const change = entry?.changes?.[0];

        if (change?.field === "message_template_status_update") {
            const value = change.value;
            const messageTemplateId = value.message_template_id;
            const event = value.event; // APPROVED, REJECTED, PAUSED, etc.
            const reason = value.reason; // For rejection

            console.log(`Received template status update: ${event} for ${messageTemplateId}`);

            // We need to map message_template_id (Meta ID) to our internal ID
            // Ideally our templates table stores `metaTemplateId`.
            // For now, assuming we can find it or this is just a placeholder implementation.

            // To be fully implemented:
            // await ctx.runMutation(api.templates.mutations.updateStatusByMetaId, { 
            //    metaId: messageTemplateId, 
            //    status: event 
            // });
        }

        return new Response("OK", { status: 200 });
    }

    return new Response("Method not allowed", { status: 405 });
});
