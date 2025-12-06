'use client'

import { motion, Variants } from 'framer-motion'
import { ReactNode } from 'react'

interface StaggerContainerProps {
    children: ReactNode
    staggerDelay?: number
    delayChildren?: number
    className?: string
    once?: boolean
    amount?: number
    /** Use 'mount' for elements that should animate immediately, 'inView' for scroll-triggered */
    trigger?: 'mount' | 'inView'
}

export const StaggerContainer = ({
    children,
    staggerDelay = 0.1,
    delayChildren = 0.2,
    className = '',
    once = true,
    amount = 0.1,
    trigger = 'inView'
}: StaggerContainerProps) => {
    const container: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                delayChildren,
                staggerChildren: staggerDelay
            }
        }
    }

    // For 'mount' trigger, animate immediately on mount
    if (trigger === 'mount') {
        return (
            <motion.div
                className={className}
                variants={container}
                initial="hidden"
                animate="visible"
            >
                {children}
            </motion.div>
        )
    }

    // For 'inView' trigger, use intersection observer
    return (
        <motion.div
            className={className}
            variants={container}
            initial="hidden"
            whileInView="visible"
            viewport={{ once, amount }}
        >
            {children}
        </motion.div>
    )
}

// Composant enfant pour être utilisé avec StaggerContainer
export const StaggerItem = ({
    children,
    className = ''
}: {
    children: ReactNode
    className?: string
}) => {
    const item: Variants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }
        }
    }

    return (
        <motion.div
            className={className}
            variants={item}
        >
            {children}
        </motion.div>
    )
}

export default StaggerContainer
