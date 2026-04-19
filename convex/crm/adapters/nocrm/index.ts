import type { CRMAdapter } from "../../core/types";
import { PROVIDER_INFO } from "../../core/providers";
import { CRMError } from "../../core/errors";

const notImpl = (op: string) => {
    throw new CRMError(`nocrm.${op} not implemented (Phase 4)`, {
        provider: "nocrm",
        retryable: false,
    });
};

export const nocrmAdapter: CRMAdapter = {
    provider: "nocrm",
    capabilities: PROVIDER_INFO.nocrm.capabilities,
    validateApiKey: async () => ({ ok: false }),
    pullContactsPage: async () => notImpl("pullContactsPage") as never,
    pushConversationEvent: async () => notImpl("pushConversationEvent") as never,
};
