import { action, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Helper to get active organization ID for current user
 */
export const getActiveOrgId = internalQuery({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) return null;

        const session = await ctx.db
            .query("userSessions")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .first();

        return session?.currentOrganizationId ?? null;
    }
});

/**
 * Saves the WhatsApp configuration for an organization
 */
export const saveWhatsAppConfig = internalMutation({
    args: {
        organizationId: v.id("organizations"),
        accessToken: v.string(),
        phoneNumberId: v.string(),
        wabaId: v.string(),
        displayPhoneNumber: v.optional(v.string()),
        verifiedName: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.organizationId, {
            whatsapp: {
                accessToken: args.accessToken,
                phoneNumberId: args.phoneNumberId,
                businessAccountId: args.wabaId,
                webhookVerifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || "",
                displayPhoneNumber: args.displayPhoneNumber,
                verifiedName: args.verifiedName,
            }
        });
    }
});

// 1. Fetch Available Phone Numbers (Step 1)
export const fetchWhatsAppPhoneNumbers = action({
    args: {
        accessToken: v.string(),
    },
    handler: async (ctx, args) => {
        // Fetch WABA ID
        console.log("Fetching WABA...");
        let wabaId;
        const wabaResponse = await fetch(`https://graph.facebook.com/v19.0/me/whatsapp_business_accounts?access_token=${args.accessToken}`);

        console.log(`[WABA Fetch] Status: ${wabaResponse.status}`);

        if (wabaResponse.ok) {
            const wabaData = await wabaResponse.json();
            console.log(`[WABA Fetch] Data: ${JSON.stringify(wabaData)}`);
            wabaId = wabaData.data?.[0]?.id;
        } else {
            const errorBody = await wabaResponse.text();
            console.error(`[WABA Fetch] Error: ${errorBody}`);
        }

        // Fallback to /me/accounts if needed
        if (!wabaId) {
            console.log("Primary WABA fetch empty, trying fallback /me/accounts...");
            const accountsResponse = await fetch(`https://graph.facebook.com/v19.0/me/accounts?access_token=${args.accessToken}`);

            console.log(`[Fallback Fetch] Status: ${accountsResponse.status}`);

            if (accountsResponse.ok) {
                const accountsData = await accountsResponse.json();
                console.log(`[Fallback Fetch] Data: ${JSON.stringify(accountsData)}`);
                wabaId = accountsData.data?.[0]?.id;
            } else {
                const errorBody = await accountsResponse.text();
                console.error(`[Fallback Fetch] Error: ${errorBody}`);
            }
        }

        // 3. Fallback to /me/businesses (Businesses API)
        if (!wabaId) {
            console.log("Secondary fallback: Checking /me/businesses...");
            const businessesResponse = await fetch(`https://graph.facebook.com/v19.0/me/businesses?access_token=${args.accessToken}`);

            console.log(`[Business Fetch] Status: ${businessesResponse.status}`);

            if (businessesResponse.ok) {
                const businessData = await businessesResponse.json();
                console.log(`[Business Fetch] Data: ${JSON.stringify(businessData)}`);

                const businesses = businessData.data || [];
                // Try to find a WABA in each business
                for (const business of businesses) {
                    console.log(`Checking WABAs for business ${business.id}...`);
                    const wabaRes = await fetch(`https://graph.facebook.com/v19.0/${business.id}/owned_whatsapp_business_accounts?access_token=${args.accessToken}`);
                    if (wabaRes.ok) {
                        const wabaResData = await wabaRes.json();
                        if (wabaResData.data && wabaResData.data.length > 0) {
                            wabaId = wabaResData.data[0].id;
                            console.log(`Found WABA ${wabaId} in business ${business.id}`);
                            break;
                        }
                    }
                }
            } else {
                const errorBody = await businessesResponse.text();
                console.error(`[Business Fetch] Error: ${errorBody}`);
            }
        }

        if (!wabaId) {
            // Instead of throwing, return null to indicate no account found gracefully
            console.log("No WhatsApp Business Account found after all attempts.");
            return { wabaId: null, phoneNumbers: [] };
        }

        // Fetch Phone Numbers
        console.log(`Fetching Phone Numbers for WABA ${wabaId}...`);
        const phoneResponse = await fetch(`https://graph.facebook.com/v19.0/${wabaId}/phone_numbers?access_token=${args.accessToken}`);

        if (!phoneResponse.ok) {
            throw new Error("Failed to fetch WhatsApp Phone Numbers");
        }

        const phoneData = await phoneResponse.json();
        const phoneNumbers = phoneData.data || [];

        return {
            wabaId,
            phoneNumbers: phoneNumbers.map((p: any) => ({
                id: p.id,
                display_phone_number: p.display_phone_number,
                verified_name: p.verified_name,
                quality_rating: p.quality_rating
            }))
        };
    }
});

