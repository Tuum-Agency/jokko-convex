
import { v } from "convex/values";
import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Helper to get Org ID (simplified)
async function getOrganizationId(ctx: any, userId: string) {
    const session = await ctx.db
        .query("userSessions")
        .withIndex("by_user", (q: any) => q.eq("userId", userId))
        .first();

    if (session?.currentOrganizationId) return session.currentOrganizationId;

    const membership = await ctx.db
        .query("memberships")
        .withIndex("by_user", (q: any) => q.eq("userId", userId))
        .first();

    return membership?.organizationId;
}

export const getDashboardStats = query({
    args: {
        startDate: v.optional(v.number()),
        endDate: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const organizationId = await getOrganizationId(ctx, userId);
        if (!organizationId) throw new Error("No organization found");

        const start = args.startDate || 0;
        const end = args.endDate || Date.now();

        // 1. Fetch Agents (Memberships)
        const memberships = await ctx.db
            .query("memberships")
            .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
            .collect();

        // Map members to simple objects
        const agentsMap = new Map();
        for (const m of memberships) {
            // We include all members to track who sent what, but purely for display we might filter later
            const user = await ctx.db.get(m.userId);
            agentsMap.set(m.userId, {
                id: m.userId,
                name: user?.name || "Unknown",
                role: m.role,
                conversations: 0,
                messages: 0,
                responseTimeSum: 0,
                responseCount: 0,
            });
        }

        // 2. Aggregate Messages & Calculate Response Times
        const messages = await ctx.db
            .query("messages")
            .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
            .collect();

        // Group by conversation for response time calc
        const textMessagesByConv = new Map<string, any[]>();

        let totalMessages = 0;
        let inboundCount = 0;
        let outboundCount = 0;

        for (const msg of messages) {
            // Filter for global stats
            const inRange = msg.createdAt >= start && msg.createdAt <= end;

            if (inRange) {
                totalMessages++;
                if (msg.direction === 'INBOUND') inboundCount++;
                else outboundCount++;

                if (msg.senderId && agentsMap.has(msg.senderId)) {
                    const agent = agentsMap.get(msg.senderId);
                    agent.messages++;
                }
            }

            // Group for response time (we need history even before 'start' to find the prompt for a response?)
            // Actually, we usually care about response times occurring IN the period.
            // But the *conversation* flow matters.
            // Let's collect all messages to process flow, then count those falling in range.
            if (!textMessagesByConv.has(msg.conversationId)) {
                textMessagesByConv.set(msg.conversationId, []);
            }
            textMessagesByConv.get(msg.conversationId)!.push(msg);
        }

        // Calculate Response Times
        for (const [convId, msgs] of textMessagesByConv.entries()) {
            // Sort by time
            msgs.sort((a, b) => a.createdAt - b.createdAt);

            let lastInboundTime = 0;

            for (const msg of msgs) {
                if (msg.direction === 'INBOUND') {
                    lastInboundTime = msg.createdAt;
                } else if (msg.direction === 'OUTBOUND' && msg.senderId) {
                    // It's a response?
                    // Rules:
                    // 1. Must be after an inbound.
                    // 2. We only count the FIRST response to an inbound? Or any response?
                    // Typically: Response Time is time to first response.
                    // But here "average response time" might mean for every block.
                    // Let's use: If last message was Inbound, this is a Response.
                    // And reset lastInboundTime to avoid counting subsequent messages as responses to the same inbound (unless that's desired).
                    // Usually: Inbound -> Outbound (Response). Outbound (Followup).
                    // We only count Inbound -> Outbound.

                    if (lastInboundTime > 0) {
                        const diff = msg.createdAt - lastInboundTime;
                        // Only count if this response happened in the requested period
                        if (msg.createdAt >= start && msg.createdAt <= end) {
                            if (agentsMap.has(msg.senderId)) {
                                const agent = agentsMap.get(msg.senderId);
                                agent.responseTimeSum += diff;
                                agent.responseCount++;
                            }
                        }
                        // Reset
                        lastInboundTime = 0;
                    }
                }
            }
        }

        // 3. Aggregate Current Assignments
        // For "Conversations handled", we can use the messages we processed (if agent sent a message, they handled it).
        // OR we can use current assignments from `conversations` table.
        // Let's use Current Assignments for the "Assignations" column as users expect "What is currently on their plate".
        // But "conversations qu'ils ont eu à gérer" (handled) -> Messages logic is better?
        // Let's add "Handled" (Active via messages) AND "Assigned" (Currently assigned).

        let totalConversations = 0;
        let openConversations = 0;
        let closedConversations = 0;

        const conversations = await ctx.db
            .query("conversations")
            .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
            .collect();

        for (const conv of conversations) {
            totalConversations++;
            if (conv.status === 'OPEN') openConversations++;
            else closedConversations++;

            if (conv.assignedTo && agentsMap.has(conv.assignedTo)) {
                const agent = agentsMap.get(conv.assignedTo);
                agent.conversations++;
            }
        }

        // Final formatting
        const agents = Array.from(agentsMap.values())
            .filter((a: any) => a.role === 'AGENT' || a.role === 'ADMIN' || a.role === 'OWNER') // Show all capable of handling
            .map((a: any) => {
                const avgMs = a.responseCount > 0 ? a.responseTimeSum / a.responseCount : 0;
                // Format: e.g. "5m 30s"
                let avgResponseTime = "N/A";
                if (a.responseCount > 0) {
                    const minutes = Math.floor(avgMs / 60000);
                    if (minutes < 60) avgResponseTime = `${minutes}m`;
                    else {
                        const hours = Math.floor(minutes / 60);
                        const mins = minutes % 60;
                        avgResponseTime = `${hours}h ${mins}m`;
                    }
                }

                return {
                    id: a.id,
                    name: a.name,
                    role: a.role,
                    messagesCount: a.messages,
                    conversationsCount: a.conversations,
                    avgResponseTime,
                    // Raw for sorting if needed
                    _avgMs: avgMs
                };
            });

        // Calculate Global Response Stats
        let globalResponseTimeSum = 0;
        let globalResponseCount = 0;

        for (const agent of agentsMap.values()) {
            globalResponseTimeSum += agent.responseTimeSum;
            globalResponseCount += agent.responseCount;
        }

        const globalAvgMs = globalResponseCount > 0 ? globalResponseTimeSum / globalResponseCount : 0;
        let globalAvgResponseTime = "N/A";
        if (globalResponseCount > 0) {
            const minutes = Math.floor(globalAvgMs / 60000);
            if (minutes < 60) globalAvgResponseTime = `${minutes}m`;
            else {
                const hours = Math.floor(minutes / 60);
                const mins = minutes % 60;
                globalAvgResponseTime = `${hours}h ${mins}m`;
            }
        }

        return {
            global: {
                totalMessages,
                inboundCount,
                outboundCount,
                totalConversations,
                openConversations,
                closedConversations,
                avgResponseTime: globalAvgResponseTime // Added field
            },
            agents: agents.sort((a, b) => b.messagesCount - a.messagesCount)
        };
    }
});
