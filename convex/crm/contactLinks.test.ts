// @vitest-environment node
/**
 * Tests for contactLinks.purgeStaleLinks — the daily cron that deletes
 * crmContactLinks for connections disconnected > 7 days ago.
 *
 * Matches the UX promise from DisconnectDialog:
 *   "Liens contacts ↔ CRM conservés pour permettre une reconnexion rapide
 *   pendant 7 jours."
 */

import { convexTest } from "convex-test";
import { beforeEach, describe, expect, it } from "vitest";
import { internal } from "../_generated/api";
import schema from "../schema";
import { modules } from "../test.modules";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

describe("contactLinks.purgeStaleLinks", () => {
    let t: any;

    beforeEach(() => {
        t = convexTest(schema, modules);
    });

    async function seedOrgAndContact() {
        return t.run(async (ctx: any) => {
            const userId = await ctx.db.insert("users", {
                email: "purge@t.com",
                name: "Purge",
            });
            const orgId = await ctx.db.insert("organizations", {
                name: "Org",
                slug: "org-purge",
                ownerId: userId,
                plan: "BUSINESS",
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });
            const contactId = await ctx.db.insert("contacts", {
                organizationId: orgId,
                phone: "+221770000000",
                name: "Alice",
                searchName: "alice +221770000000",
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });
            return { userId, orgId, contactId };
        });
    }

    async function seedConnection(
        orgId: any,
        userId: any,
        opts: { status: "active" | "disconnected"; revokedAt?: number },
    ) {
        return t.run(async (ctx: any) => {
            return ctx.db.insert("crmConnections", {
                organizationId: orgId,
                provider: "hubspot",
                status: opts.status,
                authMode: "oauth2",
                scalingMode: "standard",
                remoteAccountId: `remote-${Math.random()}`,
                connectedAt: Date.now(),
                connectedBy: userId,
                revokedAt: opts.revokedAt,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });
        });
    }

    async function seedLink(orgId: any, contactId: any, connectionId: any) {
        return t.run(async (ctx: any) => {
            return ctx.db.insert("crmContactLinks", {
                organizationId: orgId,
                contactId,
                connectionId,
                provider: "hubspot",
                externalId: `ext-${Math.random()}`,
                linkStatus: "linked",
                linkMethod: "phone",
                lastPulledAt: Date.now(),
                linkedAt: Date.now(),
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });
        });
    }

    it("deletes links whose connection is disconnected > 7 days ago", async () => {
        const { userId, orgId, contactId } = await seedOrgAndContact();
        const staleConn = await seedConnection(orgId, userId, {
            status: "disconnected",
            revokedAt: Date.now() - SEVEN_DAYS_MS - 60_000, // 7 days + 1 minute ago
        });
        const linkId = await seedLink(orgId, contactId, staleConn);

        const result = await t.mutation(
            internal.crm.contactLinks.purgeStaleLinks,
            {},
        );

        expect(result.deletedLinks).toBe(1);
        expect(result.staleConnections).toBe(1);

        const link = await t.run((ctx: any) => ctx.db.get(linkId));
        expect(link).toBeNull();
    });

    it("keeps links whose connection is disconnected < 7 days ago", async () => {
        const { userId, orgId, contactId } = await seedOrgAndContact();
        const recentConn = await seedConnection(orgId, userId, {
            status: "disconnected",
            revokedAt: Date.now() - 60_000, // 1 minute ago
        });
        const linkId = await seedLink(orgId, contactId, recentConn);

        const result = await t.mutation(
            internal.crm.contactLinks.purgeStaleLinks,
            {},
        );

        expect(result.deletedLinks).toBe(0);
        const link = await t.run((ctx: any) => ctx.db.get(linkId));
        expect(link).not.toBeNull();
    });

    it("ignores links whose connection is still active", async () => {
        const { userId, orgId, contactId } = await seedOrgAndContact();
        const activeConn = await seedConnection(orgId, userId, { status: "active" });
        const linkId = await seedLink(orgId, contactId, activeConn);

        const result = await t.mutation(
            internal.crm.contactLinks.purgeStaleLinks,
            {},
        );

        expect(result.deletedLinks).toBe(0);
        const link = await t.run((ctx: any) => ctx.db.get(linkId));
        expect(link).not.toBeNull();
    });

    it("writes one audit log per organization with the deleted count", async () => {
        const { userId, orgId, contactId } = await seedOrgAndContact();
        const staleConn = await seedConnection(orgId, userId, {
            status: "disconnected",
            revokedAt: Date.now() - SEVEN_DAYS_MS - 60_000,
        });
        await seedLink(orgId, contactId, staleConn);
        await seedLink(orgId, contactId, staleConn);
        await seedLink(orgId, contactId, staleConn);

        await t.mutation(internal.crm.contactLinks.purgeStaleLinks, {});

        const logs = await t.run(async (ctx: any) =>
            ctx.db
                .query("integrationAuditLog")
                .withIndex("by_organization", (q: any) => q.eq("organizationId", orgId))
                .collect(),
        );
        const purgeLog = logs.find(
            (l: any) => l.action === "contact_links_purged",
        );
        expect(purgeLog).toBeDefined();
        expect(purgeLog.metadataSanitized.deletedLinks).toBe(3);
        expect(purgeLog.severity).toBe("info");
    });

    it("purges across multiple organizations and logs each separately", async () => {
        const a = await seedOrgAndContact();
        const b = await seedOrgAndContact();
        const staleA = await seedConnection(a.orgId, a.userId, {
            status: "disconnected",
            revokedAt: Date.now() - SEVEN_DAYS_MS - 60_000,
        });
        const staleB = await seedConnection(b.orgId, b.userId, {
            status: "disconnected",
            revokedAt: Date.now() - SEVEN_DAYS_MS - 60_000,
        });
        await seedLink(a.orgId, a.contactId, staleA);
        await seedLink(b.orgId, b.contactId, staleB);

        const result = await t.mutation(
            internal.crm.contactLinks.purgeStaleLinks,
            {},
        );

        expect(result.deletedLinks).toBe(2);

        const logs = await t.run(async (ctx: any) =>
            ctx.db
                .query("integrationAuditLog")
                .filter((q: any) => q.eq(q.field("action"), "contact_links_purged"))
                .collect(),
        );
        expect(logs).toHaveLength(2);
        const orgs = new Set(logs.map((l: any) => String(l.organizationId)));
        expect(orgs.has(String(a.orgId))).toBe(true);
        expect(orgs.has(String(b.orgId))).toBe(true);
    });

    it("is a no-op (no audit log) when there is nothing to purge", async () => {
        const { userId, orgId, contactId } = await seedOrgAndContact();
        const activeConn = await seedConnection(orgId, userId, { status: "active" });
        await seedLink(orgId, contactId, activeConn);

        const result = await t.mutation(
            internal.crm.contactLinks.purgeStaleLinks,
            {},
        );

        expect(result.deletedLinks).toBe(0);
        expect(result.staleConnections).toBe(0);

        const logs = await t.run(async (ctx: any) =>
            ctx.db
                .query("integrationAuditLog")
                .filter((q: any) => q.eq(q.field("action"), "contact_links_purged"))
                .collect(),
        );
        expect(logs).toHaveLength(0);
    });
});
