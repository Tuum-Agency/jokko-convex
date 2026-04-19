import type { CRMAdapter } from "../../core/types";
import { PROVIDER_INFO } from "../../core/providers";
import { CRMError } from "../../core/errors";

const notImpl = (op: string) => {
    throw new CRMError(`pipedrive.${op} not implemented (Phase 3)`, {
        provider: "pipedrive",
        retryable: false,
    });
};

export const pipedriveAdapter: CRMAdapter = {
    provider: "pipedrive",
    capabilities: PROVIDER_INFO.pipedrive.capabilities,
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
