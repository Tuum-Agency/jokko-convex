import { RateLimiter, MINUTE, HOUR } from "@convex-dev/rate-limiter";
import { components } from "../_generated/api";

export const rateLimiter = new RateLimiter(components.rateLimiter, {
    // Auth: brute-force protection
    sendMessage: { kind: "token bucket", rate: 30, period: MINUTE, capacity: 5 },

    // WhatsApp test messages
    sendTestMessage: { kind: "token bucket", rate: 5, period: MINUTE, capacity: 2 },

    // Checkout sessions
    createCheckout: { kind: "fixed window", rate: 5, period: HOUR },

    // Organization creation
    createOrganization: { kind: "fixed window", rate: 5, period: HOUR },

    // File uploads
    uploadFile: { kind: "token bucket", rate: 20, period: MINUTE, capacity: 5 },

    // WhatsApp channel operations
    whatsappConnect: { kind: "fixed window", rate: 10, period: HOUR },
});
