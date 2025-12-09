
import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

export const sendMessage = internalAction({
    args: {
        messageId: v.id("messages"),
        organizationId: v.id("organizations"),
        to: v.string(),
        text: v.optional(v.string()),
        type: v.optional(v.string()), // "text" (default) or "interactive"
        interactive: v.optional(v.any()), // JSON payload for interactive messages
    },
    handler: async (ctx, args) => {
        // 1. Get Organization Config
        const org = await ctx.runQuery(internal.utils.getOrganization, { id: args.organizationId });

        // Resolve Credentials
        // Prioritize ENV vars
        const envPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
        const envToken = process.env.WHATSAPP_ACCESS_TOKEN;

        console.log(`[DEBUG] Env Vars - PhoneID: ${envPhoneId ? "Set" : "Missing"}, Token: ${envToken ? "Set" : "Missing"}`);

        let phoneNumberId = envPhoneId || org?.whatsapp?.phoneNumberId;
        let accessToken = envToken || org?.whatsapp?.accessToken;

        if (!phoneNumberId || !accessToken) {
            console.log(`[DEBUG] Org Config - PhoneID: ${org?.whatsapp?.phoneNumberId}, Token: ${org?.whatsapp?.accessToken ? "Set" : "Missing"}`);
            console.error(`[OUTBOUND] Missing WhatsApp credentials (DB or ENV) for Org ${args.organizationId}`);
            // ... failure handling ...
            await ctx.runMutation(internal.utils.updateMessageStatus, {
                messageId: args.messageId,
                status: "FAILED"
            });
            return;
        }

        const recipientPhone = args.to.replace(/\D/g, '');

        console.log(`[OUTBOUND] Sending message to ${recipientPhone} (ID: ${phoneNumberId})`);

        // Construct Payload
        const type = args.type || "text";
        let messageBody: any = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: recipientPhone,
            type: type
        };

        if (type === "text") {
            messageBody.text = { preview_url: false, body: args.text };
        } else if (type === "interactive" && args.interactive) {
            messageBody.interactive = args.interactive;
        }

        try {
            const response = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(messageBody),
            });

            const data = await response.json();

            if (!response.ok) {
                console.error(`[OUTBOUND] WhatsApp API Error:`, data);
                await ctx.runMutation(internal.utils.updateMessageStatus, {
                    messageId: args.messageId,
                    status: "FAILED"
                });
            } else {
                console.log(`[OUTBOUND] Message sent. WhatsApp ID: ${data.messages?.[0]?.id}`);
                await ctx.runMutation(internal.utils.updateMessageStatus, {
                    messageId: args.messageId,
                    status: "SENT",
                    externalId: data.messages?.[0]?.id
                });
            }
        } catch (error) {
            console.error(`[OUTBOUND] Network Error:`, error);
            await ctx.runMutation(internal.utils.updateMessageStatus, {
                messageId: args.messageId,
                status: "FAILED"
            });
        }
    },
});
