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
 * Helper to get current authenticated user ID (for use in actions)
 */
export const getAuthUserIdQuery = internalQuery({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        return userId;
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

/**
 * Get phone number status from Meta API for the current org's connected number
 */
export const getPhoneNumberStatus = action({
    args: {},
    handler: async (ctx): Promise<Record<string, string> | null> => {
        const orgId: string | null = await ctx.runQuery(internal.whatsapp.getActiveOrgId);
        if (!orgId) throw new Error("Non authentifié");

        const org: any = await ctx.runQuery(internal.utils.getOrganization, { id: orgId as any });
        if (!org?.whatsapp?.phoneNumberId || !org?.whatsapp?.accessToken) {
            return null;
        }

        const phoneNumberId: string = org.whatsapp.phoneNumberId;
        const accessToken: string = org.whatsapp.accessToken;
        const res: Response = await fetch(
            `https://graph.facebook.com/v19.0/${phoneNumberId}?fields=quality_rating,platform_type,status,name_status,messaging_limit_tier`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        if (!res.ok) {
            const err: any = await res.json();
            return { error: err.error?.message || "Erreur API Meta" };
        }

        return await res.json() as Record<string, string>;
    }
});

/**
 * Get live status for a specific channel from Meta API.
 * Resolves credentials from wabas table, falls back to org.whatsapp legacy.
 */
export const getChannelStatus = action({
    args: { channelId: v.id("whatsappChannels") },
    handler: async (ctx, args): Promise<Record<string, string> | null> => {
        const channel: any = await ctx.runQuery(internal.channels.getChannelWithWaba, { channelId: args.channelId });

        const accessToken: string = channel.waba?.accessTokenRef || channel.orgWhatsapp?.accessToken || "";
        const phoneNumberId: string = channel.phoneNumberId;

        if (!accessToken || !phoneNumberId) return null;

        const res: Response = await fetch(
            `https://graph.facebook.com/v19.0/${phoneNumberId}?fields=quality_rating,platform_type,status,name_status,messaging_limit_tier`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        if (!res.ok) {
            const err: any = await res.json();
            return { error: err.error?.message || "Erreur API Meta" };
        }

        return await res.json() as Record<string, string>;
    }
});

/**
 * Send a test message using a specific channel's credentials.
 */
export const sendTestMessageByChannel = action({
    args: {
        channelId: v.id("whatsappChannels"),
        to: v.string(),
    },
    handler: async (ctx, args): Promise<{ success: boolean; messageId: string | undefined }> => {
        const channel: any = await ctx.runQuery(internal.channels.getChannelWithWaba, { channelId: args.channelId });

        const accessToken: string = channel.waba?.accessTokenRef || channel.orgWhatsapp?.accessToken || "";
        const phoneNumberId: string = channel.phoneNumberId;

        if (!phoneNumberId || !accessToken) {
            throw new Error("Credentials WhatsApp non configurées pour ce canal");
        }

        const recipientPhone: string = args.to.replace(/\D/g, '');

        const response: Response = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
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
                text: {
                    preview_url: false,
                    body: `Test Jokko — Canal "${channel.label || channel.displayPhoneNumber}". Votre intégration fonctionne ! ✅`
                }
            }),
        });

        const data: any = await response.json();

        if (!response.ok) {
            console.error("[TEST-CHANNEL] WhatsApp API Error:", data);
            throw new Error(data.error?.message || "Échec de l'envoi du message test");
        }

        console.log(`[TEST-CHANNEL] Message sent to ${recipientPhone} via channel ${channel.label}. ID: ${data.messages?.[0]?.id}`);
        return { success: true, messageId: data.messages?.[0]?.id };
    }
});

