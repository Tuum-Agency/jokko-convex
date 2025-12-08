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
                    { id: '1', type: 'message', position: { x: 250, y: 100 }, data: { label: 'Message 1', content: 'Ceci est un flux mocké (Pas de clé API).' } }
                ],
                edges: []
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
                    
                    Supported node types:
                    - "message": Mandatory "content" in data. Content should be the actual text sent to the user.
                    
                    CRITICAL RULES:
                    1. LABELS: Use descriptive labels like "Welcome Message", "First Follow-up", "Promo Offer" instead of "Message 1".
                    2. CONTENT: The content must be engaging, professional, and match the user's intent perfectly. Use emojis if appropriate.
                    3. DATA USAGE: If the user asks about "services" or "offerings", USE the 'AVAILABLE ORGANIZATION SERVICES' list provided above. Do not hallucinate services.
                    4. STRUCTURE: Arrange nodes vertically with sufficient vertical spacing (at least 150px gap).
                    5. IDs: Use simple string IDs ('1', '2', '3') or keep existing ones.
                    
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
