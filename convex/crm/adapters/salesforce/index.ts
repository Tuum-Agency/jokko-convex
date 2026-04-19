import type { CRMAdapter } from "../../core/types";
import { PROVIDER_INFO } from "../../core/providers";
import { CRMError } from "../../core/errors";

const notImpl = (op: string) => {
    throw new CRMError(`salesforce.${op} not implemented (Phase 3)`, {
        provider: "salesforce",
        retryable: false,
    });
};

export const salesforceAdapter: CRMAdapter = {
    provider: "salesforce",
    capabilities: PROVIDER_INFO.salesforce.capabilities,
    buildAuthorizeUrl: () => {
        notImpl("buildAuthorizeUrl");
        return "";
    },
    exchangeCode: async () => notImpl("exchangeCode") as never,
    refreshToken: async () => notImpl("refreshToken") as never,
    revokeToken: async () => {},
    pullContactsPage: async () => notImpl("pullContactsPage") as never,
    pullDealsPage: async () => notImpl("pullDealsPage") as never,
    pushConversationEvent: async () => notImpl("pushConversationEvent") as never,
};
