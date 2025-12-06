'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface FloatingElementProps {
    children: ReactNode
    intensity?: 'subtle' | 'medium' | 'strong'
    direction?: 'vertical' | 'horizontal' | 'both'
    duration?: number
    className?: string
}

export const FloatingElement = ({
    children,
    intensity = 'subtle',
    direction = 'vertical',
    duration = 3,
    className = ''
}: FloatingElementProps) => {
    const getIntensityValue = () => {
        switch (intensity) {
            case 'subtle':
                return 5
            case 'medium':
                return 10
            case 'strong':
                return 15
            default:
                return 5
        }
    }

    const intensityValue = getIntensityValue()

    const getAnimation = () => {
        switch (direction) {
            case 'vertical':
                return {
                    y: [-intensityValue, intensityValue, -intensityValue]
                }
            case 'horizontal':
                return {
                    x: [-intensityValue, intensityValue, -intensityValue]
                }
            case 'both':
                return {
                    y: [-intensityValue, intensityValue, -intensityValue],
                    x: [-intensityValue / 2, intensityValue / 2, -intensityValue / 2]
                }
            default:
                return {
                    y: [-intensityValue, intensityValue, -intensityValue]
                }
        }
    }

    return (
        <motion.div
            className={className}
            animate={getAnimation()}
            transition={{
                duration,
                repeat: Infinity,
                ease: "easeInOut"
            }}
        >
            {children}
        </motion.div>
    )
}

export default FloatingElement
