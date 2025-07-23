import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface InteractiveAccordionProps {
  title: string
  subtitle?: string
  icon?: React.ReactNode
  badge?: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
  className?: string
}

export default function InteractiveAccordion({
  title,
  subtitle,
  icon,
  badge,
  children,
  defaultOpen = false,
  className = ''
}: InteractiveAccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <motion.div 
      className={`bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg overflow-hidden ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/50 transition-all duration-200"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <div className="flex items-center gap-4">
          {icon && (
            <div className="text-blue-500">
              {icon}
            </div>
          )}
          <div className="text-left">
            <h3 className="font-bold text-gray-900 text-lg">{title}</h3>
            {subtitle && (
              <p className="text-sm text-gray-500">{subtitle}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {badge}
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-5 h-5 text-gray-400" />
          </motion.div>
        </div>
      </motion.button>

      <motion.div
        initial={false}
        animate={{
          height: isOpen ? 'auto' : 0,
          opacity: isOpen ? 1 : 0
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        style={{ overflow: 'hidden' }}
      >
        <div className="px-6 pb-6 border-t border-gray-100/50">
          {children}
        </div>
      </motion.div>
    </motion.div>
  )
}
