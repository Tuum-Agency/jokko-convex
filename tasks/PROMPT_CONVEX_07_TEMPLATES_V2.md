# 📝 PROMPT CONVEX 07 - Templates WhatsApp Business (Complet V2)

> Guide d'implémentation pour Claude - Gestion complète des templates
> WhatsApp Business API avec Convex, inspiré de Twilio.
> Tous les types : Text, Media, Interactive, Carousel, Catalog, 
> Authentication, Location, Multi-Product, Limited-Time Offer, Coupon.
> 
> 🔗 **Dépend de :** PROMPT_CONVEX_00 (Architecture), PROMPT_CONVEX_04 (Onboarding WhatsApp)
> 📚 **Documentation Convex:** https://docs.convex.dev/
> 📚 **Meta Templates API:** https://developers.facebook.com/docs/whatsapp/business-management-api/message-templates
> 📚 **Twilio WhatsApp Templates:** https://www.twilio.com/docs/whatsapp/tutorial/send-whatsapp-notification-messages-templates

---

## 📋 Vue d'Ensemble des Types de Templates

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                    TYPES DE TEMPLATES WHATSAPP                               ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  ┌─────────────────────────────────────────────────────────────────────────┐ ║
║  │                         TEMPLATES DE BASE                               │ ║
║  ├─────────────────────────────────────────────────────────────────────────┤ ║
║  │                                                                         │ ║
║  │  📝 TEXT                    🖼️ MEDIA                   🔐 AUTHENTICATION │ ║
║  │  ─────────────              ─────────────              ───────────────── │ ║
║  │  Texte simple               Image, Video,             Code OTP          │ ║
║  │  avec variables             Document, Audio           Bouton copier     │ ║
║  │                                                                         │ ║
║  └─────────────────────────────────────────────────────────────────────────┘ ║
║                                                                              ║
║  ┌─────────────────────────────────────────────────────────────────────────┐ ║
║  │                       TEMPLATES INTERACTIFS                             │ ║
║  ├─────────────────────────────────────────────────────────────────────────┤ ║
║  │                                                                         │ ║
║  │  🔘 QUICK REPLY             🔗 CALL-TO-ACTION         📋 LIST           │ ║
║  │  ─────────────              ─────────────────         ─────────────     │ ║
║  │  Boutons réponse            URL / Téléphone           Menu déroulant    │ ║
║  │  rapide (max 3)             (max 2)                   avec sections     │ ║
║  │                                                                         │ ║
║  │  🎠 CAROUSEL                📍 LOCATION               ⏰ LIMITED-TIME   │ ║
║  │  ─────────────              ─────────────             ─────────────     │ ║
║  │  Plusieurs cartes           Envoyer position          Offre limitée     │ ║
║  │  scrollables (2-10)         ou demander               avec countdown    │ ║
║  │                                                                         │ ║
║  └─────────────────────────────────────────────────────────────────────────┘ ║
║                                                                              ║
║  ┌─────────────────────────────────────────────────────────────────────────┐ ║
║  │                       TEMPLATES E-COMMERCE                              │ ║
║  ├─────────────────────────────────────────────────────────────────────────┤ ║
║  │                                                                         │ ║
║  │  🛒 CATALOG                 📦 SINGLE PRODUCT         📦📦 MULTI-PRODUCT │ ║
║  │  ─────────────              ──────────────            ────────────────  │ ║
║  │  Lien vers                  Un seul produit           Plusieurs         │ ║
║  │  catalogue complet          du catalogue              produits (max 30) │ ║
║  │                                                                         │ ║
║  │  🧾 ORDER DETAILS           📊 ORDER STATUS                             │ ║
║  │  ─────────────              ──────────────                              │ ║
║  │  Détails commande           Suivi expédition                            │ ║
║  │  avec produits              (shipped, etc.)                             │ ║
║  │                                                                         │ ║
║  └─────────────────────────────────────────────────────────────────────────┘ ║
║                                                                              ║
║  ┌─────────────────────────────────────────────────────────────────────────┐ ║
║  │                       TEMPLATES AVANCÉS                                 │ ║
║  ├─────────────────────────────────────────────────────────────────────────┤ ║
║  │                                                                         │ ║
║  │  🎠 CAROUSEL                📍 LOCATION               ⏰ LIMITED-TIME   │ ║
║  │  ─────────────              ─────────────             ─────────────     │ ║
║  │  Plusieurs cartes           Envoyer position          Offre limitée     │ ║
║  │  scrollables (2-10)         ou demander               avec countdown    │ ║
║  │                                                                         │ ║
║  │  🎟️ COUPON                  🔐 AUTHENTICATION                           │ ║
║  │  ─────────────              ─────────────                               │ ║
║  │  Code promo                 Code OTP                                    │ ║
║  │  avec copie auto            avec copie auto                             │ ║
║  │                                                                         │ ║
║  └─────────────────────────────────────────────────────────────────────────┘ ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## 🎯 Matrice Complète des Types

