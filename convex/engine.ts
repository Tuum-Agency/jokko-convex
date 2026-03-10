
import { v } from "convex/values";
import { internalMutation, MutationCtx } from "./_generated/server";
import { internal, api } from "./_generated/api";
import { Id, Doc } from "./_generated/dataModel";

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

// ...

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

        let flowExecuted = false;

        // 2. Match Flows
        if (flows.length > 0) {
            for (const flow of flows) {
                let shouldRun = false;

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
                    shouldRun = true;
                }

                if (shouldRun) {
                    console.log(`[ENGINE] Executing Flow: ${flow.name} (${flow._id})`);
                    await executeFlow(ctx, flow, args);
                    flowExecuted = true;
                    break;
                }
            }
        }

        // 3. Auto-Assignment / Routing (if no flow handled it)
        if (!flowExecuted) {
            console.log("[ENGINE] No flow matched. Triggering Auto-Assignment/Routing.");
            await ctx.scheduler.runAfter(0, api.assignments.analyzeAndRoute, {
                conversationId: args.conversationId,
                organizationId: args.organizationId,
                messageText: args.messageText
            });
        }
    },
});

async function executeFlow(ctx: MutationCtx, flow: Doc<"flows">, input: { conversationId: Id<"conversations">; organizationId: Id<"organizations">; contactId: Id<"contacts"> }) {
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

    // 1. Find Start Node
    let currentNode = nodes.find(n => n.type === 'start');

    // Fallback: If no start node, find a node with no incoming edges (root)
    if (!currentNode) {
        const targetIds = new Set(edges.map(e => e.target));
        currentNode = nodes.find(n => !targetIds.has(n.id));
    }

    if (!currentNode) {
        // Fallback 2: Previous logic (find first message)
        currentNode = nodes.find(n => n.type === 'message');
    }

    if (!currentNode) {
        console.log("No valid start node found.");
        return;
    }

    console.log(`[ENGINE] Starting flow execution at node: ${currentNode.id} (${currentNode.type})`);

    // Contact verification once
    const contact = await ctx.db.get(input.contactId);
    if (!contact) {
        console.error("Contact not found for automation reply");
        return;
    }

    // 2. Traversal Loop
    const MAX_STEPS = 20;
    let step = 0;

    while (currentNode && step < MAX_STEPS) {
        step++;
        console.log(`[ENGINE] Step ${step}: Processing node ${currentNode.id} (${currentNode.type})`);

        // EXECUTE NODE LOGIC based on type
        if (currentNode.type === 'message') {
            const content = currentNode.data.content;
            if (content) {
                const messageId = await ctx.db.insert("messages", {
                    organizationId: input.organizationId,
                    conversationId: input.conversationId,
                    contactId: input.contactId,
                    type: "TEXT",
                    content: content,
                    direction: "OUTBOUND",
                    status: "PENDING",
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                });

                await ctx.db.patch(input.conversationId, {
                    lastMessageAt: Date.now(),
                    preview: `You: ${content}`,
                    updatedAt: Date.now(),
                });

                // Schedule send with slight delay to preserve order if multiple
                await ctx.scheduler.runAfter(step * 1000, internal.whatsapp_actions.sendMessage, {
                    messageId: messageId,
                    organizationId: input.organizationId,
                    to: contact.phone,
                    text: content,
                    type: "text",
                });
            }
        } else if (currentNode.type === 'interactive') {
            const data = currentNode.data as any;
            const content = data.content || "Faites un choix";
            const interactiveType = data.interactiveType || "button"; // 'list' or 'button'
            const options = data.options || [];

            let interactivePayload: any = null;

            if (interactiveType === 'button') {
                interactivePayload = {
                    type: "button",
                    body: { text: content },
                    action: {
                        buttons: options.map((opt: any) => ({
                            type: "reply",
                            reply: {
                                id: opt.id || opt.title,
                                title: opt.title || opt.label || "Option"
                            }
                        }))
                    }
                };
            } else if (interactiveType === 'list') {
                interactivePayload = {
                    type: "list",
                    body: { text: content },
                    action: {
                        button: "Menu",
                        sections: [
                            {
                                title: "Options",
                                rows: options.map((opt: any) => ({
                                    id: opt.id || opt.title,
                                    title: opt.title || opt.label || "Option",
                                    description: opt.description || ""
                                }))
                            }
                        ]
                    }
                };
            }

            if (interactivePayload) {
                const messageId = await ctx.db.insert("messages", {
                    organizationId: input.organizationId,
                    conversationId: input.conversationId,
                    contactId: input.contactId,
                    type: "INTERACTIVE",
                    content: `[${interactiveType.toUpperCase()}] ${content}`,
                    interactive: interactivePayload,
                    direction: "OUTBOUND",
                    status: "PENDING",
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                });

                await ctx.db.patch(input.conversationId, {
                    lastMessageAt: Date.now(),
                    preview: `[Interactive]`,
                    updatedAt: Date.now(),
                });

                await ctx.scheduler.runAfter(step * 1000, internal.whatsapp_actions.sendMessage, {
                    messageId: messageId,
                    organizationId: input.organizationId,
                    to: contact.phone,
                    type: "interactive",
                    interactive: interactivePayload
                });
            }
        }

        // FIND NEXT NODE
        const outboundEdges = edges.filter(e => e.source === currentNode?.id);
        if (outboundEdges.length === 0) {
            break;
        }

        // For now, take the first edge (linear flow)
        const nextEdge = outboundEdges[0];
        currentNode = nodes.find(n => n.id === nextEdge.target);
    }
}
