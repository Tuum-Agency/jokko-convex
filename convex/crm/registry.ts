/**
 * Central registry mapping CRMProvider → CRMAdapter instance.
 * Adding a new provider = 1 file + 1 line here.
 */

import type { CRMAdapter, CRMProvider } from "./core/types";
import { hubspotAdapter } from "./adapters/hubspot";
import { pipedriveAdapter } from "./adapters/pipedrive";
import { salesforceAdapter } from "./adapters/salesforce";
import { sellsyAdapter } from "./adapters/sellsy";
import { axonautAdapter } from "./adapters/axonaut";
import { nocrmAdapter } from "./adapters/nocrm";

const REGISTRY: Record<CRMProvider, CRMAdapter> = {
    hubspot: hubspotAdapter,
    pipedrive: pipedriveAdapter,
    salesforce: salesforceAdapter,
    sellsy: sellsyAdapter,
    axonaut: axonautAdapter,
    nocrm: nocrmAdapter,
};

export function getAdapter(provider: CRMProvider): CRMAdapter {
    const a = REGISTRY[provider];
    if (!a) throw new Error(`Unknown CRM provider: ${provider}`);
    return a;
}

export function listAdapters(): CRMAdapter[] {
    return Object.values(REGISTRY);
}
