/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║              components/ui/password-strength.tsx              ║
 * ╠═══════════════════════════════════════════════════════════════╣
 * ║ DESCRIPTION:                                                  ║
 * ║   Indicateur visuel de la force du mot de passe avec:         ║
 * ║   - Barre de progression colorée                              ║
 * ║   - Liste des critères avec statut                            ║
 * ║   - Texte descriptif de la force                              ║
 * ╚═══════════════════════════════════════════════════════════════╝
 */

'use client'

import * as React from 'react'
import { Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================
// TYPES
// ============================================

interface PasswordCriteria {
  id: string
  label: string
  test: (password: string) => boolean
}

interface StrengthLevel {
  label: string
  color: string
  bgColor: string
  minScore: number
}

// ============================================
// CONSTANTS
// ============================================

const PASSWORD_CRITERIA: PasswordCriteria[] = [
  {
    id: 'length',
    label: 'Au moins 8 caractères',
    test: (pwd) => pwd.length >= 8,
  },
  {
    id: 'lowercase',
    label: 'Une lettre minuscule',
    test: (pwd) => /[a-z]/.test(pwd),
  },
  {
    id: 'uppercase',
    label: 'Une lettre majuscule',
    test: (pwd) => /[A-Z]/.test(pwd),
  },
  {
    id: 'number',
    label: 'Un chiffre',
    test: (pwd) => /[0-9]/.test(pwd),
  },
  {
    id: 'special',
    label: 'Un caractère spécial (!@#$%...)',
    test: (pwd) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd),
  },
]

const STRENGTH_LEVELS: StrengthLevel[] = [
  { label: 'Très faible', color: 'bg-red-500', bgColor: 'bg-red-100', minScore: 0 },
  { label: 'Faible', color: 'bg-orange-500', bgColor: 'bg-orange-100', minScore: 1 },
  { label: 'Moyen', color: 'bg-yellow-500', bgColor: 'bg-yellow-100', minScore: 2 },
  { label: 'Fort', color: 'bg-green-500', bgColor: 'bg-green-100', minScore: 4 },
  { label: 'Très fort', color: 'bg-green-600', bgColor: 'bg-green-100', minScore: 5 },
]

// ============================================
// HELPER FUNCTIONS
// ============================================

function calculateStrength(password: string): {
  score: number
  passed: string[]
  failed: string[]
} {
  const passed: string[] = []
  const failed: string[] = []

  for (const criteria of PASSWORD_CRITERIA) {
    if (criteria.test(password)) {
      passed.push(criteria.id)
    } else {
      failed.push(criteria.id)
    }
  }

  return {
    score: passed.length,
    passed,
    failed,
  }
}

function getStrengthLevel(score: number): StrengthLevel {
  for (let i = STRENGTH_LEVELS.length - 1; i >= 0; i--) {
    if (score >= STRENGTH_LEVELS[i].minScore) {
      return STRENGTH_LEVELS[i]
    }
  }
  return STRENGTH_LEVELS[0]
}

// ============================================
// COMPONENTS
// ============================================

interface PasswordStrengthProps {
  password: string
  showCriteria?: boolean
  className?: string
}

export function PasswordStrength({
  password,
  showCriteria = true,
  className,
}: PasswordStrengthProps) {
  const { score, passed } = calculateStrength(password)
  const strengthLevel = getStrengthLevel(score)
  const percentage = (score / PASSWORD_CRITERIA.length) * 100

  // Don't show anything if password is empty
  if (!password) {
    return null
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Strength Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <span className="text-xs font-medium text-gray-500">
            Force du mot de passe
          </span>
          <span
            className={cn(
              'text-xs font-semibold px-2 py-0.5 rounded-full',
              strengthLevel.bgColor,
              strengthLevel.color.replace('bg-', 'text-')
            )}
          >
            {strengthLevel.label}
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-300 ease-out',
              strengthLevel.color
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Criteria List */}
      {showCriteria && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {PASSWORD_CRITERIA.map((criteria) => {
            const isPassed = passed.includes(criteria.id)
            return (
              <div
                key={criteria.id}
                className={cn(
                  'flex items-center gap-2 text-xs transition-colors',
                  isPassed ? 'text-green-600' : 'text-gray-400'
                )}
              >
                {isPassed ? (
                  <Check className="w-3.5 h-3.5 flex-shrink-0" />
                ) : (
                  <X className="w-3.5 h-3.5 flex-shrink-0" />
                )}
                <span>{criteria.label}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ============================================
// HOOK FOR EXTERNAL USE
// ============================================

export function usePasswordStrength(password: string) {
  const { score, passed, failed } = calculateStrength(password)
  const strengthLevel = getStrengthLevel(score)

  return {
    score,
    maxScore: PASSWORD_CRITERIA.length,
    passed,
    failed,
    level: strengthLevel,
    isStrong: score >= 4,
    isValid: score >= 3, // Minimum: length + 2 other criteria
    percentage: (score / PASSWORD_CRITERIA.length) * 100,
  }
}
