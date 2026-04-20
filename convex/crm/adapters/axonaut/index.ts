import type { CRMAdapter } from "../../core/types";
import { PROVIDER_INFO } from "../../core/providers";
import * as rest from "./rest";

export const axonautAdapter: CRMAdapter = {
    provider: "axonaut",
    capabilities: PROVIDER_INFO.axonaut.capabilities,
    validateApiKey: rest.validateApiKey,
    pullContactsPage: rest.pullContactsPage,
    pullDealsPage: rest.pullDealsPage,
    pushConversationEvent: rest.pushConversationEvent,
    verifyWebhookSignature: rest.verifyWebhookSignature,
    parseWebhookEvent: rest.parseWebhookEvent,
};
