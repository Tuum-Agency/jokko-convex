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
            assignment: v.optional(v.object({
                autoAssignEnabled: v.boolean(),
                maxConcurrentChats: v.number(),
                excludeOfflineAgents: v.boolean()
            }))
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
        lastAssignedAt: v.optional(v.number()),
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
        address: v.optional(v.string()),
        city: v.optional(v.string()),
        country: v.optional(v.string()),
        countryCode: v.optional(v.string()), // e.g. "+221"

        // Professional
        company: v.optional(v.string()),
        jobTitle: v.optional(v.string()),

        // Metadata
        notes: v.optional(v.union(
            v.string(),
            v.array(v.object({
                content: v.string(),
                authorId: v.optional(v.id("users")),
                createdAt: v.number()
            }))
        )),
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
        audienceConfig: v.object({
            type: v.union(v.literal("ALL"), v.literal("TAGS"), v.literal("COUNTRIES")),
            tags: v.optional(v.array(v.id("tags"))),
            countries: v.optional(v.array(v.string())), // Array of prefixes e.g. ["+221", "+33"]
        }),

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
        text: v.optional(v.string()), // Full text content or caption
        type: v.optional(v.string()), // "TEXT", "IMAGE", "VIDEO", "DOCUMENT"
        mediaStorageId: v.optional(v.id("_storage")), // For media shortcuts
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
    // ============================================
    // Flows (Automation)
    // ============================================
    flows: defineTable({
        organizationId: v.id("organizations"),
        name: v.string(),
        description: v.optional(v.string()),
        triggerType: v.string(), // e.g., "KEYWORD"
        triggerConfig: v.optional(v.string()), // JSON string for config
        nodes: v.string(), // JSON string (array of nodes)
        edges: v.string(), // JSON string (array of edges)
        isActive: v.boolean(),
        createdAt: v.number(),
        updatedAt: v.number(),
    }).index("by_organization", ["organizationId"]),

    // ============================================
    // CONVERSATIONS
    // ============================================
    conversations: defineTable({
        organizationId: v.id("organizations"),
        contactId: v.optional(v.id("contacts")),

        // Channel info
        channel: v.string(), // "WHATSAPP", "SMS", etc.
        channelId: v.optional(v.string()), // External ID

        // Status
        status: v.string(), // "OPEN", "CLOSED", "SNOOZED"

        // Assignment
        assignedTo: v.optional(v.id("users")),
        assignedAt: v.optional(v.number()), // Log assignment time
        departmentId: v.optional(v.string()),

        // Window
        windowExpiresAt: v.optional(v.number()), // WhatsApp 24h window expiration

        // Metadata
        lastMessageAt: v.number(),
        unreadCount: v.number(),
        preview: v.optional(v.string()),
        priority: v.optional(v.string()), // "urgent", "high", "normal", "low"

        // Tags
        tags: v.optional(v.array(v.string())),

        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_organization", ["organizationId"])
        .index("by_org_status", ["organizationId", "status"])
        .index("by_org_last_message", ["organizationId", "lastMessageAt"])
        .index("by_assigned", ["assignedTo"])
        .index("by_department", ["departmentId"]),

    // ============================================
    // MESSAGES
    // ============================================
    messages: defineTable({
        organizationId: v.id("organizations"),
        conversationId: v.id("conversations"),
        senderId: v.optional(v.id("users")), // null if contact (INBOUND) or SYSTEM
        contactId: v.optional(v.id("contacts")), // null if user (OUTBOUND) or SYSTEM

        // Content
        type: v.string(), // "TEXT", "IMAGE", "VIDEO", "AUDIO", "DOCUMENT", "LOCATION", "STICKER", "REACTION", "SYSTEM"
        content: v.optional(v.string()),
        mediaUrl: v.optional(v.string()), // URL if media
        mediaType: v.optional(v.string()), // MIME type
        fileName: v.optional(v.string()), // For documents
        fileSize: v.optional(v.number()), // Size in bytes
        mediaStorageId: v.optional(v.id("_storage")),

        // Location specifics
        latitude: v.optional(v.number()),
        longitude: v.optional(v.number()),
        locationName: v.optional(v.string()),
        locationAddress: v.optional(v.string()),

        // Metadata
        direction: v.string(), // "INBOUND", "OUTBOUND"
        status: v.string(), // "PENDING", "SENT", "DELIVERED", "READ", "FAILED"

        // Reply/Forward
        replyToId: v.optional(v.id("messages")),
        isForwarded: v.optional(v.boolean()),

        // External ID (WhatsApp Message ID)
        externalId: v.optional(v.string()),

        // Broadcast Link (Campaigns)
        broadcastId: v.optional(v.id("broadcasts")),

        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_conversation", ["conversationId"])
        .index("by_organization", ["organizationId"]),

    // ============================================
    // TYPING INDICATORS
    // ============================================
    typing: defineTable({
        conversationId: v.id("conversations"),
        userId: v.id("users"),
        timestamp: v.number(),
    })
        .index("by_conversation", ["conversationId"])
        .index("by_user", ["userId"])
        .index("by_conversation_user", ["conversationId", "userId"]),

    // ============================================
    // ASSIGNMENT SYSTEM
    // ============================================

    // DEPARTMENTS TABLE
    departments: defineTable({
        organizationId: v.id('organizations'),

        // Basic info
        name: v.string(),
        nameFr: v.optional(v.string()),
        description: v.optional(v.string()),
        icon: v.optional(v.string()),
        color: v.optional(v.string()),

        // Routing configuration
        routingStrategy: v.union(
            v.literal('ROUND_ROBIN'),   // Séquentiel
            v.literal('LEAST_BUSY'),    // Moins chargé
            v.literal('RANDOM'),        // Aléatoire
            v.literal('SKILLS_BASED'),  // Basé sur compétences
            v.literal('PRIORITY'),      // Par priorité agent
            v.literal('STICKY')         // Même agent si possible
        ),
        autoAssign: v.boolean(),
        maxQueueSize: v.optional(v.number()),
        maxWaitTimeMinutes: v.optional(v.number()),

        // Working hours
        schedule: v.optional(v.object({
            enabled: v.boolean(),
            timezone: v.string(),
            slots: v.array(v.object({
                dayOfWeek: v.number(), // 0-6 (Sunday-Saturday)
                startTime: v.string(), // "09:00"
                endTime: v.string(),   // "18:00"
            })),
        })),

        // Fallback when no agents available
        fallback: v.optional(v.object({
            type: v.union(
                v.literal('QUEUE'),       // Mettre en file d'attente
                v.literal('DEPARTMENT'),  // Rediriger vers autre dept
                v.literal('AUTO_REPLY'),  // Message automatique
                v.literal('ESCALATE')     // Escalader
            ),
            targetDepartmentId: v.optional(v.id('departments')),
            autoReplyMessage: v.optional(v.string()),
        })),

        // SLA settings
        sla: v.optional(v.object({
            firstResponseMinutes: v.number(),
            resolutionMinutes: v.number(),
            warningThresholdPercent: v.number(),
        })),

        // Priority
        priority: v.number(), // 1-10, higher = more important

        // Status
        isActive: v.boolean(),
        isDefault: v.boolean(), // Département par défaut

        // Stats cache
        activeConversations: v.number(),
        queuedConversations: v.number(),

        // Timestamps
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index('by_organization', ['organizationId'])
        .index('by_org_and_active', ['organizationId', 'isActive'])
        .index('by_org_and_default', ['organizationId', 'isDefault']),

    // AGENTS TABLE (Agent-specific settings)
    agents: defineTable({
        organizationId: v.id('organizations'),
        memberId: v.id('users'), // Changed from 'members' to 'users' as per existing schema structure where users are the member entities

        // Department assignments
        departmentIds: v.array(v.string()),
        primaryDepartmentId: v.optional(v.string()),

        // Skills/Tags for skills-based routing
        skills: v.optional(v.array(v.string())),
        languages: v.optional(v.array(v.string())),

        // Status
        status: v.union(
            v.literal('ONLINE'),      // Disponible
            v.literal('BUSY'),        // En conversation
            v.literal('AWAY'),        // Absent temporaire
            v.literal('OFFLINE'),     // Hors ligne
            v.literal('DND')          // Ne pas déranger
        ),
        statusMessage: v.optional(v.string()),
        statusUpdatedAt: v.number(),

        // Capacity
        maxConcurrentChats: v.number(),
        currentActiveChats: v.number(),

        // Priority in routing (higher = gets more chats)
        routingPriority: v.number(), // 1-10

        // Auto-assignment settings
        autoAccept: v.boolean(), // Accept assignments automatically
        acceptNewChats: v.boolean(), // Currently accepting new chats

        // Working hours override (if different from department)
        scheduleOverride: v.optional(v.object({
            enabled: v.boolean(),
            timezone: v.string(),
            slots: v.array(v.object({
                dayOfWeek: v.number(),
                startTime: v.string(),
                endTime: v.string(),
            })),
        })),

        // Performance metrics (cached)
        metrics: v.optional(v.object({
            averageResponseTime: v.number(), // seconds
            averageResolutionTime: v.number(),
            satisfactionScore: v.number(), // 0-100
            conversationsToday: v.number(),
            conversationsThisWeek: v.number(),
        })),

        // Last activity
        lastActivityAt: v.number(),
        lastAssignedAt: v.optional(v.number()),

        // Timestamps
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index('by_organization', ['organizationId'])
        .index('by_member', ['memberId'])
        .index('by_org_and_status', ['organizationId', 'status'])
        .index('by_department', ['departmentIds']),

    // ROUTING RULES TABLE
    routingRules: defineTable({
        organizationId: v.id('organizations'),

        // Basic info
        name: v.string(),
        description: v.optional(v.string()),

        // Priority (lower = checked first)
        priority: v.number(),

        // Conditions (AND logic between conditions)
        conditions: v.array(v.object({
            type: v.union(
                v.literal('KEYWORD'),       // Mot-clé dans message
                v.literal('CONTACT_TAG'),   // Tag du contact
                v.literal('CONTACT_FIELD'), // Champ du contact
                v.literal('TIME_RANGE'),    // Plage horaire
                v.literal('DAY_OF_WEEK'),   // Jour de semaine
                v.literal('CHANNEL'),       // Canal (WhatsApp, etc.)
                v.literal('LANGUAGE'),      // Langue détectée
                v.literal('SENTIMENT'),     // Sentiment du message
                v.literal('INTENT')         // Intent AI détecté
            ),
            field: v.optional(v.string()), // For CONTACT_FIELD
            operator: v.union(
                v.literal('EQUALS'),
                v.literal('NOT_EQUALS'),
                v.literal('CONTAINS'),
                v.literal('NOT_CONTAINS'),
                v.literal('STARTS_WITH'),
                v.literal('ENDS_WITH'),
                v.literal('GREATER_THAN'),
                v.literal('LESS_THAN'),
                v.literal('IN'),
                v.literal('NOT_IN'),
                v.literal('REGEX')
            ),
            value: v.union(v.string(), v.number(), v.array(v.string())),
            caseSensitive: v.optional(v.boolean()),
        })),

        // Action when rule matches
        action: v.object({
            type: v.union(
                v.literal('ASSIGN_DEPARTMENT'),
                v.literal('ASSIGN_AGENT'),
                v.literal('ADD_TAG'),
                v.literal('SET_PRIORITY'),
                v.literal('AUTO_REPLY'),
                v.literal('ESCALATE')
            ),
            departmentId: v.optional(v.string()),
            agentId: v.optional(v.id('agents')),
            tagName: v.optional(v.string()),
            priority: v.optional(v.number()),
            autoReplyTemplateId: v.optional(v.id('templates')),
        }),

        // Schedule (when rule is active)
        schedule: v.optional(v.object({
            enabled: v.boolean(),
            timezone: v.string(),
            slots: v.array(v.object({
                dayOfWeek: v.number(),
                startTime: v.string(),
                endTime: v.string(),
            })),
        })),

        // Status
        isActive: v.boolean(),

        // Stats
        matchCount: v.number(),
        lastMatchedAt: v.optional(v.number()),

        // Timestamps
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index('by_organization', ['organizationId'])
        .index('by_org_and_active', ['organizationId', 'isActive'])
        .index('by_org_and_priority', ['organizationId', 'priority']),

    // ASSIGNMENTS TABLE
    assignments: defineTable({
        organizationId: v.id('organizations'),
        conversationId: v.id('conversations'), // WARNING: `conversations` table must exist, if not I need to create it or stub it. I'll assume it exists or I'll create it.

        // Current assignment
        agentId: v.optional(v.id('agents')),
        departmentId: v.optional(v.string()),

        // Status
        status: v.union(
            v.literal('PENDING'),     // En attente d'acceptation
            v.literal('ACTIVE'),      // Assigné et actif
            v.literal('PAUSED'),      // Mis en pause
            v.literal('COMPLETED'),   // Terminé
            v.literal('TRANSFERRED'), // Transféré
            v.literal('ESCALATED')    // Escaladé
        ),

        // Assignment metadata
        assignedBy: v.union(
            v.literal('SYSTEM'),      // Auto-assigned
            v.literal('MANUAL'),      // Manually by admin/manager
            v.literal('TRANSFER'),    // Via transfer
            v.literal('ESCALATION'),  // Via escalation
            v.literal('RULE')         // Via routing rule
        ),
        assignedByMemberId: v.optional(v.id('users')),
        ruleId: v.optional(v.id('routingRules')),

        // Timing
        assignedAt: v.number(),
        acceptedAt: v.optional(v.number()),
        firstResponseAt: v.optional(v.number()),
        resolvedAt: v.optional(v.number()),

        // SLA tracking
        slaBreached: v.boolean(),
        slaBreachType: v.optional(v.union(
            v.literal('FIRST_RESPONSE'),
            v.literal('RESOLUTION')
        )),

        // Notes
        internalNotes: v.optional(v.string()),

        // History of changes
        history: v.array(v.object({
            action: v.string(),
            fromAgentId: v.optional(v.id('agents')),
            toAgentId: v.optional(v.id('agents')),
            fromDepartmentId: v.optional(v.string()),
            toDepartmentId: v.optional(v.string()),
            reason: v.optional(v.string()),
            performedBy: v.optional(v.id('users')),
            timestamp: v.number(),
        })),

        // Timestamps
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index('by_organization', ['organizationId'])
        .index('by_conversation', ['conversationId'])
        .index('by_agent', ['agentId'])
        .index('by_department', ['departmentId'])
        .index('by_org_and_status', ['organizationId', 'status'])
        .index('by_agent_and_status', ['agentId', 'status']),

    // ASSIGNMENT QUEUE TABLE
    assignmentQueue: defineTable({
        organizationId: v.id('organizations'),
        departmentId: v.string(),
        conversationId: v.id('conversations'),

        // Queue position
        position: v.number(),
        priority: v.number(), // Higher = more urgent

        // Timing
        queuedAt: v.number(),
        estimatedWaitMinutes: v.optional(v.number()),

        // Attempts
        assignmentAttempts: v.number(),
        lastAttemptAt: v.optional(v.number()),
        lastAttemptError: v.optional(v.string()),

        // Contact info for display
        contactName: v.optional(v.string()),
        contactPhone: v.string(),
        lastMessagePreview: v.optional(v.string()),

        // Status
        status: v.union(
            v.literal('WAITING'),
            v.literal('ASSIGNING'),
            v.literal('ASSIGNED'),
            v.literal('EXPIRED'),
            v.literal('CANCELLED')
        ),

        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index('by_department', ['departmentId'])
        .index('by_organization', ['organizationId'])
        .index('by_dept_and_status', ['departmentId', 'status'])
        .index('by_dept_and_position', ['departmentId', 'position']),

    // TRANSFERS TABLE
    transfers: defineTable({
        organizationId: v.id('organizations'),
        conversationId: v.id('conversations'),
        assignmentId: v.id('assignments'),

        // From
        fromAgentId: v.optional(v.id('agents')),
        fromDepartmentId: v.optional(v.id('departments')),

        // To
        toAgentId: v.optional(v.id('agents')),
        toDepartmentId: v.optional(v.id('departments')),

        // Type
        type: v.union(
            v.literal('TRANSFER'),    // Simple transfer
            v.literal('ESCALATION'),  // Escalation to supervisor
            v.literal('HANDOFF')      // Shift handoff
        ),

        // Reason
        reason: v.string(),
        reasonCategory: v.optional(v.union(
            v.literal('SKILL_MISMATCH'),
            v.literal('WORKLOAD'),
            v.literal('CUSTOMER_REQUEST'),
            v.literal('SHIFT_END'),
            v.literal('ESCALATION'),
            v.literal('OTHER')
        )),

        // Status
        status: v.union(
            v.literal('PENDING'),
            v.literal('ACCEPTED'),
            v.literal('REJECTED'),
            v.literal('CANCELLED'),
            v.literal('EXPIRED')
        ),

        // Timing
        requestedAt: v.number(),
        respondedAt: v.optional(v.number()),
        expiresAt: v.number(),

        // Initiated by
        requestedByMemberId: v.id('users'),

        // Response
        responseNote: v.optional(v.string()),

        createdAt: v.number(),
    })
        .index('by_organization', ['organizationId'])
        .index('by_conversation', ['conversationId'])
        .index('by_to_agent', ['toAgentId', 'status'])
        .index('by_from_agent', ['fromAgentId']),

    // AGENT ANALYTICS TABLE
    agentAnalytics: defineTable({
        agentId: v.id('agents'),
        organizationId: v.id('organizations'),
        date: v.string(), // 'YYYY-MM-DD'

        // Volume
        conversationsAssigned: v.number(),
        conversationsCompleted: v.number(),
        conversationsTransferred: v.number(),
        messagesReceived: v.number(),
        messagesSent: v.number(),

        // Time metrics (in seconds)
        totalHandleTime: v.number(),
        averageHandleTime: v.number(),
        totalResponseTime: v.number(),
        averageFirstResponseTime: v.number(),
        averageResponseTime: v.number(),

        // Online time
        onlineMinutes: v.number(),
        busyMinutes: v.number(),
        awayMinutes: v.number(),

        // Quality
        satisfactionResponses: v.number(),
        satisfactionTotal: v.number(), // Sum of scores
        satisfactionAverage: v.number(),

        // SLA
        slaBreaches: v.number(),
        slaCompliance: v.number(), // percentage

        // By hour breakdown
        hourlyBreakdown: v.optional(v.array(v.object({
            hour: v.number(), // 0-23
            conversations: v.number(),
            messages: v.number(),
            avgResponseTime: v.number(),
        }))),

        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index('by_agent', ['agentId'])
        .index('by_agent_and_date', ['agentId', 'date'])
        .index('by_organization_and_date', ['organizationId', 'date']),

    // DEPARTMENT ANALYTICS TABLE
    departmentAnalytics: defineTable({
        departmentId: v.id('departments'),
        organizationId: v.id('organizations'),
        date: v.string(), // 'YYYY-MM-DD'

        // Volume
        conversationsReceived: v.number(),
        conversationsCompleted: v.number(),
        conversationsEscalated: v.number(),

        // Queue metrics
        averageQueueTime: v.number(), // seconds
        maxQueueTime: v.number(),
        queueAbandoned: v.number(),

        // Response metrics
        averageFirstResponseTime: v.number(),
        averageResolutionTime: v.number(),

        // SLA
        slaBreaches: v.number(),
        slaCompliance: v.number(),

        // Agent metrics
        activeAgents: v.number(),
        averageAgentUtilization: v.number(), // percentage

        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index('by_department', ['departmentId'])
        .index('by_department_and_date', ['departmentId', 'date'])
        .index('by_organization_and_date', ['organizationId', 'date']),
    // ============================================
    // NOTIFICATIONS
    // ============================================
    notifications: defineTable({
        organizationId: v.id("organizations"),
        userId: v.id("users"), // Whom the notification is for
        type: v.string(), // "ASSIGNMENT", "SYSTEM", "MENTION", etc.
        title: v.string(),
        message: v.string(),
        link: v.optional(v.string()), // e.g. /dashboard/conversations/123
        isRead: v.boolean(),
        metadata: v.optional(v.any()), // flexible payload
        createdAt: v.number(),
    })
        .index("by_user", ["userId"])
        .index("by_user_read", ["userId", "isRead"])
        .index("by_org", ["organizationId"]),
});
