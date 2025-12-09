import { v } from "convex/values";
import { action, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";
import OpenAI from "openai";

export const getFlowContext = internalQuery({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) return null;

        const session = await ctx.db
            .query("userSessions")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .first();

        if (!session || !session.currentOrganizationId) return null;

        const currentOrganizationId = session.currentOrganizationId;

        const poles = await ctx.db
            .query("poles")
            .withIndex("by_organization", (q) => q.eq("organizationId", currentOrganizationId))
            .collect();

        return {
            services: poles.map((p) => ({ name: p.name, description: p.description })),
        };
    },
});

export const generateFlow = action({
    args: {
        prompt: v.string(),
        currentNodes: v.optional(v.string()), // JSON string
        currentEdges: v.optional(v.string())  // JSON string
    },
    handler: async (ctx, args) => {
        // Fetch Context (Organization Info like Services/Poles)
        const flowContext = await ctx.runQuery(internal.ai.getFlowContext, {});

        let servicesContext = "";
        if (flowContext?.services && flowContext.services.length > 0) {
            servicesContext = "\n\nAVAILABLE ORGANIZATION SERVICES (Use these if relevant):\n" +
                flowContext.services.map(s => `- ${s.name}: ${s.description || 'No description'}`).join("\n");
        }

        // Check for API key
        const apiKey = process.env.OPENAI_API_KEY;

        if (!apiKey) {
            console.log("No OPENAI_API_KEY found. Returning mock response.");
            // Mock response for testing
            return {
                nodes: [
                    { id: '1', type: 'start', position: { x: 250, y: 0 }, data: { label: 'Start', triggerType: 'keyword', keywords: 'demo' } },
                    { id: '2', type: 'message', position: { x: 250, y: 150 }, data: { label: 'Welcome', content: 'Welcome to the Demo Flow!' } },
                    {
                        id: '3', type: 'interactive', position: { x: 250, y: 300 }, data: {
                            label: 'Options',
                            interactiveType: 'list',
                            content: 'Choose an option:',
                            options: [{ id: 'opt1', title: 'Sales', label: 'Sales' }, { id: 'opt2', title: 'Support', label: 'Support' }]
                        }
                    },
                    { id: '4', type: 'action', position: { x: 250, y: 500 }, data: { label: 'Assign Agent', actionType: 'assign', details: 'Support Team' } }
                ],
                edges: [
                    { id: 'e1-2', source: '1', target: '2' },
                    { id: 'e2-3', source: '2', target: '3' },
                    { id: 'e3-4', source: '3', target: '4' }
                ]
            };
        }

        const openai = new OpenAI({ apiKey });

        // Preparing context description
        let contextDescription = "You are starting from scratch.";
        if (args.currentNodes && args.currentEdges) {
            contextDescription = `Current Flow State:
        Nodes: ${args.currentNodes}
        Edges: ${args.currentEdges}
        
        The user wants to MODIFY this flow. Preserve existing IDs where possible if they are not being deleted.
        `;
        }

        try {
            const response = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    {
                        role: "system",
                        content: `You are an expert at creating and modifying React Flow automation diagrams for a WhatsApp/SMS marketing platform.
                    
                    ${contextDescription}
                    ${servicesContext}
                    
                    Your goal is to output a VALID JSON object representing the NEW state of the flow.
                    
                    The structure must be:
                    {
                      "nodes": [
                        { "id": "string", "type": "message", "position": { "x": number, "y": number }, "data": { "label": "string", "content": "string" } }
                      ],
                      "edges": [
                        { "id": "string", "source": "string", "target": "string" }
                      ]
                    }
                    
                    Supported node types & structure:

                    1. "start" (The Trigger):
                       - data: { "label": "Start", "triggerType": "keyword", "keywords": "hello, start" }
                       (Always include one start node).

                    2. "message" (Text only):
                       - data: { "label": "Welcome", "content": "Hello! How can I help?" }

                    3. "interactive" (Buttons or Lists):
                       - data: {
                           "label": "Choose Option",
                           "interactiveType": "list" (OR "button" for <= 3 options),
                           "content": "Please select a service:",
                           "options": [
                               { "id": "opt_1", "title": "Sales", "label": "Sales" },
                               { "id": "opt_2", "title": "Support", "label": "Support" }
                           ]
                       }

                    4. "action" (System operations):
                       - data: { "label": "Tag User", "actionType": "tag", "details": "Lead" }
                       (actionTypes: "tag", "assign", "close")

                    CRITICAL RULES:
                    1. START NODE: Every flow MUST have exactly one 'start' node.
                    2. SERVICES: Use the 'AVAILABLE ORGANIZATION SERVICES' list to populate 'interactive' node options if relevant.
                    3. LOGIC: Flow should generally go Start -> Message/Interactive -> (Decision) -> Message -> Action.
                    4. IDS: Use simple unique string IDs.
                    5. LAYOUT: Calculate "position" {x, y} so nodes flow logically from top to bottom.
                    
                    Return ONLY the JSON.`
                    },
                    { role: "user", content: args.prompt }
                ],
                response_format: { type: "json_object" }
            });

            const content = response.choices[0].message.content;
            if (!content) throw new Error("No content from OpenAI");

            const json = JSON.parse(content);
            return json; // Expecting { nodes: [...], edges: [...] }

        } catch (error: any) {
            console.error("OpenAI error:", error);
            return { error: error.message || "Failed to generate flow" };
        }
    },
});
