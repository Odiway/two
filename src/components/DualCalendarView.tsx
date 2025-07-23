'use client'

import React from 'react'
import EnhancedCalendar from '@/components/EnhancedCalendar'
import EnhancedCalendar2 from '@/components/EnhancedCalendar2'

interface DualCalendarViewProps {
  tasks: any[]
  project: any
  users: any[]
  onTaskUpdate: (taskId: string, updates: any) => void
  onProjectReschedule: (rescheduleType: string) => void
}

function DualCalendarView({
  tasks,
  project,
  users,
  onTaskUpdate,
  onProjectReschedule,
}: DualCalendarViewProps) {
  return (
    <div className='space-y-8'>
      {/* First Calendar - Maximum Workload */}
      <div className='bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl'>
        <h2 className='text-3xl font-bold text-gray-800 mb-6 text-center'>
          📊 Maksimum Doluluk Takvimi
        </h2>
        <p className='text-gray-600 text-center mb-6'>
          Her gün için en yüksek çalışan doluluk oranını gösterir
        </p>
        <EnhancedCalendar
          tasks={tasks}
          project={project}
          users={users}
          onTaskUpdate={onTaskUpdate}
          onProjectReschedule={onProjectReschedule}
        />
      </div>

      {/* Second Calendar - Average Workload */}
      <div className='bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl'>
        <h2 className='text-3xl font-bold text-gray-800 mb-6 text-center'>
          📈 Ortalama Doluluk Takvimi
        </h2>
        <p className='text-gray-600 text-center mb-6'>
          Her gün için ortalama çalışan doluluk oranını gösterir
        </p>
        <EnhancedCalendar2
          tasks={tasks}
          project={project}
          users={users}
          onTaskUpdate={onTaskUpdate}
          onProjectReschedule={onProjectReschedule}
          calculationMode='average'
          title='Ortalama Doluluk Takvimi'
        />
      </div>

      {/* Optional Third Calendar - Individual User Focus */}
      <div className='bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl'>
        <h2 className='text-3xl font-bold text-gray-800 mb-6 text-center'>
          👤 Bireysel Doluluk Takvimi
        </h2>
        <p className='text-gray-600 text-center mb-6'>
          Belirli bir çalışanın doluluk oranını gösterir
        </p>
        <EnhancedCalendar2
          tasks={tasks}
          project={project}
          users={users}
          onTaskUpdate={onTaskUpdate}
          onProjectReschedule={onProjectReschedule}
          calculationMode='individual'
          title='Bireysel Doluluk Takvimi'
        />
      </div>

      {/* Summary Statistics */}
      <div className='bg-white rounded-xl shadow-lg p-6 border border-gray-200'>
        <h3 className='text-xl font-bold text-gray-800 mb-4 text-center'>
          📋 Doluluk Karşılaştırması
        </h3>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <div className='text-center p-4 bg-blue-50 rounded-lg'>
            <h4 className='font-semibold text-blue-800'>Maksimum Doluluk</h4>
            <p className='text-sm text-blue-600 mt-2'>
              En yoğun çalışanın doluluk oranını gösterir. Kaynak darboğazlarını
              tespit etmek için idealdir.
            </p>
          </div>
          <div className='text-center p-4 bg-green-50 rounded-lg'>
            <h4 className='font-semibold text-green-800'>Ortalama Doluluk</h4>
            <p className='text-sm text-green-600 mt-2'>
              Tüm çalışanların ortalama doluluk oranını gösterir. Genel takım
              yükünü değerlendirmek için idealdir.
            </p>
          </div>
          <div className='text-center p-4 bg-purple-50 rounded-lg'>
            <h4 className='font-semibold text-purple-800'>Bireysel Doluluk</h4>
            <p className='text-sm text-purple-600 mt-2'>
              Belirli bir çalışanın doluluk oranını gösterir. Kişisel performans
              takibi için idealdir.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DualCalendarView
