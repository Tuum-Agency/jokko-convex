/**
 * Build deep-link URLs to the contact record in the external CRM UI.
 * Returns null when the provider is unknown or required info is missing.
 */

import type { CRMProvider } from "./types";

export interface ExternalContactUrlInput {
    provider: CRMProvider | string;
    externalId: string;
    remoteAccountId?: string;
    instanceUrl?: string;
}

export function buildExternalContactUrl(input: ExternalContactUrlInput): string | null {
    const { provider, externalId, remoteAccountId, instanceUrl } = input;
    if (!externalId) return null;

    switch (provider) {
        case "hubspot": {
            if (!remoteAccountId) return null;
            return `https://app.hubspot.com/contacts/${remoteAccountId}/contact/${encodeURIComponent(externalId)}`;
        }
        case "pipedrive": {
            const base = pipedriveBase(instanceUrl);
            if (!base) return null;
            return `${base}/person/${encodeURIComponent(externalId)}`;
        }
        case "salesforce": {
            const base = salesforceLightningBase(instanceUrl);
            if (!base) return null;
            return `${base}/lightning/r/Contact/${encodeURIComponent(externalId)}/view`;
        }
        case "sellsy": {
            return `https://go.sellsy.com/contact/${encodeURIComponent(externalId)}`;
        }
        case "axonaut": {
            return `https://axonaut.com/app/contacts/${encodeURIComponent(externalId)}`;
        }
        case "nocrm": {
            const base = nocrmBase(instanceUrl);
            if (!base) return null;
            return `${base}/#/leads/${encodeURIComponent(externalId)}`;
        }
        default:
            return null;
    }
}

function pipedriveBase(instanceUrl?: string): string | null {
    if (!instanceUrl) return null;
    try {
        const u = new URL(instanceUrl);
        const host = u.hostname.replace(/^api\./, "");
        return `https://${host}`;
    } catch {
        return null;
    }
}

function salesforceLightningBase(instanceUrl?: string): string | null {
    if (!instanceUrl) return null;
    try {
        const u = new URL(instanceUrl);
        const host = u.hostname
            .replace(".my.salesforce.com", ".lightning.force.com")
            .replace(/^login\./, "")
            .replace(/^test\./, "");
        return `https://${host}`;
    } catch {
        return null;
    }
}

function nocrmBase(instanceUrl?: string): string | null {
    if (!instanceUrl) return null;
    try {
        const u = new URL(instanceUrl);
        return `${u.protocol}//${u.hostname}`;
    } catch {
        return null;
    }
}

export const PROVIDER_DISPLAY_NAMES: Record<string, string> = {
    hubspot: "HubSpot",
    pipedrive: "Pipedrive",
    salesforce: "Salesforce",
    sellsy: "Sellsy",
    axonaut: "Axonaut",
    nocrm: "noCRM.io",
};
