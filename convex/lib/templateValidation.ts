
import {
    TemplateType,
    TEMPLATE_TYPE_CONFIGS,
    TEMPLATE_LIMITS,
    TemplateTypeConfig
} from './templateTypes';

export interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
}

// Words that trigger "Marketing" classification (Should not be in Utility)
const MARKETING_KEYWORDS = [
    // FR
    'promo', 'promotion', 'solde', 'rabais', 'remise', 'réduction', '%', 'gratuit',
    'offert', 'cadeau', 'gagner', 'vente', 'acheter', 'commande', 'nouveau',
    'exclusif', 'lancement', 'découvrir', 'coupon', 'code', 'illimité',
    'offre', 'offres', 'meilleur prix', 'pas cher', 'moins cher',
    // EN
    'promo', 'sale', 'offer', 'discount', '% off', 'free', 'gift', 'win',
    'buy', 'shop', 'order', 'new', 'exclusive', 'launch', 'discover',
    'coupon', 'code', 'unlimited', 'best price', 'cheap', 'deal'
];

// Words that indicate abusive or high-risk content (Ban risk)
const RISK_KEYWORDS = [
    // Financial / Scam
    'crypto', 'bitcoin', 'investment', 'invest', 'loan', 'prêt', 'crédit',
    'bank account', 'compte bancaire', 'password', 'mot de passe', 'cvv',
    'card number', 'numéro de carte', 'social security', 'sécu',
    // Harassment
    'fuck', 'shit', 'merde', 'putain', 'connard', 'salope', 'idiot' // Basic filter
];

export function validateTemplate(data: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = []; // Potential rejection reasons but not strict errors
    const type = data.type as TemplateType;
    const config = TEMPLATE_TYPE_CONFIGS[type];
    const category = data.category as string;

    if (!config) {
        return { valid: false, errors: [`Invalid template type: ${type}`], warnings: [] };
    }

    // ============================================
    // 1. STRUCTURAL VALIDATION (Hard Errors)
    // ============================================

    if (!data.name || data.name.length > 512) {
        errors.push("Name is required and must be under 512 characters");
    }

    if (data.name && !TEMPLATE_LIMITS.general.slugPattern.test(data.name)) {
        errors.push("Name must contain only lowercase alphanumeric characters and underscores");
    }

    if (data.language && !/^[a-z]{2}(_[A-Z]{2})?$/.test(data.language)) {
        errors.push("Invalid language code format");
    }

    // Header Validation
    if (config.features.headerRequired && !data.header) {
        errors.push("Header is required for this template type");
    }

    if (data.header) {
        if (!config.features.headerTypes.includes(data.header.type)) {
            errors.push(`Header type ${data.header.type} is not allowed for ${type}`);
        }
        if (data.header.type === 'TEXT') {
            const text = data.header.text || "";
            if (text.length > TEMPLATE_LIMITS.general.headerTextMax) {
                errors.push(`Header text exceeds ${TEMPLATE_LIMITS.general.headerTextMax} characters`);
            }
            checkVariables(text, errors, warnings, "Header");
        }
    }

    // Body Validation
    if (config.features.bodyRequired) {
        if (!data.body) {
            errors.push("Body text is required");
        } else {
            if (data.body.length > TEMPLATE_LIMITS.general.bodyMax) {
                errors.push(`Body text exceeds ${TEMPLATE_LIMITS.general.bodyMax} characters`);
            }
            checkVariables(data.body, errors, warnings, "Body");
            checkPolicyContent(data.body, category, errors, warnings);
        }
    }

    // Footer Validation
    if (data.footer) {
        if (!config.features.hasFooter) {
            errors.push("Footer is not allowed for this template type");
        } else if (data.footer.length > TEMPLATE_LIMITS.general.footerMax) {
            errors.push(`Footer text exceeds ${TEMPLATE_LIMITS.general.footerMax} characters`);
        }
    }

    // Buttons Validation
    if (data.buttons && data.buttons.length > 0) {
        if (!config.features.hasButtons) {
            errors.push("Buttons are not allowed for this template type");
        }
        if (data.buttons.length > config.features.maxButtons) {
            errors.push(`Too many buttons. Max allowed: ${config.features.maxButtons}`);
        }

        data.buttons.forEach((btn: any, index: number) => {
            if (btn.type === 'URL' && btn.url) {
                if (btn.url.includes('{{') && !btn.url.includes('{{1}}')) {
                    errors.push(`URL parameters must be {{1}} (only one variable at the end)`);
                }
            }
            if (btn.type === 'PHONE_NUMBER' && btn.phoneNumber) {
                if (!/^\+[1-9]\d{1,14}$/.test(btn.phoneNumber)) {
                    errors.push(`Button phone number must be in E.164 format (e.g., +221...)`);
                }
            }
        });
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings
    };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function checkVariables(text: string, errors: string[], warnings: string[], context: string) {
    // 1. Check syntax {{1}}, {{2}}
    const regex = /\{\{(\d+)\}\}/g;
    const matches: number[] = [];
    let match;

    while ((match = regex.exec(text)) !== null) {
        matches.push(parseInt(match[1]));
    }

    if (matches.length === 0 && text.includes('{{')) {
        // Suspicious: has {{ but not matching {{number}}
        // Could be {{ name }} which is invalid
        if (/\{\{[^0-9]+\}\}/.test(text) || /\{\{ \d+ \}\}/.test(text)) {
            errors.push(`${context}: Variables must be format {{1}}, {{2}} without spaces or names.`);
        }
    }

    if (matches.length > 0) {
        // 2. Check sequential (1, 2, 3...)
        matches.sort((a, b) => a - b);

        // Remove duplicates for sequence check
        const unique = [...new Set(matches)];

        if (unique[0] !== 1) {
            errors.push(`${context}: Variables must start with {{1}}.`);
        }

        for (let i = 0; i < unique.length - 1; i++) {
            if (unique[i + 1] !== unique[i] + 1) {
                errors.push(`${context}: Missing variable {{${unique[i] + 1}}}. Variables must be sequential.`);
            }
        }

        // 3. Floating parameters check (text ends with {{1}} without punctuation? actually WA is fine with that)
        // Meta rejects parameters that are "floating" without context sometimes, but hard to define.
        // Instead, check for "Too many variables relative to text length" ?
        // Meta heuristic: nice to have.
    }
}

function checkPolicyContent(text: string, category: string, errors: string[], warnings: string[]) {
    const lower = text.toLowerCase();

    // 1. Check High Risk (Ban)
    for (const word of RISK_KEYWORDS) {
        if (lower.includes(word)) {
            warnings.push(`Risk: Content contains sensitive or flaggable word "${word}". may lead to rejection or ban.`);
        }
    }

    // 2. Category mismatch (Utility vs Marketing)
    // If user selected UTILITY, they cannot send marketing content
    if (category === 'UTILITY' || category === 'AUTHENTICATION') {
        const foundMarketing = MARKETING_KEYWORDS.filter(k => lower.includes(k));
        if (foundMarketing.length > 0) {
            warnings.push(
                `Policy: Category is ${category}, but content contains marketing words: "${foundMarketing.slice(0, 3).join(', ')}". \n` +
                `Meta will likely reject this. Change category to MARKETING.`
            );
        }
    }

    // 3. Formatting abuse
    if (text === text.toUpperCase() && text.length > 10) {
        warnings.push("Style: Excessive use of UPPERCASE. This is often flagged as spam.");
    }

    if ((text.match(/!/g) || []).length > 3) {
        warnings.push("Style: Excessive exclamation marks detected.");
    }
}
