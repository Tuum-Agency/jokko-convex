import { v } from "convex/values";
import { internalMutation, internalQuery, query, QueryCtx } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Helper to get current organization
async function getCurrentOrgId(ctx: QueryCtx) {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const session = await ctx.db
        .query("userSessions")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .first();

    return session?.currentOrganizationId ?? null;
}

// Generate a human-readable payment reference: PAY-XXXXXXXX
function generatePublicReference(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let ref = "PAY-";
    for (let i = 0; i < 8; i++) {
        ref += chars[Math.floor(Math.random() * chars.length)];
    }
    return ref;
}

/**
 * Create a new payment session (called by payment actions)
 */
export const createPaymentSession = internalMutation({
    args: {
        organizationId: v.id("organizations"),
        userId: v.id("users"),
        amount: v.number(),
        credits: v.number(),
        provider: v.union(
            v.literal("WAVE"),
            v.literal("ORANGE_MONEY"),
            v.literal("STRIPE")
        ),
    },
    handler: async (ctx, args) => {
        const idempotencyKey = crypto.randomUUID();
        const publicReference = generatePublicReference();

        const sessionId = await ctx.db.insert("paymentSessions", {
            organizationId: args.organizationId,
            userId: args.userId,
            amount: args.amount,
            credits: args.credits,
            provider: args.provider,
            status: "PENDING",
            publicReference,
            idempotencyKey,
            createdAt: Date.now(),
            expiresAt: Date.now() + 30 * 60 * 1000, // 30 minutes
        });

        return { sessionId, idempotencyKey, publicReference };
    },
});

/**
 * Update a payment session with provider details (called after provider API response)
 */
export const updatePaymentSession = internalMutation({
    args: {
        sessionId: v.id("paymentSessions"),
        providerSessionId: v.optional(v.string()),
        checkoutUrl: v.optional(v.string()),
        providerMetadata: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        const { sessionId, ...updates } = args;
        const cleanUpdates: Record<string, unknown> = {};
        if (updates.providerSessionId !== undefined) cleanUpdates.providerSessionId = updates.providerSessionId;
        if (updates.checkoutUrl !== undefined) cleanUpdates.checkoutUrl = updates.checkoutUrl;
        if (updates.providerMetadata !== undefined) cleanUpdates.providerMetadata = updates.providerMetadata;

        await ctx.db.patch(sessionId, cleanUpdates);
    },
});

/**
 * Complete a payment: mark as COMPLETED + add credits atomically.
 * Idempotent: if already COMPLETED or webhookEventId matches, skips.
 */
export const completePayment = internalMutation({
    args: {
        sessionId: v.id("paymentSessions"),
        providerTransactionId: v.optional(v.string()),
        webhookEventId: v.optional(v.string()),
        providerMetadata: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        const session = await ctx.db.get(args.sessionId);
        if (!session) throw new Error("Payment session not found");

        // Idempotency: already completed
        if (session.status === "COMPLETED") {
            console.log(`[Payment] Already completed, skipping: ${session._id}`);
            return;
        }

        // Idempotency: same webhook event already processed
        if (args.webhookEventId && session.webhookEventId === args.webhookEventId) {
            console.log(`[Payment] Duplicate webhook event, skipping: ${args.webhookEventId}`);
            return;
        }

        // Can only complete PENDING sessions
        if (session.status !== "PENDING") {
            console.log(`[Payment] Cannot complete session in status ${session.status}: ${session._id}`);
            return;
        }

        // 1. Update payment session
        await ctx.db.patch(session._id, {
            status: "COMPLETED",
            providerTransactionId: args.providerTransactionId,
            webhookEventId: args.webhookEventId,
            providerMetadata: args.providerMetadata,
            lastWebhookAt: Date.now(),
            completedAt: Date.now(),
        });

        // 2. Add credits to organization (atomic with session update)
        const org = await ctx.db.get(session.organizationId);
        if (!org) throw new Error("Organization not found");

        const currentBalance = org.creditBalance ?? 0;
        const newBalance = currentBalance + session.credits;

        await ctx.db.patch(session.organizationId, {
            creditBalance: newBalance,
        });

        // 3. Insert credit transaction record
        await ctx.db.insert("creditTransactions", {
            organizationId: session.organizationId,
            amount: session.credits,
            type: "RECHARGE",
            description: `Recharge ${session.provider} - ${session.publicReference}`,
            referenceId: args.providerTransactionId || session.providerSessionId,
            balanceAfter: newBalance,
            performedBy: session.userId,
            createdAt: Date.now(),
        });

        console.log(`[Payment] Completed: ${session._id}, credits: +${session.credits}, balance: ${newBalance}`);
    },
});

/**
 * Mark a payment session as FAILED
 */
export const failPayment = internalMutation({
    args: {
        sessionId: v.id("paymentSessions"),
        failureReason: v.string(),
        webhookEventId: v.optional(v.string()),
        providerMetadata: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        const session = await ctx.db.get(args.sessionId);
        if (!session) return;

        // Don't overwrite a completed payment
        if (session.status === "COMPLETED") return;

        await ctx.db.patch(session._id, {
            status: "FAILED",
            failureReason: args.failureReason,
            webhookEventId: args.webhookEventId,
            providerMetadata: args.providerMetadata,
            lastWebhookAt: Date.now(),
        });

        console.log(`[Payment] Failed: ${session._id}, reason: ${args.failureReason}`);
    },
});

/**
 * Expire PENDING sessions past their expiresAt timestamp.
 * Called by cron every 5 minutes.
 */
export const expirePaymentSessions = internalMutation({
    args: {},
    handler: async (ctx) => {
        const now = Date.now();
        const pendingSessions = await ctx.db
            .query("paymentSessions")
            .withIndex("by_status", (q) => q.eq("status", "PENDING"))
            .collect();

        let expired = 0;
        for (const session of pendingSessions) {
            if (session.expiresAt < now) {
                await ctx.db.patch(session._id, {
                    status: "EXPIRED",
                    failureReason: "Session expirée (30 minutes)",
                });
                expired++;
            }
        }

        if (expired > 0) {
            console.log(`[Payment] Expired ${expired} payment sessions`);
        }
    },
});

/**
 * Lookup a payment session by provider session ID (for webhook handlers)
 */
export const getPaymentSessionByProviderSessionId = internalQuery({
    args: { providerSessionId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("paymentSessions")
            .withIndex("by_provider_session", (q) =>
                q.eq("providerSessionId", args.providerSessionId)
            )
            .first();
    },
});

/**
 * Get payment status (public query, auth-gated by organization)
 */
export const getPaymentStatus = query({
    args: { paymentSessionId: v.id("paymentSessions") },
    handler: async (ctx, args) => {
        const orgId = await getCurrentOrgId(ctx);
        if (!orgId) return null;

        const session = await ctx.db.get(args.paymentSessionId);
        if (!session) return null;

        // Auth gate: only return if belongs to user's org
        if (session.organizationId !== orgId) return null;

        return {
            status: session.status,
            amount: session.amount,
            credits: session.credits,
            provider: session.provider,
            publicReference: session.publicReference,
            failureReason: session.failureReason,
            createdAt: session.createdAt,
            completedAt: session.completedAt,
        };
    },
});
