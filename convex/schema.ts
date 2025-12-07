/**
 *  ____        _                
 * / ___|  ___ | |__   ___  __ _ 
 * \___ \ / __|| '_ \ / _ \/ _` |
 *  ___) | (__ | | | |  __/ (_| |
 * |____/ \___||_| |_|\___|\__,_|
 *                               
 * DATA MODEL
 * 
 * Defines the database schema for the application using Convex.
 * Includes:
 * - Users & Auth (via @convex-dev/auth)
 * - Organizations (Tenants)
 * - Memberships (Roles & Permissions)
 * - Invitations
 * - User Sessions
 * 
 * @see https://docs.convex.dev/database/schemas
 */

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
    ...authTables,

    // ============================================
    // Users
    // ============================================
    users: defineTable({
        name: v.optional(v.string()),
        email: v.string(),
        image: v.optional(v.string()),
        emailVerificationTime: v.optional(v.number()),
        phone: v.optional(v.string()),
        locale: v.optional(v.string()),
        timezone: v.optional(v.string()),
        onboardingCompleted: v.optional(v.boolean()),
        createdAt: v.optional(v.number()),
        updatedAt: v.optional(v.number()),
    }).index("by_email", ["email"]),

    // ============================================
    // Organizations (Entreprises - Tenants)
    // ============================================
    organizations: defineTable({
        name: v.string(),
        slug: v.string(),
        logo: v.optional(v.id("_storage")),

        // Business Info
        businessSector: v.optional(v.string()),
        website: v.optional(v.string()),
        phone: v.optional(v.string()),
        address: v.optional(v.string()),
        timezone: v.optional(v.string()),
        locale: v.optional(v.string()),

        // Onboarding Status
        onboardingStep: v.optional(v.string()), // "BUSINESS_INFO", "WHATSAPP_CONNECT", "COMPLETED"

        industry: v.optional(v.string()), // Legacy? Keep for now
        ownerId: v.id("users"),
        // WhatsApp Config
        whatsapp: v.optional(v.object({
            phoneNumberId: v.string(),
            businessAccountId: v.string(),
            accessToken: v.string(),
            webhookVerifyToken: v.string(),
            displayPhoneNumber: v.optional(v.string()),
            verifiedName: v.optional(v.string()),
        })),
        settings: v.optional(v.object({
            businessHours: v.optional(v.any()),
            autoReplyEnabled: v.optional(v.boolean()),
            autoReplyMessage: v.optional(v.string()),
            defaultLanguage: v.optional(v.string()),
        })),
        plan: v.union(
            v.literal("FREE"),
            v.literal("STARTER"),
            v.literal("PRO"),
            v.literal("ENTERPRISE")
        ),
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_owner", ["ownerId"])
        .index("by_slug", ["slug"]),


    // ============================================
    // Poles (Services / Departments)
    // ============================================
    poles: defineTable({
        organizationId: v.id("organizations"),
        name: v.string(),
        description: v.optional(v.string()),
        color: v.optional(v.string()),
        icon: v.optional(v.string()), // Lucide icon name
        createdAt: v.number(),
        updatedAt: v.number(),
    }).index("by_organization", ["organizationId"]),

    // ============================================
    // Memberships (User <-> Organization)
    // ============================================
    memberships: defineTable({
        userId: v.id("users"),
        organizationId: v.id("organizations"),
        role: v.union(v.literal("OWNER"), v.literal("ADMIN"), v.literal("AGENT")),
        poleId: v.optional(v.id("poles")), // Associated service/pole
        // Presence
        status: v.union(
            v.literal("ONLINE"),
            v.literal("BUSY"),
            v.literal("AWAY"),
            v.literal("OFFLINE")
        ),
        statusMessage: v.optional(v.string()),
        maxConversations: v.number(),
        activeConversations: v.number(),
        lastSeenAt: v.number(),
        joinedAt: v.number(),
        invitedById: v.optional(v.id("users")),
    })
        .index("by_user", ["userId"])
        .index("by_organization", ["organizationId"])
        .index("by_user_org", ["userId", "organizationId"])
        .index("by_org_status", ["organizationId", "status"]), // Optimized for assignment logic

    // ============================================
    // Invitations
    // ============================================
    invitations: defineTable({
        organizationId: v.id("organizations"),
        email: v.string(),
        name: v.optional(v.string()), // Added name field
        role: v.union(v.literal("ADMIN"), v.literal("AGENT")),
        poleId: v.optional(v.id("poles")), // Associated service/pole
        token: v.string(),
        status: v.union(
            v.literal("PENDING"),
            v.literal("ACCEPTED"),
            v.literal("EXPIRED"),
            v.literal("CANCELLED")
        ),
        invitedById: v.id("users"),
        expiresAt: v.number(),
        acceptedAt: v.optional(v.number()),
        createdAt: v.number(),
    })
        .index("by_organization", ["organizationId"])
        .index("by_token", ["token"])
        .index("by_org_status", ["organizationId", "status"]),

    // ============================================
    // User Sessions (current org)
    // ============================================
    userSessions: defineTable({
        userId: v.id("users"),
        currentOrganizationId: v.optional(v.id("organizations")),
        lastActivityAt: v.number(),
    }).index("by_user", ["userId"]),

    // ============================================
    // Tags
    // ============================================
    tags: defineTable({
        organizationId: v.id("organizations"),
        name: v.string(),
        color: v.optional(v.string()),
        createdAt: v.number(),
    })
        .index("by_organization", ["organizationId"])
        .index("by_org_name", ["organizationId", "name"]),

    // ============================================
    // Contacts
    // ============================================
    contacts: defineTable({
        organizationId: v.id("organizations"),

        // Identity
        phone: v.string(),
        name: v.optional(v.string()), // Full name or Display name
        firstName: v.optional(v.string()),
        lastName: v.optional(v.string()),
        email: v.optional(v.string()),

        // Professional
        company: v.optional(v.string()),
        jobTitle: v.optional(v.string()),

        // Address
        address: v.optional(v.string()),
        city: v.optional(v.string()),
        country: v.optional(v.string()),

        // Metadata
        notes: v.optional(v.string()),
        tags: v.optional(v.array(v.id("tags"))),
        isWhatsApp: v.optional(v.boolean()),

        // Search & Sort
        searchName: v.string(), // Concatenated field for search (name + phone + email)

        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_organization", ["organizationId"])
        .index("by_org_phone", ["organizationId", "phone"])
        .index("by_org_created", ["organizationId", "createdAt"]) // For default sorting
        .searchIndex("search_contacts", {
            searchField: "searchName",
            filterFields: ["organizationId"],
        }),

    // ==========================================
    // TEMPLATES
    // ==========================================
    templates: defineTable({
        organizationId: v.id('organizations'),
        whatsappConfigId: v.optional(v.id('whatsappConfigs')), // Note: verify if whatsappConfigs table exists, handled below

        // Meta IDs
        metaTemplateId: v.optional(v.string()),
        metaTemplateName: v.optional(v.string()),

        // Base info
        name: v.string(),
        slug: v.string(),
        description: v.optional(v.string()),

        // Type & Category
        type: v.string(), // Validated by app logic
        category: v.string(), // Validated by app logic
        language: v.string(),

        // Allow category change (Meta can suggest different category)
        allowCategoryChange: v.optional(v.boolean()),

        // ========== COMMON COMPONENTS ==========

        // Header
        header: v.optional(v.object({
            type: v.string(), // Validated by app logic
            text: v.optional(v.string()),
            mediaUrl: v.optional(v.string()),
            mediaStorageId: v.optional(v.id('_storage')),
            mediaHandle: v.optional(v.string()), // Meta media handle
            location: v.optional(v.object({
                latitude: v.number(),
                longitude: v.number(),
                name: v.optional(v.string()),
                address: v.optional(v.string()),
            })),
            example: v.optional(v.object({
                text: v.optional(v.string()),
                mediaUrl: v.optional(v.string()),
            })),
        })),

        // Body
        body: v.optional(v.string()),
        bodyExamples: v.optional(v.array(v.string())),

        // Footer
        footer: v.optional(v.string()),

        // Buttons
        buttons: v.optional(v.array(v.object({
            type: v.string(),
            text: v.string(),
            // URL button
            url: v.optional(v.string()),
            urlSuffix: v.optional(v.string()), // Dynamic part {{1}}
            // Phone button
            phoneNumber: v.optional(v.string()),
            // Quick reply
            payload: v.optional(v.string()),
            // Catalog/Product
            catalogId: v.optional(v.string()),
            productRetailerId: v.optional(v.string()),
        }))),

        // ========== TYPE-SPECIFIC CONFIGS ==========

        // CAROUSEL (2-10 cards)
        carouselCards: v.optional(v.array(v.object({
            header: v.object({
                type: v.string(),
                mediaUrl: v.optional(v.string()),
                mediaStorageId: v.optional(v.id('_storage')),
                mediaHandle: v.optional(v.string()),
            }),
            body: v.string(),
            bodyExamples: v.optional(v.array(v.string())),
            buttons: v.array(v.object({
                type: v.string(),
                text: v.string(),
                url: v.optional(v.string()),
                urlSuffix: v.optional(v.string()),
                phoneNumber: v.optional(v.string()),
                payload: v.optional(v.string()),
            })),
        }))),

        // CATALOG / PRODUCTS
        catalogConfig: v.optional(v.object({
            catalogId: v.string(),
            // Single product
            productRetailerId: v.optional(v.string()),
            // Multi product (sections)
            sections: v.optional(v.array(v.object({
                title: v.string(),
                productRetailerIds: v.array(v.string()),
            }))),
            // Thumbnail product (for header)
            thumbnailProductRetailerId: v.optional(v.string()),
        })),

        // LIST (interactive list message)
        listConfig: v.optional(v.object({
            buttonText: v.string(), // Max 20 chars
            sections: v.array(v.object({
                title: v.optional(v.string()), // Max 24 chars
                rows: v.array(v.object({
                    id: v.string(),
                    title: v.string(), // Max 24 chars
                    description: v.optional(v.string()), // Max 72 chars
                })),
            })),
        })),

        // LOCATION
        locationConfig: v.optional(v.object({
            action: v.string(), // send vs request
            // For send
            location: v.optional(v.object({
                latitude: v.number(),
                longitude: v.number(),
                name: v.optional(v.string()),
                address: v.optional(v.string()),
            })),
        })),

        // LIMITED TIME OFFER
        ltoConfig: v.optional(v.object({
            hasExpiration: v.boolean(),
            expirationTimeMs: v.optional(v.number()), // Unix timestamp
            offerCode: v.optional(v.string()),
        })),

        // COUPON
        couponConfig: v.optional(v.object({
            couponCode: v.string(),
            // Auto-generated button to copy code
        })),

        // AUTHENTICATION (OTP)
        authConfig: v.optional(v.object({
            codeExpirationMinutes: v.optional(v.number()), // 1-90
            addSecurityRecommendation: v.optional(v.boolean()),
            // One-tap autofill (Android only)
            enableOneTapAutofill: v.optional(v.boolean()),
            packageName: v.optional(v.string()), // Android package
            signatureHash: v.optional(v.string()), // App signature
            // Zero-tap (for eligible businesses)
            enableZeroTap: v.optional(v.boolean()),
        })),

        // ORDER DETAILS / ORDER STATUS
        orderConfig: v.optional(v.object({
            // Type of order message
            orderType: v.string(),
            // Reference
            referenceId: v.optional(v.string()),
            // Status (for order_status)
            status: v.optional(v.string()),
            // Tracking
            trackingUrl: v.optional(v.string()),
            carrier: v.optional(v.string()),
            trackingNumber: v.optional(v.string()),
            // Payment
            paymentStatus: v.optional(v.string()),
        })),

        // ========== STATUS & QUALITY ==========

        status: v.string(),
        statusMessage: v.optional(v.string()),
        rejectedReason: v.optional(v.string()),
        qualityScore: v.optional(v.string()),

        // ========== STATISTICS ==========

        sentCount: v.number(),
        deliveredCount: v.number(),
        readCount: v.number(),
        repliedCount: v.number(),
        clickedCount: v.number(),
        convertedCount: v.number(),
        failedCount: v.number(),
        blockedCount: v.number(),

        // ========== TIMESTAMPS ==========

        lastSyncedAt: v.optional(v.number()),
        lastUsedAt: v.optional(v.number()),
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index('by_organization', ['organizationId'])
        .index('by_org_and_status', ['organizationId', 'status'])
        .index('by_org_and_type', ['organizationId', 'type'])
        .index('by_org_and_category', ['organizationId', 'category'])
        .index('by_org_slug_lang', ['organizationId', 'slug', 'language'])
        .index('by_metaTemplateId', ['metaTemplateId'])
        .searchIndex('search_templates', {
            searchField: 'name',
            filterFields: ['organizationId', 'status', 'type', 'category'],
        }),

    // ==========================================
    // TEMPLATE SUBMISSIONS (Audit Log)
    // ==========================================
    templateSubmissions: defineTable({
        templateId: v.id('templates'),
        action: v.string(),
        payload: v.any(),
        metaResponse: v.optional(v.any()),
        metaTemplateId: v.optional(v.string()),
        success: v.boolean(),
        errorCode: v.optional(v.string()),
        errorMessage: v.optional(v.string()),
        submittedByMemberId: v.optional(v.id('users')), // NOTE: Using users table instead of members
        createdAt: v.number(),
    })
        .index('by_template', ['templateId'])
        .index('by_createdAt', ['createdAt']),

    // ==========================================
    // TEMPLATE ANALYTICS (Daily)
    // ==========================================
    templateAnalytics: defineTable({
        templateId: v.id('templates'),
        date: v.string(), // YYYY-MM-DD

        // Counts
        sent: v.number(),
        delivered: v.number(),
        read: v.number(),
        replied: v.number(),
        clicked: v.number(),
        converted: v.number(),
        failed: v.number(),
        blocked: v.number(),

        // Costs (in cents)
        totalCost: v.optional(v.number()),

        // Breakdown by button (for CTA, carousel)
        buttonClicks: v.optional(v.array(v.object({
            buttonIndex: v.number(),
            buttonText: v.string(),
            clicks: v.number(),
        }))),

        // Breakdown by card (for carousel)
        cardMetrics: v.optional(v.array(v.object({
            cardIndex: v.number(),
            views: v.number(),
            clicks: v.number(),
        }))),

        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index('by_template', ['templateId'])
        .index('by_template_date', ['templateId', 'date']),

    // ==========================================
    // TEMPLATE VARIABLES (for complex templates)
    // ==========================================
    templateVariables: defineTable({
        templateId: v.id('templates'),

        // Variable info
        index: v.number(), // {{1}}, {{2}}, etc.
        name: v.string(), // Human readable: "customer_name"
        description: v.optional(v.string()),

        // Type hint for UI
        dataType: v.string(),

        // Default/example value
        defaultValue: v.optional(v.string()),
        example: v.string(),

        // Validation
        required: v.boolean(),
        maxLength: v.optional(v.number()),
        pattern: v.optional(v.string()), // Regex

        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index('by_template', ['templateId'])
        .index('by_template_index', ['templateId', 'index']),

    // ==========================================
    // SHORTCUTS (Quick Replies)
    // ==========================================
    // ============================================
    // Broadcasts (Campaigns)
    // ============================================
    broadcasts: defineTable({
        organizationId: v.id("organizations"),
        name: v.string(),
        templateId: v.id("templates"),

        status: v.union(
            v.literal("DRAFT"),
            v.literal("SCHEDULED"),
            v.literal("SENDING"),
            v.literal("COMPLETED"),
            v.literal("FAILED"),
            v.literal("CANCELLED")
        ),

        scheduledAt: v.optional(v.number()),
        completedAt: v.optional(v.number()),

        // Stats snapshot
        sentCount: v.number(),
        deliveredCount: v.number(),
        readCount: v.number(),
        repliedCount: v.number(),
        failedCount: v.number(),

        // Metadata
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_organization", ["organizationId"])
        .index("by_org_status", ["organizationId", "status"]),

    shortcuts: defineTable({
        organizationId: v.id("organizations"),
        shortcut: v.string(), // Trigger command (e.g., "/intro")
        text: v.string(), // Full text content
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_organization", ["organizationId"])
        .index("by_org_shortcut", ["organizationId", "shortcut"])
        .searchIndex("search_shortcuts", {
            searchField: "shortcut",
            filterFields: ["organizationId"],
        }), // Note: text search would ideally include text field too but Convex search supports 1 searchField.
    // I'll search on "shortcut" primarily. If user wants to search text, I might need another index or concatenation?
    // "on va vérifier par exemple à 15".
    // I'll stick to searching shortcut for now, or just use `shortcut` as searchField.
    // Actually, `searchName` in contacts used concatenation.
    // I can add a `searchField` to shortcuts too? Or just search `shortcut`.
    // User usually searches the trigger.
    // I'll just add search on `shortcut`.
});
