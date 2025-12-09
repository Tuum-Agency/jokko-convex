'use client'
import { useState, forwardRef, useEffect } from 'react'
import { Check, X } from 'lucide-react'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
    validatePhone,
    formatAsYouType,
    detectCountry,
    getNationalNumber,
    SUPPORTED_COUNTRIES,
    type PhoneValidationResult,
    type CountryCode,
} from '@/lib/contacts/validation'

interface PhoneInputProps {
    value?: string
    indicator?: CountryCode | null
    onChange?: (value: string, validation: PhoneValidationResult) => void
    onBlur?: () => void
    defaultCountry?: CountryCode
    placeholder?: string
    disabled?: boolean
    error?: string
    showValidation?: boolean
    className?: string
    id?: string
    name?: string
}

// Separate internal state for Country and National Number
// When `value` props changes (external update), we parse it.
// When User types, we format it and rebuild `value`.

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
    function PhoneInput(
        {
            value = '',
            onChange,
            onBlur,
            defaultCountry = 'SN',
            placeholder = '77 123 45 67',
            disabled,
            error,
            showValidation = true,
            className,
            id,
            name,
            indicator,
        },
        ref
    ) {
        const [country, setCountry] = useState<CountryCode>(defaultCountry)
        const [displayValue, setDisplayValue] = useState('')
        const [validation, setValidation] = useState<PhoneValidationResult | null>(null)
        const [indicatorNumber, setIndicatorNumber] = useState<CountryCode | null | undefined>(null)

        // Initialize from prop value if present
        useEffect(() => {
            if (value) {
                setIndicatorNumber(indicator);
                // If indicator explicit (from outside detection), use it. Or auto-detect.
                const detected = indicatorNumber || detectCountry(value);
                console.log('PhoneInput value:', value, 'Detected:', detected, "indicatorNumber", indicatorNumber);

                let nextCountry = detected || defaultCountry;

                // Sticky logic: If detection is null (e.g. ambiguity), but we have a currently selected country
                // that matches the prefix of the value, preserve it to prevent jumping to defaultCountry.
                if (!detected) {
                    const currentDialCode = SUPPORTED_COUNTRIES.find(c => c.code === country)?.dialCode;
                    if (currentDialCode) {
                        const cleanVal = value.replace(/[^\d+]/g, '');
                        const normalizedCtx = cleanVal.startsWith('+') ? cleanVal : '+' + cleanVal;
                        if (normalizedCtx.startsWith(currentDialCode)) {
                            // The number still matches the currently selected country, keep it.
                            nextCountry = country;
                        }
                    }
                }

                setCountry(nextCountry);

                // Strip prefix to get national digits
                const countryObj = SUPPORTED_COUNTRIES.find(c => c.code === nextCountry);
                let national = value;

                if (countryObj) {
                    // Normalize value for stripping
                    const cleanVal = value.replace(/[^\d+]/g, '');
                    const cleanDial = countryObj.dialCode.replace('+', '');

                    // Check against +DialCode
                    if (cleanVal.startsWith(countryObj.dialCode)) {
                        national = cleanVal.substring(countryObj.dialCode.length);
                    }
                    // Check against DialCode (no plus)
                    else if (cleanVal.startsWith(cleanDial)) {
                        national = cleanVal.substring(cleanDial.length);
                    }
                    // Check against +DialCode (stripping + manual check)
                    else if (('+' + cleanVal).startsWith(countryObj.dialCode)) {
                        // This case handles e.g. "33..." -> "+33..." matches "+33"
                        // We need to strip "33" from "33..."
                        national = cleanVal.substring(cleanDial.length);
                    }
                }

                // Format for display
                const formatted = formatAsYouType(national, nextCountry);
                setDisplayValue(formatted);

                // Validate initial
                setValidation(validatePhone(value, { defaultCountry }));
            } else {
                setCountry(defaultCountry);
                setDisplayValue('');
            }
        }, [value, defaultCountry]); // Careful with dependency loop if onChange updates value fast

        // We need to break the loop: if user types, we update internal displayValue, AND call onChange.
        // Parent updates `value`. `useEffect` triggers.
        // If `useEffect` logic rebuilds exact same displayValue, no render loop.
        // To be safe, we can check if `value` matches our reconstructed current state?
        // Actually, easiest way is to trust `value` prop as source of truth for country/initial, but drive input from local state for smooth typing.
        // But if we separate, we might desync.
        // Let's stick to: useEffect updates local state ONLY if the derived value from prop is different from current local state?
        // Or just let it sync. React handles same-value state updates efficiently.

        const currentCountryObj = SUPPORTED_COUNTRIES.find((c) => c.code === country);

        const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const raw = e.target.value;

            // Limit to allowed chars (digits, maybe space)
            // But user might type arbitrary stuff, formatAsYouType handles clean up
            const formatted = formatAsYouType(raw, country);
            setDisplayValue(formatted);

            // Reconstruct full E.164
            const cleanDigits = formatted.replace(/\D/g, '');
            const prefix = currentCountryObj?.dialCode || '';
            const fullNumber = prefix + cleanDigits;

            const res = validatePhone(fullNumber, { defaultCountry: country });
            setValidation(res);

            onChange?.(fullNumber, res);
        };

        const handleCountryChange = (code: string) => {
            const newCountry = code as CountryCode;
            setCountry(newCountry);

            // Reformat existing digits with new country format
            const cleanDigits = displayValue.replace(/\D/g, '');
            const newFormatted = formatAsYouType(cleanDigits, newCountry);
            setDisplayValue(newFormatted);

            const newCountryObj = SUPPORTED_COUNTRIES.find(c => c.code === newCountry);
            const prefix = newCountryObj?.dialCode || '';
            const fullNumber = prefix + cleanDigits;

            const res = validatePhone(fullNumber, { defaultCountry: newCountry });
            setValidation(res);

            onChange?.(fullNumber, res);
        };

        const showValid = showValidation && displayValue && validation?.valid
        const showInvalid = showValidation && displayValue && validation?.valid === false
        const hasError = !!error || showInvalid

        return (
            <div className={cn('space-y-1', className)}>
                <div className={cn(
                    "flex h-12 w-full rounded-xl border border-gray-200 bg-gray-50 focus-within:ring-2 focus-within:ring-green-500/20 focus-within:border-green-500 overflow-hidden",
                    hasError && "border-destructive ring-destructive/20"
                )}>
                    {/* Country Selector */}
                    <div className="flex-none border-r border-gray-200 bg-gray-50/50">
                        <Select value={country} onValueChange={handleCountryChange} disabled={disabled}>
                            <SelectTrigger className="h-full border-0 bg-transparent px-3 rounded-none shadow-none focus:ring-0 gap-2 w-[100px]">
                                <SelectValue>
                                    <span className="flex items-center gap-1">
                                        <span className="text-lg leading-none">{currentCountryObj?.flag}</span>
                                        <span className="text-xs text-muted-foreground">{currentCountryObj?.dialCode}</span>
                                    </span>
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {SUPPORTED_COUNTRIES.map((c) => (
                                    <SelectItem key={c.code} value={c.code}>
                                        <span className="flex items-center gap-2">
                                            <span>{c.flag}</span>
                                            <span>{c.name}</span>
                                            <span className="text-xs text-muted-foreground">{c.dialCode}</span>
                                        </span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Input */}
                    <input
                        ref={ref}
                        id={id}
                        name={name}
                        type="tel"
                        value={displayValue}
                        onChange={handleInputChange}
                        onBlur={onBlur}
                        placeholder={placeholder}
                        disabled={disabled}
                        className="flex-1 bg-transparent px-3 text-sm focus:outline-none placeholder:text-muted-foreground"
                    />

                    {/* Validation Status */}
                    {showValidation && displayValue && (
                        <div className="flex items-center px-3">
                            {showValid ? (
                                <Check className="h-4 w-4 text-green-500" />
                            ) : showInvalid ? (
                                <X className="h-4 w-4 text-destructive" />
                            ) : null}
                        </div>
                    )}
                </div>

                {/* Error message */}
                {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
        )
    }
)
