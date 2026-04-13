/**
 * Plan utility types and helpers for the frontend.
 *
 * The actual plan data (limits, pricing, features) lives in the Convex `plans` table.
 * This file provides type definitions and pure formatting helpers.
 */

export type PlanKey = "FREE" | "STARTER" | "BUSINESS" | "PRO" | "ENTERPRISE";

export const UNLIMITED = -1;

export function isUnlimited(value: number): boolean {
    return value === UNLIMITED;
}

export function formatLimit(value: number): string {
    if (value === UNLIMITED) return "Illimité";
    return new Intl.NumberFormat("fr-FR").format(value);
}
