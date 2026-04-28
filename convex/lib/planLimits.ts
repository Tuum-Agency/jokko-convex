/**
 * Plan limits — helpers centralisés pour l'enforcement des quotas par plan.
 *
 * Source unique de vérité : table `plans` (voir planHelpers.ts).
 * Convention : -1 signifie illimité.
 */

import type { QueryCtx, MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { getPlanLimits, hasChosenPlan, isTrialing, isUnlimited } from "./planHelpers";

export type ResourceKind = "channels" | "agents" | "templates";

/**
 * Compte les canaux actifs (status != "disabled" & != "banned") d'une org.
 */
export async function countActiveChannels(
    ctx: QueryCtx | MutationCtx,
    organizationId: Id<"organizations">,
): Promise<number> {
    const channels = await ctx.db
        .query("whatsappChannels")
        .withIndex("by_org", (q) => q.eq("organizationId", organizationId))
        .collect();
    return channels.filter((c) => c.status !== "disabled" && c.status !== "banned").length;
}

/**
 * Compte les memberships actifs + invitations PENDING (un seat en attente compte).
 */
export async function countActiveAgents(
    ctx: QueryCtx | MutationCtx,
    organizationId: Id<"organizations">,
): Promise<number> {
    const memberships = await ctx.db
        .query("memberships")
        .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
        .collect();
    const pendingInvites = await ctx.db
        .query("invitations")
        .withIndex("by_org_status", (q) =>
            q.eq("organizationId", organizationId).eq("status", "PENDING"),
        )
        .collect();
    return memberships.length + pendingInvites.length;
}

/**
 * Compte les templates de l'org (tous statuts).
 */
export async function countTemplates(
    ctx: QueryCtx | MutationCtx,
    organizationId: Id<"organizations">,
): Promise<number> {
    const templates = await ctx.db
        .query("templates")
        .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
        .collect();
    return templates.length;
}

/**
 * Vérifie qu'une ressource peut être créée sans dépasser la limite du plan.
 * Throw une erreur explicite sinon.
 */
export async function assertWithinLimit(
    ctx: QueryCtx | MutationCtx,
    organizationId: Id<"organizations">,
    kind: ResourceKind,
): Promise<void> {
    const org = await ctx.db.get(organizationId);
    if (!org) throw new Error("Organization not found");

    // Pendant la période d'essai : bypass complet des quotas.
    if (isTrialing(org)) return;

    // Trial expiré ET pas de plan choisi → tout est verrouillé.
    if (!hasChosenPlan(org)) {
        throw new Error(
            "Votre période d'essai est terminée. Choisissez un plan depuis /dashboard/billing pour débloquer les fonctionnalités.",
        );
    }

    const limits = await getPlanLimits(ctx, org.plan);

    let current: number;
    let max: number;
    let label: string;

    switch (kind) {
        case "channels":
            current = await countActiveChannels(ctx, organizationId);
            max = limits.maxWhatsappChannels;
            label = "canaux WhatsApp";
            break;
        case "agents":
            current = await countActiveAgents(ctx, organizationId);
            max = limits.maxAgents;
            label = "agents";
            break;
        case "templates":
            current = await countTemplates(ctx, organizationId);
            max = limits.maxTemplates;
            label = "templates";
            break;
    }

    if (isUnlimited(max)) return;
    if (current >= max) {
        throw new Error(
            `Limite atteinte pour le plan ${org.plan} : ${label} (max ${max}). Passez à un plan supérieur pour en ajouter plus.`,
        );
    }
}
