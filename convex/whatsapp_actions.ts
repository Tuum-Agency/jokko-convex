
import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

export const sendMessage = internalAction({
    args: {
        messageId: v.id("messages"),
        organizationId: v.id("organizations"),
        to: v.string(),
        text: v.string(),
    },
    handler: async (ctx, args) => {
        // 1. Get Organization Config
        const org = await ctx.runQuery(internal.utils.getOrganization, { id: args.organizationId });

        // Resolve Credentials
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
            await ctx.runMutation(internal.utils.updateMessageStatus, {
                messageId: args.messageId,
                status: "FAILED"
            });
            return;
        }

        // Sanitize Phone Number (Remove spaces, ensure no + if WA doesn't want it? Actually WA API allows +, but clean is better)
        // Usually WA API expects E.164 without +, or just digits.
        // Docs: "Recipient's phone number with country code" (e.g., 16315555555)
        // It does NOT want the '+' usually in the JSON body for 'to'.
        // Let's strip everything except digits.
        const recipientPhone = args.to.replace(/\D/g, '');

        console.log(`[OUTBOUND] Sending message to ${recipientPhone} (ID: ${phoneNumberId})`);

        try {
            const response = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    messaging_product: "whatsapp",
                    recipient_type: "individual",
                    to: recipientPhone,
                    type: "text",
                    text: { preview_url: false, body: args.text },
                }),
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
