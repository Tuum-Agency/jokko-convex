"use node";

/**
 *   ____      _ _     _        _   _
 *  / ___|__ _| | |   / \   ___| |_(_) ___  _ __  ___
 * | |   / _` | | |  / _ \ / __| __| |/ _ \| '_ \/ __|
 * | |__| (_| | | | / ___ \ (__| |_| | (_) | | | \__ \
 *  \____\__,_|_|_|/_/   \_\___|\__|_|\___/|_| |_|___/
 *
 * META GRAPH API ACTIONS FOR WHATSAPP CALLING
 *
 * Sends call signaling commands (pre_accept, accept, reject, terminate)
 * to Meta's WhatsApp Cloud API.
 */

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

const GRAPH_API_VERSION = "v20.0";
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

/**
 * Resolve WhatsApp credentials for a call.
 * Priority: channel WABA config > org DB config > env vars.
 */
async function resolveCallCredentials(
    ctx: any,
    callId: any
) {
    const call = await ctx.runQuery(internal.utils.getCall, { id: callId });
    if (!call) throw new Error(`Call ${callId} not found`);

    const org = await ctx.runQuery(internal.utils.getOrganization, { id: call.organizationId });

    let phoneNumberId: string | undefined;
    let accessToken: string | undefined;

    // Try channel-specific credentials first
    if (call.whatsappChannelId) {
        const channel = await ctx.runQuery(internal.utils.getWhatsAppChannel, { id: call.whatsappChannelId });
        if (channel?.wabaId) {
            const waba = await ctx.runQuery(internal.utils.getWaba, { id: channel.wabaId });
            if (waba?.accessTokenRef) {
                accessToken = waba.accessTokenRef;
            }
            phoneNumberId = channel.phoneNumberId;
        }
    }

    // Fallback to org config
    if (!phoneNumberId) phoneNumberId = org?.whatsapp?.phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID;
    if (!accessToken) accessToken = org?.whatsapp?.accessToken || process.env.WHATSAPP_ACCESS_TOKEN;

    if (!phoneNumberId || !accessToken) {
        throw new Error(`Missing WhatsApp credentials for call ${callId}`);
    }

    return { call, phoneNumberId, accessToken };
}

/**
 * Send a call action to Meta Graph API.
 */
async function sendCallAction(
    phoneNumberId: string,
    accessToken: string,
    payload: Record<string, any>
) {
    const url = `${GRAPH_API_BASE}/${phoneNumberId}/calls`;

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            messaging_product: "whatsapp",
            ...payload,
        }),
    });

    const responseText = await response.text();

    if (!response.ok) {
        console.error(`[CALL_ACTION] API error ${response.status}:`, responseText);
        throw new Error(`Meta API error: ${response.status} - ${responseText}`);
    }

    console.log(`[CALL_ACTION] Success:`, responseText);
    return JSON.parse(responseText);
}

// ============================================
// PRE_ACCEPT: Send SDP answer, begin WebRTC handshake
// ============================================

export const sendPreAccept = internalAction({
    args: {
        callId: v.id("calls"),
    },
    handler: async (ctx, args) => {
        try {
            const { call, phoneNumberId, accessToken } = await resolveCallCredentials(ctx, args.callId);

            if (!call.sdpAnswer) {
                throw new Error("No SDP answer available for pre_accept");
            }

            await sendCallAction(phoneNumberId, accessToken, {
                call_id: call.externalCallId,
                action: "pre_accept",
                session: {
                    sdp: call.sdpAnswer,
                    sdp_type: "answer",
                },
            });

            console.log(`[CALL_ACTION] pre_accept sent for call ${call.externalCallId}`);
        } catch (error) {
            console.error(`[CALL_ACTION] sendPreAccept failed:`, String(error));
            await ctx.runMutation(internal.utils.updateCallStatus, {
                callId: args.callId,
                status: "FAILED",
                terminationReason: `pre_accept failed: ${String(error)}`,
            });
        }
    },
});

