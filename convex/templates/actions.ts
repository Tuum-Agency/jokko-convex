
import { v } from "convex/values";
import { action } from "../_generated/server";
import { buildMetaTemplatePayload } from "../lib/templateBuilder";
import { api } from "../_generated/api";

export const submitToMeta = action({
    args: {
        templateId: v.id("templates"),
    },
    handler: async (ctx, args) => {
        // 1. Fetch template data and validate ownership via query
        const template = await ctx.runQuery(api.templates.queries.get, { id: args.templateId });

        if (!template) {
            throw new Error("Template not found or unauthorized");
        }

        // 2. Fetch Organization config (placeholder for now)
        // const org = await ctx.runQuery(api.organizations.getInternal, { id: template.organizationId });

        // 3. Logic to build payload and call Meta API
        // const payload = buildMetaTemplatePayload(template);
        // ... fetch(...)

        console.log("Submit to Meta action called for template:", template.slug, "Org:", template.organizationId);

        // Simulation delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Update status to APPROVED (Simulating instant sandbox approval)
        await ctx.runMutation(api.templates.mutations.updateStatus, {
            id: args.templateId,
            status: "APPROVED"
        });

        return { success: true, message: "Template submitted successfully (Simulation)" };
    },
});
