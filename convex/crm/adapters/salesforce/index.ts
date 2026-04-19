import type { CRMAdapter } from "../../core/types";
import { PROVIDER_INFO } from "../../core/providers";
import * as rest from "./rest";

export const salesforceAdapter: CRMAdapter = {
    provider: "salesforce",
    capabilities: PROVIDER_INFO.salesforce.capabilities,
    buildAuthorizeUrl: rest.buildAuthorizeUrl,
    exchangeCode: rest.exchangeCode,
    refreshToken: rest.refreshToken,
    revokeToken: rest.revokeToken,
    pullContactsPage: rest.pullContactsPage,
    pullDealsPage: rest.pullDealsPage,
    pushConversationEvent: rest.pushConversationEvent,
};
