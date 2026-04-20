import type { CRMAdapter } from "../../core/types";
import { PROVIDER_INFO } from "../../core/providers";
import * as rest from "./rest";

export const nocrmAdapter: CRMAdapter = {
    provider: "nocrm",
    capabilities: PROVIDER_INFO.nocrm.capabilities,
    validateApiKey: rest.validateApiKey,
    pullContactsPage: rest.pullContactsPage,
    pullDealsPage: rest.pullDealsPage,
    pushConversationEvent: rest.pushConversationEvent,
};
