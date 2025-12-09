import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// Gérer un message entrant
export const handleIncomingMessage = mutation({
    args: {
        message: v.any(), // L'objet message raw de WhatsApp
        phoneNumberId: v.optional(v.string()), // ID du compte WhatsApp Business
        contact: v.optional(v.any()), // Info contact raw
    },
    handler: async (ctx, args) => {
        const { message, phoneNumberId } = args;
        const from = message.from; // Numéro de téléphone
        const name = args.contact?.profile?.name || from;

        // 1. Trouver l'organisation
        // TODO: Mapper phoneNumberId -> OrganizationId via la table whatsappConfigs
        const organization = await ctx.db.query("organizations").first();
        if (!organization) throw new Error("No organization found");

        // 2. Trouver ou créer le contact
        let contact = await ctx.db
            .query("contacts")
            .withIndex("by_org_phone", (q) =>
                q.eq("organizationId", organization._id).eq("phone", from)
            )
            .first();

        if (!contact) {
            const contactId = await ctx.db.insert("contacts", {
                organizationId: organization._id,
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

        // 3. Trouver ou créer la conversation
        // Utilisation de filter car pas d'index direct composite (ou utilisation index by_organization)
        let conversation = await ctx.db
            .query("conversations")
            .withIndex("by_organization", (q) => q.eq("organizationId", organization._id))
            .filter((q) =>
                q.and(
                    q.eq(q.field("contactId"), contact!._id),
                    q.eq(q.field("status"), "OPEN")
                )
            )
            .first();

        if (!conversation) {
            const conversationId = await ctx.db.insert("conversations", {
                organizationId: organization._id,
                contactId: contact._id,
                status: "OPEN",
                unreadCount: 0,
                lastMessageAt: Date.now(),
                channel: "WHATSAPP",
                createdAt: Date.now(),
                updatedAt: Date.now(),
                // title n'existe pas dans le schema, il est dérivé du contact
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

        if (message.type === "text") {
            content = message.text.body;
        } else if (message.type === "image") {
            type = "IMAGE";
            content = message.image.caption || "";
            mediaUrl = message.image.id; // Stocker l'ID temporairement
            mediaType = message.image.mime_type;
        } else {
            type = message.type.toUpperCase();
            content = `[${type}]`;
        }

        const newMessageId = await ctx.db.insert("messages", {
            organizationId: organization._id,
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

        // 5. Mettre à jour la conversation
        await ctx.db.patch(conversation._id, {
            lastMessageAt: Date.now(),
            preview: content || `[${type}]`,
            unreadCount: (conversation.unreadCount || 0) + 1,
            updatedAt: Date.now(),
        });

        // 6. Trigger Automation Engine
        await ctx.scheduler.runAfter(0, internal.engine.processMessage, {
            organizationId: organization._id,
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
            if (message.context && message.context.id) {
                const originalMsg = await ctx.db
                    .query("messages")
                    .filter(q => q.eq(q.field("externalId"), message.context.id))
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

// Gérer une mise à jour de statut
export const handleStatusUpdate = mutation({
    args: {
        waMessageId: v.string(),
        status: v.string(),
        timestamp: v.string(),
        errors: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        // Trouver le message par son externalId (scan car pas d'index global UNIQUE sur externalId, mais rare)
        // TODO: Ajouter index pour perf
        const message = await ctx.db
            .query("messages")
            .filter((q) => q.eq(q.field("externalId"), args.waMessageId))
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
