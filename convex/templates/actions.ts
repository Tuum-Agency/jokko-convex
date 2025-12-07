
import { v } from "convex/values";
import { action } from "../_generated/server";
import { buildMetaTemplatePayload } from "../lib/templateBuilder";
import { api } from "../_generated/api";

export const submitToMeta = action({
    args: {
        templateId: v.id("templates"),
    },
    handler: async (ctx, args) => {
        // 1. Fetch template data and validate ownership via query
        const template = await ctx.runQuery(api.templates.queries.get, { id: args.templateId });

        if (!template) {
            throw new Error("Template not found or unauthorized");
        }

        // 2. Build payload
        const payload = buildMetaTemplatePayload(template);

        // 3. Get Credentials (from env for now, ideally from Org settings)
        // In a real multi-tenant app, these would come from `ctx.runQuery(api.organizations.getSecrets, ...)`
        const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
        const businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;

        if (!accessToken || !businessAccountId) {
            console.error("Missing WhatsApp credentials in env");
            throw new Error("Configuration error: Missing WhatsApp credentials");
        }

        console.log("Sending payload to Meta:", JSON.stringify(payload, null, 2));

        // 4. Send to Meta Graph API
        const response = await fetch(`https://graph.facebook.com/v21.0/${businessAccountId}/message_templates`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Meta API Error:", data);
            throw new Error(`Meta API Error: ${data.error?.message || 'Unknown error'}`);
        }

        console.log("Meta API Success:", data);

        // Update status to PENDING (Waiting for WhatsApp approval)
        await ctx.runMutation(api.templates.mutations.updateStatus, {
            id: args.templateId,
            status: "PENDING"
        });

        return { success: true, message: "Template submitted for review" };
    },
});
