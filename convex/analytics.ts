
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
            const user = await ctx.db.get(m.userId);
            agentsMap.set(m.userId, {
                id: m.userId,
                name: user?.name || "Unknown",
                role: m.role,
                conversations: 0,
                messages: 0,
                responseTimeSum: 0,
                responseCount: 0,
                handledConversations: new Set<string>(),
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
        let marketingOutbound = 0;
        let conversationInbound = 0;
        let conversationOutbound = 0;

        for (const msg of messages) {
            // Filter for global stats
            const inRange = msg.createdAt >= start && msg.createdAt <= end;

            if (inRange) {
                totalMessages++;
                const isBroadcast = !!msg.broadcastId;

                if (msg.direction === 'INBOUND') {
                    inboundCount++;
                    conversationInbound++;
                } else {
                    outboundCount++;
                    if (isBroadcast) {
                        marketingOutbound++;
                    } else {
                        conversationOutbound++;
                    }
                }

                if (msg.senderId && agentsMap.has(msg.senderId)) {
                    const agent = agentsMap.get(msg.senderId);
                    agent.messages++;
                    agent.handledConversations.add(msg.conversationId);
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
                    handledConversations: a.handledConversations.size,
                    responseCount: a.responseCount,
                    avgResponseTime,
                    _avgMs: avgMs,
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

        // ── Daily Activity Chart ──
        const dayMs = 24 * 60 * 60 * 1000;
        const dailyActivity: { date: string; label: string; inbound: number; outbound: number; marketing: number }[] = [];

        const chartStartDate = new Date(start);
        chartStartDate.setHours(0, 0, 0, 0);

        for (let d = chartStartDate.getTime(); d <= end; d += dayMs) {
            const dayStart = d;
            const dayEnd = d + dayMs;
            const dayDate = new Date(d);
            let dayInbound = 0;
            let dayOutbound = 0;
            let dayMarketing = 0;

            for (const msg of messages) {
                if (msg.createdAt >= dayStart && msg.createdAt < dayEnd) {
                    if (msg.direction === 'INBOUND') {
                        dayInbound++;
                    } else if (msg.broadcastId) {
                        dayMarketing++;
                    } else {
                        dayOutbound++;
                    }
                }
            }

            const dayNum = dayDate.getDate();
            const monthNames = ['jan', 'fév', 'mar', 'avr', 'mai', 'jun', 'jul', 'aoû', 'sep', 'oct', 'nov', 'déc'];
            dailyActivity.push({
                date: dayDate.toISOString().split('T')[0],
                label: `${dayNum} ${monthNames[dayDate.getMonth()]}`,
                inbound: dayInbound,
                outbound: dayOutbound,
                marketing: dayMarketing,
            });
        }

        // ── Trends (compare with previous period of same duration) ──
        const periodDuration = end - start;
        const prevStart = start - periodDuration;

        let prevTotalMessages = 0;
        for (const msg of messages) {
            if (msg.createdAt >= prevStart && msg.createdAt < start) {
                prevTotalMessages++;
            }
        }

        let currentNewConvs = 0;
        let prevNewConvs = 0;
        for (const conv of conversations) {
            if (conv.createdAt >= start && conv.createdAt <= end) currentNewConvs++;
            else if (conv.createdAt >= prevStart && conv.createdAt < start) prevNewConvs++;
        }

        const formatTrend = (current: number, prev: number) => {
            if (prev === 0 && current === 0) return { trend: 'up' as const, value: '0%' };
            if (prev === 0) return { trend: 'up' as const, value: `+${current}` };
            const percent = ((current - prev) / prev) * 100;
            return {
                trend: percent >= 0 ? 'up' as const : 'down' as const,
                value: `${percent > 0 ? '+' : ''}${Math.round(percent)}%`,
            };
        };

        const responseRate = conversationInbound > 0
            ? Math.min(100, Math.round((conversationOutbound / conversationInbound) * 100))
            : 0;

        return {
            global: {
                totalMessages,
                inboundCount,
                outboundCount,
                conversationInbound,
                conversationOutbound,
                marketingOutbound,
                totalConversations,
                openConversations,
                closedConversations,
                avgResponseTime: globalAvgResponseTime,
                responseRate,
            },
            agents: agents.sort((a, b) => b.messagesCount - a.messagesCount),
            dailyActivity,
            trends: {
                messages: formatTrend(totalMessages, prevTotalMessages),
                conversations: formatTrend(currentNewConvs, prevNewConvs),
            },
        };
    }
});

export const getAppDashboardStats = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) return null;

        const organizationId = await getOrganizationId(ctx, userId);
        if (!organizationId) return null;

        const now = Date.now();
        const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
        const currentStart = now - thirtyDaysMs;
        const previousStart = currentStart - thirtyDaysMs;

        // --- 1. Recent Conversations ---
        const recentConvsRaw = await ctx.db
            .query("conversations")
            .withIndex("by_org_last_message", (q) => q.eq("organizationId", organizationId))
            .order("desc")
            .take(5);

        const recentConversations = await Promise.all(recentConvsRaw.map(async (c) => {
            let contactName = "Inconnu";
            let contactPhone = "";

            if (c.contactId) {
                const contact = await ctx.db.get(c.contactId);
                if (contact) {
                    contactName = contact.name || contact.phone;
                    contactPhone = contact.phone;
                }
            }

            return {
                id: c._id,
                contactName,
                contactPhone,
                lastMessageTime: c.lastMessageAt,
                unread: c.unreadCount > 0
            };
        }));

        // --- 2. Stats & Trends ---

        // Fetch all messages in the last 60 days
        const messages = await ctx.db
            .query("messages")
            .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
            .filter(q => q.gte(q.field("createdAt"), previousStart))
            .collect();

        // Accumulators
        let currentPeriod = {
            messagesSent: 0,
            messagesInbound: 0,
            activeContacts: new Set<string>()
        };

        let previousPeriod = {
            messagesSent: 0,
            messagesInbound: 0,
            activeContacts: new Set<string>()
        };

        for (const m of messages) {
            const isCurrent = m.createdAt >= currentStart;
            const target = isCurrent ? currentPeriod : previousPeriod;

            if (m.direction === 'OUTBOUND') target.messagesSent++;
            if (m.direction === 'INBOUND') target.messagesInbound++;
            if (m.contactId) target.activeContacts.add(m.contactId);
        }

        // Count Total Conversations (Snapshot or new in period?)
        // Let's use Total Conversations as "Total In Database" and Trend as "New this month"
        const allConversations = await ctx.db
            .query("conversations")
            .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
            .collect();

        const totalConversationsCount = allConversations.length;

        // Calculate new conversations in periods for trend
        let currentNewConvs = 0;
        let prevNewConvs = 0;
        for (const c of allConversations) {
            if (c.createdAt >= currentStart) currentNewConvs++;
            else if (c.createdAt >= previousStart) prevNewConvs++;
        }

        // --- Formatting Helper ---
        const formatTrend = (current: number, prev: number, isPercent = false) => {
            if (prev === 0) return { trend: 'up' as const, value: isPercent ? '>100%' : `+${current}` };
            const diff = current - prev;
            const percent = (diff / prev) * 100;
            const trend = diff >= 0 ? 'up' as const : 'down' as const;
            const value = isPercent ? `${percent > 0 ? '+' : ''}${percent.toFixed(1)}%` : `${diff > 0 ? '+' : ''}${Math.round(percent)}%`;
            return { trend, value };
        };

        // 1. Total Conversations
        const convTrend = formatTrend(currentNewConvs, prevNewConvs);

        // 2. Active Contacts
        const activeContactsCount = currentPeriod.activeContacts.size;
        const prevActiveContactsCount = previousPeriod.activeContacts.size;
        const contactsTrend = formatTrend(activeContactsCount, prevActiveContactsCount);

        // 3. Messages Sent
        const sentTrend = formatTrend(currentPeriod.messagesSent, previousPeriod.messagesSent);

        // 4. Response Rate (Approx: Outbound / Total messages involved?) 
        // Or just Replied / Inbound.
        // Let's use (Outbound / (Outbound + Inbound)) or just Outbound/Inbound
        const calcRate = (out: number, inb: number) => {
            if (inb === 0) return 0; // No inbound messages
            return Math.min(100, (out / inb) * 100);
        };

        const currentRate = calcRate(currentPeriod.messagesSent, currentPeriod.messagesInbound);
        const prevRate = calcRate(previousPeriod.messagesSent, previousPeriod.messagesInbound);
        const rateTrend = formatTrend(currentRate, prevRate, true);

        // --- 3. Weekly Activity (last 7 days) ---
        const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
        const weekStart = now - sevenDaysMs;
        const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
        const weeklyActivity: { day: string; inbound: number; outbound: number }[] = [];

        for (let i = 6; i >= 0; i--) {
            const dayStart = now - (i * 24 * 60 * 60 * 1000);
            const dayEnd = dayStart + 24 * 60 * 60 * 1000;
            const dayDate = new Date(dayStart);
            let inbound = 0;
            let outbound = 0;

            for (const m of messages) {
                if (m.createdAt >= dayStart && m.createdAt < dayEnd) {
                    if (m.direction === 'INBOUND') inbound++;
                    else outbound++;
                }
            }

            weeklyActivity.push({
                day: dayNames[dayDate.getDay()],
                inbound,
                outbound,
            });
        }

        // --- 4. Conversation breakdown ---
        let openConversations = 0;
        let resolvedConversations = 0;
        for (const c of allConversations) {
            if (c.status === 'OPEN') openConversations++;
            else resolvedConversations++;
        }

        return {
            stats: [
                {
                    title: 'Total Conversations',
                    value: totalConversationsCount.toLocaleString(),
                    description: 'depuis le mois dernier',
                    trend: convTrend.trend,
                    trendValue: convTrend.value,
                    iconColor: "text-emerald-600",
                    iconBg: "bg-emerald-50",
                },
                {
                    title: 'Contacts Actifs',
                    value: activeContactsCount.toLocaleString(),
                    description: 'contacts engagés',
                    trend: contactsTrend.trend,
                    trendValue: contactsTrend.value,
                    iconColor: "text-blue-600",
                    iconBg: "bg-blue-50",
                },
                {
                    title: 'Messages Envoyés',
                    value: currentPeriod.messagesSent.toLocaleString(),
                    description: 'ce mois-ci',
                    trend: sentTrend.trend,
                    trendValue: sentTrend.value,
                    iconColor: "text-purple-600",
                    iconBg: "bg-purple-50",
                },
                {
                    title: 'Taux de Réponse',
                    value: `${currentRate.toFixed(1)}%`,
                    description: 'estimé',
                    trend: rateTrend.trend,
                    trendValue: rateTrend.value,
                    iconColor: "text-orange-600",
                    iconBg: "bg-orange-50",
                },
            ],
            recentConversations,
            chartData: {
                weeklyActivity,
                inboundMessages: currentPeriod.messagesInbound,
                outboundMessages: currentPeriod.messagesSent,
                responseRate: Math.round(currentRate),
                totalConversations: totalConversationsCount,
                openConversations,
                resolvedConversations,
            },
        };
    }
});

