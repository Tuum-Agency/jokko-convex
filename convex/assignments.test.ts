import { convexTest } from "convex-test";
import { describe, it, expect, beforeEach } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./test.modules";

// Helper to create a full test environment with user, org, membership, session, and conversations
async function setupTestEnv(t: any, opts?: { role?: string; agentStatus?: string }) {
    return await t.run(async (ctx: any) => {
        const userId = await ctx.db.insert("users", {
            email: "admin@test.com",
            name: "Admin User",
        });

        const orgId = await ctx.db.insert("organizations", {
            name: "Test Org",
            slug: "test-org",
            ownerId: userId,
            plan: "BUSINESS",
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        const membershipId = await ctx.db.insert("memberships", {
            userId,
            organizationId: orgId,
            role: (opts?.role as any) || "OWNER",
            status: (opts?.agentStatus as any) || "ONLINE",
            maxConversations: 10,
            activeConversations: 0,
            lastSeenAt: Date.now(),
            joinedAt: Date.now(),
        });

        await ctx.db.insert("userSessions", {
            userId,
            currentOrganizationId: orgId,
            lastActivityAt: Date.now(),
        });

        return { userId, orgId, membershipId };
    });
}

async function createAgent(t: any, orgId: any, name: string, opts?: { role?: string; status?: string; activeConversations?: number; maxConversations?: number }) {
    return await t.run(async (ctx: any) => {
        const agentUserId = await ctx.db.insert("users", {
            email: `${name.toLowerCase().replace(/\s/g, '.')}@test.com`,
            name,
        });

        const membershipId = await ctx.db.insert("memberships", {
            userId: agentUserId,
            organizationId: orgId,
            role: (opts?.role as any) || "AGENT",
            status: (opts?.status as any) || "ONLINE",
            maxConversations: opts?.maxConversations ?? 5,
            activeConversations: opts?.activeConversations ?? 0,
            lastSeenAt: Date.now(),
            joinedAt: Date.now(),
        });

        return { agentUserId, membershipId };
    });
}

async function createConversation(t: any, orgId: any, opts?: { assignedTo?: any; preview?: string; status?: string }) {
    return await t.run(async (ctx: any) => {
        const phone = `+22177${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`;
        const contactId = await ctx.db.insert("contacts", {
            organizationId: orgId,
            phone,
            name: "Test Contact",
            searchName: `Test Contact ${phone}`,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        const convId = await ctx.db.insert("conversations", {
            organizationId: orgId,
            contactId,
            channel: "WHATSAPP",
            status: opts?.status || "OPEN",
            lastMessageAt: Date.now(),
            unreadCount: 1,
            preview: opts?.preview || "Bonjour",
            assignedTo: opts?.assignedTo,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        return { convId, contactId };
    });
}

describe("Assignments", () => {
    let t: any;

    beforeEach(() => {
        t = convexTest(schema, modules);
    });

    // ============================================
    // getStats
    // ============================================
    describe("getStats", () => {
        it("should return correct unassigned count", async () => {
            const { userId, orgId } = await setupTestEnv(t);

            // Create 3 unassigned conversations
            await createConversation(t, orgId);
            await createConversation(t, orgId);
            await createConversation(t, orgId);

            const stats = await t.withIdentity({ subject: userId }).query(api.assignments.getStats, {});

            expect(stats.unassignedCount).toBe(3);
        });

        it("should count urgent messages", async () => {
            const { userId, orgId } = await setupTestEnv(t);

            await createConversation(t, orgId, { preview: "Bonjour" });
            await createConversation(t, orgId, { preview: "C'est urgent SVP" });
            await createConversation(t, orgId, { preview: "J'ai un problème" });

            const stats = await t.withIdentity({ subject: userId }).query(api.assignments.getStats, {});

            expect(stats.unassignedCount).toBe(3);
            expect(stats.urgentCount).toBe(2); // "urgent" and "problème"
        });

        it("should not count assigned conversations as unassigned", async () => {
            const { userId, orgId } = await setupTestEnv(t);
            const { agentUserId } = await createAgent(t, orgId, "Agent One");

            await createConversation(t, orgId, { assignedTo: agentUserId });
            await createConversation(t, orgId); // unassigned

            const stats = await t.withIdentity({ subject: userId }).query(api.assignments.getStats, {});

            expect(stats.unassignedCount).toBe(1);
        });
    });

    // ============================================
    // getConversationsQueue
    // ============================================
    describe("getConversationsQueue", () => {
        it("should return OPEN conversations", async () => {
            const { userId, orgId } = await setupTestEnv(t);

            await createConversation(t, orgId, { preview: "Message 1" });
            await createConversation(t, orgId, { preview: "Message 2" });
            await createConversation(t, orgId, { status: "CLOSED", preview: "Closed" });

            const queue = await t.withIdentity({ subject: userId }).query(api.assignments.getConversationsQueue, {});

            expect(queue).toHaveLength(2);
        });

        it("should detect priority from keywords", async () => {
            const { userId, orgId } = await setupTestEnv(t);

            await createConversation(t, orgId, { preview: "Bonjour normal" });
            await createConversation(t, orgId, { preview: "C'est urgent" });

            const queue = await t.withIdentity({ subject: userId }).query(api.assignments.getConversationsQueue, {});

            const normal = queue.find((c: any) => c.message.includes("normal"));
            const urgent = queue.find((c: any) => c.message.includes("urgent"));

            expect(normal?.priority).toBe("normal");
            expect(urgent?.priority).toBe("urgent");
        });

        it("should include contact name and phone", async () => {
            const { userId, orgId } = await setupTestEnv(t);
            await createConversation(t, orgId, { preview: "Hello" });

            const queue = await t.withIdentity({ subject: userId }).query(api.assignments.getConversationsQueue, {});

            expect(queue[0].business).toBe("Test Contact");
            expect(queue[0].phone).toMatch(/^\+221/);
        });

        it("should include assignee name when assigned", async () => {
            const { userId, orgId } = await setupTestEnv(t);
            const { agentUserId } = await createAgent(t, orgId, "Paul Diop");

            await createConversation(t, orgId, { assignedTo: agentUserId });

            const queue = await t.withIdentity({ subject: userId }).query(api.assignments.getConversationsQueue, {});

            expect(queue[0].assigneeName).toBe("Paul Diop");
            expect(queue[0].statusColor).toBe("bg-green-500");
        });

        it("AGENT role should only see own + unassigned conversations", async () => {
            const { orgId } = await setupTestEnv(t); // admin creates org

            const { agentUserId: agent1Id } = await createAgent(t, orgId, "Agent 1");
            const { agentUserId: agent2Id } = await createAgent(t, orgId, "Agent 2");

            // Create agent1 session
            await t.run(async (ctx: any) => {
                await ctx.db.insert("userSessions", {
                    userId: agent1Id,
                    currentOrganizationId: orgId,
                    lastActivityAt: Date.now(),
                });
            });

            await createConversation(t, orgId); // unassigned
            await createConversation(t, orgId, { assignedTo: agent1Id }); // assigned to agent1
            await createConversation(t, orgId, { assignedTo: agent2Id }); // assigned to agent2

            const queue = await t.withIdentity({ subject: agent1Id }).query(api.assignments.getConversationsQueue, {});

            // Agent1 should see unassigned (1) + own (1) = 2, NOT agent2's
            expect(queue).toHaveLength(2);
        });
    });

    // ============================================
    // bulkAssign (#28)
    // ============================================
    describe("bulkAssign", () => {
        it("should assign multiple conversations to a member", async () => {
            const { userId, orgId } = await setupTestEnv(t);
            const { agentUserId } = await createAgent(t, orgId, "Target Agent");

            const { convId: conv1 } = await createConversation(t, orgId);
            const { convId: conv2 } = await createConversation(t, orgId);
            const { convId: conv3 } = await createConversation(t, orgId);

            const result = await t.withIdentity({ subject: userId }).mutation(api.assignments.bulkAssign, {
                conversationIds: [conv1, conv2, conv3],
                memberId: agentUserId,
            });

            expect(result.assigned).toBe(3);

            // Verify conversations are assigned
            const queue = await t.withIdentity({ subject: userId }).query(api.assignments.getConversationsQueue, {});
            const assigned = queue.filter((c: any) => c.assignedTo === agentUserId);
            expect(assigned).toHaveLength(3);
        });

        it("should skip conversations already assigned to the same member", async () => {
            const { userId, orgId } = await setupTestEnv(t);
            const { agentUserId } = await createAgent(t, orgId, "Same Agent");

            const { convId } = await createConversation(t, orgId, { assignedTo: agentUserId });

            const result = await t.withIdentity({ subject: userId }).mutation(api.assignments.bulkAssign, {
                conversationIds: [convId],
                memberId: agentUserId,
            });

            expect(result.assigned).toBe(0);
        });

        it("should update target member activeConversations", async () => {
            const { userId, orgId } = await setupTestEnv(t);
            const { agentUserId, membershipId } = await createAgent(t, orgId, "Counter Agent");

            const { convId: c1 } = await createConversation(t, orgId);
            const { convId: c2 } = await createConversation(t, orgId);

            await t.withIdentity({ subject: userId }).mutation(api.assignments.bulkAssign, {
                conversationIds: [c1, c2],
                memberId: agentUserId,
            });

            // Check membership load
            const membership = await t.run(async (ctx: any) => {
                return await ctx.db.get(membershipId);
            });

            expect(membership.activeConversations).toBe(2);
        });

        it("should create assignment records", async () => {
            const { userId, orgId } = await setupTestEnv(t);
            const { agentUserId } = await createAgent(t, orgId, "Record Agent");

            const { convId } = await createConversation(t, orgId);

            await t.withIdentity({ subject: userId }).mutation(api.assignments.bulkAssign, {
                conversationIds: [convId],
                memberId: agentUserId,
            });

            // Check assignment record was created
            const assignments = await t.run(async (ctx: any) => {
                return await ctx.db
                    .query("assignments")
                    .withIndex("by_conversation", (q: any) => q.eq("conversationId", convId))
                    .collect();
            });

            expect(assignments).toHaveLength(1);
            expect(assignments[0].assignedBy).toBe("MANUAL");
            expect(assignments[0].status).toBe("ACTIVE");
            expect(assignments[0].internalNotes).toBe("Bulk assignment");
        });

        it("should throw error for AGENT role", async () => {
            const { orgId } = await setupTestEnv(t);
            const { agentUserId } = await createAgent(t, orgId, "Limited Agent");
            const { agentUserId: targetId } = await createAgent(t, orgId, "Target");

            // Create session for agent
            await t.run(async (ctx: any) => {
                await ctx.db.insert("userSessions", {
                    userId: agentUserId,
                    currentOrganizationId: orgId,
                    lastActivityAt: Date.now(),
                });
            });

            const { convId } = await createConversation(t, orgId);

            await expect(
                t.withIdentity({ subject: agentUserId }).mutation(api.assignments.bulkAssign, {
                    conversationIds: [convId],
                    memberId: targetId,
                })
            ).rejects.toThrow("Agents cannot bulk assign");
        });

        it("should decrement previous assignee load on reassignment", async () => {
            const { userId, orgId } = await setupTestEnv(t);
            const { agentUserId: prevAgent, membershipId: prevMembershipId } = await createAgent(t, orgId, "Prev Agent", { activeConversations: 3 });
            const { agentUserId: newAgent } = await createAgent(t, orgId, "New Agent");

            const { convId } = await createConversation(t, orgId, { assignedTo: prevAgent });

            await t.withIdentity({ subject: userId }).mutation(api.assignments.bulkAssign, {
                conversationIds: [convId],
                memberId: newAgent,
            });

            const prevMembership = await t.run(async (ctx: any) => ctx.db.get(prevMembershipId));
            expect(prevMembership.activeConversations).toBe(2); // 3 - 1
        });
    });

    // ============================================
    // getAssignmentHistory (#33)
    // ============================================
    describe("getAssignmentHistory", () => {
        it("should return empty array for conversation with no assignments", async () => {
            const { userId, orgId } = await setupTestEnv(t);
            const { convId } = await createConversation(t, orgId);

            const history = await t.withIdentity({ subject: userId }).query(api.assignments.getAssignmentHistory, {
                conversationId: convId,
            });

            expect(history).toHaveLength(0);
        });

        it("should return assignment history with assignee names", async () => {
            const { userId, orgId } = await setupTestEnv(t);
            const { convId } = await createConversation(t, orgId);

            // Create an assignment record
            await t.run(async (ctx: any) => {
                await ctx.db.insert("assignments", {
                    organizationId: orgId,
                    conversationId: convId,
                    assignedByMemberId: userId,
                    assignedBy: "MANUAL",
                    status: "ACTIVE",
                    assignedAt: Date.now(),
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                    slaBreached: false,
                    history: [],
                    internalNotes: "Test note",
                });
            });

            const history = await t.withIdentity({ subject: userId }).query(api.assignments.getAssignmentHistory, {
                conversationId: convId,
            });

            expect(history).toHaveLength(1);
            expect(history[0].assignedBy).toBe("MANUAL");
            expect(history[0].assignedByName).toBe("Admin User");
            expect(history[0].status).toBe("ACTIVE");
            expect(history[0].note).toBe("Test note");
        });

        it("should return at most 10 records ordered desc", async () => {
            const { userId, orgId } = await setupTestEnv(t);
            const { convId } = await createConversation(t, orgId);

            // Insert 12 assignment records
            for (let i = 0; i < 12; i++) {
                await t.run(async (ctx: any) => {
                    await ctx.db.insert("assignments", {
                        organizationId: orgId,
                        conversationId: convId,
                        assignedByMemberId: userId,
                        assignedBy: "MANUAL",
                        status: i < 11 ? "TRANSFERRED" : "ACTIVE",
                        assignedAt: Date.now() + i * 1000,
                        createdAt: Date.now() + i * 1000,
                        updatedAt: Date.now() + i * 1000,
                        slaBreached: false,
                        history: [],
                    });
                });
            }

            const history = await t.withIdentity({ subject: userId }).query(api.assignments.getAssignmentHistory, {
                conversationId: convId,
            });

            expect(history).toHaveLength(10); // max 10
        });

        it("should return empty for conversation from another org", async () => {
            const { userId, orgId } = await setupTestEnv(t);

            // Create conv in a different org
            const otherOrgConvId = await t.run(async (ctx: any) => {
                const otherOwner = await ctx.db.insert("users", { email: "other@test.com", name: "Other" });
                const otherOrg = await ctx.db.insert("organizations", {
                    name: "Other Org",
                    slug: "other-org",
                    ownerId: otherOwner,
                    plan: "STARTER",
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                });
                const contactId = await ctx.db.insert("contacts", {
                    organizationId: otherOrg,
                    phone: "+221770000000",
                    name: "Other Contact",
                    searchName: "Other Contact +221770000000",
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                });
                return await ctx.db.insert("conversations", {
                    organizationId: otherOrg,
                    contactId,
                    channel: "WHATSAPP",
                    status: "OPEN",
                    lastMessageAt: Date.now(),
                    unreadCount: 0,
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                });
            });

            const history = await t.withIdentity({ subject: userId }).query(api.assignments.getAssignmentHistory, {
                conversationId: otherOrgConvId,
            });

            expect(history).toHaveLength(0); // access denied - returns empty
        });
    });

    // ============================================
    // assign (single)
    // ============================================
    describe("assign", () => {
        it("should assign a conversation to a member", async () => {
            const { userId, orgId } = await setupTestEnv(t);
            const { agentUserId } = await createAgent(t, orgId, "Target Agent");
            const { convId } = await createConversation(t, orgId);

            await t.withIdentity({ subject: userId }).mutation(api.assignments.assign, {
                conversationId: convId,
                memberId: agentUserId,
                note: "Manual assignment test",
            });

            // Verify conversation is assigned
            const conv = await t.run(async (ctx: any) => ctx.db.get(convId));
            expect(conv.assignedTo).toBe(agentUserId);
        });

        it("should create a notification for the assigned agent", async () => {
            const { userId, orgId } = await setupTestEnv(t);
            const { agentUserId } = await createAgent(t, orgId, "Notified Agent");
            const { convId } = await createConversation(t, orgId);

            await t.withIdentity({ subject: userId }).mutation(api.assignments.assign, {
                conversationId: convId,
                memberId: agentUserId,
            });

            const notifications = await t.run(async (ctx: any) => {
                return await ctx.db
                    .query("notifications")
                    .filter((q: any) => q.eq(q.field("userId"), agentUserId))
                    .collect();
            });

            expect(notifications).toHaveLength(1);
            expect(notifications[0].type).toBe("ASSIGNMENT");
        });
    });

    // ============================================
    // unassign
    // ============================================
    describe("unassign", () => {
        it("should unassign a conversation and decrement load", async () => {
            const { userId, orgId } = await setupTestEnv(t);
            const { agentUserId, membershipId } = await createAgent(t, orgId, "Busy Agent", { activeConversations: 3 });
            const { convId } = await createConversation(t, orgId, { assignedTo: agentUserId });

            await t.withIdentity({ subject: userId }).mutation(api.assignments.unassign, {
                conversationId: convId,
            });

            const conv = await t.run(async (ctx: any) => ctx.db.get(convId));
            expect(conv.assignedTo).toBeUndefined();

            const membership = await t.run(async (ctx: any) => ctx.db.get(membershipId));
            expect(membership.activeConversations).toBe(2);
        });
    });

    // ============================================
    // getAgentsList
    // ============================================
    describe("getAgentsList", () => {
        it("should return all org members with enriched info", async () => {
            const { userId, orgId } = await setupTestEnv(t);
            await createAgent(t, orgId, "Agent Alpha", { status: "ONLINE" });
            await createAgent(t, orgId, "Agent Beta", { status: "OFFLINE" });

            const agents = await t.withIdentity({ subject: userId }).query(api.assignments.getAgentsList, {});

            // Should include the owner + 2 agents = 3
            expect(agents).toHaveLength(3);

            const alpha = agents.find((a: any) => a.fullName === "Agent Alpha");
            expect(alpha).toBeDefined();
            expect(alpha?.status).toBe("En ligne");
            expect(alpha?.online).toBe(true);
        });

        it("should show correct load and capacity", async () => {
            const { userId, orgId } = await setupTestEnv(t);
            await createAgent(t, orgId, "Loaded Agent", {
                activeConversations: 4,
                maxConversations: 5,
            });

            const agents = await t.withIdentity({ subject: userId }).query(api.assignments.getAgentsList, {});

            const loaded = agents.find((a: any) => a.fullName === "Loaded Agent");
            expect(loaded?.load).toBe(4);
            expect(loaded?.maxLoad).toBe(5);
        });
    });

    // ============================================
    // updateAssignmentSettings
    // ============================================
    describe("updateAssignmentSettings", () => {
        it("should update settings for OWNER role", async () => {
            const { userId } = await setupTestEnv(t);

            await t.withIdentity({ subject: userId }).mutation(api.assignments.updateAssignmentSettings, {
                autoAssignEnabled: true,
                maxConcurrentChats: 8,
                excludeOfflineAgents: true,
            });

            const settings = await t.withIdentity({ subject: userId }).query(api.assignments.getAssignmentSettings, {});

            expect(settings?.autoAssignEnabled).toBe(true);
            expect(settings?.maxConcurrentChats).toBe(8);
            expect(settings?.excludeOfflineAgents).toBe(true);
        });

        it("should throw for AGENT role", async () => {
            const { orgId } = await setupTestEnv(t);
            const { agentUserId } = await createAgent(t, orgId, "Agent User");

            await t.run(async (ctx: any) => {
                await ctx.db.insert("userSessions", {
                    userId: agentUserId,
                    currentOrganizationId: orgId,
                    lastActivityAt: Date.now(),
                });
            });

            await expect(
                t.withIdentity({ subject: agentUserId }).mutation(api.assignments.updateAssignmentSettings, {
                    autoAssignEnabled: true,
                    maxConcurrentChats: 5,
                    excludeOfflineAgents: true,
                })
            ).rejects.toThrow("Only admins can update settings");
        });
    });
});