// 2. Finalize Registration (Step 2 - Save Selected Number + Subscribe Webhooks)
export const finalizeWhatsAppRegistration = action({
    args: {
        accessToken: v.string(),
        wabaId: v.string(),
        phoneNumberId: v.string(),
        displayPhoneNumber: v.optional(v.string()),
        verifiedName: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const orgId = await ctx.runQuery(internal.whatsapp.getActiveOrgId);

        if (!orgId) {
            throw new Error("No active organization found");
        }

        // 1. Subscribe app to WABA webhooks (so incoming messages trigger our webhook)
        console.log(`[REGISTER] Subscribing app to WABA ${args.wabaId} webhooks...`);
        const subscribeRes = await fetch(
            `https://graph.facebook.com/v20.0/${args.wabaId}/subscribed_apps`,
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${args.accessToken}`,
                    "Content-Type": "application/json",
                },
            }
        );
        const subscribeData = await subscribeRes.json();
        if (!subscribeRes.ok) {
            console.error("[REGISTER] Failed to subscribe app to WABA webhooks:", subscribeData);
        } else {
            console.log("[REGISTER] App subscribed to WABA webhooks successfully:", subscribeData);
        }

        // 2. Register phone number for Cloud API messaging
        console.log(`[REGISTER] Registering phone number ${args.phoneNumberId}...`);
        const registerRes = await fetch(
            `https://graph.facebook.com/v20.0/${args.phoneNumberId}/register`,
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${args.accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    messaging_product: "whatsapp",
                    pin: "123456",
                }),
            }
        );
        const registerData = await registerRes.json();
        if (!registerRes.ok) {
            console.error("[REGISTER] Phone registration response:", registerData);
        } else {
            console.log("[REGISTER] Phone registered successfully:", registerData);
        }

        // 3. Save Configuration
        await ctx.runMutation(internal.whatsapp.saveWhatsAppConfig, {
            organizationId: orgId,
            accessToken: args.accessToken,
            phoneNumberId: args.phoneNumberId,
            wabaId: args.wabaId,
            displayPhoneNumber: args.displayPhoneNumber,
            verifiedName: args.verifiedName,
        });

        return { success: true };
    }
});

// Subscribe existing WABA to webhooks (for already connected orgs)
export const subscribeWebhook = action({
    args: {
        organizationId: v.optional(v.id("organizations")),
    },
    handler: async (ctx, args): Promise<{ success: boolean; message: string }> => {
        let orgId: any = args.organizationId;
        if (!orgId) {
            orgId = await ctx.runQuery(internal.whatsapp.getActiveOrgId);
        }
        if (!orgId) throw new Error("No active organization found");

        const org: any = await ctx.runQuery(internal.utils.getOrganization, { id: orgId });
        if (!org?.whatsapp?.businessAccountId || !org?.whatsapp?.accessToken) {
            throw new Error("WhatsApp not configured for this organization");
        }

        const wabaId: string = org.whatsapp.businessAccountId;
        const accessToken: string = org.whatsapp.accessToken;

        console.log(`[SUBSCRIBE] Subscribing app to WABA ${wabaId}...`);
        const res: Response = await fetch(
            `https://graph.facebook.com/v20.0/${wabaId}/subscribed_apps`,
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
            }
        );
        const data: any = await res.json();

        if (!res.ok) {
            console.error("[SUBSCRIBE] Failed:", data);
            throw new Error(data.error?.message || "Failed to subscribe webhook");
        }

        console.log("[SUBSCRIBE] Success:", data);
        return { success: true, message: `WABA ${wabaId} subscribed to webhooks` };
    }
});

// Send a test message to verify WhatsApp connection
export const sendTestMessage = action({
    args: {
        to: v.string(),
        organizationId: v.optional(v.id("organizations")),
        useEnvCredentials: v.optional(v.boolean()),
    },
    handler: async (ctx, args): Promise<{ success: boolean; messageId: string | undefined }> => {
        let phoneNumberId: string = "";
        let accessToken: string = "";

        if (args.useEnvCredentials) {
            phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || "";
            accessToken = process.env.WHATSAPP_ACCESS_TOKEN || "";
        } else {
            let orgId: any = args.organizationId;
            if (!orgId) {
                orgId = await ctx.runQuery(internal.whatsapp.getActiveOrgId);
            }
            if (!orgId) throw new Error("No active organization found");

            const org: any = await ctx.runQuery(internal.utils.getOrganization, { id: orgId });
            phoneNumberId = org?.whatsapp?.phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID || "";
            accessToken = org?.whatsapp?.accessToken || process.env.WHATSAPP_ACCESS_TOKEN || "";
        }

        if (!phoneNumberId || !accessToken) {
            throw new Error("WhatsApp not configured");
        }

        const recipientPhone: string = args.to.replace(/\D/g, '');

        const messageBody = {
            messaging_product: "whatsapp" as const,
            recipient_type: "individual" as const,
            to: recipientPhone,
            type: "text" as const,
            text: {
                preview_url: false,
                body: "Ceci est un message test de Jokko. Votre intégration WhatsApp fonctionne correctement ! ✅"
            }
        };

        const response: Response = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(messageBody),
        });

        const data: any = await response.json();

        if (!response.ok) {
            console.error("[TEST] WhatsApp API Error:", data);
            throw new Error(data.error?.message || "Failed to send test message");
        }

        console.log(`[TEST] Message sent successfully to ${recipientPhone}. ID: ${data.messages?.[0]?.id}`);
        return { success: true, messageId: data.messages?.[0]?.id };
    }
});

// Webhook handler supprimé - centralisé dans http.ts pour éviter la duplication
