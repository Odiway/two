'use client'

import { useState } from 'react'
import Link from 'next/link'
import ProjectFilter from '@/components/ProjectFilter'
import { formatDate } from '@/lib/utils'
import {
  Calendar,
  Users,
  Target,
  AlertTriangle,
  Clock,
  Zap,
  Plus,
} from 'lucide-react'

interface Project {
  id: string
  name: string
  description: string | null
  status: string
  priority: string
  startDate: Date | string | null
  endDate: Date | string | null
  createdAt: Date | string
  updatedAt: Date | string
  tasks: Array<{
    id: string
    title: string
    description?: string | null
    status: string
    priority: string
    endDate: Date | string | null
    projectId: string
    createdAt: Date | string
    updatedAt: Date | string
    assignedId?: string | null
    startDate?: Date | string | null
    workflowStepId?: string | null
  }>
  members: Array<{
    user: {
      id: string
      name: string
      email: string
    }
  }>
}

interface ProjectsListProps {
  projects: Project[]
}

// Proje durumuna göre renk sınıfları
function getProjectStatusColor(status: string) {
  switch (status) {
    case 'PLANNING':
      return {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        border: 'border-yellow-300',
        accent: 'bg-yellow-500',
        gradient: 'from-yellow-400 to-orange-500',
      }
    case 'IN_PROGRESS':
      return {
        bg: 'bg-blue-100',
        text: 'text-blue-800',
        border: 'border-blue-300',
        accent: 'bg-blue-500',
        gradient: 'from-blue-400 to-indigo-500',
      }
    case 'REVIEW':
      return {
        bg: 'bg-purple-100',
        text: 'text-purple-800',
        border: 'border-purple-300',
        accent: 'bg-purple-500',
        gradient: 'from-purple-400 to-pink-500',
      }
    case 'COMPLETED':
      return {
        bg: 'bg-green-100',
        text: 'text-green-800',
        border: 'border-green-300',
        accent: 'bg-green-500',
        gradient: 'from-green-400 to-emerald-500',
      }
    case 'ON_HOLD':
      return {
        bg: 'bg-gray-100',
        text: 'text-gray-800',
        border: 'border-gray-300',
        accent: 'bg-gray-500',
        gradient: 'from-gray-400 to-slate-500',
      }
    default:
      return {
        bg: 'bg-gray-100',
        text: 'text-gray-800',
        border: 'border-gray-300',
        accent: 'bg-gray-500',
        gradient: 'from-gray-400 to-slate-500',
      }
  }
}

// Öncelik seviyesine göre renk sınıfları
function getProjectPriorityColor(priority: string) {
  switch (priority) {
    case 'LOW':
      return {
        bg: 'bg-green-50',
        text: 'text-green-700',
        border: 'border-green-200',
        dot: 'bg-green-400',
        icon: '🟢',
      }
    case 'MEDIUM':
      return {
        bg: 'bg-yellow-50',
        text: 'text-yellow-700',
        border: 'border-yellow-200',
        dot: 'bg-yellow-400',
        icon: '🟡',
      }
    case 'HIGH':
      return {
        bg: 'bg-red-50',
        text: 'text-red-700',
        border: 'border-red-200',
        dot: 'bg-red-400',
        icon: '🔴',
      }
    default:
      return {
        bg: 'bg-gray-50',
        text: 'text-gray-700',
        border: 'border-gray-200',
        dot: 'bg-gray-400',
        icon: '⚪',
      }
  }
}

// Durum metinleri
function getStatusText(status: string) {
  switch (status) {
    case 'PLANNING':
      return 'Planlama'
    case 'IN_PROGRESS':
      return 'Devam Ediyor'
    case 'REVIEW':
      return 'İncelemede'
    case 'COMPLETED':
      return 'Tamamlandı'
    case 'ON_HOLD':
      return 'Beklemede'
    default:
      return status
  }
}

