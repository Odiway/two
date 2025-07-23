import { LucideIcon } from 'lucide-react'
import { ReactNode } from 'react'

interface StatsCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  gradient: string
  trend?: {
    value: number
    label: string
    positive: boolean
  }
  children?: ReactNode
}

export default function StatsCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  gradient,
  trend,
  children 
}: StatsCardProps) {
  return (
    <div className={`relative overflow-hidden rounded-2xl p-6 text-white ${gradient}`}>
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 20%, rgba(255,255,255,0.1) 0%, transparent 50%)`
          }}
        />
      </div>
      
      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            <p className="text-white/80 text-sm font-medium">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            {subtitle && (
              <p className="text-white/70 text-xs mt-1">{subtitle}</p>
            )}
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
            <Icon className="w-8 h-8 text-white" />
          </div>
        </div>
        
        {trend && (
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
              trend.positive 
                ? 'bg-green-400/20 text-green-100' 
                : 'bg-red-400/20 text-red-100'
            }`}>
              {trend.positive ? '+' : ''}{trend.value}%
            </span>
            <span className="text-white/70 text-xs">{trend.label}</span>
          </div>
        )}
        
        {children}
      </div>
    </div>
  )
}
