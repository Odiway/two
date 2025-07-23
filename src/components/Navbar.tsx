'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  FolderKanban,
  Calendar,
  Users,
  BarChart3,
  FileText,
  Bell,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Takvim', href: '/calendar', icon: Calendar },
  { name: 'Projeler', href: '/projects', icon: FolderKanban },
  { name: 'Takım', href: '/team', icon: Users },
  { name: 'İş Gücü', href: '/workload', icon: BarChart3 },
  { name: 'Raporlar', href: '/reports', icon: FileText },
  { name: 'Bildirimler', href: '/notifications', icon: Bell },
]

export default function Navbar() {
  const pathname = usePathname()

  return (
    <nav className='bg-blue-900 shadow-lg border-b border-blue-800'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between h-16'>
          <div className='flex'>
            <div className='flex-shrink-0 flex items-center'>
              <h1 className='text-xl font-bold text-white'>
                Batarya Üretim Departmanı
              </h1>
            </div>
            <div className='hidden sm:ml-8 sm:flex sm:space-x-1'>
              {navigation.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'inline-flex items-center px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 relative group',
                      isActive
                        ? 'bg-blue-700 text-white shadow-md border border-blue-600'
                        : 'text-blue-100 hover:bg-blue-800 hover:text-white hover:shadow-sm'
                    )}
                  >
                    <Icon className='w-4 h-4 mr-2 transition-transform group-hover:scale-110' />
                    {item.name}
                    {isActive && (
                      <div className='absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full'></div>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
          <div className='flex items-center'>
            <div className='flex-shrink-0'>
              <div className='w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center shadow-lg ring-2 ring-blue-400 hover:ring-blue-300 transition-all duration-300'>
                <span className='text-white text-sm font-semibold'>T</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
