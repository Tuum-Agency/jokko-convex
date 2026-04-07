import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// Gérer un message entrant (internal only — called from http.ts webhook handler)
export const handleIncomingMessage = internalMutation({
    args: {
        // v.any() pour accepter tous les formats de message WhatsApp
        // (v.object strict rejetait les champs inconnus envoyés par Meta)
        message: v.any(),
        phoneNumberId: v.optional(v.string()),
        contact: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        const { message, phoneNumberId } = args;
        const from = message.from; // Numéro de téléphone
        const name = args.contact?.profile?.name || from;

        // 1. Trouver l'organisation via whatsappChannels (nouveau modèle) puis fallback legacy
        if (!phoneNumberId) {
            console.error("[WHATSAPP] Missing phoneNumberId in webhook event");
            return;
        }

        // Nouveau modèle: lookup via whatsappChannels
        const channel = await ctx.db
            .query("whatsappChannels")
            .withIndex("by_phone_id", (q) => q.eq("phoneNumberId", phoneNumberId))
            .first();

        let organizationId: Id<"organizations">;
        let whatsappChannelId: Id<"whatsappChannels"> | undefined;

        if (channel) {
            if (channel.status !== "active") {
                console.log(`[WHATSAPP] Channel ${phoneNumberId} is ${channel.status}, skipping`);
                return;
            }
            organizationId = channel.organizationId;
            whatsappChannelId = channel._id;

            // Update lastWebhookAt
            await ctx.db.patch(channel._id, { lastWebhookAt: Date.now() });
        } else {
            // Fallback legacy: lookup via organizations
            const organization = await ctx.db
                .query("organizations")
                .withIndex("by_whatsapp_phone_id", (q) => q.eq("whatsapp.phoneNumberId", phoneNumberId))
                .first();

            if (!organization) {
                console.error(`[WHATSAPP] No channel or organization found for phoneNumberId: ${phoneNumberId}`);
                return;
            }
            organizationId = organization._id;

            // Try to find default channel for this org (if migration partially done)
            const defaultChannel = await ctx.db
                .query("whatsappChannels")
                .withIndex("by_org_default", (q) => q.eq("organizationId", organizationId).eq("isOrgDefault", true))
                .first();
            whatsappChannelId = defaultChannel?._id;
        }

        const organization = await ctx.db.get(organizationId);
        if (!organization) {
            console.error(`[WHATSAPP] Organization ${organizationId} not found`);
            return;
        }

        // 2. Trouver ou créer le contact
        let contact = await ctx.db
            .query("contacts")
            .withIndex("by_org_phone", (q) =>
                q.eq("organizationId", organization._id).eq("phone", from)
            )
            .first();

        if (!contact) {
            const contactId = await ctx.db.insert("contacts", {
                organizationId: organizationId,
                phone: from,
                name: name,
                searchName: `${name} ${from}`,
                isWhatsApp: true,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });
            contact = await ctx.db.get(contactId);
        }

        if (!contact) throw new Error("Failed to get contact");

        // BLOCK CHECK
        if (contact.isBlocked) {
            console.log(`[WHATSAPP] Ignoring message from blocked contact: ${from}`);
            return;
        }

        // 3. Trouver ou créer la conversation (using composite index)
        let conversation = await ctx.db
            .query("conversations")
            .withIndex("by_org_contact", (q) =>
                q.eq("organizationId", organization._id)
                    .eq("contactId", contact!._id)
                    .eq("status", "OPEN")
            )
            .first();

        if (!conversation) {
            const conversationId = await ctx.db.insert("conversations", {
                organizationId: organizationId,
                contactId: contact._id,
                status: "OPEN",
                unreadCount: 0,
                lastMessageAt: Date.now(),
                channel: "WHATSAPP",
                whatsappChannelId: whatsappChannelId,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });
            conversation = await ctx.db.get(conversationId);
        }

        if (!conversation) throw new Error("Failed to get conversation");

        // Check for first message (before inserting the new one)
        const existingInbound = await ctx.db
            .query("messages")
            .withIndex("by_conversation", (q) => q.eq("conversationId", conversation!._id))
            .filter((q) => q.eq(q.field("direction"), "INBOUND"))
            .first();
        const isFirstMessage = !existingInbound;

        // 4. Enregistrer le message
        let content = "";
        let type = "TEXT";
        let mediaUrl = undefined;
        let mediaType = undefined;

        if (message.type === "text" && message.text) {
            content = message.text.body;
        } else if (message.type === "image" && message.image) {
            type = "IMAGE";
            content = message.image.caption || "";
            mediaUrl = message.image.id;
            mediaType = message.image.mime_type;
        } else if (message.type === "audio" && message.audio) {
            type = "AUDIO";
            content = "";
            mediaUrl = message.audio.id;
            mediaType = message.audio.mime_type;
        } else if (message.type === "video" && message.video) {
            type = "VIDEO";
            content = message.video.caption || "";
            mediaUrl = message.video.id;
            mediaType = message.video.mime_type;
        } else if (message.type === "document" && message.document) {
            type = "DOCUMENT";
            content = message.document.caption || "";
            mediaUrl = message.document.id;
            mediaType = message.document.mime_type;
        } else if (message.type === "sticker" && message.sticker) {
            type = "STICKER";
            content = "";
            mediaUrl = message.sticker.id;
            mediaType = message.sticker.mime_type;
        } else if (["interactive", "button", "simple_button"].includes(message.type.toLowerCase())) {
            type = "INTERACTIVE";
            const interactive = message.interactive;
            const button = message.button;

            if (interactive) {
                console.log("Interactive Payload:", JSON.stringify(interactive));

                if (interactive.type === "button_reply" || message.type === "button") {
                    const reply = interactive.button_reply;
                    content = reply?.title || reply?.id || "Bouton";
                } else if (interactive.type === "list_reply") {
                    const reply = interactive.list_reply;
                    content = reply?.title || reply?.id || "Liste";
                } else if (interactive.type === "nfm_reply") {
                    content = interactive.nfm_reply?.body || "Réponse Flow";
                } else {
                    content = interactive.active_title || interactive.body || `[Interaction: ${interactive.type || message.type}]`;
                }
            } else if (button) {
                content = button.title || button.id || "Bouton";
            } else {
                content = `[Interaction: ${message.type}]`;
            }
        } else {
            type = message.type.toUpperCase();
            content = `[${type}] ${JSON.stringify(message).slice(0, 100)}`;
        }

        const newMessageId = await ctx.db.insert("messages", {
            organizationId: organizationId,
            conversationId: conversation._id,
            contactId: contact._id,
            // senderId: doit être undefined pour les messages entrants (système/contact)

            type: type,
            content: content,
            mediaUrl: mediaUrl,
            mediaType: mediaType,

            direction: "INBOUND",
            status: "DELIVERED",

            externalId: message.id,

            createdAt: Number(message.timestamp) * 1000,
            updatedAt: Date.now(),
        });

        // 5. Schedule media download for media messages
        if (mediaUrl && ["IMAGE", "AUDIO", "VIDEO", "DOCUMENT", "STICKER"].includes(type)) {
            await ctx.scheduler.runAfter(0, internal.whatsapp_actions.downloadMedia, {
                messageId: newMessageId,
                organizationId: organizationId,
                whatsappMediaId: mediaUrl,
            });
        }

        // 6. Mettre à jour la conversation
        const MEDIA_PREVIEW: Record<string, string> = {
            AUDIO: "🎵 Audio",
            IMAGE: "📷 Photo",
            VIDEO: "🎥 Vidéo",
            DOCUMENT: "📄 Document",
            STICKER: "🎭 Sticker",
        };
        const preview = content || MEDIA_PREVIEW[type] || `[${type}]`;
        await ctx.db.patch(conversation._id, {
            lastMessageAt: Date.now(),
            preview,
            unreadCount: (conversation.unreadCount || 0) + 1,
            updatedAt: Date.now(),
        });

        // 7. Trigger Automation Engine
        await ctx.scheduler.runAfter(0, internal.engine.processMessage, {
            organizationId: organizationId,
            conversationId: conversation._id,
            contactId: contact._id,
            messageText: content,
            isFirstMessage: isFirstMessage,
        });

        // 7. BROADCAST REPLY TRACKING
        // Check if this message is a reply to a broadcast
        try {
            let attributedBroadcastId: any = null;

            // A. Explicit Reply (Context)
            const contextId = message.context?.id;
            if (contextId) {
                const originalMsg = await ctx.db
                    .query("messages")
                    .withIndex("by_external_id", (q) => q.eq("externalId", contextId))
                    .first();

                if (originalMsg && originalMsg.broadcastId) {
                    attributedBroadcastId = originalMsg.broadcastId;
                }
            }

            // B. Implicit Attribution (Time window) if not explicit
            if (!attributedBroadcastId) {
                // Find the latest outbound message THAT IS A BROADCAST within this conversation
                const lastBroadcastMsg = await ctx.db
                    .query("messages")
                    .withIndex("by_conversation", q => q.eq("conversationId", conversation!._id))
                    .order("desc")
                    .filter(q => q.and(
                        q.eq(q.field("direction"), "OUTBOUND"),
                        q.neq(q.field("broadcastId"), undefined)
                    ))
                    .first();

                if (lastBroadcastMsg && lastBroadcastMsg.broadcastId) {
                    const ONE_DAY = 24 * 60 * 60 * 1000;
                    // Only attribute if within 24 hours of the broadcast message
                    if (Date.now() - lastBroadcastMsg.createdAt < ONE_DAY) {
                        attributedBroadcastId = lastBroadcastMsg.broadcastId;
                    }
                }
            }

            // If we found a broadcast to attribute to
            if (attributedBroadcastId) {
                // 1. Link this inbound message to the broadcast
                await ctx.db.patch(newMessageId, { broadcastId: attributedBroadcastId });

                // 2. Increment stats (Unique reply per conversation)
                // Check if we already counted a reply for this broadcast in this conversation
                const existingReply = await ctx.db
                    .query("messages")
                    .withIndex("by_conversation", q => q.eq("conversationId", conversation!._id))
                    .filter(q => q.and(
                        q.eq(q.field("broadcastId"), attributedBroadcastId),
                        q.neq(q.field("_id"), newMessageId) // Exclude current
                    ))
                    .first();

                if (!existingReply) {
                    const broadcast = await ctx.db.get(attributedBroadcastId as Id<"broadcasts">);
                    if (broadcast) {
                        await ctx.db.patch(broadcast._id, {
                            repliedCount: (broadcast.repliedCount || 0) + 1
                        });
                    }
                }
            }
        } catch (e) {
            console.error("Error tracking broadcast reply:", e);
        }

        console.log(`[WHATSAPP] Processed message from ${from}`);
    }
});