// ============================================
// ACCEPT: Finalize the call after WebRTC connected
// ============================================

export const sendAccept = internalAction({
    args: {
        callId: v.id("calls"),
    },
    handler: async (ctx, args) => {
        try {
            const { call, phoneNumberId, accessToken } = await resolveCallCredentials(ctx, args.callId);

            await sendCallAction(phoneNumberId, accessToken, {
                call_id: call.externalCallId,
                action: "accept",
            });

            console.log(`[CALL_ACTION] accept sent for call ${call.externalCallId}`);
        } catch (error) {
            console.error(`[CALL_ACTION] sendAccept failed:`, String(error));
        }
    },
});

// ============================================
// REJECT: Decline the incoming call
// ============================================

export const sendReject = internalAction({
    args: {
        callId: v.id("calls"),
    },
    handler: async (ctx, args) => {
        try {
            const { call, phoneNumberId, accessToken } = await resolveCallCredentials(ctx, args.callId);

            await sendCallAction(phoneNumberId, accessToken, {
                call_id: call.externalCallId,
                action: "reject",
            });

            console.log(`[CALL_ACTION] reject sent for call ${call.externalCallId}`);
        } catch (error) {
            console.error(`[CALL_ACTION] sendReject failed:`, String(error));
        }
    },
});

// ============================================
// TERMINATE: End an active call
// ============================================

export const sendTerminate = internalAction({
    args: {
        callId: v.id("calls"),
    },
    handler: async (ctx, args) => {
        try {
            const { call, phoneNumberId, accessToken } = await resolveCallCredentials(ctx, args.callId);

            await sendCallAction(phoneNumberId, accessToken, {
                call_id: call.externalCallId,
                action: "terminate",
            });

            console.log(`[CALL_ACTION] terminate sent for call ${call.externalCallId}`);
        } catch (error) {
            console.error(`[CALL_ACTION] sendTerminate failed:`, String(error));
        }
    },
});

// ============================================
// ENABLE CALLING: Enable calling on a phone number
// ============================================

// ============================================
// OUTBOUND: Send Call Permission Request (CPR)
// ============================================

export const sendCallPermissionRequest = internalAction({
    args: {
        callId: v.id("calls"),
        organizationId: v.id("organizations"),
        contactPhone: v.string(),
    },
    handler: async (ctx, args) => {
        try {
            const org = await ctx.runQuery(internal.utils.getOrganization, { id: args.organizationId });

            // Resolve credentials (same priority as resolveCallCredentials)
            const call = await ctx.runQuery(internal.utils.getCall, { id: args.callId });
            if (!call) throw new Error(`Call ${args.callId} not found`);

            let phoneNumberId: string | undefined;
            let accessToken: string | undefined;

            if (call.whatsappChannelId) {
                const channel = await ctx.runQuery(internal.utils.getWhatsAppChannel, { id: call.whatsappChannelId });
                if (channel?.wabaId) {
                    const waba = await ctx.runQuery(internal.utils.getWaba, { id: channel.wabaId });
                    if (waba?.accessTokenRef) accessToken = waba.accessTokenRef;
                    phoneNumberId = channel.phoneNumberId;
                }
            }

            if (!phoneNumberId) phoneNumberId = org?.whatsapp?.phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID;
            if (!accessToken) accessToken = org?.whatsapp?.accessToken || process.env.WHATSAPP_ACCESS_TOKEN;

            if (!phoneNumberId || !accessToken) {
                throw new Error(`Missing WhatsApp credentials for CPR`);
            }

            // Update fromPhone on the call record
            await ctx.runMutation(internal.utils.updateCallStatus, {
                callId: args.callId,
                status: "REQUESTING_PERMISSION",
            });

            const recipientPhone = args.contactPhone.replace(/\D/g, "");

            // Send CPR as an interactive call_permission_request message
            // This works within the 24-hour messaging window (active conversation)
            const url = `${GRAPH_API_BASE}/${phoneNumberId}/messages`;
            const payload = {
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: recipientPhone,
                type: "interactive",
                interactive: {
                    type: "call_permission_request",
                    action: {
                        name: "call_permission_request",
                    },
                    body: {
                        text: "Nous souhaitons vous appeler concernant votre conversation.",
                    },
                },
            };

            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const responseText = await response.text();

            if (!response.ok) {
                console.error(`[CALL_ACTION] CPR failed ${response.status}:`, responseText);
                await ctx.runMutation(internal.utils.updateCallStatus, {
                    callId: args.callId,
                    status: "FAILED",
                    terminationReason: `CPR failed: ${response.status} - ${responseText}`,
                });
                return;
            }

            console.log(`[CALL_ACTION] CPR sent to ${recipientPhone}:`, responseText);
        } catch (error) {
            console.error(`[CALL_ACTION] sendCallPermissionRequest failed:`, String(error));
            await ctx.runMutation(internal.utils.updateCallStatus, {
                callId: args.callId,
                status: "FAILED",
                terminationReason: `CPR error: ${String(error)}`,
            });
        }
    },
});

