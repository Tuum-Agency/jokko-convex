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
    // Memberships (User <-> Organization)
    // ============================================
    memberships: defineTable({
        userId: v.id("users"),
        organizationId: v.id("organizations"),
        role: v.union(v.literal("OWNER"), v.literal("ADMIN"), v.literal("AGENT")),
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
        .index("by_org_status", ["organizationId", "status"]),

    // ============================================
    // Invitations
    // ============================================
    invitations: defineTable({
        organizationId: v.id("organizations"),
        email: v.string(),
        role: v.union(v.literal("ADMIN"), v.literal("AGENT")),
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
});