// 1. Fetch Available Phone Numbers (Step 1) — aggregates ALL WABAs
export const fetchWhatsAppPhoneNumbers = action({
    args: {
        accessToken: v.string(),
    },
    handler: async (ctx, args) => {
        // Auth check: require authenticated user with active org
        const orgId: string | null = await ctx.runQuery(internal.whatsapp.getActiveOrgId);
        if (!orgId) throw new Error("Not authenticated or no active organization");

        const allWabaIds: string[] = [];

        // Helper: fetch phone numbers for a single WABA
        async function fetchPhonesForWaba(wabaId: string): Promise<any[]> {
            console.log(`[WABA] Fetching phones for WABA ${wabaId}...`);
            const res = await fetch(
                `https://graph.facebook.com/v19.0/${wabaId}/phone_numbers?fields=id,display_phone_number,verified_name,quality_rating,platform_type,status`,
                { headers: { Authorization: `Bearer ${args.accessToken}` } }
            );
            if (!res.ok) {
                console.error(`[WABA] Failed to fetch phones for ${wabaId}`);
                return [];
            }
            const data = await res.json();
            return (data.data || []).map((p: any) => ({
                id: p.id,
                display_phone_number: p.display_phone_number,
                verified_name: p.verified_name,
                quality_rating: p.quality_rating,
                platform_type: p.platform_type,
                status: p.status,
                wabaId,
            }));
        }

        // 1. Primary: /me/whatsapp_business_accounts (may return multiple)
        console.log("Fetching WABAs...");
        const wabaResponse = await fetch(`https://graph.facebook.com/v19.0/me/whatsapp_business_accounts`, {
            headers: { Authorization: `Bearer ${args.accessToken}` },
        });
        if (wabaResponse.ok) {
            const wabaData = await wabaResponse.json();
            console.log(`[WABA Fetch] Found ${wabaData.data?.length || 0} WABAs`);
            for (const waba of (wabaData.data || [])) {
                if (waba.id && !allWabaIds.includes(waba.id)) allWabaIds.push(waba.id);
            }
        } else {
            console.error(`[WABA Fetch] Error: ${await wabaResponse.text()}`);
        }

        // 2. Fallback: /me/businesses → owned_whatsapp_business_accounts
        if (allWabaIds.length === 0) {
            console.log("No WABAs from primary, trying /me/businesses...");
            const businessesResponse = await fetch(`https://graph.facebook.com/v19.0/me/businesses`, {
                headers: { Authorization: `Bearer ${args.accessToken}` },
            });
            if (businessesResponse.ok) {
                const businessData = await businessesResponse.json();
                for (const business of (businessData.data || [])) {
                    const wabaRes = await fetch(`https://graph.facebook.com/v19.0/${business.id}/owned_whatsapp_business_accounts`, {
                        headers: { Authorization: `Bearer ${args.accessToken}` },
                    });
                    if (wabaRes.ok) {
                        const wabaResData = await wabaRes.json();
                        for (const waba of (wabaResData.data || [])) {
                            if (waba.id && !allWabaIds.includes(waba.id)) {
                                allWabaIds.push(waba.id);
                                console.log(`[Business] Found WABA ${waba.id} in business ${business.id}`);
                            }
                        }
                    }
                }
            } else {
                console.error(`[Business Fetch] Error: ${await businessesResponse.text()}`);
            }
        }

        if (allWabaIds.length === 0) {
            console.log("No WhatsApp Business Account found after all attempts.");
            return { wabaIds: [] as string[], wabaId: null as string | null, phoneNumbers: [] as any[] };
        }

        // 3. Fetch phone numbers from ALL WABAs
        const allPhoneNumbers: any[] = [];
        const seenPhoneIds = new Set<string>();

        for (const wabaId of allWabaIds) {
            const phones = await fetchPhonesForWaba(wabaId);
            for (const phone of phones) {
                if (!seenPhoneIds.has(phone.id)) {
                    seenPhoneIds.add(phone.id);
                    allPhoneNumbers.push(phone);
                }
            }
        }

        console.log(`[WABA] Total: ${allWabaIds.length} WABAs, ${allPhoneNumbers.length} phone numbers`);

        return {
            wabaIds: allWabaIds,
            // Keep wabaId for backwards compat (first WABA)
            wabaId: allWabaIds[0] || null,
            phoneNumbers: allPhoneNumbers,
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
                    pin: crypto.randomUUID().replace(/-/g, "").substring(0, 6),
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
        // Auth check
        const orgId = await ctx.runQuery(internal.whatsapp.getActiveOrgId);
        if (!orgId) throw new Error("Not authenticated or no active organization");

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

// Diagnostic: Check WhatsApp phone number status, webhook subscription, and app config
export const diagnoseWebhook = action({
    args: {
        organizationId: v.optional(v.id("organizations")),
    },
    handler: async (ctx, args) => {
        // Auth check: require authenticated user
        const activeOrg = await ctx.runQuery(internal.whatsapp.getActiveOrgId);
        if (!activeOrg) throw new Error("Not authenticated or no active organization");

        const results: Record<string, any> = {};

        // 1. Get org
        let orgId: any = args.organizationId || activeOrg;
        if (!orgId) {
            // List all orgs with WhatsApp configured
            const orgs = await ctx.runQuery(internal.utils.listWhatsAppOrgs);
            if (orgs.length === 0) return { error: "No organizations with WhatsApp configured" };
            if (orgs.length > 0) {
                // Use first org found
                orgId = orgs[0]._id;
                console.log(`[DIAGNOSE] No orgId provided, using first WhatsApp org: ${orgs[0].name} (${orgId})`);
            }
        }

        const org: any = await ctx.runQuery(internal.utils.getOrganization, { id: orgId });
        if (!org?.whatsapp) return { error: "WhatsApp not configured for this organization", orgId };

        const { phoneNumberId, businessAccountId: wabaId, accessToken } = org.whatsapp;
        results.config = {
            phoneNumberId,
            wabaId,
            hasAccessToken: !!accessToken,
            displayPhoneNumber: org.whatsapp.displayPhoneNumber,
            verifiedName: org.whatsapp.verifiedName,
        };

        // 2. Check phone number status
        try {
            const phoneRes = await fetch(
                `https://graph.facebook.com/v20.0/${phoneNumberId}?fields=verified_name,display_phone_number,quality_rating,platform_type,status,name_status,messaging_limit_tier,is_official_business_account,account_mode`,
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            const phoneData = await phoneRes.json();
            results.phoneNumber = phoneRes.ok ? phoneData : { error: phoneData.error };
        } catch (e: any) {
            results.phoneNumber = { error: e.message };
        }

        // 3. Check WABA subscribed apps
        try {
            const subsRes = await fetch(
                `https://graph.facebook.com/v20.0/${wabaId}/subscribed_apps`,
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            const subsData = await subsRes.json();
            results.subscribedApps = subsRes.ok ? subsData : { error: subsData.error };
        } catch (e: any) {
            results.subscribedApps = { error: e.message };
        }

        // 4. Check webhook URL configured on the app (requires app-level token)
        const appId = process.env.FACEBOOK_APP_ID;
        const appSecret = process.env.FACEBOOK_APP_SECRET;
        if (appId && appSecret) {
            try {
                const appTokenRes = await fetch(
                    `https://graph.facebook.com/v20.0/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&grant_type=client_credentials`
                );
                const appTokenData = await appTokenRes.json();
                if (appTokenData.access_token) {
                    const webhookRes = await fetch(
                        `https://graph.facebook.com/v20.0/${appId}/subscriptions`,
                        { headers: { Authorization: `Bearer ${appTokenData.access_token}` } }
                    );
                    const webhookData = await webhookRes.json();
                    results.appWebhookSubscriptions = webhookRes.ok ? webhookData : { error: webhookData.error };
                }
            } catch (e: any) {
                results.appWebhookSubscriptions = { error: e.message };
            }
        } else {
            results.appWebhookSubscriptions = { warning: "FACEBOOK_APP_ID or FACEBOOK_APP_SECRET not set" };
        }

        // 5. Env vars check
        results.envVars = {
            FACEBOOK_APP_SECRET: !!process.env.FACEBOOK_APP_SECRET,
            FACEBOOK_APP_ID: !!process.env.FACEBOOK_APP_ID,
            WHATSAPP_WEBHOOK_VERIFY_TOKEN: !!process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN,
        };

        console.log("[DIAGNOSE] Full results:", JSON.stringify(results, null, 2));
        return results;
    },
});

/**
 * Add a new WhatsApp channel to the organization.
 * Orchestrates: Meta API subscribe/register → WABA record → Channel record → legacy compat.
 */
export const addChannel = action({
    args: {
        accessToken: v.string(),
        wabaId: v.string(),
        phoneNumberId: v.string(),
        displayPhoneNumber: v.optional(v.string()),
        verifiedName: v.optional(v.string()),
        label: v.optional(v.string()),
    },
    handler: async (ctx, args): Promise<{ success: boolean; channelId: string }> => {
        // 1. Auth
        const orgId: string | null = await ctx.runQuery(internal.whatsapp.getActiveOrgId);
        if (!orgId) throw new Error("No active organization found");

        const userId: string | null = await ctx.runQuery(internal.whatsapp.getAuthUserIdQuery);
        if (!userId) throw new Error("Not authenticated");

        // 2. Exchange short-lived token for long-lived token (~60 days)
        let longLivedToken = args.accessToken;
        const appId = process.env.FACEBOOK_APP_ID;
        const appSecret = process.env.FACEBOOK_APP_SECRET;

        if (appId && appSecret) {
            try {
                console.log("[ADD_CHANNEL] Exchanging short-lived token for long-lived token...");
                const exchangeRes = await fetch(
                    `https://graph.facebook.com/v20.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${args.accessToken}`
                );
                const exchangeData: any = await exchangeRes.json();

                if (exchangeRes.ok && exchangeData.access_token) {
                    longLivedToken = exchangeData.access_token;
                    const expiresInDays = exchangeData.expires_in ? Math.round(exchangeData.expires_in / 86400) : "unknown";
                    console.log(`[ADD_CHANNEL] Token exchanged successfully. Expires in ~${expiresInDays} days.`);
                } else {
                    console.warn("[ADD_CHANNEL] Token exchange failed, using short-lived token:", exchangeData.error?.message || exchangeData);
                }
            } catch (e) {
                console.warn("[ADD_CHANNEL] Token exchange error, using short-lived token:", e);
            }
        } else {
            console.warn("[ADD_CHANNEL] FACEBOOK_APP_ID or FACEBOOK_APP_SECRET not set, cannot exchange token");
        }

        // 3. Subscribe app to WABA webhooks
        console.log(`[ADD_CHANNEL] Subscribing app to WABA ${args.wabaId} webhooks...`);
        const subscribeRes: Response = await fetch(
            `https://graph.facebook.com/v20.0/${args.wabaId}/subscribed_apps`,
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${longLivedToken}`,
                    "Content-Type": "application/json",
                },
            }
        );
        const subscribeData: any = await subscribeRes.json();
        if (!subscribeRes.ok) {
            console.error("[ADD_CHANNEL] Failed to subscribe:", subscribeData);
        } else {
            console.log("[ADD_CHANNEL] Subscribed successfully:", subscribeData);
        }

        // 4. Register phone number for Cloud API
        console.log(`[ADD_CHANNEL] Registering phone number ${args.phoneNumberId}...`);
        const registerRes: Response = await fetch(
            `https://graph.facebook.com/v20.0/${args.phoneNumberId}/register`,
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${longLivedToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    messaging_product: "whatsapp",
                    pin: crypto.randomUUID().replace(/-/g, "").substring(0, 6),
                }),
            }
        );
        const registerData: any = await registerRes.json();
        if (!registerRes.ok) {
            console.error("[ADD_CHANNEL] Phone registration response:", registerData);
        } else {
            console.log("[ADD_CHANNEL] Phone registered successfully:", registerData);
        }

        // 5. Create or get WABA record (with long-lived token)
        const wabaDocId: string = await ctx.runMutation(internal.channels.getOrCreateWaba, {
            organizationId: orgId as any,
            metaBusinessAccountId: args.wabaId,
            accessTokenRef: longLivedToken,
            createdBy: userId as any,
        });

        // 6. Create channel record
        const channelId: string = await ctx.runMutation(internal.channels.internalCreate, {
            organizationId: orgId as any,
            wabaId: wabaDocId as any,
            label: args.label || args.verifiedName || args.displayPhoneNumber || "WhatsApp",
            phoneNumberId: args.phoneNumberId,
            displayPhoneNumber: args.displayPhoneNumber || "",
            verifiedName: args.verifiedName,
            createdBy: userId as any,
        });

        // 7. Legacy compat: update organizations.whatsapp (with long-lived token)
        await ctx.runMutation(internal.whatsapp.saveWhatsAppConfig, {
            organizationId: orgId as any,
            accessToken: longLivedToken,
            phoneNumberId: args.phoneNumberId,
            wabaId: args.wabaId,
            displayPhoneNumber: args.displayPhoneNumber,
            verifiedName: args.verifiedName,
        });

        console.log(`[ADD_CHANNEL] Channel ${channelId} created successfully`);
        return { success: true, channelId };
    },
});
