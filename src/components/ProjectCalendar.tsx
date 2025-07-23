'use client'

import { useState, useEffect } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Target,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Zap,
  Users,
  Timer,
  Calendar,
  X,
} from 'lucide-react'
import {
  WorkloadAnalyzer,
  WorkloadData,
  getWorkloadColor,
} from '@/lib/workload-analysis'
import TaskDetailModal from '@/components/TaskDetailModal'

interface Task {
  id: string
  title: string
  status: string
  priority: string
  startDate?: Date | null
  endDate?: Date | null
  assignedId?: string
  estimatedHours?: number
  delayDays?: number
  workloadPercentage?: number
  assignedUser?: {
    id: string
    name: string
    maxHoursPerDay?: number
  } | null
}

interface ProjectCalendarProps {
  tasks: Task[]
  projectName: string
  users?: any[]
  project?: {
    id: string
    startDate?: Date
    endDate?: Date
  }
}

// Görev durumuna göre renk sınıfları
function getTaskStatusColor(status: string) {
  switch (status) {
    case 'TODO':
      return {
        bg: 'bg-gray-100',
        text: 'text-gray-700',
        border: 'border-gray-300',
        accent: 'bg-gray-500',
      }
    case 'IN_PROGRESS':
      return {
        bg: 'bg-blue-100',
        text: 'text-blue-700',
        border: 'border-blue-300',
        accent: 'bg-blue-500',
      }
    case 'REVIEW':
      return {
        bg: 'bg-purple-100',
        text: 'text-purple-700',
        border: 'border-purple-300',
        accent: 'bg-purple-500',
      }
    case 'COMPLETED':
      return {
        bg: 'bg-green-100',
        text: 'text-green-700',
        border: 'border-green-300',
        accent: 'bg-green-500',
      }
    default:
      return {
        bg: 'bg-gray-100',
        text: 'text-gray-700',
        border: 'border-gray-300',
        accent: 'bg-gray-500',
      }
  }
}

// Öncelik seviyesine göre renk sınıfları
function getTaskPriorityColor(priority: string) {
  switch (priority) {
    case 'LOW':
      return {
        bg: 'bg-green-50',
        text: 'text-green-600',
        border: 'border-green-200',
        dot: 'bg-green-400',
      }
    case 'MEDIUM':
      return {
        bg: 'bg-yellow-50',
        text: 'text-yellow-600',
        border: 'border-yellow-200',
        dot: 'bg-yellow-400',
      }
    case 'HIGH':
      return {
        bg: 'bg-red-50',
        text: 'text-red-600',
        border: 'border-red-200',
        dot: 'bg-red-400',
      }
    default:
      return {
        bg: 'bg-gray-50',
        text: 'text-gray-600',
        border: 'border-gray-200',
        dot: 'bg-gray-400',
      }
  }
}

