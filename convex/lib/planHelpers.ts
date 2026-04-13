/**
 * Plan helpers - reads limits from the `plans` table (source unique de vérité).
 *
 * Replaces the hardcoded planLimits.ts.
 * Convention: -1 = unlimited.
 */

import { QueryCtx, MutationCtx } from "../_generated/server";

const UNLIMITED = -1;

export function isUnlimited(value: number): boolean {
    return value === UNLIMITED;
}

async function getPlan(ctx: QueryCtx | MutationCtx, planKey: string) {
    const plan = await ctx.db
        .query("plans")
        .withIndex("by_key", (q) => q.eq("key", planKey))
        .first();
    if (!plan) throw new Error(`Plan "${planKey}" not found in database`);
    return plan;
}

export async function getMaxChannels(ctx: QueryCtx | MutationCtx, planKey: string): Promise<number> {
    return (await getPlan(ctx, planKey)).maxWhatsappChannels;
}

export async function getMaxAgents(ctx: QueryCtx | MutationCtx, planKey: string): Promise<number> {
    return (await getPlan(ctx, planKey)).maxAgents;
}

export async function getConversationLimit(ctx: QueryCtx | MutationCtx, planKey: string): Promise<number> {
    return (await getPlan(ctx, planKey)).maxConversationsPerMonth;
}

export async function getPlanLimits(ctx: QueryCtx | MutationCtx, planKey: string) {
    const plan = await getPlan(ctx, planKey);
    return {
        maxAgents: plan.maxAgents,
        maxWhatsappChannels: plan.maxWhatsappChannels,
        maxConversationsPerMonth: plan.maxConversationsPerMonth,
        maxTemplates: plan.maxTemplates,
        historyDays: plan.historyDays,
    };
}
