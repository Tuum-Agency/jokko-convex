import type { CRMAdapter } from "../../core/types";
import { PROVIDER_INFO } from "../../core/providers";
import * as rest from "./rest";

export const hubspotAdapter: CRMAdapter = {
    provider: "hubspot",
    capabilities: PROVIDER_INFO.hubspot.capabilities,
    buildAuthorizeUrl: rest.buildAuthorizeUrl,
    exchangeCode: rest.exchangeCode,
    refreshToken: rest.refreshToken,
    revokeToken: rest.revokeToken,
    pullContactsPage: rest.pullContactsPage,
    pullDealsPage: rest.pullDealsPage,
    findContactByPhone: rest.findContactByPhone,
    findContactByEmail: rest.findContactByEmail,
    pushConversationEvent: rest.pushConversationEvent,
    verifyWebhookSignature: rest.verifyWebhookSignature,
    parseWebhookEvent: rest.parseWebhookEvent,
};
