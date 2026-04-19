import type { CRMAdapter } from "../../core/types";
import { PROVIDER_INFO } from "../../core/providers";
import { CRMError } from "../../core/errors";

const notImpl = (op: string) => {
    throw new CRMError(`axonaut.${op} not implemented (Phase 4)`, {
        provider: "axonaut",
        retryable: false,
    });
};

export const axonautAdapter: CRMAdapter = {
    provider: "axonaut",
    capabilities: PROVIDER_INFO.axonaut.capabilities,
    validateApiKey: async () => ({ ok: false }),
    pullContactsPage: async () => notImpl("pullContactsPage") as never,
    pullDealsPage: async () => notImpl("pullDealsPage") as never,
    pushConversationEvent: async () => notImpl("pushConversationEvent") as never,
};
