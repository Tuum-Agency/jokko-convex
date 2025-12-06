'use client'

import { motion } from 'framer-motion'

interface SquigglyUnderlineProps {
    color?: string
    strokeWidth?: number
    duration?: number
    className?: string
    width?: number
}

export const SquigglyUnderline = ({
    color = "#16a34a",
    strokeWidth = 1,
    duration = 0.8,
    className = "",
    width: _width = 37
}: SquigglyUnderlineProps) => (
    <motion.div className={`absolute -bottom-[6px] left-0 right-0 h-[10px] ${className}`}>
        <svg className="w-full h-full" viewBox="0 0 37 8" fill="none" preserveAspectRatio="none">
            <motion.path
                d="M1 5.39971C7.48565 -1.08593 6.44837 -0.12827 8.33643 6.47992C8.34809 6.52075 11.6019 2.72875 12.3422 2.33912C13.8991 1.5197 16.6594 2.96924 18.3734 2.96924C21.665 2.96924 23.1972 1.69759 26.745 2.78921C29.7551 3.71539 32.6954 3.7794 35.8368 3.7794"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{
                    strokeDasharray: 84.20591735839844,
                    strokeDashoffset: 84.20591735839844,
                }}
                animate={{
                    strokeDashoffset: 0,
                }}
                transition={{
                    duration,
                    ease: "easeInOut"
                }}
            />
        </svg>
    </motion.div>
)

export default SquigglyUnderline
