import { httpAction, action, internalMutation, internalQuery } from "./_generated/server";
import { api, internal } from "./_generated/api";
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
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.organizationId, {
            whatsapp: {
                accessToken: args.accessToken,
                phoneNumberId: args.phoneNumberId, // We use this for sending
                businessAccountId: args.wabaId,
                webhookVerifyToken: "jokko_webhook_verify_2024", // Default verification token
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

// 2. Finalize Registration (Step 2 - Save Selected Number)
export const finalizeWhatsAppRegistration = action({
    args: {
        accessToken: v.string(),
        wabaId: v.string(),
        phoneNumberId: v.string(),
    },
    handler: async (ctx, args) => {
        const orgId = await ctx.runQuery(internal.whatsapp.getActiveOrgId);

        if (!orgId) {
            throw new Error("No active organization found");
        }

        // Save Configuration
        await ctx.runMutation(internal.whatsapp.saveWhatsAppConfig, {
            organizationId: orgId,
            accessToken: args.accessToken,
            phoneNumberId: args.phoneNumberId,
            wabaId: args.wabaId
        });

        return { success: true };
    }
});

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
