'use client'

import { motion, Variants } from 'framer-motion'
import { ReactNode } from 'react'

interface SlideInViewProps {
    children: ReactNode
    direction?: 'left' | 'right' | 'up' | 'down'
    distance?: number
    delay?: number
    duration?: number
    className?: string
    once?: boolean
    amount?: number
}

export const SlideInView = ({
    children,
    direction = 'left',
    distance = 50,
    delay = 0,
    duration = 0.8,
    className = '',
    once = true,
    amount = 0.1
}: SlideInViewProps) => {
    const getInitialPosition = () => {
        switch (direction) {
            case 'left':
                return { x: -distance, y: 0 }
            case 'right':
                return { x: distance, y: 0 }
            case 'up':
                return { x: 0, y: distance }
            case 'down':
                return { x: 0, y: -distance }
            default:
                return { x: -distance, y: 0 }
        }
    }

    const variants: Variants = {
        hidden: {
            opacity: 0,
            ...getInitialPosition()
        },
        visible: {
            opacity: 1,
            x: 0,
            y: 0,
            transition: {
                duration,
                ease: [0, 0.71, 0.2, 1.01],
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

export default SlideInView
