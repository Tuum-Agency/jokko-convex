import { v } from "convex/values";
import { mutation, query, internalAction, internalMutation, internalQuery } from "./_generated/server";
import { internal, api } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";
import { hasPermission, type Role } from "./lib/permissions";
import { getMessageCostFCFA, calculateBroadcastCost } from "../lib/whatsapp-pricing";

// List broadcasts for the current organization
export const list = query({
    args: {
        search: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const user = await ctx.db.get(userId);
        if (!user) throw new Error("User not found");

        // Get user's current organization from session
        const session = await ctx.db
            .query("userSessions")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .first();

        if (!session?.currentOrganizationId) {
            return [];
        }

        const organizationId = session.currentOrganizationId;

        // Fetch broadcasts
        // TODO: Implement search if needed, for now just list all by org
        const broadcasts = await ctx.db
            .query("broadcasts")
            .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
            .order("desc")
            .collect();

        // Enrich with template name ?
        // Doing it client side or here? Let's do it here to accept fewer roundtrips if possible,
        // but `Promise.all` is cheap here.
        const enrichedBroadcasts = await Promise.all(
            broadcasts.map(async (b) => {
                const template = await ctx.db.get(b.templateId);
                let channelName: string | null = null;
                if (b.whatsappChannelId) {
                    const channel = await ctx.db.get(b.whatsappChannelId);
                    channelName = channel?.label ?? null;
                }
                return {
                    ...b,
                    templateName: template?.name || "Unknown Template",
                    channelName,
                };
            })
        );

        // Filter by search if provided (client-side style filtering for now as name is not indexed for search yet or we use simple filter)
        if (args.search) {
            const lowerSearch = args.search.toLowerCase();
            return enrichedBroadcasts.filter(b =>
                b.name.toLowerCase().includes(lowerSearch) ||
                b.templateName.toLowerCase().includes(lowerSearch)
            );
        }

        return enrichedBroadcasts;
    },
});

export const get = query({
    args: { id: v.id("broadcasts") },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const broadcast = await ctx.db.get(args.id);
        if (!broadcast) return null;

        // Check organization access
        const session = await ctx.db
            .query("userSessions")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .first();

        if (session?.currentOrganizationId !== broadcast.organizationId) {
            throw new Error("Unauthorized access to this broadcast");
        }

        const template = await ctx.db.get(broadcast.templateId);

        // Channel name
        let channelName: string | null = null;
        if (broadcast.whatsappChannelId) {
            const channel = await ctx.db.get(broadcast.whatsappChannelId);
            channelName = channel?.label ?? null;
        }

        // Total audience count (same logic as estimateAudience)
        const contacts = await ctx.db
            .query("contacts")
            .withIndex("by_organization", (q) => q.eq("organizationId", broadcast.organizationId))
            .collect();

        let totalAudience = contacts.length;
        const config = broadcast.audienceConfig;
        if (config.type === "TAGS" && config.tags && config.tags.length > 0) {
            totalAudience = contacts.filter((c) =>
                c.tags && c.tags.some((t) => config.tags!.includes(t))
            ).length;
        } else if (config.type === "COUNTRIES" && config.countries && config.countries.length > 0) {
            totalAudience = contacts.filter((c) =>
                config.countries!.some((prefix) => c.phone.startsWith(prefix))
            ).length;
        }

        return {
            ...broadcast,
            template,
            channelName,
            totalAudience,
        };
    },
});

