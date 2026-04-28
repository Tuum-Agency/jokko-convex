'use client'

import { motion } from 'framer-motion'

interface ActiveIndicatorProps {
  /** Position the indicator (left, right, bottom) */
  position?: 'left' | 'right' | 'bottom'
  /** Color of the indicator */
  color?: string
  /** Width/height of the indicator */
  size?: number
  /** Layout ID for shared element transitions */
  layoutId?: string
  /** Additional className */
  className?: string
}

export const ActiveIndicator = ({
  position = 'left',
  color = '#16a34a',
  size = 3,
  layoutId = 'active-indicator',
  className = ''
}: ActiveIndicatorProps) => {
  const positionStyles = {
    left: {
      left: -12,
      top: '50%',
      transform: 'translateY(-50%)',
      width: size,
      height: '60%',
      borderRadius: '0 4px 4px 0'
    },
    right: {
      right: 0,
      top: '50%',
      transform: 'translateY(-50%)',
      width: size,
      height: '60%',
      borderRadius: '4px 0 0 4px'
    },
    bottom: {
      bottom: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      height: size,
      width: '60%',
      borderRadius: '4px 4px 0 0'
    }
  }

  return (
    <motion.div
      layoutId={layoutId}
      className={`absolute ${className}`}
      style={{
        backgroundColor: color,
        ...positionStyles[position]
      }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{
        type: 'spring',
        stiffness: 380,
        damping: 30
      }}
    />
  )
}

interface ActiveBackgroundProps {
  /** Layout ID for shared element transitions */
  layoutId?: string
  /** Additional className */
  className?: string
}

export const ActiveBackground = ({
  layoutId = 'active-background',
  className = ''
}: ActiveBackgroundProps) => {
  return (
    <motion.div
      layoutId={layoutId}
      className={`absolute inset-0 rounded-xl bg-green-50 ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{
        type: 'spring',
        stiffness: 380,
        damping: 30
      }}
    />
  )
}

export default ActiveIndicator
