
export type CountryCode = 'SN' | 'FR' | 'US' | 'CI' | 'ML' | 'GN' | 'GM';

export interface Country {
    code: CountryCode;
    name: string;
    flag: string;
    dialCode: string;
    format: string; // e.g. "## ### ## ##"
}

export const SUPPORTED_COUNTRIES: Country[] = [
    { code: 'SN', name: 'Sénégal', flag: '🇸🇳', dialCode: '+221', format: '## ### ## ##' },
    { code: 'FR', name: 'France', flag: '🇫🇷', dialCode: '+33', format: '# ## ## ## ##' },
    { code: 'US', name: 'États-Unis', flag: '🇺🇸', dialCode: '+1', format: '(###) ###-####' },
    { code: 'CI', name: 'Côte d\'Ivoire', flag: '🇨🇮', dialCode: '+225', format: '## ## ## ## ##' },
    { code: 'ML', name: 'Mali', flag: '🇲🇱', dialCode: '+223', format: '## ## ## ##' },
    { code: 'GN', name: 'Guinée', flag: '🇬🇳', dialCode: '+224', format: '## ## ## ## ##' },
    { code: 'GM', name: 'Gambie', flag: '🇬🇲', dialCode: '+220', format: '### ####' },
];

export interface PhoneValidationResult {
    valid: boolean
    normalized: string | null
    country: CountryCode | null
    countryCode: string | null
    nationalNumber: string | null
    displayFormat: string | null
    error?: string
}

export function detectCountry(phone: string): CountryCode | null {
    // Basic detection
    if (phone.startsWith('+221')) return 'SN';
    if (phone.startsWith('+33')) return 'FR';
    if (phone.startsWith('+1')) return 'US';
    return 'SN';
}

export function getNationalNumber(phone: string): string {
    return phone.replace(/^\+\d+\s?/, '');
}

export function formatPhoneDisplay(phone: string, format: 'international' | 'national' | 'local' = 'international'): string {
    if (!phone) return '';
    return phone;
}

export function validatePhone(phone: string, options?: { defaultCountry?: CountryCode }): PhoneValidationResult {
    // Simple mock validation
    const valid = phone.length > 5;
    return {
        valid,
        normalized: valid ? phone : null,
        country: options?.defaultCountry || 'SN',
        countryCode: '+221',
        nationalNumber: phone,
        displayFormat: phone,
        error: valid ? undefined : 'Numéro invalide'
    };
}

export function formatAsYouType(phone: string, country: CountryCode): string {
    return phone;
}
