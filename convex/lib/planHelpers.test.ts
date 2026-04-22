// @vitest-environment node
import { describe, it, expect } from "vitest";
import {
    featureUnlockSource,
    getTrialEndsAt,
    hasChosenPlan,
    hasFeatureAccess,
    isTrialing,
} from "./planHelpers";

// Helpers utilitaires pour fabriquer des orgs fictives.
const DAY = 24 * 60 * 60 * 1000;
const now = 1_700_000_000_000; // date pivot arbitraire pour tests déterministes

function org(overrides: Partial<{
    plan: string;
    hasSelectedPlan: boolean;
    trialStartedAt: number;
    trialEndsAt: number;
    createdAt: number;
}> = {}) {
    return {
        plan: "FREE",
        createdAt: now,
        ...overrides,
    } as any;
}

describe("planHelpers — trial detection", () => {
    it("essai actif : trialEndsAt dans le futur", () => {
        const o = org({ trialEndsAt: now + 5 * DAY });
        expect(isTrialing(o, now)).toBe(true);
    });

    it("essai expiré : trialEndsAt dans le passé", () => {
        const o = org({ trialEndsAt: now - DAY });
        expect(isTrialing(o, now)).toBe(false);
    });

    it("backfill implicite : sans trialEndsAt mais créé il y a < 14j", () => {
        const o = org({ createdAt: now - 5 * DAY });
        expect(isTrialing(o, now)).toBe(true);
    });

    it("backfill implicite expiré : créé il y a > 14j sans trialEndsAt", () => {
        const o = org({ createdAt: now - 30 * DAY });
        expect(isTrialing(o, now)).toBe(false);
    });

    it("getTrialEndsAt retourne createdAt + 14j quand absent", () => {
        const o = org({ createdAt: now });
        expect(getTrialEndsAt(o)).toBe(now + 14 * DAY);
    });
});

describe("planHelpers — hasChosenPlan", () => {
    it("FREE + pas de flag = pas de plan choisi", () => {
        expect(hasChosenPlan(org({ plan: "FREE" }))).toBe(false);
    });

    it("hasSelectedPlan=true = plan choisi", () => {
        expect(hasChosenPlan(org({ plan: "FREE", hasSelectedPlan: true }))).toBe(true);
    });

    it("plan payant sans flag = plan choisi (fallback)", () => {
        expect(hasChosenPlan(org({ plan: "BUSINESS" }))).toBe(true);
    });
});

describe("planHelpers — hasFeatureAccess", () => {
    it("trial actif : accès à toutes les features, même AI (PRO)", () => {
        const o = org({ plan: "FREE", trialEndsAt: now + 3 * DAY });
        expect(hasFeatureAccess(o, "ai", now)).toBe(true);
        expect(hasFeatureAccess(o, "broadcasts", now)).toBe(true);
        expect(hasFeatureAccess(o, "flows", now)).toBe(true);
    });

    it("trial expiré + pas de plan : tout verrouillé (lockAll)", () => {
        const o = org({ plan: "FREE", trialEndsAt: now - DAY, hasSelectedPlan: false });
        expect(hasFeatureAccess(o, "inbox", now)).toBe(false);
        expect(hasFeatureAccess(o, "broadcasts", now)).toBe(false);
        expect(hasFeatureAccess(o, "ai", now)).toBe(false);
    });

    it("trial expiré + plan BUSINESS : broadcasts OK, AI verrouillée", () => {
        const o = org({
            plan: "BUSINESS",
            trialEndsAt: now - DAY,
            hasSelectedPlan: true,
        });
        expect(hasFeatureAccess(o, "broadcasts", now)).toBe(true);
        expect(hasFeatureAccess(o, "chatbot", now)).toBe(true);
        expect(hasFeatureAccess(o, "flows", now)).toBe(true);
        expect(hasFeatureAccess(o, "ai", now)).toBe(false);
        expect(hasFeatureAccess(o, "integrations_crm", now)).toBe(false);
    });

    it("trial expiré + plan PRO : AI et flows débloqués", () => {
        const o = org({
            plan: "PRO",
            trialEndsAt: now - DAY,
            hasSelectedPlan: true,
        });
        expect(hasFeatureAccess(o, "ai", now)).toBe(true);
        expect(hasFeatureAccess(o, "flows", now)).toBe(true);
        expect(hasFeatureAccess(o, "broadcasts", now)).toBe(true);
        expect(hasFeatureAccess(o, "accountManager", now)).toBe(false);
    });

    it("trial expiré + plan STARTER : features basiques OK, broadcasts verrouillé", () => {
        const o = org({
            plan: "STARTER",
            trialEndsAt: now - DAY,
            hasSelectedPlan: true,
        });
        expect(hasFeatureAccess(o, "inbox", now)).toBe(true);
        expect(hasFeatureAccess(o, "quickReplies", now)).toBe(true);
        expect(hasFeatureAccess(o, "broadcasts", now)).toBe(false);
        expect(hasFeatureAccess(o, "ai", now)).toBe(false);
    });
});

describe("planHelpers — featureUnlockSource", () => {
    it("feature incluse dans le plan → source = 'plan'", () => {
        const o = org({
            plan: "BUSINESS",
            hasSelectedPlan: true,
            trialEndsAt: now - DAY,
        });
        expect(featureUnlockSource(o, "broadcasts", now)).toBe("plan");
    });

    it("feature hors plan mais trial actif → source = 'trial'", () => {
        const o = org({
            plan: "FREE",
            hasSelectedPlan: false,
            trialEndsAt: now + 3 * DAY,
        });
        expect(featureUnlockSource(o, "ai", now)).toBe("trial");
    });

    it("feature incluse dans le plan ET trial actif → 'plan' prioritaire", () => {
        const o = org({
            plan: "PRO",
            hasSelectedPlan: true,
            trialEndsAt: now + 3 * DAY,
        });
        expect(featureUnlockSource(o, "ai", now)).toBe("plan");
        expect(featureUnlockSource(o, "broadcasts", now)).toBe("plan");
    });

    it("trial expiré + pas de plan → 'locked'", () => {
        const o = org({
            plan: "FREE",
            hasSelectedPlan: false,
            trialEndsAt: now - DAY,
        });
        expect(featureUnlockSource(o, "broadcasts", now)).toBe("locked");
        expect(featureUnlockSource(o, "inbox", now)).toBe("locked");
    });

    it("trial expiré + plan STARTER : AI = locked, inbox = plan", () => {
        const o = org({
            plan: "STARTER",
            hasSelectedPlan: true,
            trialEndsAt: now - DAY,
        });
        expect(featureUnlockSource(o, "ai", now)).toBe("locked");
        expect(featureUnlockSource(o, "inbox", now)).toBe("plan");
    });
});
