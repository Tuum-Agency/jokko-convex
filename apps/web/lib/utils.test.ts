import { describe, it, expect } from 'vitest'
import { cn } from './utils'

describe('utils', () => {
    it('cn should merge class names correctly', () => {
        const result = cn('bg-red-500', 'text-white')
        expect(result).toBe('bg-red-500 text-white')
    })

    it('cn should handle conditional classes', () => {
        const result = cn('bg-red-500', false && 'text-white', 'p-4')
        expect(result).toBe('bg-red-500 p-4')
    })

    it('cn should merge tailwind conflicts', () => {
        // tailwind-merge should resolve this to p-4 (last wins)
        const result = cn('p-2', 'p-4')
        expect(result).toBe('p-4')
    })
})
