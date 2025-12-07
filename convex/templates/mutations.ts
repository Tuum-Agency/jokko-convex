
import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { validateTemplate } from "../lib/templateValidation";

export const create = mutation({
    args: {
        name: v.string(),
        language: v.string(),
        category: v.string(), // We'll validate this is a valid TemplateCategory
        type: v.string(),     // We'll validate this is a valid TemplateType
        description: v.optional(v.string()),

        // Flexible fields, validated by logic
        header: v.optional(v.any()), // v.object({...}) in schema, passing as any for flexibility in args then validating
        body: v.optional(v.string()),
        footer: v.optional(v.string()),
        buttons: v.optional(v.any()),

        // Specific configs
        carouselCards: v.optional(v.any()),
        catalogConfig: v.optional(v.any()),
        listConfig: v.optional(v.any()),
        locationConfig: v.optional(v.any()),
        ltoConfig: v.optional(v.any()),
        couponConfig: v.optional(v.any()),
        authConfig: v.optional(v.any()),
        orderConfig: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const session = await ctx.db
            .query("userSessions")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .first();

        if (!session || !session.currentOrganizationId) throw new Error("No active organization");

        // Validate
        const validation = validateTemplate(args);
        if (!validation.valid) {
            throw new Error(`Validation failed: ${validation.errors.join(", ")}`);
        }

        const templateId = await ctx.db.insert("templates", {
            organizationId: session.currentOrganizationId,
            name: args.name,
            slug: args.name.toLowerCase().replace(/[^a-z0-9_]/g, "_"), // Simple slug generation
            language: args.language,
            category: args.category,
            type: args.type,
            description: args.description,
            status: "DRAFT",

            header: args.header,
            body: args.body,
            footer: args.footer,
            buttons: args.buttons,

            carouselCards: args.carouselCards,
            catalogConfig: args.catalogConfig,
            listConfig: args.listConfig,
            locationConfig: args.locationConfig,
            ltoConfig: args.ltoConfig,
            couponConfig: args.couponConfig,
            authConfig: args.authConfig,
            orderConfig: args.orderConfig,

            sentCount: 0,
            deliveredCount: 0,
            readCount: 0,
            repliedCount: 0,
            clickedCount: 0,
            convertedCount: 0,
            failedCount: 0,
            blockedCount: 0,

            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        return templateId;
    },
});

export const update = mutation({
    args: {
        id: v.id("templates"),
        name: v.optional(v.string()),
        language: v.optional(v.string()),
        category: v.optional(v.string()),
        type: v.optional(v.string()),
        description: v.optional(v.string()),

        header: v.optional(v.any()),
        body: v.optional(v.string()),
        footer: v.optional(v.string()),
        buttons: v.optional(v.any()),

        carouselCards: v.optional(v.any()),
        catalogConfig: v.optional(v.any()),
        listConfig: v.optional(v.any()),
        locationConfig: v.optional(v.any()),
        ltoConfig: v.optional(v.any()),
        couponConfig: v.optional(v.any()),
        authConfig: v.optional(v.any()),
        orderConfig: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const session = await ctx.db
            .query("userSessions")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .first();

        if (!session || !session.currentOrganizationId) throw new Error("No active organization");

        const template = await ctx.db.get(args.id);
        if (!template || template.organizationId !== session.currentOrganizationId) {
            throw new Error("Template not found or unauthorized");
        }

        if (template.status !== "DRAFT" && template.status !== "REJECTED" && template.status !== "PAUSED") {
            // Cannot edit pending or approved templates (usually)
            // But for now let's allow it but maybe warn? 
            // Meta prevents editing approved templates except for category/components sometimes.
            // We'll restrict to DRAFT for simplicity or allow edits that reset status?
            // Let's keep it simple: allow update, user knows they might need to resubmit.
        }

        // Merge for validation
        const merged = { ...template, ...args };
        const validation = validateTemplate(merged);
        if (!validation.valid) {
            throw new Error(`Validation failed: ${validation.errors.join(", ")}`);
        }

        await ctx.db.patch(args.id, {
            ...args,
            updatedAt: Date.now(),
        });
    },
});

export const deleteTemplate = mutation({
    args: { id: v.id("templates") },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const session = await ctx.db
            .query("userSessions")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .first();

        if (!session || !session.currentOrganizationId) throw new Error("No active organization");

        const template = await ctx.db.get(args.id);
        if (!template || template.organizationId !== session.currentOrganizationId) {
            throw new Error("Unauthorized");
        }

        // We might want to just mark as DELETED
        await ctx.db.patch(args.id, {
            status: "DELETED",
            updatedAt: Date.now(),
        });
    },
});

export const updateStatus = mutation({
    args: {
        id: v.id("templates"),
        status: v.string(), // "PENDING", "APPROVED", "REJECTED"
    },
    handler: async (ctx, args) => {
        // This is called by internal action so we might skip rigorous auth check 
        // IF we trust the action. But actions are client callable?
        // Wait, submitToMeta is an action.
        // If I make this a public mutation, users can call it.
        // I should check auth.
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        // Verify ownership
        const template = await ctx.db.get(args.id);
        if (!template) throw new Error("Template not found");

        // We really should verify organization, but for simplicity assuming userId check roughly covers basic auth.
        // Better:
        const session = await ctx.db
            .query("userSessions")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .first();
        if (!session || !session.currentOrganizationId || template.organizationId !== session.currentOrganizationId) {
            throw new Error("Unauthorized");
        }

        await ctx.db.patch(args.id, {
            status: args.status,
            updatedAt: Date.now(),
        });
    },
});

export const seedStandard = mutation({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const session = await ctx.db
            .query("userSessions")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .first();

        if (!session || !session.currentOrganizationId) throw new Error("No active organization");
        const orgId = session.currentOrganizationId;

        // Check for hello_world
        const existing = await ctx.db
            .query("templates")
            .withIndex("by_organization", q => q.eq("organizationId", orgId))
            .filter(q => q.eq(q.field("name"), "hello_world"))
            .first();

        if (existing) {
            return { message: "Standard templates already exist", inserted: 0 };
        }

        // Insert hello_world
        await ctx.db.insert("templates", {
            organizationId: orgId,
            name: "hello_world",
            slug: "hello_world",
            language: "en_US", // Standard is usually en_US
            category: "UTILITY",
            type: "STANDARD", // Custom type for our app logic, or just UTILITY
            description: "Standard WhatsApp Welcome Template",
            status: "APPROVED",

            header: {
                type: "TEXT",
                text: "Hello World"
            },
            body: "Welcome and congratulations. This message demonstrates your ability to send a WhatsApp message notification. You can now send any standard message.",
            footer: "WhatsApp Business API Team",

            sentCount: 0,
            deliveredCount: 0,
            readCount: 0,
            repliedCount: 0,
            clickedCount: 0,
            convertedCount: 0,
            failedCount: 0,
            blockedCount: 0,

            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        return { message: "Standard templates seeded", inserted: 1 };
    },
});