// ============================================
// OUTBOUND: Send call offer with SDP to Meta
// ============================================

export const sendOutboundCallOffer = internalAction({
    args: {
        callId: v.id("calls"),
    },
    handler: async (ctx, args) => {
        try {
            const { call, phoneNumberId, accessToken } = await resolveCallCredentials(ctx, args.callId);

            if (!call.sdpOffer) {
                throw new Error("No SDP offer available for outbound call");
            }

            const recipientPhone = call.toPhone.replace(/\D/g, "");

            const result = await sendCallAction(phoneNumberId, accessToken, {
                to: recipientPhone,
                session: {
                    sdp: call.sdpOffer,
                    sdp_type: "offer",
                },
            });

            // Store the external call ID returned by Meta
            if (result?.call_id) {
                const callDoc = await ctx.runQuery(internal.utils.getCall, { id: args.callId });
                if (callDoc) {
                    await ctx.runMutation(internal.calls.updateExternalCallId, {
                        callId: args.callId,
                        externalCallId: result.call_id,
                    });
                }
            }

            console.log(`[CALL_ACTION] Outbound call offer sent to ${recipientPhone}`);
        } catch (error) {
            const errorStr = String(error);
            console.error(`[CALL_ACTION] sendOutboundCallOffer failed:`, errorStr);

            // Recoverable errors (payment, rate limit, transient) → back to PERMISSION_GRANTED so agent can retry
            const isRecoverable = errorStr.includes("131044") || // payment issue
                errorStr.includes("rate limit") ||
                errorStr.includes("is_transient");

            await ctx.runMutation(internal.utils.updateCallStatus, {
                callId: args.callId,
                status: isRecoverable ? "PERMISSION_GRANTED" : "FAILED",
                terminationReason: `Outbound offer failed: ${errorStr}`,
            });
        }
    },
});

// ============================================
// ENABLE CALLING: Enable calling on a phone number
// ============================================

export const enableCallingOnChannel = internalAction({
    args: {
        phoneNumberId: v.string(),
        accessToken: v.string(),
    },
    handler: async (ctx, args) => {
        const url = `${GRAPH_API_BASE}/${args.phoneNumberId}/settings`;

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${args.accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                calling: { status: "ENABLED" },
            }),
        });

        const responseText = await response.text();

        if (!response.ok) {
            console.error(`[CALL_ACTION] Enable calling failed ${response.status}:`, responseText);
            throw new Error(`Failed to enable calling: ${response.status}`);
        }

        console.log(`[CALL_ACTION] Calling enabled on ${args.phoneNumberId}`);
        return JSON.parse(responseText);
    },
});