| Type | Catégorie | Header | Body | Footer | Buttons | Use Case |
|------|-----------|--------|------|--------|---------|----------|
| **TEXT** | UTILITY/MARKETING | ❌ | ✅ Texte + vars | ✅ | ❌ | Notifications |
| **MEDIA** | UTILITY/MARKETING | 🖼️/🎬/📄/🔊 | ✅ | ✅ | ❌ | Promos visuelles |
| **QUICK_REPLY** | UTILITY/MARKETING | Optionnel | ✅ | ✅ | 3 QR max | Sondages |
| **CALL_TO_ACTION** | UTILITY/MARKETING | Optionnel | ✅ | ✅ | URL+Phone | Réservations |
| **LIST** | UTILITY/MARKETING | TEXT | ✅ | ✅ | Menu | Menus, options |
| **AUTHENTICATION** | AUTH | ❌ | OTP {{1}} | ❌ | COPY_CODE | Vérification |
| **CAROUSEL** | MARKETING | ❌ | ✅ intro | ❌ | 2/carte | Produits |
| **CATALOG** | MARKETING | ❌ | ✅ | ✅ | VIEW_CATALOG | E-commerce |
| **SINGLE_PRODUCT** | UTILITY/MKTG | Produit auto | ✅ | ✅ | VIEW_PRODUCT | Confirmation |
| **MULTI_PRODUCT** | MARKETING | TEXT | ✅ | ✅ | VIEW_PRODUCTS | Recommandations |
| **LOCATION** | UTILITY | ❌ | ✅ | ❌ | ❌ | Livraison |
| **LIMITED_TIME_OFFER** | MARKETING | 🖼️/🎬 required | ✅ | ❌ | CTA + Timer | Flash sales |
| **COUPON** | MARKETING | Optionnel | ✅ | ❌ | COPY_CODE | Promos |
| **AUTHENTICATION** | AUTH | ❌ | OTP {{1}} | ❌ | COPY/OTP | Vérification |
| **ORDER_DETAILS** | UTILITY | ❌ | Order JSON | ❌ | Track URL | Confirmation |
| **ORDER_STATUS** | UTILITY | ❌ | Status JSON | ❌ | Track URL | Suivi |

---

## 📁 Structure des Fichiers

```
convex/
├── schema.ts                       # Tables templates complet
├── templates/
│   ├── index.ts                    # Re-exports
│   ├── queries.ts                  # Queries communes
│   ├── mutations.ts                # Mutations communes  
│   ├── actions.ts                  # Actions Meta API
│   └── types/
│       ├── text.ts                 # Text + Media
│       ├── interactive.ts          # Quick Reply, CTA, List
│       ├── authentication.ts       # OTP templates
│       ├── carousel.ts             # Carousel (2-10 cartes)
│       ├── catalog.ts              # Catalog, Single, Multi Product
│       ├── location.ts             # Location request/send
│       ├── limitedTimeOffer.ts     # LTO avec countdown
│       ├── coupon.ts               # Coupons/promo codes
│       └── order.ts                # Order details/status
├── lib/
│   ├── templateTypes.ts            # Types & Configs
│   ├── templateValidation.ts       # Validation par type
│   └── templateBuilder.ts          # Payload Meta builder
└── http.ts                         # Webhooks

src/
├── components/
│   └── templates/
│       ├── TemplateTypeSelector.tsx  # Sélection type
│       ├── TemplateBuilder.tsx       # Builder principal
│       ├── TemplateList.tsx          # Liste temps réel
│       ├── builders/                 # Builder par type
│       │   ├── TextBuilder.tsx
│       │   ├── MediaBuilder.tsx
│       │   ├── QuickReplyBuilder.tsx
│       │   ├── CTABuilder.tsx
│       │   ├── ListBuilder.tsx
│       │   ├── CarouselBuilder.tsx
│       │   ├── CatalogBuilder.tsx
│       │   ├── ProductBuilder.tsx
│       │   ├── LocationBuilder.tsx
│       │   ├── LTOBuilder.tsx
│       │   ├── CouponBuilder.tsx
│       │   ├── AuthBuilder.tsx
│       │   └── OrderBuilder.tsx
│       └── previews/                 # Preview par type
│           ├── BasePreview.tsx
│           ├── CarouselPreview.tsx
│           ├── ListPreview.tsx
│           ├── ProductPreview.tsx
│           ├── LTOPreview.tsx
│           └── OrderPreview.tsx
└── hooks/
    └── useTemplateBuilder.ts
```

---

## 🗄️ ÉTAPE 1 : Schéma Convex Complet

