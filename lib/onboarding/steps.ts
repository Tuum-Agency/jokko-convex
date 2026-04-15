import { z } from 'zod';
import { LucideIcon, Building2, MessageCircle, CheckCircle, UtensilsCrossed, Store, ShoppingCart, Heart, GraduationCap, Home, Plane, Landmark, Laptop, Briefcase, MoreHorizontal } from 'lucide-react';

// ============================================
// TYPES
// ============================================

export type OnboardingStepKey =
    | 'BUSINESS_INFO'
    | 'PLAN_SELECT'
    | 'WHATSAPP_CONNECT'
    | 'COMPLETED';

export interface OnboardingStep {
    key: OnboardingStepKey;
    order: number;
    title: string;
    description: string;
    icon: string;
    isSkippable: boolean;
    validationSchema: z.ZodSchema | null;
}

// ============================================
// VALIDATION SCHEMAS
// ============================================

export const businessInfoSchema = z.object({
    businessName: z
        .string()
        .min(2, 'Le nom doit contenir au moins 2 caractères')
        .max(100, 'Le nom ne peut pas dépasser 100 caractères'),
    slug: z
        .string()
        .min(3, 'Le slug doit contenir au moins 3 caractères')
        .max(63, 'Le slug ne peut pas dépasser 63 caractères')
        .regex(
            /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/,
            'Uniquement lettres minuscules, chiffres et tirets (pas au début/fin)'
        ),
    businessSector: z.enum([
        'RESTAURANT',
        'RETAIL',
        'ECOMMERCE',
        'HEALTHCARE',
        'EDUCATION',
        'REAL_ESTATE',
        'TRAVEL',
        'FINANCE',
        'TECHNOLOGY',
        'SERVICES',
        'OTHER',
    ], { message: 'Veuillez sélectionner un secteur d\'activité' }),
    businessLogo: z.string().url().optional().nullable(),
    businessWebsite: z.string().url().optional().or(z.literal('')),
    businessPhone: z.string().optional(),
    timezone: z.string(),
    locale: z.enum(['fr', 'en']),
});

export const whatsappConnectSchema = z.object({
    phoneNumberId: z.string().min(1, 'Phone Number ID requis'),
    businessAccountId: z.string().min(1, 'Business Account ID requis'),
    accessToken: z.string().min(1, 'Access Token requis'),
});

// Export types inferred from schemas
export type BusinessInfoData = z.infer<typeof businessInfoSchema>;
export type WhatsAppConnectData = z.infer<typeof whatsappConnectSchema>;

// ============================================
// STEPS CONFIGURATION
// ============================================

export const ONBOARDING_STEPS: OnboardingStep[] = [
    {
        key: 'BUSINESS_INFO',
        order: 1,
        title: 'Informations Business',
        description: 'Configurez votre profil entreprise',
        icon: 'Building2',
        isSkippable: false,
        validationSchema: businessInfoSchema,
    },
    {
        key: 'PLAN_SELECT',
        order: 2,
        title: 'Choisir un plan',
        description: 'Sélectionnez le plan adapté à vos besoins',
        icon: 'CreditCard',
        isSkippable: false,
        validationSchema: null,
    },
    {
        key: 'WHATSAPP_CONNECT',
        order: 3,
        title: 'Connexion WhatsApp',
        description: 'Connectez votre numéro WhatsApp Business',
        icon: 'MessageCircle',
        isSkippable: true,
        validationSchema: whatsappConnectSchema,
    },
    {
        key: 'COMPLETED',
        order: 4,
        title: 'Terminé !',
        description: 'Votre espace est prêt',
        icon: 'CheckCircle',
        isSkippable: false,
        validationSchema: null,
    },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getStepByKey(key: OnboardingStepKey): OnboardingStep | undefined {
    return ONBOARDING_STEPS.find((step) => step.key === key);
}

export function getStepByOrder(order: number): OnboardingStep | undefined {
    return ONBOARDING_STEPS.find((step) => step.order === order);
}

export function getNextStep(currentKey: OnboardingStepKey): OnboardingStep | null {
    const current = getStepByKey(currentKey);
    if (!current) return null;
    return getStepByOrder(current.order + 1) || null;
}

export function getPreviousStep(currentKey: OnboardingStepKey): OnboardingStep | null {
    const current = getStepByKey(currentKey);
    if (!current || current.order === 1) return null;
    return getStepByOrder(current.order - 1) || null;
}

export function canGoBack(currentKey: OnboardingStepKey): boolean {
    const current = getStepByKey(currentKey);
    return current !== undefined && current.order > 1 && currentKey !== 'COMPLETED';
}

export function getProgressPercentage(currentKey: OnboardingStepKey): number {
    const current = getStepByKey(currentKey);
    if (!current) return 0;
    return Math.round((current.order / ONBOARDING_STEPS.length) * 100);
}

// ============================================
// BUSINESS SECTORS (for display)
// ============================================

export const BUSINESS_SECTORS = [
    { value: 'RESTAURANT', label: 'Restaurant / Food Service', icon: UtensilsCrossed },
    { value: 'RETAIL', label: 'Commerce de détail', icon: Store },
    { value: 'ECOMMERCE', label: 'E-commerce', icon: ShoppingCart },
    { value: 'HEALTHCARE', label: 'Santé', icon: Heart },
    { value: 'EDUCATION', label: 'Éducation', icon: GraduationCap },
    { value: 'REAL_ESTATE', label: 'Immobilier', icon: Home },
    { value: 'TRAVEL', label: 'Voyage / Tourisme', icon: Plane },
    { value: 'FINANCE', label: 'Finance / Assurance', icon: Landmark },
    { value: 'TECHNOLOGY', label: 'Technologie', icon: Laptop },
    { value: 'SERVICES', label: 'Services', icon: Briefcase },
    { value: 'OTHER', label: 'Autre', icon: MoreHorizontal },
] as const;

// ============================================
// TIMEZONES (common ones)
// ============================================

export const TIMEZONES = [
    { value: 'Africa/Dakar', label: '(GMT+0) Dakar' },
    { value: 'Africa/Lagos', label: '(GMT+1) Lagos' },
    { value: 'Africa/Johannesburg', label: '(GMT+2) Johannesburg' },
    { value: 'Africa/Casablanca', label: '(GMT+1) Casablanca' },
    { value: 'Africa/Abidjan', label: '(GMT+0) Abidjan' },
    { value: 'Europe/Paris', label: '(GMT+1) Paris' },
    { value: 'Europe/London', label: '(GMT+0) Londres' },
    { value: 'America/New_York', label: '(GMT-5) New York' },
    { value: 'America/Los_Angeles', label: '(GMT-8) Los Angeles' },
    { value: 'Asia/Dubai', label: '(GMT+4) Dubai' },
    { value: 'UTC', label: '(GMT+0) UTC' },
] as const;

// ============================================
// LANGUAGES
// ============================================

export const LANGUAGES = [
    { value: 'fr', label: 'Français' },
    { value: 'en', label: 'English' },
] as const;
