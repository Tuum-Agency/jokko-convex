'use client'

import { motion, Variants } from 'framer-motion'
import { ReactNode } from 'react'

interface FadeInViewProps {
    children: ReactNode
    direction?: 'up' | 'down' | 'left' | 'right'
    delay?: number
    duration?: number
    className?: string
    once?: boolean
    amount?: number
    /** Use 'mount' for elements that should animate immediately, 'inView' for scroll-triggered */
    trigger?: 'mount' | 'inView'
}

export const FadeInView = ({
    children,
    direction = 'up',
    delay = 0,
    duration = 0.6,
    className = '',
    once = true,
    amount = 0.1,
    trigger = 'inView'
}: FadeInViewProps) => {
    const variants: Variants = {
        hidden: {
            opacity: 0,
            y: direction === 'up' ? 20 : direction === 'down' ? -20 : 0,
            x: direction === 'left' ? 20 : direction === 'right' ? -20 : 0
        },
        visible: {
            opacity: 1,
            y: 0,
            x: 0,
            transition: {
                duration,
                ease: [0.25, 0.1, 0.25, 1],
                delay
            }
        }
    }

    // For 'mount' trigger, animate immediately on mount
    if (trigger === 'mount') {
        return (
            <motion.div
                className={className}
                initial="hidden"
                animate="visible"
                variants={variants}
            >
                {children}
            </motion.div>
        )
    }

    // For 'inView' trigger, use intersection observer
    return (
        <motion.div
            className={className}
            initial="hidden"
            whileInView="visible"
            viewport={{ once, amount }}
            variants={variants}
        >
            {children}
        </motion.div>
    )
}

export default FadeInView
