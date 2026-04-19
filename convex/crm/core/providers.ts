/**
 * Static provider metadata and capabilities. No runtime dependency.
 */

import type { CRMCapabilities, CRMProvider } from "./types";

export interface ProviderInfo {
    key: CRMProvider;
    displayName: string;
    authMode: "oauth2" | "apiKey";
    availability: "available" | "coming_soon";
    docsUrl: string;
    capabilities: CRMCapabilities;
}

export const PROVIDER_INFO: Record<CRMProvider, ProviderInfo> = {
    hubspot: {
        key: "hubspot",
        displayName: "HubSpot",
        authMode: "oauth2",
        availability: "available",
        docsUrl: "https://developers.hubspot.com/docs/api/overview",
        capabilities: {
            authMode: "oauth2",
            supportsWebhooks: true,
            supportsIncrementalPull: true,
            supportsDeals: true,
            supportsRevoke: true,
            rateLimitPerHour: 40_000,
            pageSizeStandard: 100,
            pageSizeLarge: 100,
            pollIntervalStandardMs: 10 * 60_000,
            pollIntervalLargeMs: 3 * 60_000,
            requiredScopes: ["crm.objects.contacts.read", "crm.objects.deals.read"],
        },
    },
    pipedrive: {
        key: "pipedrive",
        displayName: "Pipedrive",
        authMode: "oauth2",
        availability: "available",
        docsUrl: "https://developers.pipedrive.com/docs/api/v1",
        capabilities: {
            authMode: "oauth2",
            supportsWebhooks: true,
            supportsIncrementalPull: true,
            supportsDeals: true,
            supportsRevoke: true,
            rateLimitPerHour: 40_000,
            pageSizeStandard: 100,
            pageSizeLarge: 500,
            pollIntervalStandardMs: 10 * 60_000,
            pollIntervalLargeMs: 3 * 60_000,
        },
    },
    salesforce: {
        key: "salesforce",
        displayName: "Salesforce",
        authMode: "oauth2",
        availability: "available",
        docsUrl: "https://developer.salesforce.com/docs/apis",
        capabilities: {
            authMode: "oauth2",
            supportsWebhooks: false,
            supportsIncrementalPull: true,
            supportsDeals: true,
            supportsRevoke: true,
            rateLimitPerHour: 100_000,
            pageSizeStandard: 200,
            pageSizeLarge: 500,
            pollIntervalStandardMs: 10 * 60_000,
            pollIntervalLargeMs: 3 * 60_000,
        },
    },
    sellsy: {
        key: "sellsy",
        displayName: "Sellsy",
        authMode: "oauth2",
        availability: "available",
        docsUrl: "https://api.sellsy.com/doc/v2/",
        capabilities: {
            authMode: "oauth2",
            supportsWebhooks: true,
            supportsIncrementalPull: true,
            supportsDeals: true,
            supportsRevoke: false,
            rateLimitPerHour: 3_600,
            pageSizeStandard: 100,
            pageSizeLarge: 200,
            pollIntervalStandardMs: 10 * 60_000,
            pollIntervalLargeMs: 3 * 60_000,
        },
    },
    axonaut: {
        key: "axonaut",
        displayName: "Axonaut",
        authMode: "apiKey",
        availability: "available",
        docsUrl: "https://axonaut.com/api/v2/doc",
        capabilities: {
            authMode: "apiKey",
            supportsWebhooks: true,
            supportsIncrementalPull: true,
            supportsDeals: true,
            supportsRevoke: false,
            rateLimitPerHour: 1_000,
            pageSizeStandard: 50,
            pageSizeLarge: 100,
            pollIntervalStandardMs: 10 * 60_000,
            pollIntervalLargeMs: 3 * 60_000,
        },
    },
    nocrm: {
        key: "nocrm",
        displayName: "noCRM.io",
        authMode: "apiKey",
        availability: "available",
        docsUrl: "https://nocrm.io/help/api/",
        capabilities: {
            authMode: "apiKey",
            supportsWebhooks: false,
            supportsIncrementalPull: true,
            supportsDeals: false,
            supportsRevoke: false,
            rateLimitPerHour: 3_600,
            pageSizeStandard: 50,
            pageSizeLarge: 100,
            pollIntervalStandardMs: 10 * 60_000,
            pollIntervalLargeMs: 3 * 60_000,
        },
    },
};

export function listProviders(): ProviderInfo[] {
    return Object.values(PROVIDER_INFO);
}

export function getProviderInfo(provider: CRMProvider): ProviderInfo {
    return PROVIDER_INFO[provider];
}
