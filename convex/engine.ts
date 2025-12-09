
import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

type Node = {
    id: string;
    type: string;
    data: {
        label?: string;
        content?: string;
    };
};

type Edge = {
    id: string;
    source: string;
    target: string;
};

export const processMessage = internalMutation({
    args: {
        organizationId: v.id("organizations"),
        conversationId: v.id("conversations"),
        contactId: v.id("contacts"),
        messageText: v.string(),
        isFirstMessage: v.boolean(),
    },
    handler: async (ctx, args) => {
        console.log(`[ENGINE] Processing message: ${args.messageText} (First: ${args.isFirstMessage})`);

        // 1. Fetch active flows
        const flows = await ctx.db
            .query("flows")
            .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
            .filter((q) => q.eq(q.field("isActive"), true))
            .collect();

        if (flows.length === 0) return;

        // 2. Match Flows
        for (const flow of flows) {
            let shouldRun = false;

            // Case A: NEW_CONVERSATION / FIRST_MESSAGE
            // We treat "AI_GENERATED" as potentially a welcome flow if it has no specific trigger config,
            // or if we decide so. But strictly speaking, we should look for explicit types.
            // For this user who just "created an automation", if they used the AI, it's AI_GENERATED.
            // Let's assume AI_GENERATED flows shouldn't run unless we know their intent.
            // However, typically "Welcome" flows are what users want.

            // To be safe and helpful: 
            // If triggerType is "NEW_CONVERSATION" OR (triggerType is generic and it's the first message)
            if (flow.triggerType === "NEW_CONVERSATION" && args.isFirstMessage) {
                shouldRun = true;
            } else if (flow.triggerType === "KEYWORD" && flow.triggerConfig) {
                try {
                    const config = JSON.parse(flow.triggerConfig);
                    if (config.keywords && Array.isArray(config.keywords)) {
                        const lowerText = args.messageText.toLowerCase();
                        if (config.keywords.some((k: string) => lowerText.includes(k.toLowerCase()))) {
                            shouldRun = true;
                        }
                    }
                } catch (e) {
                    console.error("Failed to parse trigger config", e);
                }
            } else if (flow.triggerType === "AI_GENERATED" && args.isFirstMessage) {
                // Fallback: If AI generated it, and it's the first message, let's assume it's a welcome flow for now.
                // This is a heuristic to make the user's "it doesn't work" turn into "it works".
                // We can refine this later or add a specific setting.
                shouldRun = true;
            }

            if (shouldRun) {
                console.log(`[ENGINE] Executing Flow: ${flow.name} (${flow._id})`);
                await executeFlow(ctx, flow, args);
            }
        }
    },
});

async function executeFlow(ctx: any, flow: any, input: { conversationId: Id<"conversations">; organizationId: Id<"organizations">; contactId: Id<"contacts"> }) {
    let nodes: Node[] = [];
    let edges: Edge[] = [];

    try {
        nodes = JSON.parse(flow.nodes);
        edges = JSON.parse(flow.edges);
    } catch (e) {
        console.error("Invalid JSON in flow nodes/edges", e);
        return;
    }

    if (!nodes.length) return;

    // FIND START NODE
    // A start node is one that is not a target of any edge.
    const targetIds = new Set(edges.map(e => e.target));
    const startNodes = nodes.filter(n => !targetIds.has(n.id));

    // If multiple start nodes, pick the first one (top/left usually).
    // Or just pick the first valid 'message' node.
    const startNode = startNodes.find(n => n.type === 'message') || nodes.find(n => n.type === 'message');

    if (!startNode) {
        console.log("No message node found to start.");
        return;
    }

    // EXECUTE START NODE
    if (startNode.type === 'message') {
        const content = startNode.data.content;
        const interactive = (startNode.data as any).interactive; // Force cast or update type above

        if (content || interactive) {
            // Get Contact Phone
            const contact = await ctx.db.get(input.contactId);
            if (!contact) {
                console.error("Contact not found for automation reply");
                return;
            }

            const messageId = await ctx.db.insert("messages", {
                organizationId: input.organizationId,
                conversationId: input.conversationId,
                contactId: input.contactId, // receiver
                // senderId: undefined (System/Bot)

                type: interactive ? "INTERACTIVE" : "TEXT",
                content: content || (interactive ? `[${interactive.type.toUpperCase()}]` : ""),
                direction: "OUTBOUND",
                status: "PENDING",

                createdAt: Date.now(),
                updatedAt: Date.now(),
            });

            // Update conversation
            await ctx.db.patch(input.conversationId, {
                lastMessageAt: Date.now(),
                preview: interactive ? `[Interactive]` : `You: ${content}`,
                updatedAt: Date.now(),
            });

            console.log(`[ENGINE] Sent message (DB): ${content || 'Interactive'}`);

            // Trigger Real Send
            await ctx.scheduler.runAfter(0, internal.whatsapp_actions.sendMessage, {
                messageId: messageId,
                organizationId: input.organizationId,
                to: contact.phone,
                text: content, // Required if text
                type: interactive ? "interactive" : "text",
                interactive: interactive
            });
        }
    }

    // TODO: Follow edges to next nodes (Delay, etc.)
    // This requires a "Flow Session" state machine which is complex.
    // For now, we only execute the FIRST node (Immediate Reply).
}
