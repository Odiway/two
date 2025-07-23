import { Sparkles, Zap, Target, TrendingUp, Clock, Users } from 'lucide-react'

interface FloatingElementProps {
  className?: string
  delay?: number
}

export function FloatingOrb({ className = '', delay = 0 }: FloatingElementProps) {
  return (
    <div 
      className={`absolute rounded-full bg-gradient-to-r from-blue-400/20 to-purple-400/20 animate-pulse ${className}`}
      style={{
        animationDelay: `${delay}s`,
        filter: 'blur(1px)'
      }}
    />
  )
}

export function FloatingIcon({ className = '', delay = 0 }: FloatingElementProps) {
  const icons = [Sparkles, Zap, Target, TrendingUp, Clock, Users]
  const IconComponent = icons[Math.floor(Math.random() * icons.length)]
  
  return (
    <div 
      className={`absolute text-blue-400/30 animate-bounce ${className}`}
      style={{
        animationDelay: `${delay}s`,
        animationDuration: '3s'
      }}
    >
      <IconComponent className="w-6 h-6" />
    </div>
  )
}

export function GradientBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50" />
      
      {/* Floating orbs */}
      <FloatingOrb className="w-72 h-72 top-10 -left-20" delay={0} />
      <FloatingOrb className="w-96 h-96 top-1/2 -right-32" delay={2} />
      <FloatingOrb className="w-64 h-64 bottom-20 left-1/3" delay={4} />
      
      {/* Floating icons */}
      <FloatingIcon className="top-20 left-1/4" delay={1} />
      <FloatingIcon className="top-1/3 right-1/4" delay={3} />
      <FloatingIcon className="bottom-1/3 left-1/2" delay={5} />
      
      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}
      />
    </div>
  )
}
