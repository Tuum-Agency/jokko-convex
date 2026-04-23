/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║              components/ui/password-input.tsx                 ║
 * ╠═══════════════════════════════════════════════════════════════╣
 * ║ DESCRIPTION:                                                  ║
 * ║   Composant Input pour les mots de passe avec:                ║
 * ║   - Toggle show/hide password                                 ║
 * ║   - Support des icones gauche                                 ║
 * ║   - Accessible et responsive                                  ║
 * ╚═══════════════════════════════════════════════════════════════╝
 */

'use client'

import * as React from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface PasswordInputProps
  extends Omit<React.ComponentProps<'input'>, 'type'> {
  /** Left icon to display inside the input */
  leftIcon?: React.ReactNode
  /** Error state */
  error?: boolean
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, leftIcon, error, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false)

    return (
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            {leftIcon}
          </div>
        )}
        <input
          type={showPassword ? 'text' : 'password'}
          className={cn(
            'flex h-12 w-full rounded-xl border border-gray-200 bg-gray-50 text-base text-gray-900 transition-all',
            'placeholder:text-gray-400',
            'focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-500/20 focus:outline-none',
            'disabled:cursor-not-allowed disabled:opacity-50',
            leftIcon ? 'pl-12' : 'px-4',
            'pr-12', // Always leave space for the toggle button
            error && 'border-red-300 focus:border-red-500 focus:ring-red-500/20',
            className
          )}
          ref={ref}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:text-gray-600"
          tabIndex={-1}
          aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
        >
          {showPassword ? (
            <EyeOff className="w-5 h-5" />
          ) : (
            <Eye className="w-5 h-5" />
          )}
        </button>
      </div>
    )
  }
)
PasswordInput.displayName = 'PasswordInput'

export { PasswordInput }
