import { convexTest } from "convex-test";
import { describe, it, expect, beforeEach } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";
import { modules } from "./test.modules";

describe("Teams", () => {
    let t: any;
    let userId: string;
    let orgId: string;

    beforeEach(async () => {
        t = convexTest(schema, modules);

        // Setup: user + org + membership
        userId = await t.run(async (ctx: any) => {
            return await ctx.db.insert("users", { email: "owner@test.com", name: "Owner" });
        });

        orgId = await t.run(async (ctx: any) => {
            return await ctx.db.insert("organizations", {
                name: "Test Org",
                ownerId: userId,
                plan: "BUSINESS",
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });
        });

        // Create membership
        await t.run(async (ctx: any) => {
            await ctx.db.insert("memberships", {
                userId,
                organizationId: orgId,
                role: "OWNER",
                status: "ONLINE",
                maxConversations: 10,
                activeConversations: 0,
                lastSeenAt: Date.now(),
                joinedAt: Date.now(),
            });
        });

        // Create userSession
        await t.run(async (ctx: any) => {
            await ctx.db.insert("userSessions", {
                userId,
                currentOrganizationId: orgId,
                lastActivityAt: Date.now(),
            });
        });
    });

    it("should create a team", async () => {
        const teamId = await t.withIdentity({ subject: userId }).mutation(api.teams.create, {
            organizationId: orgId,
            name: "Support",
            description: "Customer support team",
            color: "#3B82F6",
        });

        expect(teamId).toBeDefined();

        const team = await t.run(async (ctx: any) => {
            return await ctx.db.get(teamId);
        });

        expect(team.name).toBe("Support");
        expect(team.description).toBe("Customer support team");
        expect(team.color).toBe("#3B82F6");
        expect(team.organizationId).toBe(orgId);
    });

    it("should list teams", async () => {
        await t.withIdentity({ subject: userId }).mutation(api.teams.create, {
            organizationId: orgId,
            name: "Support",
        });
        await t.withIdentity({ subject: userId }).mutation(api.teams.create, {
            organizationId: orgId,
            name: "Sales",
        });

        const teams = await t.withIdentity({ subject: userId }).query(api.teams.list, {
            organizationId: orgId,
        });

        expect(teams).toHaveLength(2);
        expect(teams[0].memberCount).toBe(0);
    });

    it("should archive a team and hide it from list", async () => {
        const teamId = await t.withIdentity({ subject: userId }).mutation(api.teams.create, {
            organizationId: orgId,
            name: "Deprecated",
        });

        await t.withIdentity({ subject: userId }).mutation(api.teams.archive, { id: teamId });

        const teams = await t.withIdentity({ subject: userId }).query(api.teams.list, {
            organizationId: orgId,
        });

        expect(teams).toHaveLength(0);
    });

    it("should add a member to a team", async () => {
        const teamId = await t.withIdentity({ subject: userId }).mutation(api.teams.create, {
            organizationId: orgId,
            name: "Support",
        });

        // Create agent user
        const agentId = await t.run(async (ctx: any) => {
            const uid = await ctx.db.insert("users", { email: "agent@test.com", name: "Agent" });
            await ctx.db.insert("memberships", {
                userId: uid,
                organizationId: orgId,
                role: "AGENT",
                status: "ONLINE",
                maxConversations: 5,
                activeConversations: 0,
                lastSeenAt: Date.now(),
                joinedAt: Date.now(),
            });
            return uid;
        });

        await t.withIdentity({ subject: userId }).mutation(api.teams.addMember, {
            teamId,
            userId: agentId,
            role: "member",
        });

        const team = await t.withIdentity({ subject: userId }).query(api.teams.getById, { id: teamId });
        expect(team.members).toHaveLength(1);
        expect(team.members[0].role).toBe("member");
        expect(team.members[0].user.name).toBe("Agent");
    });

    it("should prevent duplicate team membership", async () => {
        const teamId = await t.withIdentity({ subject: userId }).mutation(api.teams.create, {
            organizationId: orgId,
            name: "Support",
        });

        await t.withIdentity({ subject: userId }).mutation(api.teams.addMember, {
            teamId,
            userId,
            role: "lead",
        });

        await expect(
            t.withIdentity({ subject: userId }).mutation(api.teams.addMember, {
                teamId,
                userId,
                role: "member",
            })
        ).rejects.toThrow("already a member");
    });

    it("should remove a member from a team", async () => {
        const teamId = await t.withIdentity({ subject: userId }).mutation(api.teams.create, {
            organizationId: orgId,
            name: "Support",
        });

        await t.withIdentity({ subject: userId }).mutation(api.teams.addMember, {
            teamId,
            userId,
            role: "lead",
        });

        await t.withIdentity({ subject: userId }).mutation(api.teams.removeMember, {
            teamId,
            userId,
        });

        const team = await t.withIdentity({ subject: userId }).query(api.teams.getById, { id: teamId });
        expect(team.members).toHaveLength(0);
    });

    it("should update member role", async () => {
        const teamId = await t.withIdentity({ subject: userId }).mutation(api.teams.create, {
            organizationId: orgId,
            name: "Support",
        });

        await t.withIdentity({ subject: userId }).mutation(api.teams.addMember, {
            teamId,
            userId,
            role: "member",
        });

        await t.withIdentity({ subject: userId }).mutation(api.teams.updateMemberRole, {
            teamId,
            userId,
            role: "lead",
        });

        const team = await t.withIdentity({ subject: userId }).query(api.teams.getById, { id: teamId });
        expect(team.members[0].role).toBe("lead");
    });

    it("should list my teams", async () => {
        const teamId1 = await t.withIdentity({ subject: userId }).mutation(api.teams.create, {
            organizationId: orgId,
            name: "Team A",
        });
        await t.withIdentity({ subject: userId }).mutation(api.teams.create, {
            organizationId: orgId,
            name: "Team B",
        });

        // Add user to only Team A
        await t.withIdentity({ subject: userId }).mutation(api.teams.addMember, {
            teamId: teamId1,
            userId,
            role: "lead",
        });

        const myTeams = await t.withIdentity({ subject: userId }).query(api.teams.listMyTeams, {
            organizationId: orgId,
        });

        expect(myTeams).toHaveLength(1);
        expect(myTeams[0].name).toBe("Team A");
        expect(myTeams[0].myRole).toBe("lead");
    });

    it("should prevent non-org members from being added to team", async () => {
        const teamId = await t.withIdentity({ subject: userId }).mutation(api.teams.create, {
            organizationId: orgId,
            name: "Support",
        });

        // Create user NOT in this org
        const outsiderId = await t.run(async (ctx: any) => {
            return await ctx.db.insert("users", { email: "outsider@test.com", name: "Outsider" });
        });

        await expect(
            t.withIdentity({ subject: userId }).mutation(api.teams.addMember, {
                teamId,
                userId: outsiderId,
                role: "member",
            })
        ).rejects.toThrow("not a member of this organization");
    });
});
