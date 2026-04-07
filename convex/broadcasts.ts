import { v } from "convex/values";
import { mutation, query, internalAction, internalMutation, internalQuery } from "./_generated/server";
import { internal, api } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";
import { hasPermission, type Role } from "./lib/permissions";

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
                return {
                    ...b,
                    templateName: template?.name || "Unknown Template"
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

        return {
            ...broadcast,
            template
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
        components: v.optional(v.array(v.any())),
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
        // We need all contacts for org to filter. 
        // Note: For large datasets, this should be paginated or optimized.
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

        console.log(`[BROADCAST] Sending ${broadcast.name} to ${targetContacts.length} contacts.`);

        // 4. Send Loop
        for (const contact of targetContacts) {
            // Rate limiting or batching could differ, but we rely on Convex scheduler
            await ctx.runMutation(internal.broadcasts.sendSingleToContact, {
                broadcastId: args.broadcastId,
                organizationId: args.organizationId,
                contactId: contact._id,
                phone: contact.phone,
                templateName: broadcast.template.name,
                languageCode: broadcast.template.language,
                components: [] // TODO: Resolve variables if needed (unsupported in UI currently)
            });
        }

        // 5. Mark Completed
        await ctx.runMutation(internal.broadcasts.markCompleted, { id: args.broadcastId });
    }
});

export const markCompleted = internalMutation({
    args: { id: v.id("broadcasts") },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.id, {
            status: "COMPLETED",
            completedAt: Date.now()
        });
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