export const getDashboardOverview = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) return null;

        const organizationId = await getOrganizationId(ctx, userId);
        if (!organizationId) return null;

        // --- 1. Contacts by tag (étiquettes) ---
        const tags = await ctx.db
            .query("tags")
            .withIndex("by_organization", (q: any) => q.eq("organizationId", organizationId))
            .collect();

        const contacts = await ctx.db
            .query("contacts")
            .withIndex("by_organization", (q: any) => q.eq("organizationId", organizationId))
            .collect();

        const totalContacts = contacts.length;

        // Count contacts per tag
        const tagCounts = new Map<string, number>();
        for (const tag of tags) {
            tagCounts.set(tag._id, 0);
        }
        for (const contact of contacts) {
            if (contact.tags && Array.isArray(contact.tags)) {
                for (const tagId of contact.tags) {
                    tagCounts.set(tagId, (tagCounts.get(tagId) || 0) + 1);
                }
            }
        }

        const tagStats = tags.map((tag) => ({
            id: tag._id,
            name: tag.name,
            color: tag.color || '#10b981',
            count: tagCounts.get(tag._id) || 0,
            percentage: totalContacts > 0
                ? Math.round(((tagCounts.get(tag._id) || 0) / totalContacts) * 10000) / 100
                : 0,
        }));

        // --- 2. Contacts by assignment (via conversations) ---
        const conversations = await ctx.db
            .query("conversations")
            .withIndex("by_organization", (q: any) => q.eq("organizationId", organizationId))
            .collect();

        const contactsWithOpenConv = new Set<string>();
        const contactsAssigned = new Set<string>();
        const contactsUnassigned = new Set<string>();

        for (const conv of conversations) {
            if (conv.status === 'OPEN' && conv.contactId) {
                contactsWithOpenConv.add(conv.contactId);
                if (conv.assignedTo) {
                    contactsAssigned.add(conv.contactId);
                } else {
                    contactsUnassigned.add(conv.contactId);
                }
            }
        }

        const contactBreakdown = {
            open: contactsWithOpenConv.size,
            assigned: contactsAssigned.size,
            unassigned: contactsUnassigned.size,
        };

        // --- 3. Team members with assignment counts ---
        const memberships = await ctx.db
            .query("memberships")
            .withIndex("by_organization", (q: any) => q.eq("organizationId", organizationId))
            .collect();

        const teamMembers = await Promise.all(
            memberships.map(async (m) => {
                const user = await ctx.db.get(m.userId);
                const assignedCount = conversations.filter(
                    (c) => c.assignedTo === m.userId && c.status === 'OPEN'
                ).length;

                return {
                    id: m._id,
                    userId: m.userId,
                    name: user?.name || 'Inconnu',
                    email: user?.email || '',
                    avatar: user?.image,
                    role: m.role,
                    assignedConversations: assignedCount,
                };
            })
        );

        return {
            tagStats,
            totalContacts,
            contactBreakdown,
            teamMembers: teamMembers.sort((a, b) => b.assignedConversations - a.assignedConversations),
        };
    },
});

