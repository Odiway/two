'use client'

import { Filter } from 'lucide-react'
import Link from 'next/link'

interface CalendarFilterProps {
  projects: { id: string; name: string }[]
  selectedProject?: string
}

export default function CalendarFilter({
  projects,
  selectedProject,
}: CalendarFilterProps) {
  const handleProjectChange = (projectId: string) => {
    if (projectId) {
      window.location.href = `/calendar?project=${projectId}`
    } else {
      window.location.href = '/calendar'
    }
  }

  return (
    <div className='flex items-center space-x-3'>
      <select
        className='px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
        value={selectedProject || ''}
        onChange={(e) => handleProjectChange(e.target.value)}
      >
        <option value=''>Tüm Projeler</option>
        {projects.map((project) => (
          <option key={project.id} value={project.id}>
            {project.name}
          </option>
        ))}
      </select>
      <Link
        href='/calendar'
        className='inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50'
      >
        <Filter className='w-4 h-4 mr-2' />
        Filtreleri Temizle
      </Link>
    </div>
  )
}