export const create = mutation({
    args: {
        name: v.string(),
        templateId: v.id("templates"),
        scheduledAt: v.optional(v.number()),
        whatsappChannelId: v.optional(v.id("whatsappChannels")),
        audienceConfig: v.object({
            type: v.union(v.literal("ALL"), v.literal("TAGS"), v.literal("COUNTRIES")),
            tags: v.optional(v.array(v.id("tags"))),
            countries: v.optional(v.array(v.string())),
        }),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const session = await ctx.db
            .query("userSessions")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .first();

        if (!session?.currentOrganizationId) {
            throw new Error("No organization selected");
        }

        // Permission check: only ADMIN+ can create broadcasts
        const membership = await ctx.db.query("memberships")
            .withIndex("by_user_org", q => q.eq("userId", userId).eq("organizationId", session.currentOrganizationId!))
            .first();
        if (!membership || (membership.role !== "ADMIN" && membership.role !== "OWNER")) {
            throw new Error("Permission refusée: seuls les admins peuvent créer des broadcasts");
        }

        // Validation: scheduledAt doit être au moins 5 minutes dans le futur
        if (args.scheduledAt && args.scheduledAt <= Date.now() + 5 * 60 * 1000) {
            throw new Error("La date de planification doit être au moins 5 minutes dans le futur");
        }

        const id = await ctx.db.insert("broadcasts", {
            organizationId: session.currentOrganizationId,
            name: args.name,
            templateId: args.templateId,
            audienceConfig: args.audienceConfig,
            whatsappChannelId: args.whatsappChannelId,
            status: args.scheduledAt ? "SCHEDULED" : "DRAFT",
            scheduledAt: args.scheduledAt,
            sentCount: 0,
            deliveredCount: 0,
            readCount: 0,
            repliedCount: 0,
            failedCount: 0,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        // Log activity
        await ctx.db.insert("broadcastActivities", {
            broadcastId: id,
            type: "created",
            message: `Campagne "${args.name}" créée`,
            createdAt: Date.now(),
        });

        if (args.scheduledAt) {
            await ctx.db.insert("broadcastActivities", {
                broadcastId: id,
                type: "scheduled",
                message: `Campagne planifiée pour le ${new Date(args.scheduledAt).toLocaleDateString("fr-FR")}`,
                createdAt: Date.now(),
            });
        }

        return id;
    },
});

export const update = mutation({
    args: {
        id: v.id("broadcasts"),
        name: v.optional(v.string()),
        templateId: v.optional(v.id("templates")),
        scheduledAt: v.optional(v.number()),
        status: v.optional(v.string()),
        audienceConfig: v.optional(v.object({
            type: v.union(v.literal("ALL"), v.literal("TAGS"), v.literal("COUNTRIES")),
            tags: v.optional(v.array(v.id("tags"))),
            countries: v.optional(v.array(v.string())),
        })),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const broadcast = await ctx.db.get(args.id);
        if (!broadcast) throw new Error("Broadcast not found");

        const session = await ctx.db
            .query("userSessions")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .first();

        if (session?.currentOrganizationId !== broadcast.organizationId) {
            throw new Error("Unauthorized");
        }

        // RBAC: require ADMIN or OWNER
        const membership = await ctx.db
            .query("memberships")
            .withIndex("by_user_org", (q) => q.eq("userId", userId).eq("organizationId", broadcast.organizationId))
            .first();
        if (!membership || !hasPermission(membership.role as Role, "broadcasts:create")) {
            throw new Error("Permission denied");
        }

        // Validation: scheduledAt doit être au moins 5 minutes dans le futur
        if (args.scheduledAt && args.scheduledAt <= Date.now() + 5 * 60 * 1000) {
            throw new Error("La date de planification doit être au moins 5 minutes dans le futur");
        }

        const updates: any = {
            updatedAt: Date.now(),
        };

        if (args.name !== undefined) updates.name = args.name;
        if (args.templateId !== undefined) updates.templateId = args.templateId;
        if (args.scheduledAt !== undefined) updates.scheduledAt = args.scheduledAt;
        if (args.status !== undefined) updates.status = args.status;
        if (args.audienceConfig !== undefined) updates.audienceConfig = args.audienceConfig;

        const statusChanged = args.status && args.status !== broadcast.status;

        await ctx.db.patch(args.id, updates);

        // Log activity for status changes
        if (statusChanged) {
            if (args.status === 'SENDING') {
                await ctx.db.insert("broadcastActivities", {
                    broadcastId: args.id,
                    type: "sending_started",
                    message: "Envoi de la campagne démarré",
                    createdAt: Date.now(),
                });
            } else if (args.status === 'SCHEDULED') {
                await ctx.db.insert("broadcastActivities", {
                    broadcastId: args.id,
                    type: "scheduled",
                    message: "Campagne planifiée",
                    createdAt: Date.now(),
                });
            } else if (args.status === 'CANCELLED') {
                await ctx.db.insert("broadcastActivities", {
                    broadcastId: args.id,
                    type: "cancelled",
                    message: "Campagne annulée",
                    createdAt: Date.now(),
                });
            }
        }

        // TRIGGER SENDING IF STATUS -> SENDING
        if (statusChanged && args.status === 'SENDING') {
            await ctx.scheduler.runAfter(0, internal.broadcasts.sendBroadcast, {
                broadcastId: args.id,
                organizationId: broadcast.organizationId
            });
        }
    },
});

// ===================================
// SENDING LOGIC
// ===================================

export const sendSingleToContact = internalMutation({
    args: {
        broadcastId: v.id("broadcasts"),
        organizationId: v.id("organizations"),
        contactId: v.id("contacts"),
        phone: v.string(),
        templateName: v.string(),
        languageCode: v.string(),
        components: v.optional(v.array(v.record(v.string(), v.any()))),
        whatsappChannelId: v.optional(v.id("whatsappChannels")),
    },
    handler: async (ctx, args) => {
        // 1. Find OPEN Conversation (using composite index)
        let conversation = await ctx.db
            .query("conversations")
            .withIndex("by_org_contact", q =>
                q.eq("organizationId", args.organizationId)
                    .eq("contactId", args.contactId)
                    .eq("status", "OPEN")
            )
            .first();

        if (!conversation) {
            // Check if we should re-open a closed one or create new?
            // To align with webhook which creates new on no-open, we create new.
            // But for "Chat" UI, we might prefer one conversation per contact.
            // Let's assume Session model: Create new Open.

            const conversationId = await ctx.db.insert("conversations", {
                organizationId: args.organizationId,
                contactId: args.contactId,
                channel: "WHATSAPP",
                whatsappChannelId: args.whatsappChannelId,
                status: "RESOLVED", // Broadcast-initiated: don't show as assignable
                lastMessageAt: Date.now(),
                lastMessageDirection: "OUTBOUND",
                unreadCount: 0,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                tags: [],
            });
            conversation = await ctx.db.get(conversationId);
        }

        if (!conversation) return; // Should not happen

        // 2. Create Message Record
        const messageId = await ctx.db.insert("messages", {
            organizationId: args.organizationId,
            conversationId: conversation._id,
            contactId: args.contactId,
            senderId: undefined, // System/Bot
            type: "TEMPLATE", // Or SYSTEM? "TEMPLATE" isn't in schema enum list commonly, but "SYSTEM"? 
            // Schema has "type: v.string()", so "TEMPLATE" is fine.
            content: `Template: ${args.templateName}`,
            direction: "OUTBOUND",
            status: "PENDING",
            broadcastId: args.broadcastId,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        // 3. Schedule Send
        await ctx.scheduler.runAfter(0, internal.whatsapp_actions.sendMessage, {
            messageId,
            organizationId: args.organizationId,
            whatsappChannelId: args.whatsappChannelId,
            to: args.phone,
            type: "template",
            template: {
                name: args.templateName,
                language: { code: args.languageCode },
                components: args.components || []
            }
        });

        // 4. Update Broadcast Stats
        const broadcast = await ctx.db.get(args.broadcastId);
        if (broadcast) {
            await ctx.db.patch(args.broadcastId, {
                sentCount: broadcast.sentCount + 1,
                updatedAt: Date.now()
            });
        }

        // 5. Update Conversation preview
        await ctx.db.patch(conversation._id, {
            lastMessageAt: Date.now(),
            lastMessageDirection: "OUTBOUND",
            preview: `📤 ${args.templateName}`,
            updatedAt: Date.now()
        });
    }
});

export const getBroadcastInternal = internalQuery({
    args: { id: v.id("broadcasts") },
    handler: async (ctx, args) => {
        const broadcast = await ctx.db.get(args.id);
        if (!broadcast) return null;
        const template = await ctx.db.get(broadcast.templateId);
        return {
            ...broadcast,
            template
        };
    }
});

export const sendBroadcast = internalAction({
    args: {
        broadcastId: v.id("broadcasts"),
        organizationId: v.id("organizations"),
    },
    handler: async (ctx, args) => {
        // 1. Fetch Broadcast & Template
        const broadcast = await ctx.runQuery(internal.broadcasts.getBroadcastInternal, { id: args.broadcastId });
        if (!broadcast || !broadcast.template) return;

        // 2. Fetch Contacts
        const contacts = await ctx.runQuery(internal.contacts.listAllForOrg, { organizationId: args.organizationId });

        // 3. Filter Audience
        const config = broadcast.audienceConfig;
        let targetContacts = contacts;

        if (config.type === 'TAGS' && config.tags && config.tags.length > 0) {
            targetContacts = contacts.filter(c =>
                c.tags && c.tags.some(t => config.tags!.includes(t))
            );
        } else if (config.type === 'COUNTRIES' && config.countries && config.countries.length > 0) {
            targetContacts = contacts.filter(c =>
                config.countries!.some(prefix => c.phone.startsWith(prefix))
            );
        }

        // 4. Validate & deduct credits before sending (real pricing per country)
        const { totalCostFCFA } = calculateBroadcastCost(targetContacts.map(c => c.phone));
        if (totalCostFCFA > 0) {
            try {
                await ctx.runMutation(internal.credits.internalDeductCredits, {
                    organizationId: args.organizationId,
                    amount: totalCostFCFA,
                    description: `Campagne "${broadcast.name}" — ${targetContacts.length} messages, ${totalCostFCFA.toLocaleString()} FCFA`,
                    referenceId: args.broadcastId,
                });
            } catch (e: any) {
                // Insufficient credits — mark broadcast as FAILED
                await ctx.runMutation(internal.broadcasts.markFailed, {
                    id: args.broadcastId,
                    reason: "Crédits insuffisants pour envoyer cette campagne",
                });
                return;
            }
        }

        console.log(`[BROADCAST] Sending ${broadcast.name} to ${targetContacts.length} contacts (${totalCostFCFA} FCFA).`);

        // 5. Send Loop
        for (const contact of targetContacts) {
            await ctx.runMutation(internal.broadcasts.sendSingleToContact, {
                broadcastId: args.broadcastId,
                organizationId: args.organizationId,
                contactId: contact._id,
                phone: contact.phone,
                templateName: broadcast.template.name,
                languageCode: broadcast.template.language,
                components: [],
                whatsappChannelId: broadcast.whatsappChannelId,
            });
        }

        // 6. Mark Completed
        await ctx.runMutation(internal.broadcasts.markCompleted, { id: args.broadcastId });
    }
});

export const markFailed = internalMutation({
    args: {
        id: v.id("broadcasts"),
        reason: v.string(),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.id, {
            status: "FAILED",
            updatedAt: Date.now(),
        });

        await ctx.db.insert("broadcastActivities", {
            broadcastId: args.id,
            type: "failures",
            message: args.reason,
            createdAt: Date.now(),
        });
    },
});

export const markCompleted = internalMutation({
    args: { id: v.id("broadcasts") },
    handler: async (ctx, args) => {
        const broadcast = await ctx.db.get(args.id);
        await ctx.db.patch(args.id, {
            status: "COMPLETED",
            completedAt: Date.now()
        });

        // Log completion activity
        await ctx.db.insert("broadcastActivities", {
            broadcastId: args.id,
            type: "completed",
            message: `Campagne terminée — ${broadcast?.sentCount ?? 0} envoyés, ${broadcast?.failedCount ?? 0} échecs`,
            createdAt: Date.now(),
        });

        // Log failures if any
        if (broadcast && broadcast.failedCount > 0) {
            await ctx.db.insert("broadcastActivities", {
                broadcastId: args.id,
                type: "failures",
                message: `${broadcast.failedCount} message(s) en échec`,
                createdAt: Date.now(),
            });
        }
    }
});

export const processScheduled = internalMutation({
    args: {},
    handler: async (ctx) => {
        const now = Date.now();

        // Use status index to avoid full table scan
        const broadcasts = await ctx.db
            .query("broadcasts")
            .withIndex("by_status", q => q.eq("status", "SCHEDULED"))
            .collect();

        for (const broadcast of broadcasts) {
            if (broadcast.scheduledAt && broadcast.scheduledAt <= now) {
                // Update to SENDING
                await ctx.db.patch(broadcast._id, { status: "SENDING" });

                // Trigger Send
                await ctx.scheduler.runAfter(0, internal.broadcasts.sendBroadcast, {
                    broadcastId: broadcast._id,
                    organizationId: broadcast.organizationId
                });
            }
        }
    }
});

export const deleteBroadcast = mutation({
    args: { id: v.id("broadcasts") },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const broadcast = await ctx.db.get(args.id);
        if (!broadcast) throw new Error("Broadcast not found");

        const session = await ctx.db
            .query("userSessions")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .first();

        if (session?.currentOrganizationId !== broadcast.organizationId) {
            throw new Error("Unauthorized");
        }

        // Permission check: only ADMIN+ can delete broadcasts
        const membership = await ctx.db.query("memberships")
            .withIndex("by_user_org", q => q.eq("userId", userId).eq("organizationId", broadcast.organizationId))
            .first();
        if (!membership || (membership.role !== "ADMIN" && membership.role !== "OWNER")) {
            throw new Error("Permission refusée: seuls les admins peuvent supprimer des broadcasts");
        }

        await ctx.db.delete(args.id);
    },
});

export const archiveBroadcast = mutation({
    args: { id: v.id("broadcasts") },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const broadcast = await ctx.db.get(args.id);
        if (!broadcast) throw new Error("Broadcast not found");

        const session = await ctx.db
            .query("userSessions")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .first();

        if (session?.currentOrganizationId !== broadcast.organizationId) {
            throw new Error("Unauthorized");
        }

        // Permission check: only ADMIN+ can archive broadcasts
        const membership = await ctx.db.query("memberships")
            .withIndex("by_user_org", q => q.eq("userId", userId).eq("organizationId", broadcast.organizationId))
            .first();
        if (!membership || (membership.role !== "ADMIN" && membership.role !== "OWNER")) {
            throw new Error("Permission refusée: seuls les admins peuvent archiver des broadcasts");
        }

        await ctx.db.patch(args.id, {
            status: "CANCELLED",
            updatedAt: Date.now(),
        });
    },
});

export const duplicate = mutation({
    args: { id: v.id("broadcasts") },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const original = await ctx.db.get(args.id);
        if (!original) throw new Error("Broadcast not found");

        const session = await ctx.db
            .query("userSessions")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .first();

        if (session?.currentOrganizationId !== original.organizationId) {
            throw new Error("Unauthorized");
        }

        // RBAC: require ADMIN or OWNER
        const membership = await ctx.db
            .query("memberships")
            .withIndex("by_user_org", (q) => q.eq("userId", userId).eq("organizationId", original.organizationId))
            .first();
        if (!membership || !hasPermission(membership.role as Role, "broadcasts:create")) {
            throw new Error("Permission denied");
        }

        const newId = await ctx.db.insert("broadcasts", {
            organizationId: original.organizationId,
            name: `${original.name} (Copie)`,
            templateId: original.templateId,
            audienceConfig: original.audienceConfig,
            status: "DRAFT", // Reset to draft
            // Reset stats
            sentCount: 0,
            deliveredCount: 0,
            readCount: 0,
            repliedCount: 0,
            failedCount: 0,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        return newId;
    },
});

// ===================================
// AUDIENCE ESTIMATION
// ===================================

export const estimateAudience = query({
    args: {
        audienceConfig: v.object({
            type: v.union(v.literal("ALL"), v.literal("TAGS"), v.literal("COUNTRIES")),
            tags: v.optional(v.array(v.id("tags"))),
            countries: v.optional(v.array(v.string())),
        }),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const session = await ctx.db
            .query("userSessions")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .first();

        if (!session?.currentOrganizationId) {
            return { count: 0, estimatedCost: 0, creditBalance: 0, costPerMessage: 0 };
        }

        const organizationId = session.currentOrganizationId;

        // Get credit balance
        const org = await ctx.db.get(organizationId);
        const creditBalance = org?.creditBalance ?? 0;

        const contacts = await ctx.db
            .query("contacts")
            .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
            .collect();

        const config = args.audienceConfig;

        let targetContacts = contacts;

        if (config.type === "TAGS" && config.tags && config.tags.length > 0) {
            targetContacts = contacts.filter((c) =>
                c.tags && c.tags.some((t) => config.tags!.includes(t))
            );
        } else if (config.type === "COUNTRIES" && config.countries && config.countries.length > 0) {
            targetContacts = contacts.filter((c) =>
                config.countries!.some((prefix) => c.phone.startsWith(prefix))
            );
        }

        // Calculate cost based on each contact's country
        const { totalCostFCFA } = calculateBroadcastCost(targetContacts.map(c => c.phone));
        const avgCostPerMessage = targetContacts.length > 0
            ? Math.ceil(totalCostFCFA / targetContacts.length)
            : 0;

        return {
            count: targetContacts.length,
            estimatedCost: totalCostFCFA,
            creditBalance,
            costPerMessage: avgCostPerMessage,
        };
    },
});

// ===================================
// RETRY FAILED MESSAGES
// ===================================

export const retryFailed = mutation({
    args: {
        broadcastId: v.id("broadcasts"),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const session = await ctx.db
            .query("userSessions")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .first();

        if (!session?.currentOrganizationId) {
            throw new Error("No organization selected");
        }

        const organizationId = session.currentOrganizationId;

        // Permission check: only ADMIN+ can retry
        const membership = await ctx.db.query("memberships")
            .withIndex("by_user_org", (q) => q.eq("userId", userId).eq("organizationId", organizationId))
            .first();
        if (!membership || (membership.role !== "ADMIN" && membership.role !== "OWNER")) {
            throw new Error("Permission refusée: seuls les admins peuvent relancer des broadcasts");
        }

        const broadcast = await ctx.db.get(args.broadcastId);
        if (!broadcast) throw new Error("Broadcast not found");
        if (broadcast.organizationId !== organizationId) {
            throw new Error("Unauthorized");
        }

        // Get the template for re-sending
        const template = await ctx.db.get(broadcast.templateId);
        if (!template) throw new Error("Template not found");

        // Find failed messages for this broadcast (no by_broadcast index, use filter)
        const failedMessages = await ctx.db
            .query("messages")
            .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
            .filter((q) =>
                q.and(
                    q.eq(q.field("broadcastId"), args.broadcastId),
                    q.eq(q.field("status"), "FAILED")
                )
            )
            .collect();

        let retriedCount = 0;

        for (const msg of failedMessages) {
            if (!msg.contactId) continue;

            const contact = await ctx.db.get(msg.contactId);
            if (!contact) continue;

            await ctx.scheduler.runAfter(0, internal.broadcasts.sendSingleToContact, {
                broadcastId: args.broadcastId,
                organizationId,
                contactId: contact._id,
                phone: contact.phone,
                templateName: template.name,
                languageCode: template.language,
                components: [],
                whatsappChannelId: broadcast.whatsappChannelId,
            });

            retriedCount++;
        }

        // Reset failedCount and update status
        const updates: Record<string, unknown> = {
            failedCount: 0,
            updatedAt: Date.now(),
        };
        if (broadcast.status === "COMPLETED" || broadcast.status === "FAILED") {
            updates.status = "SENDING";
        }
        await ctx.db.patch(args.broadcastId, updates);

        return { retriedCount };
    },
});

// ===================================
// ACTIVITY TIMELINE
// ===================================

export const getActivity = query({
    args: {
        broadcastId: v.id("broadcasts"),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const session = await ctx.db
            .query("userSessions")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .first();

        if (!session?.currentOrganizationId) {
            throw new Error("No organization selected");
        }

        const broadcast = await ctx.db.get(args.broadcastId);
        if (!broadcast) throw new Error("Broadcast not found");
        if (broadcast.organizationId !== session.currentOrganizationId) {
            throw new Error("Unauthorized access to this broadcast");
        }

        const activities: Array<{
            type: string;
            timestamp: number;
            message: string;
        }> = [];

        // Created
        activities.push({
            type: "created",
            timestamp: broadcast.createdAt,
            message: "Campagne créée",
        });

        // Scheduled
        if (broadcast.scheduledAt) {
            const scheduledDate = new Date(broadcast.scheduledAt).toLocaleString("fr-FR", {
                dateStyle: "long",
                timeStyle: "short",
            });
            activities.push({
                type: "scheduled",
                timestamp: broadcast.scheduledAt,
                message: `Planifiée pour le ${scheduledDate}`,
            });
        }

        // Sending started
        if (broadcast.status === "SENDING" || broadcast.status === "COMPLETED" || broadcast.status === "FAILED") {
            activities.push({
                type: "sending_started",
                timestamp: broadcast.updatedAt,
                message: "Envoi démarré",
            });
        }

        // Completed
        if (broadcast.completedAt) {
            activities.push({
                type: "completed",
                timestamp: broadcast.completedAt,
                message: `Envoi terminé — ${broadcast.sentCount} messages envoyés`,
            });
        }

        // Failures
        if (broadcast.failedCount > 0) {
            activities.push({
                type: "failures",
                timestamp: broadcast.updatedAt,
                message: `${broadcast.failedCount} messages en échec`,
            });
        }

        // Sort by timestamp descending
        activities.sort((a, b) => b.timestamp - a.timestamp);

        return { activities };
    },
});

// ===================================
// EXPORT BROADCASTS
// ===================================

export const exportBroadcasts = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const session = await ctx.db
            .query("userSessions")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .first();

        if (!session?.currentOrganizationId) {
            return [];
        }

        const organizationId = session.currentOrganizationId;

        const broadcasts = await ctx.db
            .query("broadcasts")
            .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
            .order("desc")
            .collect();

        const result = await Promise.all(
            broadcasts.map(async (b) => {
                const template = await ctx.db.get(b.templateId);
                return {
                    name: b.name,
                    templateName: template?.name || "Unknown Template",
                    status: b.status,
                    sentCount: b.sentCount,
                    deliveredCount: b.deliveredCount,
                    readCount: b.readCount,
                    repliedCount: b.repliedCount,
                    failedCount: b.failedCount,
                    createdAt: new Date(b.createdAt).toISOString(),
                    completedAt: b.completedAt ? new Date(b.completedAt).toISOString() : "",
                };
            })
        );

        return result;
    },
});