```typescript
/**
 * convex/schema.ts - Templates WhatsApp Complet
 */

import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

// ============================================
// VALIDATORS
// ============================================

// Types de templates supportés
const templateType = v.union(
  // Base
  v.literal('TEXT'),
  v.literal('MEDIA'),
  // Interactive
  v.literal('QUICK_REPLY'),
  v.literal('CALL_TO_ACTION'),
  v.literal('LIST'),
  // E-commerce
  v.literal('CATALOG'),
  v.literal('SINGLE_PRODUCT'),
  v.literal('MULTI_PRODUCT'),
  v.literal('ORDER_DETAILS'),
  v.literal('ORDER_STATUS'),
  // Advanced
  v.literal('CAROUSEL'),
  v.literal('LOCATION'),
  v.literal('LIMITED_TIME_OFFER'),
  v.literal('COUPON'),
  v.literal('AUTHENTICATION')
)

const templateCategory = v.union(
  v.literal('MARKETING'),
  v.literal('UTILITY'),
  v.literal('AUTHENTICATION')
)

const templateStatus = v.union(
  v.literal('DRAFT'),
  v.literal('PENDING'),
  v.literal('APPROVED'),
  v.literal('REJECTED'),
  v.literal('PAUSED'),
  v.literal('DISABLED'),
  v.literal('IN_APPEAL'),
  v.literal('PENDING_DELETION'),
  v.literal('DELETED')
)

const headerType = v.union(
  v.literal('NONE'),
  v.literal('TEXT'),
  v.literal('IMAGE'),
  v.literal('VIDEO'),
  v.literal('DOCUMENT'),
  v.literal('LOCATION')
)

const buttonType = v.union(
  v.literal('QUICK_REPLY'),
  v.literal('URL'),
  v.literal('PHONE_NUMBER'),
  v.literal('COPY_CODE'),
  v.literal('VOICE_CALL'),
  v.literal('CATALOG'),
  v.literal('MPM'),
  v.literal('SPM'),
  v.literal('OTP')
)

// ============================================
// SCHEMA
// ============================================

export default defineSchema({
  // ... autres tables ...

  // ==========================================
  // TEMPLATES
  // ==========================================
  templates: defineTable({
    organizationId: v.id('organizations'),
    whatsappConfigId: v.optional(v.id('whatsappConfigs')),

    // Meta IDs
    metaTemplateId: v.optional(v.string()),
    metaTemplateName: v.optional(v.string()),

    // Base info
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    
    // Type & Category
    type: templateType,
    category: templateCategory,
    language: v.string(),
    
    // Allow category change (Meta can suggest different category)
    allowCategoryChange: v.optional(v.boolean()),

    // ========== COMMON COMPONENTS ==========
    
    // Header
    header: v.optional(v.object({
      type: headerType,
      text: v.optional(v.string()),
      mediaUrl: v.optional(v.string()),
      mediaStorageId: v.optional(v.id('_storage')),
      mediaHandle: v.optional(v.string()), // Meta media handle
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
    })),

    // Body
    body: v.optional(v.string()),
    bodyExamples: v.optional(v.array(v.string())),

    // Footer
    footer: v.optional(v.string()),

    // Buttons
    buttons: v.optional(v.array(v.object({
      type: buttonType,
      text: v.string(),
      // URL button
      url: v.optional(v.string()),
      urlSuffix: v.optional(v.string()), // Dynamic part {{1}}
      // Phone button
      phoneNumber: v.optional(v.string()),
      // Quick reply
      payload: v.optional(v.string()),
      // Catalog/Product
      catalogId: v.optional(v.string()),
      productRetailerId: v.optional(v.string()),
    }))),

    // ========== TYPE-SPECIFIC CONFIGS ==========

    // CAROUSEL (2-10 cards)
    carouselCards: v.optional(v.array(v.object({
      header: v.object({
        type: v.union(v.literal('IMAGE'), v.literal('VIDEO')),
        mediaUrl: v.optional(v.string()),
        mediaStorageId: v.optional(v.id('_storage')),
        mediaHandle: v.optional(v.string()),
      }),
      body: v.string(),
      bodyExamples: v.optional(v.array(v.string())),
      buttons: v.array(v.object({
        type: buttonType,
        text: v.string(),
        url: v.optional(v.string()),
        urlSuffix: v.optional(v.string()),
        phoneNumber: v.optional(v.string()),
        payload: v.optional(v.string()),
      })),
    }))),

    // CATALOG / PRODUCTS
    catalogConfig: v.optional(v.object({
      catalogId: v.string(),
      // Single product
      productRetailerId: v.optional(v.string()),
      // Multi product (sections)
      sections: v.optional(v.array(v.object({
        title: v.string(),
        productRetailerIds: v.array(v.string()),
      }))),
      // Thumbnail product (for header)
      thumbnailProductRetailerId: v.optional(v.string()),
    })),

    // LIST (interactive list message)
    listConfig: v.optional(v.object({
      buttonText: v.string(), // Max 20 chars
      sections: v.array(v.object({
        title: v.optional(v.string()), // Max 24 chars
        rows: v.array(v.object({
          id: v.string(),
          title: v.string(), // Max 24 chars
          description: v.optional(v.string()), // Max 72 chars
        })),
      })),
    })),

    // LOCATION
    locationConfig: v.optional(v.object({
      action: v.union(v.literal('send'), v.literal('request')),
      // For send
      location: v.optional(v.object({
        latitude: v.number(),
        longitude: v.number(),
        name: v.optional(v.string()),
        address: v.optional(v.string()),
      })),
    })),

    // LIMITED TIME OFFER
    ltoConfig: v.optional(v.object({
      hasExpiration: v.boolean(),
      expirationTimeMs: v.optional(v.number()), // Unix timestamp
      offerCode: v.optional(v.string()),
    })),

    // COUPON
    couponConfig: v.optional(v.object({
      couponCode: v.string(),
      // Auto-generated button to copy code
    })),

    // AUTHENTICATION (OTP)
    authConfig: v.optional(v.object({
      codeExpirationMinutes: v.optional(v.number()), // 1-90
      addSecurityRecommendation: v.optional(v.boolean()),
      // One-tap autofill (Android only)
      enableOneTapAutofill: v.optional(v.boolean()),
      packageName: v.optional(v.string()), // Android package
      signatureHash: v.optional(v.string()), // App signature
      // Zero-tap (for eligible businesses)
      enableZeroTap: v.optional(v.boolean()),
    })),

    // ORDER DETAILS / ORDER STATUS
    orderConfig: v.optional(v.object({
      // Type of order message
      orderType: v.union(
        v.literal('order_details'),
        v.literal('order_status')
      ),
      // Reference
      referenceId: v.optional(v.string()),
      // Status (for order_status)
      status: v.optional(v.union(
        v.literal('pending'),
        v.literal('processing'),
        v.literal('shipped'),
        v.literal('delivered'),
        v.literal('completed'),
        v.literal('canceled'),
        v.literal('refunded')
      )),
      // Tracking
      trackingUrl: v.optional(v.string()),
      carrier: v.optional(v.string()),
      trackingNumber: v.optional(v.string()),
      // Payment
      paymentStatus: v.optional(v.union(
        v.literal('pending'),
        v.literal('paid'),
        v.literal('failed'),
        v.literal('refunded')
      )),
    })),

    // ========== STATUS & QUALITY ==========
    
    status: templateStatus,
    statusMessage: v.optional(v.string()),
    rejectedReason: v.optional(v.string()),
    qualityScore: v.optional(v.union(
      v.literal('GREEN'),
      v.literal('YELLOW'),
      v.literal('RED'),
      v.literal('UNKNOWN')
    )),

    // ========== STATISTICS ==========
    
    sentCount: v.number(),
    deliveredCount: v.number(),
    readCount: v.number(),
    repliedCount: v.number(),
    clickedCount: v.number(),
    convertedCount: v.number(),
    failedCount: v.number(),
    blockedCount: v.number(),

    // ========== TIMESTAMPS ==========
    
    lastSyncedAt: v.optional(v.number()),
    lastUsedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_organization', ['organizationId'])
    .index('by_org_and_status', ['organizationId', 'status'])
    .index('by_org_and_type', ['organizationId', 'type'])
    .index('by_org_and_category', ['organizationId', 'category'])
    .index('by_org_slug_lang', ['organizationId', 'slug', 'language'])
    .index('by_metaTemplateId', ['metaTemplateId'])
    .searchIndex('search_templates', {
      searchField: 'name',
      filterFields: ['organizationId', 'status', 'type', 'category'],
    }),

  // ==========================================
  // TEMPLATE SUBMISSIONS (Audit Log)
  // ==========================================
  templateSubmissions: defineTable({
    templateId: v.id('templates'),
    action: v.union(
      v.literal('CREATE'),
      v.literal('UPDATE'),
      v.literal('DELETE'),
      v.literal('APPEAL')
    ),
    payload: v.any(),
    metaResponse: v.optional(v.any()),
    metaTemplateId: v.optional(v.string()),
    success: v.boolean(),
    errorCode: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
    submittedByMemberId: v.optional(v.id('members')),
    createdAt: v.number(),
  })
    .index('by_template', ['templateId'])
    .index('by_createdAt', ['createdAt']),

  // ==========================================
  // TEMPLATE ANALYTICS (Daily)
  // ==========================================
  templateAnalytics: defineTable({
    templateId: v.id('templates'),
    date: v.string(), // YYYY-MM-DD
    
    // Counts
    sent: v.number(),
    delivered: v.number(),
    read: v.number(),
    replied: v.number(),
    clicked: v.number(),
    converted: v.number(),
    failed: v.number(),
    blocked: v.number(),
    
    // Costs (in cents)
    totalCost: v.optional(v.number()),
    
    // Breakdown by button (for CTA, carousel)
    buttonClicks: v.optional(v.array(v.object({
      buttonIndex: v.number(),
      buttonText: v.string(),
      clicks: v.number(),
    }))),
    
    // Breakdown by card (for carousel)
    cardMetrics: v.optional(v.array(v.object({
      cardIndex: v.number(),
      views: v.number(),
      clicks: v.number(),
    }))),
    
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_template', ['templateId'])
    .index('by_template_date', ['templateId', 'date']),

  // ==========================================
  // TEMPLATE VARIABLES (for complex templates)
  // ==========================================
  templateVariables: defineTable({
    templateId: v.id('templates'),
    
    // Variable info
    index: v.number(), // {{1}}, {{2}}, etc.
    name: v.string(), // Human readable: "customer_name"
    description: v.optional(v.string()),
    
    // Type hint for UI
    dataType: v.union(
      v.literal('text'),
      v.literal('currency'),
      v.literal('date'),
      v.literal('datetime'),
      v.literal('phone'),
      v.literal('url'),
      v.literal('image_url'),
      v.literal('video_url'),
      v.literal('document_url')
    ),
    
    // Default/example value
    defaultValue: v.optional(v.string()),
    example: v.string(),
    
    // Validation
    required: v.boolean(),
    maxLength: v.optional(v.number()),
    pattern: v.optional(v.string()), // Regex
    
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_template', ['templateId'])
    .index('by_template_index', ['templateId', 'index']),
})
```

