
import {
    TemplateType,
    TEMPLATE_TYPE_CONFIGS,
    TEMPLATE_LIMITS,
    TemplateTypeConfig
} from './templateTypes';

export interface ValidationResult {
    valid: boolean;
    errors: string[];
}

export function validateTemplate(data: any): ValidationResult {
    const errors: string[] = [];
    const type = data.type as TemplateType;
    const config = TEMPLATE_TYPE_CONFIGS[type];

    if (!config) {
        return { valid: false, errors: [`Invalid template type: ${type}`] };
    }

    // 1. Validate Base Fields
    if (!data.name || data.name.length > 512) {
        errors.push("Name is required and must be under 512 characters");
    }

    if (data.language && !/^[a-z]{2}(_[A-Z]{2})?$/.test(data.language)) {
        errors.push("Invalid language code format");
    }

    // 2. Validate Header
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
        }
    }

    // 3. Validate Body
    if (config.features.bodyRequired) {
        if (!data.body) {
            errors.push("Body text is required");
        } else {
            if (data.body.length > TEMPLATE_LIMITS.general.bodyMax) {
                errors.push(`Body text exceeds ${TEMPLATE_LIMITS.general.bodyMax} characters`);
            }
        }
    }

    // 4. Validate Footer
    if (data.footer) {
        if (!config.features.hasFooter) {
            errors.push("Footer is not allowed for this template type");
        } else if (data.footer.length > TEMPLATE_LIMITS.general.footerMax) {
            errors.push(`Footer text exceeds ${TEMPLATE_LIMITS.general.footerMax} characters`);
        }
    }

    // 5. Validate Buttons
    if (data.buttons && data.buttons.length > 0) {
        if (!config.features.hasButtons) {
            errors.push("Buttons are not allowed for this template type");
        }

        if (data.buttons.length > config.features.maxButtons) {
            errors.push(`Too many buttons. Max allowed: ${config.features.maxButtons}`);
        }

        if (data.buttons.length < config.features.minButtons) {
            errors.push(`Not enough buttons. Min required: ${config.features.minButtons}`);
        }

        data.buttons.forEach((btn: any, index: number) => {
            if (!config.features.buttonTypes.includes(btn.type)) {
                errors.push(`Button type ${btn.type} is not allowed`);
            }
            if (btn.text && btn.text.length > TEMPLATE_LIMITS.general.buttonTextMax) {
                errors.push(`Button text at index ${index} exceeds limit`);
            }
        });
    }

    return {
        valid: errors.length === 0,
        errors
    };
}
