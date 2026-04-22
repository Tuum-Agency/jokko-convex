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
    // Plans (source unique de vérité pour limites & tarifs)
    // ============================================
    plans: defineTable({
        key: v.string(),
        name: v.string(),
        description: v.string(),
        maxAgents: v.number(),
        maxWhatsappChannels: v.number(),
        maxConversationsPerMonth: v.number(),
        maxTemplates: v.number(),
        historyDays: v.number(),
        monthlyPriceFCFA: v.number(),
        yearlyPriceFCFA: v.number(),
        yearlyMonthlyPriceFCFA: v.number(),
        features: v.array(v.object({
            label: v.string(),
            included: v.boolean(),
        })),
        supportLevel: v.string(),
        popular: v.optional(v.boolean()),
        sortOrder: v.number(),
        isActive: v.boolean(),
    }).index("by_key", ["key"]),

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
    }).index("email", ["email"]),

    // ============================================
    // Organizations (Entreprises - Tenants)
    // ============================================
    organizations: defineTable({
        name: v.string(),
        slug: v.optional(v.string()),
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
            businessHours: v.optional(v.union(
                v.object({
                    enabled: v.boolean(),
                    timezone: v.optional(v.string()),
                    schedule: v.optional(v.array(v.object({
                        day: v.string(),
                        enabled: v.boolean(),
                        start: v.optional(v.string()),
                        end: v.optional(v.string()),
                    }))),
                }),
                v.record(v.string(), v.any())
            )),
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
            v.literal("BUSINESS"),
            v.literal("PRO"),
            v.literal("ENTERPRISE")
        ),
        creditBalance: v.optional(v.number()), // Solde de crédits (FCFA ou Unités)

        // App-level trial (14 jours à partir de la création de l'org)
        // Toutes les fonctionnalités sont déverrouillées pendant cette période, peu importe le plan choisi.
        trialStartedAt: v.optional(v.number()),
        trialEndsAt: v.optional(v.number()),

        // Indique si l'utilisateur a explicitement sélectionné un plan payant.
        // FREE est un sentinel "pas de plan choisi". Après expiration du trial et
        // sans plan sélectionné, toutes les features sont verrouillées.
        hasSelectedPlan: v.optional(v.boolean()),

        // Stripe Subscription
        stripe: v.optional(v.object({
            customerId: v.string(),
            subscriptionId: v.optional(v.string()),
            priceId: v.optional(v.string()),
            status: v.optional(v.string()), // active, canceled, past_due, trialing
            currentPeriodEnd: v.optional(v.number()),
            trialUsed: v.optional(v.boolean()),
        })),

        // Fair Usage Policy (Limits)
        usageStats: v.optional(v.object({
            periodStart: v.number(), // Start of billing cycle (timestamp)
            periodEnd: v.number(),   // End of billing cycle (timestamp)
            serviceConversationsCount: v.number(), // Free tier usage
        })),

        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_owner", ["ownerId"])
        .index("by_slug", ["slug"])
        .index("by_whatsapp_phone_id", ["whatsapp.phoneNumberId"])
        .index("by_stripe_customer", ["stripe.customerId"]),

    // ============================================
    // Credits & Billing
    // ============================================
    creditTransactions: defineTable({
        organizationId: v.id("organizations"),
        amount: v.number(), // Positive for recharge, Negative for usage
        type: v.union(
            v.literal("RECHARGE"), // Achat de crédits
            v.literal("USAGE"),    // Consommation (Broadcast, AI)
            v.literal("BONUS"),    // Offert (ex: 500 offerts)
            v.literal("REFUND"),   // Remboursement
            v.literal("ADJUSTMENT") // Correction manuelle
        ),
        description: v.optional(v.string()), // ex: "Campagne Promo Tabaski"
        referenceId: v.optional(v.string()), // ex: Payment ID or Broadcast ID
        balanceAfter: v.number(), // Snapshot du solde après opération
        performedBy: v.optional(v.id("users")), // User who triggered action
        metadata: v.optional(v.any()),
        createdAt: v.number(),
    })
        .index("by_organization", ["organizationId"])
        .index("by_org_type", ["organizationId", "type"])
        .index("by_org_date", ["organizationId", "createdAt"]),

    // ============================================
    // Payment Sessions (Pay-As-You-Go Recharge)
    // ============================================
    paymentSessions: defineTable({
        organizationId: v.id("organizations"),
        userId: v.id("users"),

        // Montant et crédits
        amount: v.number(),              // Montant en FCFA (unités majeures)
        credits: v.number(),             // Crédits à accorder
        provider: v.union(
            v.literal("WAVE"),
            v.literal("ORANGE_MONEY"),
            v.literal("STRIPE")
        ),

        // Lifecycle
        status: v.union(
            v.literal("PENDING"),
            v.literal("COMPLETED"),
            v.literal("FAILED"),
            v.literal("EXPIRED")
        ),

        // Provider references
        providerSessionId: v.optional(v.string()),
        providerTransactionId: v.optional(v.string()),
        checkoutUrl: v.optional(v.string()),
        publicReference: v.string(),      // Référence lisible (ex: "PAY-XXXX")

        // Idempotency & debug
        idempotencyKey: v.string(),
        providerMetadata: v.optional(v.any()),
        failureReason: v.optional(v.string()),

        // Webhook tracking
        lastWebhookAt: v.optional(v.number()),
        webhookEventId: v.optional(v.string()),

        // Timestamps
        createdAt: v.number(),
        completedAt: v.optional(v.number()),
        expiresAt: v.number(),
    })
        .index("by_organization", ["organizationId"])
        .index("by_provider_session", ["providerSessionId"])
        .index("by_idempotency", ["idempotencyKey"])
        .index("by_status", ["status"])
        .index("by_public_ref", ["publicReference"]),

    // ============================================
    // Tickets (Support)
    // ============================================
    tickets: defineTable({
        userId: v.optional(v.id("users")), // User who created the ticket (if logged in)
        organizationId: v.optional(v.id("organizations")), // Org context

        subject: v.string(),
        message: v.string(),
        type: v.union(
            v.literal("BUG"),
            v.literal("FEATURE"),
            v.literal("BILLING"),
            v.literal("OTHER")
        ),
        priority: v.optional(v.union(
            v.literal("LOW"),
            v.literal("MEDIUM"),
            v.literal("HIGH"),
            v.literal("URGENT")
        )),
        status: v.union(
            v.literal("OPEN"),
            v.literal("IN_PROGRESS"),
            v.literal("RESOLVED"),
            v.literal("CLOSED")
        ),

        // Contact info if not relying on userId/orgId only
        contactEmail: v.optional(v.string()),
        contactPhone: v.optional(v.string()),

        // Attachments?
        attachmentStorageId: v.optional(v.id("_storage")),

        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_user", ["userId"])
        .index("by_organization", ["organizationId"])
        .index("by_status", ["status"]),


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
        isBlocked: v.optional(v.boolean()), // Blocked status

        // WhatsApp opt-in (RGPD strict) — required before any outbound campaign
        whatsappOptIn: v.optional(v.object({
            status: v.union(
                v.literal("granted"),
                v.literal("revoked"),
                v.literal("unknown"),
            ),
            source: v.optional(v.union(
                v.literal("inbound_reply"),
                v.literal("web_form"),
                v.literal("csv_attested"),
                v.literal("crm_import_unknown"),
                v.literal("manual"),
            )),
            at: v.optional(v.number()),
            by: v.optional(v.id("users")),
            proofRef: v.optional(v.string()),
            textVersion: v.optional(v.string()),
        })),

        // Canonical E.164 (set by CRM integration import + inbound webhook).
        // Coexists with `phone` to avoid backfilling legacy data at once.
        phoneE164: v.optional(v.string()),
        phoneCountryCode: v.optional(v.string()),

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

        // Multi-channel WhatsApp
        whatsappChannelId: v.optional(v.id("whatsappChannels")),
        teamId: v.optional(v.id("teams")),

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
        .index("by_org_status", ["organizationId", "status"])
        .index("by_status", ["status"])
        .index("by_channel", ["whatsappChannelId"]),

    broadcastActivities: defineTable({
        broadcastId: v.id("broadcasts"),
        type: v.union(
            v.literal("created"),
            v.literal("scheduled"),
            v.literal("sending_started"),
            v.literal("completed"),
            v.literal("failures"),
            v.literal("cancelled"),
            v.literal("retry"),
            v.literal("paused")
        ),
        message: v.string(),
        createdAt: v.number(),
    })
        .index("by_broadcast", ["broadcastId"]),

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
    // WhatsApp Business Accounts (WABA)
    // ============================================
    wabas: defineTable({
        organizationId: v.id("organizations"),
        metaBusinessAccountId: v.string(),
        accessTokenRef: v.string(),
        label: v.optional(v.string()),
        createdBy: v.id("users"),
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_org", ["organizationId"])
        .index("by_meta_waba_id", ["metaBusinessAccountId"]),

    // ============================================
    // WhatsApp Channels (Phone Numbers)
    // ============================================
    whatsappChannels: defineTable({
        organizationId: v.id("organizations"),
        wabaId: v.id("wabas"),
        primaryTeamId: v.optional(v.id("teams")),
        poleId: v.optional(v.id("poles")),
        label: v.string(),
        phoneNumberId: v.string(),
        displayPhoneNumber: v.string(),
        verifiedName: v.optional(v.string()),
        webhookVerifyTokenRef: v.string(),
        isOrgDefault: v.boolean(),
        status: v.union(
            v.literal("pending_setup"),
            v.literal("active"),
            v.literal("disconnected"),
            v.literal("error"),
            v.literal("disabled"),
            v.literal("banned"),
        ),
        disabledReason: v.optional(v.union(
            v.literal("manual"),
            v.literal("plan_downgrade"),
        )),
        disabledAt: v.optional(v.number()),
        createdBy: v.id("users"),
        createdAt: v.number(),
        updatedAt: v.number(),
        lastConnectedAt: v.optional(v.number()),
        lastWebhookAt: v.optional(v.number()),
        callingEnabled: v.optional(v.boolean()),
    })
        .index("by_org", ["organizationId"])
        .index("by_phone_id", ["phoneNumberId"])
        .index("by_org_default", ["organizationId", "isOrgDefault"])
        .index("by_team", ["primaryTeamId"])
        .index("by_pole", ["poleId"])
        .index("by_waba", ["wabaId"]),

    // ============================================
    // Teams (Departments / Équipes)
    // ============================================
    teams: defineTable({
        organizationId: v.id("organizations"),
        name: v.string(),
        description: v.optional(v.string()),
        color: v.optional(v.string()),
        isArchived: v.optional(v.boolean()),
        createdBy: v.id("users"),
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_org", ["organizationId"]),

    // ============================================
    // Team Members (N:N users <-> teams)
    // ============================================
    teamMembers: defineTable({
        teamId: v.optional(v.id("teams")),
        userId: v.optional(v.id("users")),
        role: v.optional(v.string()),
        joinedAt: v.optional(v.number()),
        // Legacy fields (from previous team system)
        email: v.optional(v.string()),
        name: v.optional(v.string()),
        storeId: v.optional(v.string()),
        allStores: v.optional(v.boolean()),
        permissions: v.optional(v.array(v.string())),
        invitationStatus: v.optional(v.string()),
        invitationToken: v.optional(v.string()),
        invitedAt: v.optional(v.number()),
        isActive: v.optional(v.boolean()),
        createdAt: v.optional(v.number()),
        updatedAt: v.optional(v.number()),
    })
        .index("by_team", ["teamId"])
        .index("by_user", ["userId"])
        .index("by_team_user", ["teamId", "userId"])
        .index("by_user_team", ["userId", "teamId"]),

    // ============================================
    // Webhook Events (Idempotence)
    // ============================================
    webhookEvents: defineTable({
        metaEventId: v.string(),
        channelId: v.id("whatsappChannels"),
        eventType: v.union(v.literal("message"), v.literal("status")),
        processedAt: v.number(),
    })
        .index("by_event", ["metaEventId", "channelId"]),

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
        whatsappChannelId: v.optional(v.id("whatsappChannels")),
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_organization", ["organizationId"])
        .index("by_channel", ["whatsappChannelId"]),

    // ============================================
    // CONVERSATIONS
    // ============================================
    conversations: defineTable({
        organizationId: v.id("organizations"),
        contactId: v.optional(v.id("contacts")),

        // Channel info
        channel: v.string(), // "WHATSAPP", "SMS", etc.
        externalChannelId: v.optional(v.string()), // External ID (legacy, renamed from channelId)

        // Multi-channel WhatsApp
        whatsappChannelId: v.optional(v.id("whatsappChannels")),

        // Status
        status: v.string(), // "OPEN", "CLOSED", "SNOOZED"

        // Assignment
        assignedTo: v.optional(v.id("users")),
        assignedAt: v.optional(v.number()), // Log assignment time
        departmentId: v.optional(v.string()),
        assignedTeamId: v.optional(v.id("teams")),
        assignedUserId: v.optional(v.id("users")),
        poleId: v.optional(v.id("poles")),

        // Window
        windowExpiresAt: v.optional(v.number()), // WhatsApp 24h window expiration

        // Metadata
        lastMessageAt: v.number(),
        lastMessageDirection: v.optional(v.string()), // "INBOUND" | "OUTBOUND"
        unreadCount: v.number(),
        preview: v.optional(v.string()),
        priority: v.optional(v.string()), // "urgent", "high", "normal", "low"

        // Tags
        tags: v.optional(v.array(v.string())),

        // Pinned
        isPinned: v.optional(v.boolean()),

        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_organization", ["organizationId"])
        .index("by_org_status", ["organizationId", "status"])
        .index("by_org_last_message", ["organizationId", "lastMessageAt"])
        .index("by_org_contact", ["organizationId", "contactId", "status"])
        .index("by_assigned", ["assignedTo"])
        .index("by_department", ["departmentId"])
        // Multi-channel indexes
        .index("by_assigned_team_lastMessage", ["assignedTeamId", "lastMessageAt"])
        .index("by_org_channel_lastMessage", ["organizationId", "whatsappChannelId", "lastMessageAt"])
        .index("by_org_channel_unassigned", ["organizationId", "whatsappChannelId", "assignedTeamId", "lastMessageAt"]),

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
        content: v.optional(v.string()), // Fallback string representation
        interactive: v.optional(v.any()), // Structured interactive data (buttons, lists)
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
        .index("by_organization", ["organizationId"])
        .index("by_external_id", ["externalId"]),

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
    // ============================================
    // Waiting List
    // ============================================
    waitingList: defineTable({
        email: v.string(),
        companyName: v.string(),
        representativeName: v.string(),
        status: v.string(), // "PENDING", "APPROVED", "INVITED"
        createdAt: v.number(),
    }).index("by_email", ["email"]),

    // ============================================
    // Data Deletion Requests (Facebook GDPR compliance)
    // ============================================
    dataDeletionRequests: defineTable({
        facebookScopedUserId: v.string(),
        confirmationCode: v.string(),
        status: v.string(), // "PENDING", "COMPLETED", "FAILED"
        deletedWabaIds: v.optional(v.array(v.string())),
        deletedChannelCount: v.optional(v.number()),
        createdAt: v.number(),
        completedAt: v.optional(v.number()),
    })
        .index("by_confirmation_code", ["confirmationCode"])
        .index("by_facebook_user", ["facebookScopedUserId"]),

    // ============================================
    // Contact Segments (Filtres sauvegardés)
    // ============================================
    contactSegments: defineTable({
        organizationId: v.id("organizations"),
        name: v.string(),
        filters: v.object({
            search: v.optional(v.string()),
            tags: v.optional(v.array(v.string())),
            country: v.optional(v.string()),
            sort: v.optional(v.string()),
        }),
        createdBy: v.id("users"),
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_organization", ["organizationId"]),

    // ============================================
    // CRM INTEGRATIONS (Phase 1 — fondations)
    // ============================================

    crmConnections: defineTable({
        organizationId: v.id("organizations"),
        provider: v.string(),
        authMode: v.union(v.literal("oauth2"), v.literal("apiKey")),
        status: v.union(
            v.literal("active"),
            v.literal("degraded"),
            v.literal("reconnect_required"),
            v.literal("disconnected"),
        ),
        accessTokenEnc: v.optional(v.string()),
        refreshTokenEnc: v.optional(v.string()),
        apiKeyEnc: v.optional(v.string()),
        tokenExpiresAt: v.optional(v.number()),
        instanceUrl: v.optional(v.string()),
        scopes: v.optional(v.array(v.string())),
        remoteAccountId: v.string(),
        remoteAccountLabel: v.optional(v.string()),
        scalingMode: v.union(v.literal("standard"), v.literal("large")),
        debugMode: v.optional(v.boolean()),
        debugModeExpiresAt: v.optional(v.number()),
        refreshInFlight: v.optional(v.boolean()),
        refreshStartedAt: v.optional(v.number()),
        lastPollAt: v.optional(v.number()),
        nextPollAt: v.optional(v.number()),
        connectedAt: v.number(),
        connectedBy: v.id("users"),
        lastSyncAt: v.optional(v.number()),
        lastSuccessfulRefreshAt: v.optional(v.number()),
        lastErrorAt: v.optional(v.number()),
        lastErrorCode: v.optional(v.string()),
        lastErrorMessageSanitized: v.optional(v.string()),
        revokedAt: v.optional(v.number()),
        revokedBy: v.optional(v.id("users")),
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_organization", ["organizationId"])
        .index("by_organization_status", ["organizationId", "status"])
        .index("by_provider_remoteAccountId", ["provider", "remoteAccountId"])
        .index("by_nextPollAt", ["nextPollAt"]),

    crmRemoteAccountQuota: defineTable({
        provider: v.string(),
        remoteAccountId: v.string(),
        windowStartMs: v.number(),
        callsUsed: v.number(),
        rateLimitPerHour: v.number(),
        circuitState: v.union(
            v.literal("closed"),
            v.literal("half_open"),
            v.literal("open"),
        ),
        circuitOpenedAt: v.optional(v.number()),
        consecutiveErrors: v.number(),
        lastBackoffMs: v.optional(v.number()),
        updatedAt: v.number(),
    }).index("by_provider_account", ["provider", "remoteAccountId"]),

    crmContactLinks: defineTable({
        organizationId: v.id("organizations"),
        contactId: v.id("contacts"),
        connectionId: v.id("crmConnections"),
        provider: v.string(),
        externalId: v.string(),
        linkStatus: v.union(
            v.literal("linked"),
            v.literal("unlinked"),
            v.literal("conflict"),
        ),
        linkMethod: v.union(
            v.literal("phone"),
            v.literal("email"),
            v.literal("manual"),
            v.literal("import"),
        ),
        matchConfidence: v.optional(
            v.union(v.literal("high"), v.literal("medium"), v.literal("low")),
        ),
        externalOwnerId: v.optional(v.string()),
        externalTags: v.optional(v.array(v.string())),
        externalStage: v.optional(v.string()),
        externalLifecycleStage: v.optional(v.string()),
        externalCustomSnapshot: v.optional(v.any()),
        lastPulledAt: v.number(),
        lastPushedAt: v.optional(v.number()),
        lastSeenExternalUpdateAt: v.optional(v.number()),
        linkedAt: v.number(),
        unlinkedAt: v.optional(v.number()),
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_contact", ["contactId"])
        .index("by_org_provider_external", ["organizationId", "provider", "externalId"])
        .index("by_connection", ["connectionId"]),

    crmDeals: defineTable({
        organizationId: v.id("organizations"),
        connectionId: v.id("crmConnections"),
        provider: v.string(),
        externalId: v.string(),
        contactId: v.optional(v.id("contacts")),
        contactExternalId: v.optional(v.string()),
        title: v.string(),
        pipeline: v.optional(v.string()),
        stage: v.optional(v.string()),
        status: v.optional(v.string()),
        ownerId: v.optional(v.string()),
        amount: v.optional(v.number()),
        currency: v.optional(v.string()),
        rawSnapshot: v.optional(v.any()),
        rawSnapshotVersion: v.optional(v.number()),
        lastSeenExternalUpdateAt: v.optional(v.number()),
        syncedAt: v.number(),
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_organization", ["organizationId"])
        .index("by_org_provider_external", ["organizationId", "provider", "externalId"])
        .index("by_contact", ["contactId"]),

    crmSyncQueue: defineTable({
        organizationId: v.id("organizations"),
        connectionId: v.id("crmConnections"),
        eventType: v.string(),
        payload: v.any(),
        idempotencyKey: v.string(),
        entityType: v.optional(v.string()),
        entityId: v.optional(v.string()),
        status: v.union(
            v.literal("pending"),
            v.literal("processing"),
            v.literal("succeeded"),
            v.literal("failed"),
            v.literal("dead_letter"),
        ),
        retryCount: v.number(),
        nextAttemptAt: v.number(),
        lockedAt: v.optional(v.number()),
        processingStartedAt: v.optional(v.number()),
        lastAttemptAt: v.optional(v.number()),
        deadLetteredAt: v.optional(v.number()),
        lastError: v.optional(v.string()),
        enqueuedAtMs: v.number(),
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_idempotency", ["idempotencyKey"])
        .index("by_status_nextAttempt", ["status", "nextAttemptAt"])
        .index("by_connection_status", ["connectionId", "status"])
        .index("by_org_status", ["organizationId", "status"]),

    crmImportJobs: defineTable({
        organizationId: v.id("organizations"),
        connectionId: v.id("crmConnections"),
        jobType: v.union(
            v.literal("initial_import"),
            v.literal("resync"),
            v.literal("delta_poll"),
        ),
        phase: v.union(v.literal("contacts"), v.literal("deals")),
        status: v.union(
            v.literal("pending"),
            v.literal("running"),
            v.literal("paused"),
            v.literal("completed"),
            v.literal("failed"),
            v.literal("cancelled"),
        ),
        cursor: v.optional(v.string()),
        sinceMs: v.optional(v.number()),
        totalEstimated: v.optional(v.number()),
        processed: v.number(),
        matched: v.optional(v.number()),
        created: v.optional(v.number()),
        skipped: v.optional(v.number()),
        startedAt: v.number(),
        completedAt: v.optional(v.number()),
        lastHeartbeatAt: v.optional(v.number()),
        errorDetails: v.optional(v.string()),
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_organization", ["organizationId"])
        .index("by_connection", ["connectionId"])
        .index("by_status_heartbeat", ["status", "lastHeartbeatAt"]),

    crmWebhookReceipts: defineTable({
        organizationId: v.optional(v.id("organizations")),
        connectionId: v.optional(v.id("crmConnections")),
        provider: v.string(),
        eventKey: v.string(),
        eventType: v.optional(v.string()),
        entityType: v.optional(v.string()),
        entityExternalId: v.optional(v.string()),
        receivedAt: v.number(),
        processedAt: v.optional(v.number()),
        status: v.union(
            v.literal("received"),
            v.literal("processed"),
            v.literal("ignored"),
            v.literal("deferred"),
            v.literal("failed"),
            v.literal("superseded_by_resync"),
        ),
        rawBodySanitized: v.optional(v.string()),
        rawBodyCapturedAt: v.optional(v.number()),
        lastError: v.optional(v.string()),
    })
        .index("by_eventKey", ["eventKey"])
        .index("by_connection_received", ["connectionId", "receivedAt"])
        .index("by_status_received", ["status", "receivedAt"]),

    integrationAuditLog: defineTable({
        organizationId: v.id("organizations"),
        userId: v.optional(v.id("users")),
        connectionId: v.optional(v.id("crmConnections")),
        provider: v.optional(v.string()),
        action: v.string(),
        severity: v.union(
            v.literal("info"),
            v.literal("warning"),
            v.literal("error"),
        ),
        entityType: v.optional(v.string()),
        entityId: v.optional(v.string()),
        metadataSanitized: v.optional(v.any()),
        createdAt: v.number(),
    })
        .index("by_organization", ["organizationId"])
        .index("by_org_created", ["organizationId", "createdAt"])
        .index("by_connection", ["connectionId"]),

    crmOAuthAttempts: defineTable({
        state: v.string(),
        provider: v.string(),
        organizationId: v.id("organizations"),
        userId: v.id("users"),
        codeVerifier: v.string(),
        redirectUri: v.string(),
        expiresAt: v.number(),
        consumedAt: v.optional(v.number()),
        createdAt: v.number(),
    })
        .index("by_state", ["state"])
        .index("by_expires", ["expiresAt"]),

    integrationMetrics: defineTable({
        organizationId: v.id("organizations"),
        connectionId: v.id("crmConnections"),
        provider: v.string(),
        periodStart: v.number(),
        webhooksReceived: v.number(),
        webhooksProcessed: v.number(),
        webhooksIgnored: v.number(),
        webhooksFailed: v.number(),
        pushesEnqueued: v.number(),
        pushesSucceeded: v.number(),
        pushesFailed: v.number(),
        pushesDLQ: v.number(),
        pullBatchesSucceeded: v.number(),
        pullBatchesFailed: v.number(),
        pushLatencyCount: v.number(),
        pushLatencySumMs: v.number(),
        pushLatencyMaxMs: v.number(),
        pushLatencyLt100: v.number(),
        pushLatencyLt500: v.number(),
        pushLatencyLt1000: v.number(),
        pushLatencyLt2000: v.number(),
        pushLatencyLt30000: v.number(),
        pushLatencyGte30000: v.number(),
    })
        .index("by_connection_period", ["connectionId", "periodStart"])
        .index("by_org_period", ["organizationId", "periodStart"]),
});

