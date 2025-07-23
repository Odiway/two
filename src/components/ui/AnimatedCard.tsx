'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface AnimatedCardProps {
  children: ReactNode
  className?: string
  delay?: number
  hover?: boolean
  gradient?: boolean
}

export default function AnimatedCard({ 
  children, 
  className = '', 
  delay = 0, 
  hover = true,
  gradient = false 
}: AnimatedCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.5, 
        delay: delay,
        type: "spring",
        stiffness: 100 
      }}
      whileHover={hover ? { 
        y: -5, 
        scale: 1.02,
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        transition: { duration: 0.2 }
      } : undefined}
      className={`
        ${gradient ? 'bg-gradient-to-br from-white via-blue-50/50 to-purple-50/30' : 'bg-white/80'}
        backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl
        ${hover ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </motion.div>
  )
}