---

## 📝 ÉTAPE 2 : Types et Configurations Complètes

```typescript
/**
 * convex/lib/templateTypes.ts
 */

// ============================================
// ENUMS
// ============================================

export type TemplateType =
  | 'TEXT'
  | 'MEDIA'
  | 'QUICK_REPLY'
  | 'CALL_TO_ACTION'
  | 'LIST'
  | 'CATALOG'
  | 'SINGLE_PRODUCT'
  | 'MULTI_PRODUCT'
  | 'ORDER_DETAILS'
  | 'ORDER_STATUS'
  | 'CAROUSEL'
  | 'LOCATION'
  | 'LIMITED_TIME_OFFER'
  | 'COUPON'
  | 'AUTHENTICATION'

export type TemplateCategory = 'MARKETING' | 'UTILITY' | 'AUTHENTICATION'

export type TemplateStatus = 
  | 'DRAFT' 
  | 'PENDING' 
  | 'APPROVED' 
  | 'REJECTED' 
  | 'PAUSED' 
  | 'DISABLED'
  | 'IN_APPEAL'
  | 'PENDING_DELETION'
  | 'DELETED'

export type HeaderType = 'NONE' | 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'LOCATION'

export type ButtonType =
  | 'QUICK_REPLY'
  | 'URL'
  | 'PHONE_NUMBER'
  | 'COPY_CODE'
  | 'VOICE_CALL'
  | 'CATALOG'
  | 'MPM'
  | 'SPM'
  | 'OTP'

export type QualityScore = 'GREEN' | 'YELLOW' | 'RED' | 'UNKNOWN'

// ============================================
// TEMPLATE TYPE CONFIG
// ============================================

export interface TemplateTypeConfig {
  type: TemplateType
  label: string
  labelFr: string
  description: string
  descriptionFr: string
  icon: string
  categories: TemplateCategory[]
  features: {
    hasHeader: boolean
    headerTypes: HeaderType[]
    headerRequired: boolean
    hasBody: boolean
    bodyRequired: boolean
    hasFooter: boolean
    hasButtons: boolean
    buttonTypes: ButtonType[]
    maxButtons: number
    minButtons: number
    hasSpecialConfig: boolean
  }
  limits: {
    headerTextMax?: number
    headerTextVarsMax?: number
    bodyMin: number
    bodyMax: number
    bodyVarsMax: number
    footerMax?: number
    buttonTextMax: number
  }
  metaSupport: boolean
  twilioName?: string // Twilio equivalent name
}

export const TEMPLATE_TYPE_CONFIGS: Record<TemplateType, TemplateTypeConfig> = {
  // ==========================================
  // BASE TEMPLATES
  // ==========================================
  TEXT: {
    type: 'TEXT',
    label: 'Text',
    labelFr: 'Texte Simple',
    description: 'Simple text message with variables',
    descriptionFr: 'Message texte simple avec variables',
    icon: '📝',
    categories: ['UTILITY', 'MARKETING'],
    features: {
      hasHeader: false,
      headerTypes: [],
      headerRequired: false,
      hasBody: true,
      bodyRequired: true,
      hasFooter: true,
      hasButtons: false,
      buttonTypes: [],
      maxButtons: 0,
      minButtons: 0,
      hasSpecialConfig: false,
    },
    limits: {
      bodyMin: 1,
      bodyMax: 1024,
      bodyVarsMax: 10,
      footerMax: 60,
      buttonTextMax: 25,
    },
    metaSupport: true,
    twilioName: 'twilio/text',
  },

  MEDIA: {
    type: 'MEDIA',
    label: 'Media',
    labelFr: 'Média',
    description: 'Image, video, document or audio with text',
    descriptionFr: 'Image, vidéo, document ou audio avec texte',
    icon: '🖼️',
    categories: ['UTILITY', 'MARKETING'],
    features: {
      hasHeader: true,
      headerTypes: ['IMAGE', 'VIDEO', 'DOCUMENT'],
      headerRequired: true,
      hasBody: true,
      bodyRequired: true,
      hasFooter: true,
      hasButtons: false,
      buttonTypes: [],
      maxButtons: 0,
      minButtons: 0,
      hasSpecialConfig: false,
    },
    limits: {
      bodyMin: 1,
      bodyMax: 1024,
      bodyVarsMax: 10,
      footerMax: 60,
      buttonTextMax: 25,
    },
    metaSupport: true,
    twilioName: 'twilio/media',
  },

  // ==========================================
  // INTERACTIVE TEMPLATES
  // ==========================================
  QUICK_REPLY: {
    type: 'QUICK_REPLY',
    label: 'Quick Reply',
    labelFr: 'Réponse Rapide',
    description: 'Message with quick reply buttons',
    descriptionFr: 'Message avec boutons de réponse rapide',
    icon: '🔘',
    categories: ['UTILITY', 'MARKETING'],
    features: {
      hasHeader: true,
      headerTypes: ['NONE', 'TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT'],
      headerRequired: false,
      hasBody: true,
      bodyRequired: true,
      hasFooter: true,
      hasButtons: true,
      buttonTypes: ['QUICK_REPLY'],
      maxButtons: 3,
      minButtons: 1,
      hasSpecialConfig: false,
    },
    limits: {
      headerTextMax: 60,
      headerTextVarsMax: 1,
      bodyMin: 1,
      bodyMax: 1024,
      bodyVarsMax: 10,
      footerMax: 60,
      buttonTextMax: 25,
    },
    metaSupport: true,
    twilioName: 'twilio/quick-reply',
  },

  CALL_TO_ACTION: {
    type: 'CALL_TO_ACTION',
    label: 'Call to Action',
    labelFr: 'Appel à l\'Action',
    description: 'Message with URL and/or phone buttons',
    descriptionFr: 'Message avec boutons URL et/ou téléphone',
    icon: '🔗',
    categories: ['UTILITY', 'MARKETING'],
    features: {
      hasHeader: true,
      headerTypes: ['NONE', 'TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT'],
      headerRequired: false,
      hasBody: true,
      bodyRequired: true,
      hasFooter: true,
      hasButtons: true,
      buttonTypes: ['URL', 'PHONE_NUMBER', 'VOICE_CALL'],
      maxButtons: 2,
      minButtons: 1,
      hasSpecialConfig: false,
    },
    limits: {
      headerTextMax: 60,
      headerTextVarsMax: 1,
      bodyMin: 1,
      bodyMax: 1024,
      bodyVarsMax: 10,
      footerMax: 60,
      buttonTextMax: 25,
    },
    metaSupport: true,
    twilioName: 'twilio/call-to-action',
  },

  LIST: {
    type: 'LIST',
    label: 'List',
    labelFr: 'Liste / Menu',
    description: 'Interactive list with sections and rows',
    descriptionFr: 'Liste interactive avec sections et options',
    icon: '📋',
    categories: ['UTILITY', 'MARKETING'],
    features: {
      hasHeader: true,
      headerTypes: ['NONE', 'TEXT'],
      headerRequired: false,
      hasBody: true,
      bodyRequired: true,
      hasFooter: true,
      hasButtons: false,
      buttonTypes: [],
      maxButtons: 0,
      minButtons: 0,
      hasSpecialConfig: true,
    },
    limits: {
      headerTextMax: 60,
      bodyMin: 1,
      bodyMax: 1024,
      bodyVarsMax: 10,
      footerMax: 60,
      buttonTextMax: 20, // List button
    },
    metaSupport: true,
    twilioName: 'twilio/list-picker',
  },

  // ==========================================
  // E-COMMERCE TEMPLATES
  // ==========================================
  CATALOG: {
    type: 'CATALOG',
    label: 'Catalog',
    labelFr: 'Catalogue',
    description: 'Link to your WhatsApp catalog',
    descriptionFr: 'Lien vers votre catalogue WhatsApp',
    icon: '🛒',
    categories: ['MARKETING'],
    features: {
      hasHeader: false,
      headerTypes: [],
      headerRequired: false,
      hasBody: true,
      bodyRequired: true,
      hasFooter: true,
      hasButtons: true,
      buttonTypes: ['CATALOG'],
      maxButtons: 1,
      minButtons: 1,
      hasSpecialConfig: true,
    },
    limits: {
      bodyMin: 1,
      bodyMax: 1024,
      bodyVarsMax: 10,
      footerMax: 60,
      buttonTextMax: 25,
    },
    metaSupport: true,
  },

  SINGLE_PRODUCT: {
    type: 'SINGLE_PRODUCT',
    label: 'Single Product',
    labelFr: 'Produit Unique',
    description: 'Display a single product from catalog',
    descriptionFr: 'Afficher un seul produit du catalogue',
    icon: '📦',
    categories: ['UTILITY', 'MARKETING'],
    features: {
      hasHeader: false, // Product image auto
      headerTypes: [],
      headerRequired: false,
      hasBody: true,
      bodyRequired: false, // Product description used
      hasFooter: true,
      hasButtons: true,
      buttonTypes: ['SPM'],
      maxButtons: 1,
      minButtons: 1,
      hasSpecialConfig: true,
    },
    limits: {
      bodyMin: 0,
      bodyMax: 1024,
      bodyVarsMax: 10,
      footerMax: 60,
      buttonTextMax: 25,
    },
    metaSupport: true,
    twilioName: 'twilio/catalog',
  },

  MULTI_PRODUCT: {
    type: 'MULTI_PRODUCT',
    label: 'Multi-Product',
    labelFr: 'Multi-Produits',
    description: 'Display multiple products in sections',
    descriptionFr: 'Afficher plusieurs produits en sections',
    icon: '📦📦',
    categories: ['MARKETING'],
    features: {
      hasHeader: true,
      headerTypes: ['TEXT'],
      headerRequired: true,
      hasBody: true,
      bodyRequired: true,
      hasFooter: true,
      hasButtons: true,
      buttonTypes: ['MPM'],
      maxButtons: 1,
      minButtons: 1,
      hasSpecialConfig: true,
    },
    limits: {
      headerTextMax: 60,
      bodyMin: 1,
      bodyMax: 1024,
      bodyVarsMax: 10,
      footerMax: 60,
      buttonTextMax: 25,
    },
    metaSupport: true,
  },

  ORDER_DETAILS: {
    type: 'ORDER_DETAILS',
    label: 'Order Details',
    labelFr: 'Détails Commande',
    description: 'Order confirmation with line items',
    descriptionFr: 'Confirmation de commande avec articles',
    icon: '🧾',
    categories: ['UTILITY'],
    features: {
      hasHeader: false,
      headerTypes: [],
      headerRequired: false,
      hasBody: true,
      bodyRequired: true,
      hasFooter: false,
      hasButtons: true,
      buttonTypes: ['URL'],
      maxButtons: 1,
      minButtons: 0,
      hasSpecialConfig: true,
    },
    limits: {
      bodyMin: 1,
      bodyMax: 1024,
      bodyVarsMax: 10,
      buttonTextMax: 25,
    },
    metaSupport: true,
  },

  ORDER_STATUS: {
    type: 'ORDER_STATUS',
    label: 'Order Status',
    labelFr: 'Statut Commande',
    description: 'Order status update with tracking',
    descriptionFr: 'Mise à jour du statut avec suivi',
    icon: '📊',
    categories: ['UTILITY'],
    features: {
      hasHeader: false,
      headerTypes: [],
      headerRequired: false,
      hasBody: true,
      bodyRequired: true,
      hasFooter: false,
      hasButtons: true,
      buttonTypes: ['URL'],
      maxButtons: 1,
      minButtons: 0,
      hasSpecialConfig: true,
    },
    limits: {
      bodyMin: 1,
      bodyMax: 1024,
      bodyVarsMax: 10,
      buttonTextMax: 25,
    },
    metaSupport: true,
  },

  // ==========================================
  // ADVANCED TEMPLATES
  // ==========================================
  CAROUSEL: {
    type: 'CAROUSEL',
    label: 'Carousel',
    labelFr: 'Carrousel',
    description: 'Scrollable cards with images (2-10)',
    descriptionFr: 'Cartes défilantes avec images (2-10)',
    icon: '🎠',
    categories: ['MARKETING'],
    features: {
      hasHeader: false,
      headerTypes: [],
      headerRequired: false,
      hasBody: true,
      bodyRequired: true, // Intro text
      hasFooter: false,
      hasButtons: true,
      buttonTypes: ['QUICK_REPLY', 'URL', 'PHONE_NUMBER'],
      maxButtons: 2, // Per card
      minButtons: 1,
      hasSpecialConfig: true,
    },
    limits: {
      bodyMin: 1,
      bodyMax: 1024,
      bodyVarsMax: 10,
      buttonTextMax: 25,
    },
    metaSupport: true,
    twilioName: 'twilio/carousel',
  },

  LOCATION: {
    type: 'LOCATION',
    label: 'Location',
    labelFr: 'Localisation',
    description: 'Send or request location',
    descriptionFr: 'Envoyer ou demander une position',
    icon: '📍',
    categories: ['UTILITY'],
    features: {
      hasHeader: false,
      headerTypes: [],
      headerRequired: false,
      hasBody: true,
      bodyRequired: true,
      hasFooter: false,
      hasButtons: false,
      buttonTypes: [],
      maxButtons: 0,
      minButtons: 0,
      hasSpecialConfig: true,
    },
    limits: {
      bodyMin: 1,
      bodyMax: 1024,
      bodyVarsMax: 10,
      buttonTextMax: 25,
    },
    metaSupport: true,
    twilioName: 'twilio/location',
  },

  LIMITED_TIME_OFFER: {
    type: 'LIMITED_TIME_OFFER',
    label: 'Limited Time Offer',
    labelFr: 'Offre Limitée',
    description: 'Promotional offer with expiration',
    descriptionFr: 'Offre promotionnelle avec expiration',
    icon: '⏰',
    categories: ['MARKETING'],
    features: {
      hasHeader: true,
      headerTypes: ['IMAGE', 'VIDEO'],
      headerRequired: true,
      hasBody: true,
      bodyRequired: true,
      hasFooter: false,
      hasButtons: true,
      buttonTypes: ['URL', 'QUICK_REPLY', 'COPY_CODE'],
      maxButtons: 2,
      minButtons: 1,
      hasSpecialConfig: true,
    },
    limits: {
      bodyMin: 1,
      bodyMax: 1024,
      bodyVarsMax: 10,
      buttonTextMax: 25,
    },
    metaSupport: true,
  },

  COUPON: {
    type: 'COUPON',
    label: 'Coupon',
    labelFr: 'Code Promo',
    description: 'Promotional code with copy button',
    descriptionFr: 'Code promotionnel avec bouton copier',
    icon: '🎟️',
    categories: ['MARKETING'],
    features: {
      hasHeader: true,
      headerTypes: ['NONE', 'IMAGE', 'VIDEO'],
      headerRequired: false,
      hasBody: true,
      bodyRequired: true,
      hasFooter: false,
      hasButtons: true,
      buttonTypes: ['COPY_CODE'],
      maxButtons: 1,
      minButtons: 1,
      hasSpecialConfig: true,
    },
    limits: {
      bodyMin: 1,
      bodyMax: 1024,
      bodyVarsMax: 10,
      buttonTextMax: 25,
    },
    metaSupport: true,
  },

  AUTHENTICATION: {
    type: 'AUTHENTICATION',
    label: 'Authentication',
    labelFr: 'Authentification',
    description: 'OTP code with copy button',
    descriptionFr: 'Code OTP avec bouton copier',
    icon: '🔐',
    categories: ['AUTHENTICATION'],
    features: {
      hasHeader: false,
      headerTypes: [],
      headerRequired: false,
      hasBody: true,
      bodyRequired: true, // Contains {{1}} for OTP
      hasFooter: false,
      hasButtons: true,
      buttonTypes: ['OTP', 'COPY_CODE'],
      maxButtons: 1,
      minButtons: 1,
      hasSpecialConfig: true,
    },
    limits: {
      bodyMin: 1,
      bodyMax: 1024,
      bodyVarsMax: 1, // Only OTP variable
      buttonTextMax: 25,
    },
    metaSupport: true,
    twilioName: 'twilio/otp',
  },

}

// ============================================
// LANGUAGES
// ============================================

export const SUPPORTED_LANGUAGES = [
  // Main
  { code: 'fr', name: 'French', native: 'Français' },
  { code: 'en', name: 'English', native: 'English' },
  { code: 'en_US', name: 'English (US)', native: 'English (US)' },
  { code: 'en_GB', name: 'English (UK)', native: 'English (UK)' },
  
  // Africa
  { code: 'wo', name: 'Wolof', native: 'Wolof' },
  { code: 'sw', name: 'Swahili', native: 'Kiswahili' },
  { code: 'ha', name: 'Hausa', native: 'Hausa' },
  { code: 'yo', name: 'Yoruba', native: 'Yorùbá' },
  { code: 'ig', name: 'Igbo', native: 'Igbo' },
  { code: 'zu', name: 'Zulu', native: 'isiZulu' },
  { code: 'am', name: 'Amharic', native: 'አማርኛ' },
  
  // Arabic
  { code: 'ar', name: 'Arabic', native: 'العربية' },
  
  // Europe
  { code: 'es', name: 'Spanish', native: 'Español' },
  { code: 'es_MX', name: 'Spanish (Mexico)', native: 'Español (México)' },
  { code: 'pt_BR', name: 'Portuguese (BR)', native: 'Português (Brasil)' },
  { code: 'pt_PT', name: 'Portuguese (PT)', native: 'Português (Portugal)' },
  { code: 'de', name: 'German', native: 'Deutsch' },
  { code: 'it', name: 'Italian', native: 'Italiano' },
  { code: 'nl', name: 'Dutch', native: 'Nederlands' },
  { code: 'pl', name: 'Polish', native: 'Polski' },
  { code: 'ru', name: 'Russian', native: 'Русский' },
  { code: 'tr', name: 'Turkish', native: 'Türkçe' },
  
  // Asia
  { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  { code: 'id', name: 'Indonesian', native: 'Bahasa Indonesia' },
  { code: 'ms', name: 'Malay', native: 'Bahasa Melayu' },
  { code: 'th', name: 'Thai', native: 'ไทย' },
  { code: 'vi', name: 'Vietnamese', native: 'Tiếng Việt' },
  { code: 'zh_CN', name: 'Chinese (Simplified)', native: '简体中文' },
  { code: 'zh_TW', name: 'Chinese (Traditional)', native: '繁體中文' },
  { code: 'ja', name: 'Japanese', native: '日本語' },
  { code: 'ko', name: 'Korean', native: '한국어' },
] as const

export type LanguageCode = typeof SUPPORTED_LANGUAGES[number]['code']

// ============================================
// LIMITS
// ============================================

export const TEMPLATE_LIMITS = {
  carousel: {
    minCards: 2,
    maxCards: 10,
    cardBodyMax: 160,
    buttonsPerCard: 2,
  },
  list: {
    buttonTextMax: 20,
    maxSections: 10,
    maxRowsPerSection: 10,
    sectionTitleMax: 24,
    rowTitleMax: 24,
    rowDescMax: 72,
  },
  multiProduct: {
    maxProducts: 30,
    maxSections: 10,
  },
  authentication: {
    codeExpMin: 1,
    codeExpMax: 90,
  },
  general: {
    slugMax: 512,
    slugPattern: /^[a-z0-9_]+$/,
    headerTextMax: 60,
    headerTextVarsMax: 1,
    bodyMax: 1024,
    bodyVarsMax: 10,
    footerMax: 60,
    footerVars: 0,
    buttonTextMax: 25,
    urlMax: 2000,
  },
}

// ============================================
// GROUPING FOR UI
// ============================================

export const TEMPLATE_TYPE_GROUPS = [
  {
    id: 'base',
    title: 'Base Templates',
    titleFr: 'Templates de Base',
    description: 'Simple text and media messages',
    descriptionFr: 'Messages texte et média simples',
    types: ['TEXT', 'MEDIA'] as TemplateType[],
  },
  {
    id: 'interactive',
    title: 'Interactive',
    titleFr: 'Interactifs',
    description: 'Buttons, lists and quick replies',
    descriptionFr: 'Boutons, listes et réponses rapides',
    types: ['QUICK_REPLY', 'CALL_TO_ACTION', 'LIST'] as TemplateType[],
  },
  {
    id: 'ecommerce',
    title: 'E-commerce',
    titleFr: 'E-commerce',
    description: 'Catalogs, products and orders',
    descriptionFr: 'Catalogues, produits et commandes',
    types: ['CATALOG', 'SINGLE_PRODUCT', 'MULTI_PRODUCT', 'ORDER_DETAILS', 'ORDER_STATUS'] as TemplateType[],
  },
  {
    id: 'advanced',
    title: 'Advanced',
    titleFr: 'Avancés',
    description: 'Carousel, location, offers and more',
    descriptionFr: 'Carrousel, localisation, offres et plus',
    types: ['CAROUSEL', 'LOCATION', 'LIMITED_TIME_OFFER', 'COUPON', 'AUTHENTICATION'] as TemplateType[],
  },
]
```

