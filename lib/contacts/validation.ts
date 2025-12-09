
export type CountryCode = 'SN' | 'FR' | 'US' | 'CI' | 'ML' | 'GN' | 'GM';

export interface Country {
    code: CountryCode;
    name: string;
    flag: string;
    dialCode: string;
    format: string; // e.g. "## ### ## ##"
}

export const SUPPORTED_COUNTRIES: Country[] = [
    { code: 'SN', name: 'Sénégal', flag: '🇸🇳', dialCode: '+221', format: '## ### ## ##' }, // 77 123 45 67
    { code: 'FR', name: 'France', flag: '🇫🇷', dialCode: '+33', format: '## ## ## ## ##' }, // 06 12 34 56 78
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
    if (!phone) return null;

    // Clean the phone number: remove spaces, parens, dashes. Keep + and digits.
    const cleanPhone = phone.replace(/[^\d+]/g, '');

    // Normalize input to have + if missing, for checking against dialCodes which have +
    const normalizedPhone = cleanPhone.startsWith('+') ? cleanPhone : '+' + cleanPhone;

    // Sort by dialCode length desc to match longest prefix first (e.g. if we had +1 and +1242)
    const sortedCountries = [...SUPPORTED_COUNTRIES].sort((a, b) => b.dialCode.length - a.dialCode.length);

    for (const country of sortedCountries) {
        if (normalizedPhone.startsWith(country.dialCode)) {
            return country.code;
        }
    }

    return null;
}

export function getNationalNumber(phone: string): string {
    const countryCode = detectCountry(phone);
    if (countryCode) {
        const country = SUPPORTED_COUNTRIES.find(c => c.code === countryCode);
        if (country) {
            return phone.replace(country.dialCode, '').trim();
        }
    }
    // Fallback logic if detection strictly expects + but phone doesn't have it,
    // or to clean up legacy data
    return phone.replace(/^\+\d+\s?/, '');
}

export function formatPhoneDisplay(phone: string, format: 'international' | 'national' | 'local' = 'international'): string {
    if (!phone) return '';
    // Basic formatting could be added here
    return phone;
}

export function validatePhone(phone: string, options?: { defaultCountry?: CountryCode }): PhoneValidationResult {
    const countryCodeKey = detectCountry(phone) || options?.defaultCountry || 'SN';
    const country = SUPPORTED_COUNTRIES.find(c => c.code === countryCodeKey);
    const dialCode = country?.dialCode || '+221';

    // Basic validation logic
    // Ideally we would use google-libphonenumber but let's do basic length checks
    const nationalNumber = phone.startsWith(dialCode) ? phone.slice(dialCode.length) : phone;
    const cleanNumber = nationalNumber.replace(/\D/g, '');

    const valid = cleanNumber.length >= 7 && cleanNumber.length <= 15; // Rough check

    return {
        valid,
        normalized: phone,
        country: countryCodeKey,
        countryCode: dialCode,
        nationalNumber: cleanNumber,
        displayFormat: phone, // TODO: Implement proper formatting
        error: valid ? undefined : 'Numéro invalide'
    };
}

export function formatAsYouType(phone: string, countryCode: CountryCode): string {
    const country = SUPPORTED_COUNTRIES.find(c => c.code === countryCode);
    if (!country || !country.format) return phone;

    // Strip non-digits
    const digits = phone.replace(/\D/g, '');
    let formatted = '';
    let digitIndex = 0;

    for (let i = 0; i < country.format.length; i++) {
        if (digitIndex >= digits.length) break;

        const char = country.format[i];
        if (char === '#') {
            formatted += digits[digitIndex];
            digitIndex++;
        } else {
            formatted += char;
        }
    }

    return formatted;
}
