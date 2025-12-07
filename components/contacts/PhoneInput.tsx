'use client'

import { useState, forwardRef } from 'react'
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
    formatPhoneDisplay,
    SUPPORTED_COUNTRIES,
    type PhoneValidationResult,
    type CountryCode,
} from '@/lib/contacts/validation'

interface PhoneInputProps {
    value?: string
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

function parseInitialValue(value: string, defaultCountry: CountryCode) {
    if (!value) {
        return { country: defaultCountry, nationalNumber: '', validation: null }
    }
    const country = detectCountry(value) || defaultCountry;
    return {
        country,
        nationalNumber: value,
        validation: validatePhone(value)
    }
}

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
        },
        ref
    ) {
        const initialParsed = parseInitialValue(value, defaultCountry)

        const [country, setCountry] = useState<CountryCode>(initialParsed.country)
        const [inputValue, setInputValue] = useState(initialParsed.nationalNumber)
        const [validation, setValidation] = useState<PhoneValidationResult | null>(
            initialParsed.validation
        )

        const currentCountry = SUPPORTED_COUNTRIES.find((c) => c.code === country)

        const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const raw = e.target.value
            // In real app, we would strip country code if present, but here we just take input
            setInputValue(raw)
            const formatted = raw; // Simplification

            if (formatted) {
                const result = validatePhone(formatted, { defaultCountry: country })
                setValidation(result)
                onChange?.(formatted, result)
            } else {
                // ...
            }
        }

        const handleCountryChange = (code: string) => {
            setCountry(code as CountryCode)
        }

        const showValid = showValidation && inputValue && validation?.valid
        const showInvalid = showValidation && inputValue && validation?.valid === false
        const hasError = !!error || showInvalid

        return (
            <div className={cn('space-y-1', className)}>
                {/* Visual wrapper to look like InputGroup */}
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
                                        <span className="text-lg leading-none">{currentCountry?.flag}</span>
                                        <span className="text-xs text-muted-foreground">{currentCountry?.dialCode}</span>
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
                        value={inputValue}
                        onChange={handleInputChange}
                        onBlur={onBlur}
                        placeholder={placeholder}
                        disabled={disabled}
                        className="flex-1 bg-transparent px-3 text-sm focus:outline-none placeholder:text-muted-foreground"
                    />

                    {/* Validation Status */}
                    {showValidation && inputValue && (
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
