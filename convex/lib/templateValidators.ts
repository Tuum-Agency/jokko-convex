/**
 * Typed Convex validators for template mutation args.
 * Extracted from the schema definitions to replace v.any() in templates/mutations.ts.
 */
import { v } from "convex/values";

export const headerValidator = v.optional(v.object({
    type: v.string(),
    text: v.optional(v.string()),
    mediaUrl: v.optional(v.string()),
    mediaStorageId: v.optional(v.id("_storage")),
    mediaHandle: v.optional(v.string()),
    location: v.optional(v.object({
        latitude: v.number(),
        longitude: v.number(),
        name: v.optional(v.string()),
        address: v.optional(v.string()),
    })),
    example: v.optional(v.object({
        text: v.optional(v.string()),
        mediaUrl: v.optional(v.string()),
    })),
}));

export const buttonsValidator = v.optional(v.array(v.object({
    type: v.string(),
    text: v.string(),
    url: v.optional(v.string()),
    urlSuffix: v.optional(v.string()),
    phoneNumber: v.optional(v.string()),
    payload: v.optional(v.string()),
    catalogId: v.optional(v.string()),
    productRetailerId: v.optional(v.string()),
})));

export const carouselCardsValidator = v.optional(v.array(v.object({
    header: v.object({
        type: v.string(),
        mediaUrl: v.optional(v.string()),
        mediaStorageId: v.optional(v.id("_storage")),
        mediaHandle: v.optional(v.string()),
    }),
    body: v.string(),
    bodyExamples: v.optional(v.array(v.string())),
    buttons: v.array(v.object({
        type: v.string(),
        text: v.string(),
        url: v.optional(v.string()),
        urlSuffix: v.optional(v.string()),
        phoneNumber: v.optional(v.string()),
        payload: v.optional(v.string()),
    })),
})));

export const catalogConfigValidator = v.optional(v.object({
    catalogId: v.string(),
    productRetailerId: v.optional(v.string()),
    sections: v.optional(v.array(v.object({
        title: v.string(),
        productRetailerIds: v.array(v.string()),
    }))),
    thumbnailProductRetailerId: v.optional(v.string()),
}));

export const listConfigValidator = v.optional(v.object({
    buttonText: v.string(),
    sections: v.array(v.object({
        title: v.optional(v.string()),
        rows: v.array(v.object({
            id: v.string(),
            title: v.string(),
            description: v.optional(v.string()),
        })),
    })),
}));

export const locationConfigValidator = v.optional(v.object({
    action: v.string(),
    location: v.optional(v.object({
        latitude: v.number(),
        longitude: v.number(),
        name: v.optional(v.string()),
        address: v.optional(v.string()),
    })),
}));

export const ltoConfigValidator = v.optional(v.object({
    hasExpiration: v.boolean(),
    expirationTimeMs: v.optional(v.number()),
    offerCode: v.optional(v.string()),
}));

export const couponConfigValidator = v.optional(v.object({
    couponCode: v.string(),
}));

export const authConfigValidator = v.optional(v.object({
    codeExpirationMinutes: v.optional(v.number()),
    addSecurityRecommendation: v.optional(v.boolean()),
    enableOneTapAutofill: v.optional(v.boolean()),
    packageName: v.optional(v.string()),
    signatureHash: v.optional(v.string()),
    enableZeroTap: v.optional(v.boolean()),
}));

export const orderConfigValidator = v.optional(v.object({
    orderType: v.string(),
    referenceId: v.optional(v.string()),
    status: v.optional(v.string()),
    trackingUrl: v.optional(v.string()),
    carrier: v.optional(v.string()),
    trackingNumber: v.optional(v.string()),
    paymentStatus: v.optional(v.string()),
}));

export const businessHoursValidator = v.object({
    enabled: v.boolean(),
    timezone: v.optional(v.string()),
    schedule: v.optional(v.array(v.object({
        day: v.string(),
        enabled: v.boolean(),
        start: v.optional(v.string()),
        end: v.optional(v.string()),
    }))),
});
