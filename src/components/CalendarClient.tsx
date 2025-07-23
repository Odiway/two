'use client'

import React, { useState, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  Target,
  AlertTriangle,
  Zap,
  CheckCircle2,
  Users,
  Filter,
  FolderKanban,
} from 'lucide-react'

interface Task {
  id: string
  title: string
  description?: string | null
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  startDate?: Date | null
  endDate?: Date | null
  projectId: string
  assignedId?: string | null
  createdAt: Date
  updatedAt: Date
  project: {
    id: string
    name: string
  }
  assignedUser?: {
    id: string
    name: string
    email: string
  } | null
  assignedUsers?: {
    id: string
    user: {
      id: string
      name: string
      email: string
    }
  }[]
}

interface Project {
  id: string
  name: string
}

interface CalendarClientProps {
  tasks: Task[]
  projects: Project[]
  selectedProjectId?: string
}

const CalendarClient: React.FC<CalendarClientProps> = ({
  tasks,
  projects,
  selectedProjectId,
}) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [currentDate, setCurrentDate] = useState(new Date())
  // Debug: görevlerin nasıl geldiğini kontrol edelim
  React.useEffect(() => {
    console.log('Gelen görevler:', tasks)
    console.log(
      'Atanan kullanıcılar:',
      tasks.map((t) => ({
        id: t.id,
        title: t.title,
        assignedUser: t.assignedUser,
        assignedId: t.assignedId,
        assignedUsers: t.assignedUsers,
      }))
    )
  }, [tasks])

  // Görevde atanan kullanıcıları alma fonksiyonu
  const getAssignedUsers = (task: Task) => {
    const users = []

    // assignedUser varsa ekle
    if (task.assignedUser) {
      users.push(task.assignedUser)
    }

    // assignedUsers varsa ekle
    if (task.assignedUsers && task.assignedUsers.length > 0) {
      task.assignedUsers.forEach((assignment) => {
        users.push(assignment.user)
      })
    }

    // Duplicate'leri kaldır
    const uniqueUsers = users.filter(
      (user, index, self) => index === self.findIndex((u) => u.id === user.id)
    )

    return uniqueUsers
  }

  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('ALL')
  const [filterPriority, setFilterPriority] = useState<string>('ALL')

  // Proje seçme fonksiyonu
  const handleProjectChange = (projectId: string) => {
    const params = new URLSearchParams(searchParams.toString())

    if (projectId === 'all') {
      params.delete('project')
    } else {
      params.set('project', projectId)
    }

    router.push(`/calendar?${params.toString()}`)
  }

  // Seçili projenin adını bulma
  const selectedProject = selectedProjectId
    ? projects.find((p) => p.id === selectedProjectId)
    : null

  const monthNames = [
    'Ocak',
    'Şubat',
    'Mart',
    'Nisan',
    'Mayıs',
    'Haziran',
    'Temmuz',
    'Ağustos',
    'Eylül',
    'Ekim',
    'Kasım',
    'Aralık',
  ]
  const dayNames = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']

  const handlePrevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    )
  }

  const handleNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    )
  }

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay()
    return firstDay === 0 ? 6 : firstDay - 1
  }

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (selectedProjectId && task.projectId !== selectedProjectId)
        return false
      if (filterStatus !== 'ALL' && task.status !== filterStatus) return false
      if (filterPriority !== 'ALL' && task.priority !== filterPriority)
        return false
      return true
    })
  }, [tasks, selectedProjectId, filterStatus, filterPriority])

  const getTasksForDate = (date: Date) => {
    return filteredTasks.filter((task) => {
      const taskStart = task.startDate ? new Date(task.startDate) : null
      const taskEnd = task.endDate ? new Date(task.endDate) : null
      const checkDate = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      )

      if (taskStart && taskEnd) {
        const start = new Date(
          taskStart.getFullYear(),
          taskStart.getMonth(),
          taskStart.getDate()
        )
        const end = new Date(
          taskEnd.getFullYear(),
          taskEnd.getMonth(),
          taskEnd.getDate()
        )
        return checkDate >= start && checkDate <= end
      } else if (taskStart) {
        const start = new Date(
          taskStart.getFullYear(),
          taskStart.getMonth(),
          taskStart.getDate()
        )
        return checkDate.getTime() === start.getTime()
      } else if (taskEnd) {
        const end = new Date(
          taskEnd.getFullYear(),
          taskEnd.getMonth(),
          taskEnd.getDate()
        )
        return checkDate.getTime() === end.getTime()
      }
      return false
    })
  }

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'TODO':
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-700',
          border: 'border-gray-300',
          badge: 'bg-gray-500',
        }
      case 'IN_PROGRESS':
        return {
          bg: 'bg-blue-100',
          text: 'text-blue-700',
          border: 'border-blue-300',
          badge: 'bg-blue-500',
        }
      case 'REVIEW':
        return {
          bg: 'bg-purple-100',
          text: 'text-purple-700',
          border: 'border-purple-300',
          badge: 'bg-purple-500',
        }
      case 'COMPLETED':
        return {
          bg: 'bg-green-100',
          text: 'text-green-700',
          border: 'border-green-300',
          badge: 'bg-green-500',
        }
      default:
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-700',
          border: 'border-gray-300',
          badge: 'bg-gray-500',
        }
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'TODO':
        return 'Bekliyor'
      case 'IN_PROGRESS':
        return 'Devam Ediyor'
      case 'REVIEW':
        return 'İncelemede'
      case 'COMPLETED':
        return 'Tamamlandı'
      default:
        return status
    }
  }

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'LOW':
        return 'Düşük'
      case 'MEDIUM':
        return 'Orta'
      case 'HIGH':
        return 'Yüksek'
      case 'URGENT':
        return 'Acil'
      default:
        return priority
    }
  }

  const getTaskPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW':
        return {
          bg: 'bg-green-50',
          text: 'text-green-600',
          dot: 'bg-green-400',
        }
      case 'MEDIUM':
        return {
          bg: 'bg-yellow-50',
          text: 'text-yellow-600',
          dot: 'bg-yellow-400',
        }
      case 'HIGH':
        return { bg: 'bg-red-50', text: 'text-red-600', dot: 'bg-red-400' }
      case 'URGENT':
        return { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-600' }
      default:
        return { bg: 'bg-gray-50', text: 'text-gray-600', dot: 'bg-gray-400' }
    }
  }

  const getTaskTypeColor = (task: Task, date: Date) => {
    const taskStart = task.startDate ? new Date(task.startDate) : null
    const taskEnd = task.endDate ? new Date(task.endDate) : null
    const isStartDate =
      taskStart && taskStart.toDateString() === date.toDateString()
    const isEndDate = taskEnd && taskEnd.toDateString() === date.toDateString()

    if (isStartDate && isEndDate) {
      return {
        bg: 'bg-indigo-100',
        text: 'text-indigo-700',
        border: 'border-l-4 border-indigo-500',
        icon: '🎯',
      }
    } else if (isStartDate) {
      return {
        bg: 'bg-emerald-100',
        text: 'text-emerald-700',
        border: 'border-l-4 border-emerald-500',
        icon: '🚀',
      }
    } else if (isEndDate) {
      return {
        bg: 'bg-rose-100',
        text: 'text-rose-700',
        border: 'border-l-4 border-rose-500',
        icon: '🏁',
      }
    } else {
      return {
        bg: 'bg-sky-100',
        text: 'text-sky-700',
        border: 'border-l-4 border-sky-400',
        icon: '⚡',
      }
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return <Zap className='w-4 h-4 text-red-600' />
      case 'HIGH':
        return <AlertTriangle className='w-4 h-4 text-orange-600' />
      case 'MEDIUM':
        return <Clock className='w-4 h-4 text-yellow-600' />
      default:
        return <CheckCircle2 className='w-4 h-4 text-green-600' />
    }
  }

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate)
    const firstDay = getFirstDayOfMonth(currentDate)
    const days = []

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className='p-4'></div>)
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        day
      )
      const tasksForDay = getTasksForDate(date)
      const isToday = date.toDateString() === new Date().toDateString()
      const isSelected =
        selectedDate && date.toDateString() === selectedDate.toDateString()

      days.push(
        <div
          key={day}
          onClick={() => setSelectedDate(date)}
          className={`min-h-[140px] p-2 border border-gray-200 rounded-lg cursor-pointer transition-all
            ${isToday ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'}
            ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
        >
          <div className='flex justify-between items-start mb-2'>
            <span
              className={`text-sm font-semibold ${
                isToday
                  ? 'bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center'
                  : 'text-gray-700'
              }`}
            >
              {day}
            </span>
            {tasksForDay.length > 0 && (
              <span className='text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full font-medium'>
                {tasksForDay.length}
              </span>
            )}
          </div>
          <div className='space-y-1'>
            {tasksForDay.slice(0, 3).map((task) => {
              const typeColor = getTaskTypeColor(task, date)
              const statusColor = getTaskStatusColor(task.status)
              const priorityColor = getTaskPriorityColor(task.priority)
              const today = new Date()
              const isOverdue =
                task.endDate &&
                new Date(task.endDate) < today &&
                task.status !== 'COMPLETED'

              return (
                <div
                  key={task.id}
                  className={`text-xs rounded-lg p-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
                    isOverdue
                      ? 'bg-red-100 border border-red-300 animate-pulse'
                      : `${typeColor.bg} ${typeColor.border}`
                  } ${
                    getAssignedUsers(task).length === 0
                      ? 'ring-2 ring-yellow-400 ring-opacity-50'
                      : ''
                  } relative overflow-hidden`}
                  title={(() => {
                    const assignedUsers = getAssignedUsers(task)
                    const userInfo =
                      assignedUsers.length > 0
                        ? ` - Sorumlu: ${assignedUsers
                            .map((u) => `${u.name} (${u.email})`)
                            .join(', ')}`
                        : ' - Atanmamış'
                    return `${task.title} - ${
                      task.project.name
                    } - ${getStatusText(task.status)} - ${getPriorityText(
                      task.priority
                    )}${userInfo}`
                  })()}
                >
                  {/* Priority dot and status badge */}
                  <div className='flex justify-between items-start mb-1'>
                    <div
                      className={`w-2 h-2 rounded-full ${priorityColor.dot}`}
                    ></div>
                    <div
                      className={`px-1.5 py-0.5 rounded-full text-[8px] font-bold text-white ${statusColor.badge}`}
                    >
                      {getStatusText(task.status).slice(0, 3).toUpperCase()}
                    </div>
                  </div>

                  <div className='flex items-center justify-between mb-1'>
                    <div
                      className={`font-medium truncate flex-1 ${
                        typeColor.text
                      } ${isOverdue ? 'text-red-700' : ''}`}
                    >
                      <span className='mr-1'>{typeColor.icon}</span>
                      {task.title}
                    </div>
                  </div>

                  <div
                    className={`text-[10px] truncate text-gray-600 font-medium mb-1`}
                  >
                    📁 {task.project.name}
                  </div>

                  {/* Assigned user */}
                  {(() => {
                    const assignedUsers = getAssignedUsers(task)
                    if (assignedUsers.length > 0) {
                      return (
                        <div className='text-[9px] truncate text-blue-600 font-medium flex items-center'>
                          <Users className='w-2.5 h-2.5 mr-1' />
                          <span
                            className='truncate'
                            title={assignedUsers
                              .map((u) => `${u.name} (${u.email})`)
                              .join(', ')}
                          >
                            {assignedUsers.length === 1
                              ? assignedUsers[0].name
                              : `${assignedUsers[0].name} +${
                                  assignedUsers.length - 1
                                }`}
                          </span>
                        </div>
                      )
                    } else {
                      return (
                        <div className='text-[9px] truncate text-red-600 font-medium flex items-center'>
                          <AlertTriangle className='w-2.5 h-2.5 mr-1' />
                          <span>Atanmamış</span>
                        </div>
                      )
                    }
                  })()}

                  {/* Priority indicator */}
                  <div className='text-[8px] mt-1 flex items-center'>
                    <span
                      className={`w-1 h-1 rounded-full mr-1 ${priorityColor.dot}`}
                    ></span>
                    <span className={priorityColor.text}>
                      {getPriorityText(task.priority)}
                    </span>
                  </div>

                  {isOverdue && (
                    <div className='absolute inset-0 bg-red-500/20 flex items-center justify-center'>
                      <span className='text-red-700 font-bold text-[8px]'>
                        GECİKMİŞ
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
            {tasksForDay.length > 3 && (
              <div className='text-xs text-gray-500 text-center py-1 bg-gray-100 rounded-md border border-gray-200 hover:bg-gray-200 transition-colors cursor-pointer'>
                <span className='font-medium'>
                  +{tasksForDay.length - 3} görev daha
                </span>
              </div>
            )}
          </div>
        </div>
      )
    }

    return days
  }

  const tasksStats = useMemo(() => {
    const stats = {
      total: filteredTasks.length,
      todo: filteredTasks.filter((t) => t.status === 'TODO').length,
      inProgress: filteredTasks.filter((t) => t.status === 'IN_PROGRESS')
        .length,
      review: filteredTasks.filter((t) => t.status === 'REVIEW').length,
      completed: filteredTasks.filter((t) => t.status === 'COMPLETED').length,
    }
    return stats
  }, [filteredTasks])

  return (
    <div className='max-w-7xl mx-auto py-8 sm:px-6 lg:px-8'>
      <div className='px-4 py-6 sm:px-0'>
        <div className='flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8'>
          <div className='space-y-2'>
            <div className='flex items-center space-x-3'>
              <div className='p-2 bg-blue-600 rounded-xl'>
                <Calendar className='w-7 h-7 text-white' />
              </div>
              <div>
                <h1 className='text-3xl font-bold text-gray-900'>
                  Proje Takvimi
                  {selectedProject && (
                    <span className='text-lg font-medium text-blue-600 ml-3'>
                      - {selectedProject.name}
                    </span>
                  )}
                  {!selectedProjectId && (
                    <span className='text-lg font-medium text-gray-500 ml-3'>
                      - Tüm Projeler
                    </span>
                  )}
                  <span className='text-sm font-normal text-gray-400 ml-2'>
                    ({filteredTasks.length} görev)
                  </span>
                </h1>
                <p className='text-gray-600'>
                  {selectedProject
                    ? `${selectedProject.name} projesinin görevlerini ve deadline'larını takip edin`
                    : 'Tüm projelerin görevlerini ve son teslim tarihlerinizi takip edin'}
                </p>
              </div>
            </div>
          </div>

          <div className='flex flex-col lg:flex-row space-y-3 lg:space-y-0 lg:space-x-3 mt-4 lg:mt-0'>
            {/* Proje Seçici */}
            <div className='flex items-center space-x-2 bg-white rounded-lg p-1 shadow-md border'>
              <FolderKanban className='w-4 h-4 text-gray-500 ml-2' />
              <select
                value={selectedProjectId || 'all'}
                onChange={(e) => handleProjectChange(e.target.value)}
                className='bg-transparent border-none outline-none text-sm font-medium text-gray-700 cursor-pointer pr-2'
              >
                <option value='all'>Tüm Projeler</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtreleme Butonları */}
            <div className='flex space-x-3'>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className='px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500'
              >
                <option value='ALL'>Tüm Durumlar</option>
                <option value='TODO'>Yapılacak</option>
                <option value='IN_PROGRESS'>Devam Eden</option>
                <option value='REVIEW'>İnceleme</option>
                <option value='COMPLETED'>Tamamlandı</option>
              </select>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className='px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500'
              >
                <option value='ALL'>Tüm Öncelikler</option>
                <option value='URGENT'>Acil</option>
                <option value='HIGH'>Yüksek</option>
                <option value='MEDIUM'>Orta</option>
                <option value='LOW'>Düşük</option>
              </select>
            </div>
          </div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-6 gap-4 mb-8'>
          {/* Proje Bilgisi */}
          <div className='bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-lg border border-gray-100 p-6 text-white'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-indigo-100'>
                  Aktif Proje
                </p>
                <p className='text-2xl font-bold'>
                  {selectedProject ? selectedProject.name : 'Tüm Projeler'}
                </p>
                <p className='text-xs text-indigo-200 mt-1'>
                  {selectedProject
                    ? 'Seçili proje görevleri'
                    : `${projects.length} proje toplam`}
                </p>
              </div>
              <div className='p-3 bg-white bg-opacity-20 rounded-full'>
                <FolderKanban className='w-6 h-6 text-white' />
              </div>
            </div>
          </div>

          <div className='bg-white rounded-xl shadow-lg border border-gray-100 p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>
                  Toplam Görev
                </p>
                <p className='text-3xl font-bold text-gray-900'>
                  {tasksStats.total}
                </p>
              </div>
              <div className='p-3 bg-blue-100 rounded-full'>
                <Target className='w-6 h-6 text-blue-600' />
              </div>
            </div>
          </div>

          <div className='bg-white rounded-xl shadow-lg border border-gray-100 p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>Yapılacak</p>
                <p className='text-3xl font-bold text-gray-900'>
                  {tasksStats.todo}
                </p>
              </div>
              <div className='p-3 bg-gray-100 rounded-full'>
                <Clock className='w-6 h-6 text-gray-600' />
              </div>
            </div>
          </div>

          <div className='bg-white rounded-xl shadow-lg border border-gray-100 p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>Devam Eden</p>
                <p className='text-3xl font-bold text-blue-600'>
                  {tasksStats.inProgress}
                </p>
              </div>
              <div className='p-3 bg-blue-100 rounded-full'>
                <Zap className='w-6 h-6 text-blue-600' />
              </div>
            </div>
          </div>

          <div className='bg-white rounded-xl shadow-lg border border-gray-100 p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>İnceleme</p>
                <p className='text-3xl font-bold text-yellow-600'>
                  {tasksStats.review}
                </p>
              </div>
              <div className='p-3 bg-yellow-100 rounded-full'>
                <AlertTriangle className='w-6 h-6 text-yellow-600' />
              </div>
            </div>
          </div>

          <div className='bg-white rounded-xl shadow-lg border border-gray-100 p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>Tamamlandı</p>
                <p className='text-3xl font-bold text-green-600'>
                  {tasksStats.completed}
                </p>
              </div>
              <div className='p-3 bg-green-100 rounded-full'>
                <CheckCircle2 className='w-6 h-6 text-green-600' />
              </div>
            </div>
          </div>
        </div>

        <div className='bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden'>
          <div className='bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-4'>
                <button
                  onClick={handlePrevMonth}
                  className='p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors'
                >
                  <ChevronLeft className='w-5 h-5 text-white' />
                </button>
                <h2 className='text-2xl font-bold text-white'>
                  {monthNames[currentDate.getMonth()]}{' '}
                  {currentDate.getFullYear()}
                </h2>
                <button
                  onClick={handleNextMonth}
                  className='p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors'
                >
                  <ChevronRight className='w-5 h-5 text-white' />
                </button>
              </div>
            </div>
          </div>

          <div className='p-6'>
            <div className='grid grid-cols-7 gap-2 mb-4'>
              {dayNames.map((day) => (
                <div
                  key={day}
                  className='text-center text-sm font-semibold text-gray-700 py-2'
                >
                  {day}
                </div>
              ))}
            </div>
            <div className='grid grid-cols-7 gap-2'>{renderCalendarDays()}</div>
          </div>
        </div>

        {selectedDate && (
          <div className='mt-8 bg-white rounded-2xl shadow-xl border border-gray-100 p-6'>
            <h3 className='text-xl font-bold text-gray-900 mb-4'>
              {selectedDate.toLocaleDateString('tr-TR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}{' '}
              Görevleri
            </h3>
            <div className='space-y-4'>
              {getTasksForDate(selectedDate).length === 0 ? (
                <p className='text-gray-500 text-center py-8'>
                  Bu tarih için görev bulunmuyor
                </p>
              ) : (
                getTasksForDate(selectedDate).map((task) => {
                  const statusColor = getTaskStatusColor(task.status)
                  const priorityColor = getTaskPriorityColor(task.priority)
                  const typeColor = getTaskTypeColor(task, selectedDate)
                  const today = new Date()
                  const isOverdue =
                    task.endDate &&
                    new Date(task.endDate) < today &&
                    task.status !== 'COMPLETED'

                  return (
                    <div
                      key={task.id}
                      className={`border rounded-xl p-6 hover:shadow-lg transition-all duration-300 ${
                        isOverdue
                          ? 'border-red-300 bg-red-50'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div className='flex items-start justify-between mb-4'>
                        <div className='flex-1'>
                          <div className='flex items-center space-x-3 mb-3'>
                            <div className='flex items-center space-x-2'>
                              <span className='text-lg'>{typeColor.icon}</span>
                              <h4 className='text-lg font-bold text-gray-900'>
                                {task.title}
                              </h4>
                            </div>
                            {isOverdue && (
                              <span className='bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse'>
                                ⚠️ GECİKMİŞ
                              </span>
                            )}
                          </div>

                          {/* Status and Priority Row */}
                          <div className='flex items-center space-x-4 mb-4'>
                            <div className='flex items-center space-x-2'>
                              {getPriorityIcon(task.priority)}
                              <span
                                className={`text-sm px-3 py-1 rounded-full font-medium ${priorityColor.bg} ${priorityColor.text}`}
                              >
                                📍 {getPriorityText(task.priority)} Öncelik
                              </span>
                            </div>
                            <div
                              className={`text-sm px-3 py-1 rounded-full font-medium ${statusColor.bg} ${statusColor.text}`}
                            >
                              🎯 {getStatusText(task.status)}
                            </div>
                          </div>

                          {task.description && (
                            <div className='mb-4 p-4 bg-gray-50 rounded-lg border-l-4 border-blue-400'>
                              <h5 className='font-semibold text-gray-800 mb-2'>
                                📝 Açıklama:
                              </h5>
                              <p className='text-sm text-gray-700 leading-relaxed'>
                                {task.description}
                              </p>
                            </div>
                          )}

                          {/* Team and Assignment Details */}
                          <div className='mb-4 bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg border border-indigo-200'>
                            <div className='flex items-center space-x-2 mb-3'>
                              <Users className='w-5 h-5 text-indigo-600' />
                              <span className='font-semibold text-indigo-800'>
                                Takım Bilgileri
                              </span>
                            </div>

                            {(() => {
                              const assignedUsers = getAssignedUsers(task)
                              if (assignedUsers.length > 0) {
                                return (
                                  <div className='space-y-4'>
                                    <div className='bg-white p-4 rounded-lg border border-indigo-100'>
                                      <h6 className='font-semibold text-gray-800 mb-3 flex items-center'>
                                        <span className='w-2 h-2 bg-green-500 rounded-full mr-2'></span>
                                        Atanan Kişiler ({assignedUsers.length})
                                      </h6>
                                      <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                                        {assignedUsers.map((user) => (
                                          <div
                                            key={user.id}
                                            className='p-3 bg-gray-50 rounded-lg border border-gray-200'
                                          >
                                            <div className='flex items-center space-x-2 mb-2'>
                                              <div className='w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold'>
                                                {user.name
                                                  .charAt(0)
                                                  .toUpperCase()}
                                              </div>
                                              <div>
                                                <p className='text-sm font-semibold text-gray-800'>
                                                  {user.name}
                                                </p>
                                                <p className='text-xs text-gray-600'>
                                                  {user.email}
                                                </p>
                                              </div>
                                            </div>
                                            <p className='text-xs text-gray-500'>
                                              🆔 {user.id}
                                            </p>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                    <div className='bg-white p-3 rounded-lg border border-indigo-100'>
                                      <h6 className='font-semibold text-gray-800 mb-2 flex items-center'>
                                        <span className='w-2 h-2 bg-blue-500 rounded-full mr-2'></span>
                                        Atama Detayları
                                      </h6>
                                      <p className='text-xs text-gray-600'>
                                        📅 Görev Oluşturma:{' '}
                                        {new Date(
                                          task.createdAt
                                        ).toLocaleDateString('tr-TR')}
                                      </p>
                                      <p className='text-xs text-gray-600'>
                                        🔄 Son Güncelleme:{' '}
                                        {new Date(
                                          task.updatedAt
                                        ).toLocaleDateString('tr-TR')}
                                      </p>
                                      <div className='flex items-center mt-2'>
                                        <div
                                          className={`w-2 h-2 rounded-full mr-2 ${
                                            task.status === 'COMPLETED'
                                              ? 'bg-green-500'
                                              : task.status === 'IN_PROGRESS'
                                              ? 'bg-blue-500'
                                              : task.status === 'REVIEW'
                                              ? 'bg-purple-500'
                                              : 'bg-gray-400'
                                          }`}
                                        ></div>
                                        <span className='text-xs font-medium text-gray-700'>
                                          {assignedUsers.length > 1
                                            ? 'Takım halinde çalışıyor'
                                            : 'Aktif olarak çalışıyor'}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                )
                              } else {
                                return (
                                  <div className='bg-yellow-100 p-4 rounded-lg border border-yellow-300'>
                                    <div className='flex items-center space-x-2 mb-2'>
                                      <AlertTriangle className='w-5 h-5 text-yellow-600' />
                                      <span className='font-semibold text-yellow-800'>
                                        Dikkat: Atama Gerekli
                                      </span>
                                    </div>
                                    <p className='text-sm text-yellow-700 mb-2'>
                                      Bu görev henüz bir takım üyesine atanmamış
                                      durumda.
                                    </p>
                                    <div className='text-xs text-yellow-600 space-y-1'>
                                      <p>
                                        • Görevin zamanında tamamlanması için
                                        bir sorumlu belirlenmeli
                                      </p>
                                      <p>
                                        • Proje yöneticisi ile iletişime geçerek
                                        atama yapılması önerilir
                                      </p>
                                    </div>
                                  </div>
                                )
                              }
                            })()}
                          </div>

                          {/* Project and Team Information */}
                          <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'>
                            <div className='bg-blue-50 p-4 rounded-lg border border-blue-200'>
                              <div className='flex items-center space-x-2 mb-2'>
                                <Calendar className='w-5 h-5 text-blue-600' />
                                <span className='font-semibold text-blue-800'>
                                  Proje Bilgileri
                                </span>
                              </div>
                              <p className='text-sm text-blue-700 font-medium'>
                                📁 {task.project.name}
                              </p>
                              <p className='text-xs text-blue-600 mt-1'>
                                ID: {task.projectId}
                              </p>
                            </div>

                            {task.assignedUser ? (
                              <div className='bg-green-50 p-4 rounded-lg border border-green-200'>
                                <div className='flex items-center space-x-2 mb-2'>
                                  <Users className='w-5 h-5 text-green-600' />
                                  <span className='font-semibold text-green-800'>
                                    Atanan Kişi
                                  </span>
                                </div>
                                <div className='space-y-2'>
                                  <p className='text-sm text-green-700 font-medium flex items-center'>
                                    👤{' '}
                                    <span className='ml-1'>
                                      {task.assignedUser.name}
                                    </span>
                                  </p>
                                  <p className='text-xs text-green-600 flex items-center'>
                                    📧{' '}
                                    <span className='ml-1'>
                                      {task.assignedUser.email}
                                    </span>
                                  </p>
                                  <p className='text-xs text-green-500 flex items-center'>
                                    🆔{' '}
                                    <span className='ml-1'>
                                      ID: {task.assignedUser.id}
                                    </span>
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <div className='bg-yellow-50 p-4 rounded-lg border border-yellow-200'>
                                <div className='flex items-center space-x-2 mb-2'>
                                  <AlertTriangle className='w-5 h-5 text-yellow-600' />
                                  <span className='font-semibold text-yellow-800'>
                                    Atama Durumu
                                  </span>
                                </div>
                                <p className='text-sm text-yellow-700'>
                                  ⚠️ Henüz kimseye atanmamış
                                </p>
                                <p className='text-xs text-yellow-600 mt-1'>
                                  Bu görev için bir takım üyesi ataması
                                  yapılması gerekiyor
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Date Information */}
                          <div className='bg-gray-50 p-4 rounded-lg border border-gray-200'>
                            <div className='flex items-center space-x-2 mb-3'>
                              <Clock className='w-5 h-5 text-gray-600' />
                              <span className='font-semibold text-gray-800'>
                                Tarih Bilgileri
                              </span>
                            </div>
                            <div className='grid grid-cols-1 md:grid-cols-3 gap-4 text-sm'>
                              {task.startDate && (
                                <div>
                                  <span className='text-gray-600 font-medium'>
                                    🚀 Başlangıç:
                                  </span>
                                  <p className='text-gray-800 font-semibold'>
                                    {new Date(
                                      task.startDate
                                    ).toLocaleDateString('tr-TR', {
                                      day: 'numeric',
                                      month: 'long',
                                      year: 'numeric',
                                    })}
                                  </p>
                                </div>
                              )}
                              {task.endDate && (
                                <div>
                                  <span className='text-gray-600 font-medium'>
                                    🏁 Bitiş:
                                  </span>
                                  <p
                                    className={`font-semibold ${
                                      isOverdue
                                        ? 'text-red-600'
                                        : 'text-gray-800'
                                    }`}
                                  >
                                    {new Date(task.endDate).toLocaleDateString(
                                      'tr-TR',
                                      {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric',
                                      }
                                    )}
                                  </p>
                                </div>
                              )}
                              <div>
                                <span className='text-gray-600 font-medium'>
                                  📅 Oluşturulma:
                                </span>
                                <p className='text-gray-800 font-semibold'>
                                  {new Date(task.createdAt).toLocaleDateString(
                                    'tr-TR',
                                    {
                                      day: 'numeric',
                                      month: 'short',
                                      year: 'numeric',
                                    }
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Progress Information */}
                          <div className='mt-4 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200'>
                            <div className='flex items-center justify-between'>
                              <div className='flex items-center space-x-2'>
                                <Target className='w-5 h-5 text-blue-600' />
                                <span className='font-semibold text-blue-800'>
                                  Görev Durumu
                                </span>
                              </div>
                              <div
                                className={`px-4 py-2 rounded-full text-sm font-bold text-white ${statusColor.badge}`}
                              >
                                {getStatusText(task.status)}
                              </div>
                            </div>

                            {/* Progress bar */}
                            <div className='mt-3'>
                              <div className='flex justify-between items-center mb-2'>
                                <span className='text-sm text-gray-600'>
                                  İlerleme Durumu
                                </span>
                                <span className='text-sm font-bold text-gray-800'>
                                  {task.status === 'COMPLETED'
                                    ? '100%'
                                    : task.status === 'REVIEW'
                                    ? '80%'
                                    : task.status === 'IN_PROGRESS'
                                    ? '50%'
                                    : '0%'}
                                </span>
                              </div>
                              <div className='w-full bg-gray-200 rounded-full h-3'>
                                <div
                                  className={`h-3 rounded-full transition-all duration-500 ${
                                    task.status === 'COMPLETED'
                                      ? 'bg-green-500 w-full'
                                      : task.status === 'REVIEW'
                                      ? 'bg-purple-500 w-4/5'
                                      : task.status === 'IN_PROGRESS'
                                      ? 'bg-blue-500 w-1/2'
                                      : 'bg-gray-400 w-0'
                                  }`}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CalendarClient
