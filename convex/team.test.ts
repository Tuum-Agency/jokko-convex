import { convexTest } from "convex-test";
import { describe, it, expect, beforeEach } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./test.modules";

describe("Team Members", () => {
    let t: any;
    let userId: string;
    let orgId: string;

    beforeEach(async () => {
        t = convexTest(schema, modules);

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

        await t.run(async (ctx: any) => {
            await ctx.db.insert("memberships", {
                userId,
                organizationId: orgId,
                role: "OWNER",
                status: "ONLINE",
                maxConversations: 10,
                activeConversations: 2,
                lastSeenAt: Date.now(),
                joinedAt: Date.now(),
            });
            await ctx.db.insert("userSessions", {
                userId,
                currentOrganizationId: orgId,
                lastActivityAt: Date.now(),
            });
        });
    });

    // ============================================
    // listMembers
    // ============================================
    describe("listMembers", () => {
        it("should return members with enriched data", async () => {
            const result = await t.withIdentity({ subject: userId }).query(api.team.listMembers, {});

            expect(result.members).toHaveLength(1);
            expect(result.members[0].user.name).toBe("Owner");
            expect(result.members[0].role).toBe("owner");
            expect(result.members[0].status).toBe("ONLINE");
            expect(result.members[0].activeConversations).toBe(2);
            expect(result.members[0].maxConversations).toBe(10);
        });

        it("should include lastSeenAt and isCurrentUser", async () => {
            const result = await t.withIdentity({ subject: userId }).query(api.team.listMembers, {});

            expect(result.members[0].lastSeenAt).toBeDefined();
            expect(result.members[0].isCurrentUser).toBe(true);
        });

        it("should include poleName when poleId is set", async () => {
            // Create a pole and assign it
            await t.run(async (ctx: any) => {
                const poleId = await ctx.db.insert("poles", {
                    organizationId: orgId,
                    name: "Support",
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                });
                const membership = await ctx.db.query("memberships")
                    .withIndex("by_user_org", (q: any) => q.eq("userId", userId).eq("organizationId", orgId))
                    .first();
                if (membership) {
                    await ctx.db.patch(membership._id, { poleId });
                }
            });

            const result = await t.withIdentity({ subject: userId }).query(api.team.listMembers, {});

            expect(result.members[0].poleName).toBe("Support");
        });

        it("should return multiple members", async () => {
            // Add an agent
            await t.run(async (ctx: any) => {
                const agentId = await ctx.db.insert("users", { email: "agent@test.com", name: "Agent" });
                await ctx.db.insert("memberships", {
                    userId: agentId,
                    organizationId: orgId,
                    role: "AGENT",
                    status: "OFFLINE",
                    maxConversations: 5,
                    activeConversations: 0,
                    lastSeenAt: Date.now() - 3600000,
                    joinedAt: Date.now(),
                });
            });

            const result = await t.withIdentity({ subject: userId }).query(api.team.listMembers, {});

            expect(result.members).toHaveLength(2);
            expect(result.total).toBe(2);
        });
    });

    // ============================================
    // changePole
    // ============================================
    describe("changePole", () => {
        it("should update member pole", async () => {
            const { agentMembershipId, poleId } = await t.run(async (ctx: any) => {
                const agentId = await ctx.db.insert("users", { email: "agent@test.com", name: "Agent" });
                const membershipId = await ctx.db.insert("memberships", {
                    userId: agentId,
                    organizationId: orgId,
                    role: "AGENT",
                    status: "ONLINE",
                    maxConversations: 5,
                    activeConversations: 0,
                    lastSeenAt: Date.now(),
                    joinedAt: Date.now(),
                });
                const poleId = await ctx.db.insert("poles", {
                    organizationId: orgId,
                    name: "Commercial",
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                });
                return { agentMembershipId: membershipId, poleId };
            });

            await t.withIdentity({ subject: userId }).mutation(api.team.changePole, {
                membershipId: agentMembershipId,
                poleId,
            });

            const membership = await t.run(async (ctx: any) => ctx.db.get(agentMembershipId));
            expect(membership.poleId).toBe(poleId);
        });

        it("should remove pole when poleId is undefined", async () => {
            const { agentMembershipId } = await t.run(async (ctx: any) => {
                const agentId = await ctx.db.insert("users", { email: "agent@test.com", name: "Agent" });
                const poleId = await ctx.db.insert("poles", {
                    organizationId: orgId,
                    name: "Support",
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                });
                const membershipId = await ctx.db.insert("memberships", {
                    userId: agentId,
                    organizationId: orgId,
                    role: "AGENT",
                    status: "ONLINE",
                    maxConversations: 5,
                    activeConversations: 0,
                    lastSeenAt: Date.now(),
                    joinedAt: Date.now(),
                    poleId,
                });
                return { agentMembershipId: membershipId };
            });

            await t.withIdentity({ subject: userId }).mutation(api.team.changePole, {
                membershipId: agentMembershipId,
                poleId: undefined,
            });

            const membership = await t.run(async (ctx: any) => ctx.db.get(agentMembershipId));
            expect(membership.poleId).toBeUndefined();
        });

        it("should throw for non-admin user", async () => {
            const { agentId, agentMembershipId } = await t.run(async (ctx: any) => {
                const agentId = await ctx.db.insert("users", { email: "agent@test.com", name: "Agent" });
                const membershipId = await ctx.db.insert("memberships", {
                    userId: agentId,
                    organizationId: orgId,
                    role: "AGENT",
                    status: "ONLINE",
                    maxConversations: 5,
                    activeConversations: 0,
                    lastSeenAt: Date.now(),
                    joinedAt: Date.now(),
                });
                await ctx.db.insert("userSessions", {
                    userId: agentId,
                    currentOrganizationId: orgId,
                    lastActivityAt: Date.now(),
                });
                return { agentId, agentMembershipId: membershipId };
            });

            await expect(
                t.withIdentity({ subject: agentId }).mutation(api.team.changePole, {
                    membershipId: agentMembershipId,
                })
            ).rejects.toThrow("Insufficient permissions");
        });
    });

    // ============================================
    // updateRole
    // ============================================
    describe("updateRole", () => {
        it("should update a member role", async () => {
            const { agentMembershipId } = await t.run(async (ctx: any) => {
                const agentId = await ctx.db.insert("users", { email: "agent@test.com", name: "Agent" });
                const membershipId = await ctx.db.insert("memberships", {
                    userId: agentId,
                    organizationId: orgId,
                    role: "AGENT",
                    status: "ONLINE",
                    maxConversations: 5,
                    activeConversations: 0,
                    lastSeenAt: Date.now(),
                    joinedAt: Date.now(),
                });
                return { agentMembershipId: membershipId };
            });

            await t.withIdentity({ subject: userId }).mutation(api.team.updateRole, {
                membershipId: agentMembershipId,
                role: "ADMIN",
            });

            const membership = await t.run(async (ctx: any) => ctx.db.get(agentMembershipId));
            expect(membership.role).toBe("ADMIN");
        });
    });

    // ============================================
    // getTeamActivity
    // ============================================
    describe("getTeamActivity", () => {
        it("should return member joined events", async () => {
            const result = await t.withIdentity({ subject: userId }).query(api.team.getTeamActivity, {});

            expect(result.activities.length).toBeGreaterThanOrEqual(1);
            const joinEvent = result.activities.find((a: any) => a.type === "member_joined");
            expect(joinEvent).toBeDefined();
            expect(joinEvent.message).toContain("Owner");
        });

        it("should return invitation events", async () => {
            // Create an invitation
            await t.run(async (ctx: any) => {
                await ctx.db.insert("invitations", {
                    organizationId: orgId,
                    email: "invitee@test.com",
                    role: "AGENT",
                    token: "test-token-123",
                    status: "PENDING",
                    invitedById: userId,
                    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
                    createdAt: Date.now(),
                });
            });

            const result = await t.withIdentity({ subject: userId }).query(api.team.getTeamActivity, {});

            const invEvent = result.activities.find((a: any) => a.type === "invitation_sent");
            expect(invEvent).toBeDefined();
            expect(invEvent.message).toContain("invitee@test.com");
        });

        it("should return max 20 activities sorted desc", async () => {
            // Add many members
            for (let i = 0; i < 25; i++) {
                await t.run(async (ctx: any) => {
                    const uid = await ctx.db.insert("users", { email: `user${i}@test.com`, name: `User ${i}` });
                    await ctx.db.insert("memberships", {
                        userId: uid,
                        organizationId: orgId,
                        role: "AGENT",
                        status: "ONLINE",
                        maxConversations: 5,
                        activeConversations: 0,
                        lastSeenAt: Date.now(),
                        joinedAt: Date.now() + i * 1000,
                    });
                });
            }

            const result = await t.withIdentity({ subject: userId }).query(api.team.getTeamActivity, {});

            expect(result.activities.length).toBeLessThanOrEqual(20);
            // Check sorted desc
            for (let i = 1; i < result.activities.length; i++) {
                expect(result.activities[i - 1].timestamp).toBeGreaterThanOrEqual(result.activities[i].timestamp);
            }
        });
    });

    // ============================================
    // getTeamActivity — pole_created events
    // ============================================
    describe("getTeamActivity — pole events", () => {
        it("should return pole_created events", async () => {
            await t.run(async (ctx: any) => {
                await ctx.db.insert("poles", {
                    organizationId: orgId,
                    name: "Marketing",
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                });
            });

            const result = await t.withIdentity({ subject: userId }).query(api.team.getTeamActivity, {});

            const poleEvent = result.activities.find((a: any) => a.type === "pole_created");
            expect(poleEvent).toBeDefined();
            expect(poleEvent.message).toContain("Marketing");
        });

        it("should include multiple pole events", async () => {
            await t.run(async (ctx: any) => {
                await ctx.db.insert("poles", {
                    organizationId: orgId,
                    name: "Commercial",
                    createdAt: Date.now() - 1000,
                    updatedAt: Date.now(),
                });
                await ctx.db.insert("poles", {
                    organizationId: orgId,
                    name: "Support",
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                });
            });

            const result = await t.withIdentity({ subject: userId }).query(api.team.getTeamActivity, {});

            const poleEvents = result.activities.filter((a: any) => a.type === "pole_created");
            expect(poleEvents.length).toBe(2);
        });
    });

    // ============================================
    // presence — heartbeat and updateStatus
    // ============================================
    describe("presence", () => {
        it("heartbeat should set status to ONLINE when OFFLINE", async () => {
            // Set membership to OFFLINE first
            await t.run(async (ctx: any) => {
                const membership = await ctx.db.query("memberships")
                    .withIndex("by_user_org", (q: any) => q.eq("userId", userId).eq("organizationId", orgId))
                    .first();
                if (membership) await ctx.db.patch(membership._id, { status: "OFFLINE" });
            });

            await t.withIdentity({ subject: userId }).mutation(api.presence.heartbeat, {
                organizationId: orgId,
            });

            const membership = await t.run(async (ctx: any) => {
                return await ctx.db.query("memberships")
                    .withIndex("by_user_org", (q: any) => q.eq("userId", userId).eq("organizationId", orgId))
                    .first();
            });
            expect(membership.status).toBe("ONLINE");
        });

        it("updateStatus should change status to AWAY", async () => {
            await t.withIdentity({ subject: userId }).mutation(api.presence.updateStatus, {
                organizationId: orgId,
                status: "AWAY",
                statusMessage: "En reunion",
            });

            const membership = await t.run(async (ctx: any) => {
                return await ctx.db.query("memberships")
                    .withIndex("by_user_org", (q: any) => q.eq("userId", userId).eq("organizationId", orgId))
                    .first();
            });
            expect(membership.status).toBe("AWAY");
            expect(membership.statusMessage).toBe("En reunion");
        });

        it("updateStatus should change status to OFFLINE", async () => {
            await t.withIdentity({ subject: userId }).mutation(api.presence.updateStatus, {
                organizationId: orgId,
                status: "OFFLINE",
            });

            const membership = await t.run(async (ctx: any) => {
                return await ctx.db.query("memberships")
                    .withIndex("by_user_org", (q: any) => q.eq("userId", userId).eq("organizationId", orgId))
                    .first();
            });
            expect(membership.status).toBe("OFFLINE");
        });

        it("updateStatus ONLINE should switch to BUSY if at capacity", async () => {
            // Set activeConversations = maxConversations
            await t.run(async (ctx: any) => {
                const membership = await ctx.db.query("memberships")
                    .withIndex("by_user_org", (q: any) => q.eq("userId", userId).eq("organizationId", orgId))
                    .first();
                if (membership) await ctx.db.patch(membership._id, { activeConversations: 10, maxConversations: 10 });
            });

            await t.withIdentity({ subject: userId }).mutation(api.presence.updateStatus, {
                organizationId: orgId,
                status: "ONLINE",
            });

            const membership = await t.run(async (ctx: any) => {
                return await ctx.db.query("memberships")
                    .withIndex("by_user_org", (q: any) => q.eq("userId", userId).eq("organizationId", orgId))
                    .first();
            });
            expect(membership.status).toBe("BUSY");
        });
    });

    // ============================================
    // removeMember
    // ============================================
    describe("removeMember", () => {
        it("should remove a member", async () => {
            const { agentMembershipId } = await t.run(async (ctx: any) => {
                const agentId = await ctx.db.insert("users", { email: "agent@test.com", name: "Agent" });
                const membershipId = await ctx.db.insert("memberships", {
                    userId: agentId,
                    organizationId: orgId,
                    role: "AGENT",
                    status: "ONLINE",
                    maxConversations: 5,
                    activeConversations: 0,
                    lastSeenAt: Date.now(),
                    joinedAt: Date.now(),
                });
                return { agentMembershipId: membershipId };
            });

            await t.withIdentity({ subject: userId }).mutation(api.team.removeMember, {
                membershipId: agentMembershipId,
            });

            const membership = await t.run(async (ctx: any) => ctx.db.get(agentMembershipId));
            expect(membership).toBeNull();
        });
    });
});
