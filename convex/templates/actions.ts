
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

        // Update status to PENDING and save Meta ID
        await ctx.runMutation(api.templates.mutations.updateStatus, {
            id: args.templateId,
            status: "PENDING",
            metaTemplateId: data.id
        });

        return { success: true, message: "Template submitted for review" };
    },
});

export const syncFromMeta = action({
    args: {},
    handler: async (ctx) => {
        console.log("Starting Template Sync from Meta...");

        // 1. Get credentials
        const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
        const businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;

        if (!accessToken || !businessAccountId) {
            throw new Error("Missing WhatsApp credentials");
        }

        // 2. Fetch all templates from Meta
        const response = await fetch(
            `https://graph.facebook.com/v21.0/${businessAccountId}/message_templates?fields=name,status,id&limit=100`,
            {
                headers: { "Authorization": `Bearer ${accessToken}` }
            }
        );

        if (!response.ok) {
            const err = await response.json();
            console.error("Meta Sync Error:", err);
            throw new Error(`Meta API Sync Error: ${err.error?.message || 'Unknown'}`);
        }

        const data = await response.json();
        const metaTemplates = data.data as Array<{ name: string, status: string, id: string }>;

        console.log(`Fetched ${metaTemplates?.length || 0} templates from Meta`);

        if (!metaTemplates || metaTemplates.length === 0) {
            return { message: "No templates found on Meta", updated: 0 };
        }

        // 3. Get local templates
        const localTemplates = await ctx.runQuery(api.templates.queries.listForSync);
        console.log(`Found ${localTemplates.length} local templates to check`);

        // 4. Match and Update
        let updatedCount = 0;

        for (const local of localTemplates) {
            const remote = metaTemplates.find(t => t.name === local.name);
            if (remote) {
                const newStatus = remote.status.toUpperCase();

                if (local.status !== newStatus || local.metaTemplateId !== remote.id) {
                    console.log(`Updating ${local.name}: ${local.status} -> ${newStatus}`);
                    await ctx.runMutation(api.templates.mutations.updateStatus, {
                        id: local._id,
                        status: newStatus,
                        metaTemplateId: remote.id
                    });
                    updatedCount++;
                }
            }
        }

        return { success: true, message: `Sync completed. Updated ${updatedCount} templates.`, updated: updatedCount };
    }
});