---

## ✅ Résumé des 15 Types de Templates

| # | Type | Icon | Catégorie | Header | Body | Buttons | Config Spéciale |
|---|------|------|-----------|--------|------|---------|-----------------|
| 1 | TEXT | 📝 | UTILITY/MKTG | ❌ | ✅ | ❌ | - |
| 2 | MEDIA | 🖼️ | UTILITY/MKTG | 🖼️🎬📄 requis | ✅ | ❌ | - |
| 3 | QUICK_REPLY | 🔘 | UTILITY/MKTG | Optionnel | ✅ | 3 QR | - |
| 4 | CALL_TO_ACTION | 🔗 | UTILITY/MKTG | Optionnel | ✅ | 2 URL/Phone | - |
| 5 | LIST | 📋 | UTILITY/MKTG | TEXT opt | ✅ | Menu | listConfig |
| 6 | CATALOG | 🛒 | MARKETING | ❌ | ✅ | VIEW | catalogConfig |
| 7 | SINGLE_PRODUCT | 📦 | UTILITY/MKTG | Auto | Opt | VIEW | catalogConfig |
| 8 | MULTI_PRODUCT | 📦📦 | MARKETING | TEXT req | ✅ | VIEW | catalogConfig + sections |
| 9 | ORDER_DETAILS | 🧾 | UTILITY | ❌ | ✅ | URL opt | orderConfig |
| 10 | ORDER_STATUS | 📊 | UTILITY | ❌ | ✅ | URL opt | orderConfig |
| 11 | CAROUSEL | 🎠 | MARKETING | ❌ | ✅ intro | 2/carte | carouselCards (2-10) |
| 12 | LOCATION | 📍 | UTILITY | ❌ | ✅ | ❌ | locationConfig |
| 13 | LIMITED_TIME_OFFER | ⏰ | MARKETING | 🖼️🎬 req | ✅ | 2 CTA | ltoConfig |
| 14 | COUPON | 🎟️ | MARKETING | Optionnel | ✅ | COPY | couponConfig |
| 15 | AUTHENTICATION | 🔐 | AUTH | ❌ | OTP {{1}} | COPY/OTP | authConfig |

---

## 📊 Limites Officielles Meta

| Composant | Limite |
|-----------|--------|
| Slug/Name | 512 chars, `^[a-z0-9_]+$` |
| Header TEXT | 60 chars, 1 var max |
| Body | 1-1024 chars, 10 vars max |
| Footer | 60 chars, 0 vars |
| Bouton texte | 25 chars |
| URL | 2000 chars |
| Quick Reply | 3 max |
| URL buttons | 2 max |
| Phone buttons | 1 max |
| Carousel cartes | 2-10 |
| Carousel body/carte | 160 chars |
| List sections | 10 max |
| List rows/section | 10 max |
| Multi-product | 30 produits max |

---

[View PROMPT_CONVEX_07_TEMPLATES_V2.md](computer:///mnt/user-data/outputs/PROMPT_CONVEX_07_TEMPLATES_V2.md)
