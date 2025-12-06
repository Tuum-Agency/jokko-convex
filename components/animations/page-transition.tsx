'use client'

import { motion, Variants } from 'framer-motion'
import { ReactNode } from 'react'

interface PageTransitionProps {
    children: ReactNode
    className?: string
}

const pageVariants: Variants = {
    initial: {
        opacity: 0,
        y: 20
    },
    animate: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.4,
            ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
            when: 'beforeChildren' as const
        }
    },
    exit: {
        opacity: 0,
        y: -10,
        transition: {
            duration: 0.2,
            ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number]
        }
    }
}

export const PageTransition = ({ children, className = '' }: PageTransitionProps) => {
    return (
        <motion.div
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className={className}
        >
            {children}
        </motion.div>
    )
}

export default PageTransition
