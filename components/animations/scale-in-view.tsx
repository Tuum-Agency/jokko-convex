'use client'

import { motion, Variants } from 'framer-motion'
import { ReactNode } from 'react'

interface ScaleInViewProps {
    children: ReactNode
    delay?: number
    duration?: number
    scale?: number
    className?: string
    once?: boolean
    amount?: number
}

export const ScaleInView = ({
    children,
    delay = 0,
    duration = 0.6,
    scale = 0.95,
    className = '',
    once = true,
    amount = 0.1
}: ScaleInViewProps) => {
    const variants: Variants = {
        hidden: {
            opacity: 0,
            scale
        },
        visible: {
            opacity: 1,
            scale: 1,
            transition: {
                duration,
                ease: [0.25, 0.1, 0.25, 1],
                delay
            }
        }
    }

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

export default ScaleInView
