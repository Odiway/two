import { useState } from 'react'
import { motion } from 'framer-motion'

interface TabData {
  id: string
  label: string
  icon: React.ReactNode
  content: React.ReactNode
  badge?: string | number
}

interface ModernTabsProps {
  tabs: TabData[]
  defaultTab?: string
  className?: string
}

export default function ModernTabs({ tabs, defaultTab, className = '' }: ModernTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id)

  return (
    <div className={`w-full ${className}`}>
      {/* Tab Navigation */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-2 shadow-lg border border-white/20 mb-8">
        <div className="flex space-x-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                activeTab === tab.id
                  ? 'text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
              }`}
            >
              {/* Active tab background with gradient */}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 rounded-xl"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              
              {/* Tab content */}
              <div className="relative z-10 flex items-center gap-2">
                {tab.icon}
                {tab.label}
                {tab.badge && (
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                    activeTab === tab.id
                      ? 'bg-white/20 text-white'
                      : 'bg-blue-100 text-blue-600'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="relative">
        {tabs.map((tab) => (
          <motion.div
            key={tab.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{
              opacity: activeTab === tab.id ? 1 : 0,
              y: activeTab === tab.id ? 0 : 20,
              display: activeTab === tab.id ? 'block' : 'none'
            }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            {tab.content}
          </motion.div>
        ))}
      </div>
    </div>
  )
}
