
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
