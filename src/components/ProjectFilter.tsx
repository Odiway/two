'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'

interface ProjectFilterProps {
  onSearchChange: (search: string) => void
  onStatusChange: (status: string) => void
  onPriorityChange: (priority: string) => void
}

export default function ProjectFilter({
  onSearchChange,
  onStatusChange,
  onPriorityChange,
}: ProjectFilterProps) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [priority, setPriority] = useState('')

  const handleSearchChange = (value: string) => {
    setSearch(value)
    onSearchChange(value)
  }

  const handleStatusChange = (value: string) => {
    setStatus(value)
    onStatusChange(value)
  }

  const handlePriorityChange = (value: string) => {
    setPriority(value)
    onPriorityChange(value)
  }

  return (
    <div className='bg-white shadow rounded-lg mb-6'>
      <div className='p-6'>
        <div className='flex flex-col sm:flex-row gap-4'>
          <div className='flex-1'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
              <input
                type='text'
                placeholder='Proje ara...'
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
              />
            </div>
          </div>
          <div className='flex gap-3'>
            <select
              value={status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className='px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
            >
              <option value=''>Tüm Durumlar</option>
              <option value='PLANNING'>Planlama</option>
              <option value='ACTIVE'>Aktif</option>
              <option value='ON_HOLD'>Beklemede</option>
              <option value='COMPLETED'>Tamamlandı</option>
              <option value='CANCELLED'>İptal Edildi</option>
            </select>
            <select
              value={priority}
              onChange={(e) => handlePriorityChange(e.target.value)}
              className='px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
            >
              <option value=''>Tüm Öncelikler</option>
              <option value='LOW'>Düşük</option>
              <option value='MEDIUM'>Orta</option>
              <option value='HIGH'>Yüksek</option>
              <option value='URGENT'>Acil</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}