// Gérer une mise à jour de statut (internal only — called from http.ts webhook handler)
export const handleStatusUpdate = internalMutation({
    args: {
        waMessageId: v.string(),
        status: v.string(),
        timestamp: v.string(),
        errors: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        const message = await ctx.db
            .query("messages")
            .withIndex("by_external_id", (q) => q.eq("externalId", args.waMessageId))
            .first();

        if (!message) {
            console.log(`[WHATSAPP] Message not found for status update: ${args.waMessageId}`);
            return;
        }

        // Mapper status WhatsApp -> Status interne
        let internalStatus = message.status;
        if (args.status === "sent") internalStatus = "SENT";
        if (args.status === "delivered") internalStatus = "DELIVERED";
        if (args.status === "read") internalStatus = "READ";
        if (args.status === "failed") internalStatus = "FAILED";

        await ctx.db.patch(message._id, {
            status: internalStatus,
            updatedAt: Date.now(),
        });

        // BROADCAST STATS UPDATE
        if (message.broadcastId && internalStatus !== message.status) {
            const broadcast = await ctx.db.get(message.broadcastId);
            if (broadcast) {
                const updates: any = {};
                if (internalStatus === 'DELIVERED') updates.deliveredCount = (broadcast.deliveredCount || 0) + 1;
                if (internalStatus === 'READ') updates.readCount = (broadcast.readCount || 0) + 1;
                if (internalStatus === 'FAILED') updates.failedCount = (broadcast.failedCount || 0) + 1;

                if (Object.keys(updates).length > 0) {
                    await ctx.db.patch(message.broadcastId, updates);
                }
            }
        }

        console.log(`[WHATSAPP] Updated status to ${internalStatus} for message ${message._id}`);
    }
});