// Öncelik metinleri
function getPriorityText(priority: string) {
  switch (priority) {
    case 'LOW':
      return 'Düşük'
    case 'MEDIUM':
      return 'Orta'
    case 'HIGH':
      return 'Yüksek'
    default:
      return priority
  }
}

export default function ProjectsList({ projects }: ProjectsListProps) {
  const [filteredProjects, setFilteredProjects] = useState(projects)

  const handleSearch = (search: string) => {
    filterProjects(search, currentStatus, currentPriority)
  }

  const [currentStatus, setCurrentStatus] = useState('')
  const [currentPriority, setCurrentPriority] = useState('')

  const handleStatusChange = (status: string) => {
    setCurrentStatus(status)
    filterProjects(currentSearch, status, currentPriority)
  }

  const handlePriorityChange = (priority: string) => {
    setCurrentPriority(priority)
    filterProjects(currentSearch, currentStatus, priority)
  }

  const [currentSearch, setCurrentSearch] = useState('')

  const filterProjects = (search: string, status: string, priority: string) => {
    setCurrentSearch(search)
    let filtered = projects

    if (search) {
      filtered = filtered.filter(
        (project) =>
          project.name.toLowerCase().includes(search.toLowerCase()) ||
          project.description?.toLowerCase().includes(search.toLowerCase())
      )
    }

    if (status) {
      filtered = filtered.filter((project) => project.status === status)
    }

    if (priority) {
      filtered = filtered.filter((project) => project.priority === priority)
    }

    setFilteredProjects(filtered)
  }

  return (
    <>
      <ProjectFilter
        onSearchChange={handleSearch}
        onStatusChange={handleStatusChange}
        onPriorityChange={handlePriorityChange}
      />

      {/* Enhanced Projects Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
        {filteredProjects.map((project) => {
          const completedTasks = project.tasks.filter(
            (task: Project['tasks'][0]) => task.status === 'COMPLETED'
          ).length
          const totalTasks = project.tasks.length
          const progressPercentage =
            totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
          const statusColor = getProjectStatusColor(project.status)
          const priorityColor = getProjectPriorityColor(project.priority)

          const activeTasks = project.tasks.filter(
            (task: Project['tasks'][0]) => task.status === 'IN_PROGRESS'
          ).length
          const overdueTasks = project.tasks.filter(
            (task: Project['tasks'][0]) => {
              if (!task.endDate) return false
              return (
                new Date(task.endDate) < new Date() &&
                task.status !== 'COMPLETED'
              )
            }
          ).length

          const isOverdue =
            project.endDate &&
            new Date(project.endDate) < new Date() &&
            project.status !== 'COMPLETED'

          return (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <div className='group relative bg-white shadow-lg hover:shadow-2xl transition-all duration-300 rounded-2xl overflow-hidden border border-gray-100 hover:border-blue-200 transform hover:scale-105'>
                {/* Gradient Header */}
                <div
                  className={`h-2 bg-gradient-to-r ${statusColor.gradient}`}
                />

                {/* Priority Indicator */}
                <div
                  className={`absolute top-4 right-4 w-3 h-3 rounded-full ${priorityColor.dot} shadow-lg`}
                />

                <div className='p-6'>
                  {/* Project Header */}
                  <div className='flex items-start justify-between mb-4'>
                    <div className='flex-1'>
                      <h3 className='text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-200 line-clamp-2'>
                        {project.name}
                      </h3>
                      <div className='flex items-center space-x-2 mt-2'>
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${statusColor.bg} ${statusColor.text} border ${statusColor.border}`}
                        >
                          {getStatusText(project.status)}
                        </span>
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${priorityColor.bg} ${priorityColor.text} border ${priorityColor.border}`}
                        >
                          <span className='mr-1'>{priorityColor.icon}</span>
                          {getPriorityText(project.priority)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className='text-gray-600 text-sm mb-6 line-clamp-3 leading-relaxed'>
                    {project.description ||
                      'Bu proje için henüz açıklama eklenmemiş.'}
                  </p>

                  {/* Stats */}
                  <div className='grid grid-cols-2 gap-4 mb-6'>
                    <div className='bg-blue-50 rounded-lg p-3'>
                      <div className='flex items-center space-x-2'>
                        <Users className='w-4 h-4 text-blue-600' />
                        <span className='text-xs font-medium text-blue-700'>
                          Üyeler
                        </span>
                      </div>
                      <p className='text-lg font-bold text-blue-900 mt-1'>
                        {project.members.length}
                      </p>
                    </div>

                    <div className='bg-purple-50 rounded-lg p-3'>
                      <div className='flex items-center space-x-2'>
                        <Target className='w-4 h-4 text-purple-600' />
                        <span className='text-xs font-medium text-purple-700'>
                          Görevler
                        </span>
                      </div>
                      <p className='text-lg font-bold text-purple-900 mt-1'>
                        {totalTasks}
                      </p>
                    </div>
                  </div>

                  {/* Progress Section */}
                  <div className='mb-6'>
                    <div className='flex justify-between items-center mb-2'>
                      <span className='text-sm font-medium text-gray-700'>
                        İlerleme
                      </span>
                      <span className='text-sm font-bold text-gray-900'>
                        {Math.round(progressPercentage)}%
                      </span>
                    </div>
                    <div className='w-full bg-gray-200 rounded-full h-3 overflow-hidden'>
                      <div
                        className={`h-3 rounded-full transition-all duration-500 bg-gradient-to-r ${statusColor.gradient}`}
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                    <div className='flex justify-between text-xs text-gray-500 mt-1'>
                      <span>{completedTasks} tamamlandı</span>
                      <span>{totalTasks - completedTasks} kaldı</span>
                    </div>
                  </div>

                  {/* Alert indicators */}
                  {(activeTasks > 0 || overdueTasks > 0) && (
                    <div className='flex items-center space-x-3 mb-4'>
                      {activeTasks > 0 && (
                        <div className='flex items-center space-x-1 text-blue-600'>
                          <Zap className='w-4 h-4' />
                          <span className='text-xs font-medium'>
                            {activeTasks} aktif
                          </span>
                        </div>
                      )}
                      {overdueTasks > 0 && (
                        <div className='flex items-center space-x-1 text-red-600'>
                          <AlertTriangle className='w-4 h-4' />
                          <span className='text-xs font-medium'>
                            {overdueTasks} gecikmiş
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Footer */}
                  <div className='flex justify-between items-center pt-4 border-t border-gray-100'>
                    <div className='flex items-center space-x-1 text-gray-500'>
                      <Calendar className='w-4 h-4' />
                      <span className='text-xs'>
                        {project.endDate
                          ? formatDate(project.endDate)
                          : 'Tarih belirlenmemiş'}
                      </span>
                    </div>

                    {isOverdue && (
                      <div className='flex items-center space-x-1 text-red-600 bg-red-50 px-2 py-1 rounded-full'>
                        <Clock className='w-3 h-3' />
                        <span className='text-xs font-bold'>GECİKMİŞ</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Hover overlay */}
                <div className='absolute inset-0 bg-gradient-to-r from-blue-600/5 to-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none' />
              </div>
            </Link>
          )
        })}
      </div>

      {filteredProjects.length === 0 && (
        <div className='col-span-full'>
          <div className='text-center py-16 bg-white rounded-2xl shadow-lg border border-gray-100'>
            <div className='w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6'>
              <Target className='w-12 h-12 text-gray-400' />
            </div>
            <h3 className='text-xl font-semibold text-gray-900 mb-2'>
              Proje bulunamadı
            </h3>
            <p className='text-gray-500 max-w-md mx-auto mb-6'>
              Filtrelere uygun proje bulunamadı. Filtreleri temizleyerek tekrar
              deneyin veya yeni bir proje oluşturun.
            </p>
            <Link
              href='/projects/new'
              className='inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200'
            >
              <Plus className='w-5 h-5 mr-2' />
              Yeni Proje Oluştur
            </Link>
          </div>
        </div>
      )}
    </>
  )
}