// Görev tipine göre renk (başlangıç, bitiş, devam eden)
function getTaskTypeColor(task: Task, date: Date) {
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

// Yardımcı fonksiyonlar
function getStatusText(status: string) {
  switch (status) {
    case 'TODO':
      return 'Yapılacak'
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

function formatDateShort(date: Date) {
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

export default function ProjectCalendar({
  tasks,
  projectName,
  users = [],
  project = { id: '', startDate: undefined, endDate: undefined },
}: ProjectCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedTask, setSelectedTask] = useState<any>(null)
  const [workloadData, setWorkloadData] = useState<WorkloadData[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [dayTasks, setDayTasks] = useState<Task[]>([])
  const [showDayModal, setShowDayModal] = useState(false)

  // Initialize workload analyzer with proper task format (same as EnhancedCalendar)
  const tasksForAnalyzer = tasks.map((task) => ({
    ...task,
    projectId: project.id || '',
    createdById: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    workflowStepId: null,
    completedAt: null,
    assignedId: task.assignedId || null,
    startDate: task.startDate || null,
    endDate: task.endDate || null,
    status: task.status as any,
    priority: task.priority as any,
    description: null,
    originalEndDate: null,
    estimatedHours: task.estimatedHours ?? null,
    actualHours: null,
    delayDays: task.delayDays ?? 0,
    workloadPercentage: task.workloadPercentage ?? 0,
    isBottleneck: false,
    delayReason: null,
  }))

  // Calculate workload using the same method as EnhancedCalendar
  useEffect(() => {
    if (users.length > 0) {
      const workloadAnalyzer = new WorkloadAnalyzer(users, tasksForAnalyzer)

      // Calculate workload for the current month
      const startOfMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
      )
      const endOfMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0
      )

      const dailyWorkload = []
      const currentDay = new Date(startOfMonth)
      while (currentDay <= endOfMonth) {
        dailyWorkload.push(
          ...workloadAnalyzer.calculateDailyWorkload(new Date(currentDay))
        )
        currentDay.setDate(currentDay.getDate() + 1)
      }
      setWorkloadData(dailyWorkload)
    }
  }, [tasks, users, currentDate])

  const getWorkloadForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    const workload = workloadData.filter((w) => w.date === dateStr)
    // Use the same maxWorkload calculation as EnhancedCalendar
    return Math.max(...workload.map((w) => w.workloadPercent), 0)
  }

  const handleTaskClick = (task: any) => {
    setSelectedTask(task)
  }

  const handleDayClick = (date: Date) => {
    const tasksForDay = getTasksForDate(date)
    if (tasksForDay.length > 0) {
      setSelectedDate(date)
      setDayTasks(tasksForDay)
      setShowDayModal(true)
    }
  }

  const closeDayModal = () => {
    setShowDayModal(false)
    setSelectedDate(null)
    setDayTasks([])
  }

  const today = new Date()

  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth()

  // Get month dates with Monday start
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1)
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0)

  // Start from Monday of the week containing the first day
  const startDate = new Date(firstDayOfMonth)
  const dayOfWeek = firstDayOfMonth.getDay()
  const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  startDate.setDate(firstDayOfMonth.getDate() - daysToSubtract)

  // Generate 6 weeks (42 days) to ensure full calendar view
  const calendarDays = []
  for (let i = 0; i < 42; i++) {
    const currentDate = new Date(startDate)
    currentDate.setDate(startDate.getDate() + i)
    calendarDays.push(currentDate)
  }

  // Get tasks for a specific date
  const getTasksForDate = (date: Date) => {
    return tasks.filter((task) => {
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
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    if (direction === 'prev') {
      newDate.setMonth(currentMonth - 1)
    } else {
      newDate.setMonth(currentMonth + 1)
    }
    setCurrentDate(newDate)
  }

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

  const dayNames = [
    'Pazartesi',
    'Salı',
    'Çarşamba',
    'Perşembe',
    'Cuma',
    'Cumartesi',
    'Pazar',
  ]

  // İstatistikler
  const completedTasks = tasks.filter(
    (task) => task.status === 'COMPLETED'
  ).length
  const activeTasks = tasks.filter(
    (task) => task.status === 'IN_PROGRESS'
  ).length
  const overdueTasks = tasks.filter((task) => {
    if (!task.endDate) return false
    const endDate = new Date(task.endDate)
    return endDate < today && task.status !== 'COMPLETED'
  }).length
  const upcomingTasks = tasks.filter((task) => {
    if (!task.endDate) return false
    const endDate = new Date(task.endDate)
    const sevenDaysFromNow = new Date(today)
    sevenDaysFromNow.setDate(today.getDate() + 7)
    return (
      endDate >= today &&
      endDate <= sevenDaysFromNow &&
      task.status !== 'COMPLETED'
    )
  }).length

  return (
    <div className='space-y-6'>
      {/* Stats Cards */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        <div className='bg-white rounded-xl shadow-lg border border-gray-100 p-4 hover:shadow-xl transition-shadow duration-300'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-gray-600'>Toplam Görev</p>
              <p className='text-2xl font-bold text-gray-900'>{tasks.length}</p>
            </div>
            <div className='p-2 bg-blue-100 rounded-full'>
              <Target className='w-5 h-5 text-blue-600' />
            </div>
          </div>
        </div>

        <div className='bg-white rounded-xl shadow-lg border border-gray-100 p-4 hover:shadow-xl transition-shadow duration-300'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-gray-600'>Yaklaşan</p>
              <p className='text-2xl font-bold text-orange-600'>
                {upcomingTasks}
              </p>
            </div>
            <div className='p-2 bg-orange-100 rounded-full'>
              <Clock className='w-5 h-5 text-orange-600' />
            </div>
          </div>
        </div>

        <div className='bg-white rounded-xl shadow-lg border border-gray-100 p-4 hover:shadow-xl transition-shadow duration-300'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-gray-600'>Gecikmiş</p>
              <p className='text-2xl font-bold text-red-600'>{overdueTasks}</p>
            </div>
            <div className='p-2 bg-red-100 rounded-full'>
              <AlertTriangle className='w-5 h-5 text-red-600' />
            </div>
          </div>
        </div>

        <div className='bg-white rounded-xl shadow-lg border border-gray-100 p-4 hover:shadow-xl transition-shadow duration-300'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-gray-600'>Aktif</p>
              <p className='text-2xl font-bold text-green-600'>{activeTasks}</p>
            </div>
            <div className='p-2 bg-green-100 rounded-full'>
              <Zap className='w-5 h-5 text-green-600' />
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Calendar */}
      <div className='bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden'>
        {/* Calendar Header */}
        <div className='bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-3'>
              <CalendarIcon className='w-6 h-6 text-white' />
              <h2 className='text-xl font-bold text-white'>
                {projectName} - Proje Takvimi
              </h2>
            </div>
            <div className='flex items-center space-x-3'>
              <button
                onClick={() => navigateMonth('prev')}
                className='p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors'
              >
                <ChevronLeft className='w-4 h-4 text-white' />
              </button>
              <h3 className='text-lg font-bold text-white min-w-[140px] text-center'>
                {monthNames[currentMonth]} {currentYear}
              </h3>
              <button
                onClick={() => navigateMonth('next')}
                className='p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors'
              >
                <ChevronRight className='w-4 h-4 text-white' />
              </button>
            </div>
          </div>
        </div>

        {/* Days of Week Header */}
        <div className='grid grid-cols-7 border-b border-gray-200 bg-gray-50'>
          {dayNames.map((day) => (
            <div key={day} className='px-3 py-3 text-center'>
              <div className='text-sm font-semibold text-gray-600 uppercase tracking-wide'>
                {day.slice(0, 3)}
              </div>
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className='grid grid-cols-7'>
          {calendarDays.map((date, index) => {
            const isToday = date.toDateString() === today.toDateString()
            const isCurrentMonth = date.getMonth() === currentMonth
            const dayTasks = getTasksForDate(date)
            // Get workload percentage using the same method as EnhancedCalendar
            const workloadPercent = getWorkloadForDate(date)

            return (
              <div
                key={index}
                onClick={() => handleDayClick(date)}
                className={`min-h-[100px] border-r border-b border-gray-200 p-2 transition-all duration-200 hover:bg-gray-50 cursor-pointer ${
                  !isCurrentMonth ? 'bg-gray-50/50 text-gray-400' : 'bg-white'
                } ${dayTasks.length > 0 ? 'hover:bg-blue-50' : ''}`}
                title={
                  dayTasks.length > 0
                    ? `${dayTasks.length} görev - Detayları görüntülemek için tıklayın`
                    : ''
                }
              >
                <div className='flex items-center justify-between mb-2'>
                  <span
                    className={`text-sm font-medium ${
                      isToday
                        ? 'bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs'
                        : isCurrentMonth
                        ? 'text-gray-900'
                        : 'text-gray-400'
                    }`}
                  >
                    {date.getDate()}
                  </span>
                  <div className='flex items-center gap-1'>
                    {dayTasks.length > 0 && (
                      <span className='text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-medium'>
                        {dayTasks.length}
                      </span>
                    )}
                    {/* Workload indicator - same as EnhancedCalendar */}
                    {workloadPercent > 0 && (
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                          workloadPercent > 100
                            ? 'bg-red-100 text-red-700'
                            : workloadPercent > 80
                            ? 'bg-orange-100 text-orange-700'
                            : workloadPercent > 60
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                        title={`Doluluk: ${workloadPercent.toFixed(0)}%`}
                      >
                        {workloadPercent.toFixed(0)}%
                      </span>
                    )}
                  </div>
                </div>

                {/* Workload Bar - same visual as EnhancedCalendar */}
                {workloadPercent > 0 && (
                  <div className='mb-2'>
                    <div className='w-full bg-gray-200 rounded-full h-1'>
                      <div
                        className='h-1 rounded-full transition-all'
                        style={{
                          width: `${Math.min(workloadPercent, 100)}%`,
                          backgroundColor:
                            workloadPercent > 100
                              ? '#dc2626'
                              : workloadPercent > 80
                              ? '#ea580c'
                              : workloadPercent > 60
                              ? '#d97706'
                              : '#16a34a',
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Tasks for this day */}
                <div className='space-y-1'>
                  {dayTasks.slice(0, 2).map((task) => {
                    const typeColor = getTaskTypeColor(task, date)
                    const statusColor = getTaskStatusColor(task.status)
                    const priorityColor = getTaskPriorityColor(task.priority)
                    const isOverdue =
                      task.endDate &&
                      new Date(task.endDate) < today &&
                      task.status !== 'COMPLETED'

                    return (
                      <div
                        key={task.id}
                        className={`text-xs rounded-md cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-105 transform ${
                          isOverdue
                            ? 'bg-red-100 border border-red-300 animate-pulse'
                            : `${typeColor.bg} ${typeColor.border}`
                        } relative overflow-hidden`}
                        title={`${task.title} - ${getStatusText(
                          task.status
                        )} - ${getPriorityText(task.priority)}`}
                      >
                        {/* Öncelik göstergesi */}
                        <div
                          className={`absolute top-0 right-0 w-1.5 h-1.5 rounded-bl-md ${priorityColor.dot}`}
                        ></div>

                        <div className='p-1.5'>
                          {/* Görev başlığı ve ikonu */}
                          <div className='flex items-center justify-between'>
                            <div
                              className={`font-medium truncate flex-1 ${
                                typeColor.text
                              } ${isOverdue ? 'text-red-700' : ''}`}
                            >
                              <span className='mr-0.5 text-[10px]'>
                                {typeColor.icon}
                              </span>
                              <span className='text-[10px]'>{task.title}</span>
                            </div>
                            {/* Durum göstergesi */}
                            <div
                              className={`w-1.5 h-1.5 rounded-full ${statusColor.accent} ml-1`}
                            ></div>
                          </div>

                          {/* Atanan kişi */}
                          {task.assignedUser && (
                            <div className='text-[9px] text-gray-500 truncate mt-0.5'>
                              {task.assignedUser.name}
                            </div>
                          )}
                        </div>

                        {/* Gecikme uyarısı */}
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
                  {dayTasks.length > 2 && (
                    <div
                      className='text-xs text-gray-500 text-center py-0.5 bg-gray-100 rounded-md border border-gray-200 hover:bg-blue-100 hover:text-blue-700 transition-colors cursor-pointer'
                      onClick={(e) => {
                        e.stopPropagation() // Prevent day click
                        handleDayClick(date)
                      }}
                      title={`${
                        dayTasks.length - 2
                      } görev daha var. Tümünü görmek için tıklayın.`}
                    >
                      <span className='font-medium text-[10px]'>
                        +{dayTasks.length - 2} daha
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Enhanced Legend */}
      <div className='bg-white rounded-xl shadow-lg border border-gray-100 p-4'>
        <h3 className='text-sm font-semibold text-gray-800 mb-3'>
          Görev Durumları ve Öncelikler
        </h3>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          {/* Status Legend */}
          <div>
            <h4 className='text-xs font-medium text-gray-600 mb-2'>Durum:</h4>
            <div className='flex flex-wrap gap-2'>
              <div className='flex items-center space-x-1'>
                <div className='w-3 h-3 rounded bg-gray-500'></div>
                <span className='text-xs'>Yapılacak</span>
              </div>
              <div className='flex items-center space-x-1'>
                <div className='w-3 h-3 rounded bg-blue-500'></div>
                <span className='text-xs'>Devam Ediyor</span>
              </div>
              <div className='flex items-center space-x-1'>
                <div className='w-3 h-3 rounded bg-purple-500'></div>
                <span className='text-xs'>İncelemede</span>
              </div>
              <div className='flex items-center space-x-1'>
                <div className='w-3 h-3 rounded bg-green-500'></div>
                <span className='text-xs'>Tamamlandı</span>
              </div>
            </div>
          </div>

          {/* Priority Legend */}
          <div>
            <h4 className='text-xs font-medium text-gray-600 mb-2'>Öncelik:</h4>
            <div className='flex flex-wrap gap-2'>
              <div className='flex items-center space-x-1'>
                <div className='w-3 h-3 rounded-full bg-green-400'></div>
                <span className='text-xs'>Düşük</span>
              </div>
              <div className='flex items-center space-x-1'>
                <div className='w-3 h-3 rounded-full bg-yellow-400'></div>
                <span className='text-xs'>Orta</span>
              </div>
              <div className='flex items-center space-x-1'>
                <div className='w-3 h-3 rounded-full bg-red-400'></div>
                <span className='text-xs'>Yüksek</span>
              </div>
            </div>
          </div>
        </div>

        {/* Task Type Icons */}
        <div className='mt-3 pt-3 border-t border-gray-200'>
          <h4 className='text-xs font-medium text-gray-600 mb-2'>
            Görev Tipleri:
          </h4>
          <div className='flex flex-wrap gap-3'>
            <div className='flex items-center space-x-1'>
              <span className='text-sm'>🚀</span>
              <span className='text-xs'>Başlangıç</span>
            </div>
            <div className='flex items-center space-x-1'>
              <span className='text-sm'>🏁</span>
              <span className='text-xs'>Bitiş</span>
            </div>
            <div className='flex items-center space-x-1'>
              <span className='text-sm'>⚡</span>
              <span className='text-xs'>Devam Eden</span>
            </div>
            <div className='flex items-center space-x-1'>
              <span className='text-sm'>🎯</span>
              <span className='text-xs'>Tek Gün</span>
            </div>
          </div>
        </div>
      </div>

      {/* Day Details Modal */}
      {showDayModal && selectedDate && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden'>
            {/* Modal Header */}
            <div className='bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <h2 className='text-xl font-bold text-white'>
                    {selectedDate.toLocaleDateString('tr-TR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </h2>
                  <p className='text-blue-100 text-sm mt-1'>
                    {dayTasks.length} görev var
                  </p>
                </div>
                <button
                  onClick={closeDayModal}
                  className='text-white hover:text-blue-200 transition-colors p-2 hover:bg-white/20 rounded-lg'
                >
                  <svg
                    className='w-6 h-6'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M6 18L18 6M6 6l12 12'
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className='p-6 overflow-y-auto max-h-[60vh]'>
              <div className='space-y-4'>
                {dayTasks.map((task) => {
                  const statusColor = getTaskStatusColor(task.status)
                  const priorityColor = getTaskPriorityColor(task.priority)
                  const typeColor = getTaskTypeColor(task, selectedDate)
                  const isOverdue =
                    task.endDate &&
                    new Date(task.endDate) < today &&
                    task.status !== 'COMPLETED'

                  return (
                    <div
                      key={task.id}
                      className={`border rounded-lg p-4 hover:shadow-md transition-all cursor-pointer ${
                        isOverdue
                          ? 'border-red-300 bg-red-50'
                          : 'border-gray-200 bg-white hover:bg-gray-50'
                      }`}
                      onClick={() => {
                        setSelectedTask(task)
                        closeDayModal()
                      }}
                    >
                      {/* Task Header */}
                      <div className='flex items-start justify-between mb-3'>
                        <div className='flex-1'>
                          <div className='flex items-center space-x-2 mb-2'>
                            <span className='text-lg'>{typeColor.icon}</span>
                            <h3 className='font-medium text-gray-900 text-lg'>
                              {task.title}
                            </h3>
                            {isOverdue && (
                              <span className='bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full font-medium'>
                                GECİKMİŞ
                              </span>
                            )}
                          </div>
                        </div>
                        <div className='flex items-center space-x-2'>
                          <span
                            className={`w-3 h-3 rounded-full ${statusColor.accent}`}
                          ></span>
                          <span
                            className={`w-3 h-3 rounded-full ${priorityColor.dot}`}
                          ></span>
                        </div>
                      </div>

                      {/* Task Details */}
                      <div className='grid grid-cols-2 gap-4 text-sm'>
                        <div>
                          <span className='text-gray-500'>Durum:</span>
                          <span
                            className={`ml-2 font-medium ${statusColor.text}`}
                          >
                            {getStatusText(task.status)}
                          </span>
                        </div>
                        <div>
                          <span className='text-gray-500'>Öncelik:</span>
                          <span
                            className={`ml-2 font-medium ${priorityColor.text}`}
                          >
                            {getPriorityText(task.priority)}
                          </span>
                        </div>
                        {task.assignedUser && (
                          <div>
                            <span className='text-gray-500'>Atanan:</span>
                            <span className='ml-2 font-medium text-gray-900'>
                              {task.assignedUser.name}
                            </span>
                          </div>
                        )}
                        {task.estimatedHours && (
                          <div>
                            <span className='text-gray-500'>Tahmini:</span>
                            <span className='ml-2 font-medium text-gray-900'>
                              {task.estimatedHours} saat
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Task Dates */}
                      {(task.startDate || task.endDate) && (
                        <div className='mt-3 pt-3 border-t border-gray-100'>
                          <div className='flex items-center space-x-4 text-sm'>
                            {task.startDate && (
                              <div>
                                <span className='text-gray-500'>
                                  Başlangıç:
                                </span>
                                <span className='ml-2 font-medium text-green-600'>
                                  {new Date(task.startDate).toLocaleDateString(
                                    'tr-TR'
                                  )}
                                </span>
                              </div>
                            )}
                            {task.endDate && (
                              <div>
                                <span className='text-gray-500'>Bitiş:</span>
                                <span
                                  className={`ml-2 font-medium ${
                                    isOverdue ? 'text-red-600' : 'text-blue-600'
                                  }`}
                                >
                                  {new Date(task.endDate).toLocaleDateString(
                                    'tr-TR'
                                  )}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {dayTasks.length === 0 && (
                <div className='text-center py-8 text-gray-500'>
                  <Calendar className='w-12 h-12 mx-auto mb-3 opacity-50' />
                  <p>Bu gün için görev bulunmuyor.</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className='bg-gray-50 px-6 py-4'>
              <div className='flex justify-between items-center'>
                <div className='text-sm text-gray-600'>
                  Görev detaylarını görmek için görevin üzerine tıklayın
                </div>
                <button
                  onClick={closeDayModal}
                  className='px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors'
                >
                  Kapat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  )
}
