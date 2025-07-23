'use client'

import React, { useState, useEffect } from 'react'
import {
  Calendar,
  Clock,
  AlertTriangle,
  Users,
  BarChart3,
  RefreshCw,
  Timer,
  Zap,
} from 'lucide-react'
import {
  WorkloadAnalyzer,
  BottleneckData,
  WorkloadData,
  TaskTimeTracker,
  getWorkloadColor,
  getWorkloadLabel,
} from '@/lib/workload-analysis'

interface Task {
  id: string
  title: string
  description?: string
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  startDate?: Date
  endDate?: Date
  assignedId?: string
  estimatedHours?: number
  actualHours?: number
  delayReason?: string
  delayDays: number
  workloadPercentage: number
  isBottleneck: boolean
  originalEndDate?: Date
  assignedUser?: {
    id: string
    name: string
    maxHoursPerDay: number
  }
}

interface Project {
  id: string
  name: string
  startDate?: Date
  endDate?: Date
  originalEndDate?: Date
  delayDays: number
  autoReschedule: boolean
}

interface EnhancedCalendar2Props {
  tasks: Task[]
  project: Project
  users: any[]
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void
  onProjectReschedule: (rescheduleType: string) => void
  calculationMode?: 'max' | 'average' | 'individual' // New prop to control calculation method
  title?: string // Custom title for the calendar
}

function EnhancedCalendar2({
  tasks,
  project,
  users,
  onTaskUpdate,
  onProjectReschedule,
  calculationMode = 'average', // Default to average for second calendar
  title = 'Doluluk Takvimi', // Default title
}: EnhancedCalendar2Props) {
  // Initialize with current date (July 2025)
  const [currentDate, setCurrentDate] = useState(() => new Date(2025, 6, 23)) // July 23, 2025
  const [viewMode, setViewMode] = useState<
    'calendar' | 'workload' | 'bottleneck' | 'timeline'
  >('calendar')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [workloadData, setWorkloadData] = useState<WorkloadData[]>([])
  const [bottleneckData, setBottleneckData] = useState<BottleneckData[]>([])
  const [rescheduleOptions, setRescheduleOptions] = useState<any>(null)
  const [showRescheduleModal, setShowRescheduleModal] = useState(false)

  // Initialize workload analyzer with proper task format
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
    description: task.description || null,
    originalEndDate: task.originalEndDate || null,
    estimatedHours: task.estimatedHours ?? null,
    actualHours: task.actualHours ?? null,
    delayDays: task.delayDays ?? null,
    workloadPercentage: task.workloadPercentage ?? null,
    isBottleneck: task.isBottleneck ?? false,
    delayReason: task.delayReason ?? null,
  }))
  const workloadAnalyzer = new WorkloadAnalyzer(users, tasksForAnalyzer)

  // Calculate workload and bottlenecks
  useEffect(() => {
    if (project.startDate && project.endDate) {
      const startDate = new Date(project.startDate)
      const endDate = new Date(project.endDate)

      // Calculate daily workload for ALL days (including weekends)
      const dailyWorkload = []
      const currentDay = new Date(startDate)
      while (currentDay <= endDate) {
        // Calculate workload for every day, not just working days
        dailyWorkload.push(
          ...workloadAnalyzer.calculateDailyWorkload(new Date(currentDay))
        )
        currentDay.setDate(currentDay.getDate() + 1)
      }
      setWorkloadData(dailyWorkload)

      // Detect bottlenecks for ALL days (including weekends)
      const bottlenecks = []
      const currentBottleneckDate = new Date(startDate)
      while (currentBottleneckDate <= endDate) {
        // Get tasks for this date using the same logic as getTasksForDate
        const dailyTasks = tasks.filter((task) => {
          if (!task.startDate || !task.endDate) return false
          const taskStart = new Date(task.startDate)
          const taskEnd = new Date(task.endDate)
          const checkDate = new Date(currentBottleneckDate)

          taskStart.setHours(0, 0, 0, 0)
          taskEnd.setHours(0, 0, 0, 0)
          checkDate.setHours(0, 0, 0, 0)

          return checkDate >= taskStart && checkDate <= taskEnd
        })

        const dailyWorkload = workloadAnalyzer.calculateDailyWorkload(
          currentBottleneckDate
        )
        const maxWorkload = Math.max(
          ...dailyWorkload.map((w) => w.workloadPercent),
          0
        )

        const isBottleneck = maxWorkload > 80 || dailyTasks.length > 5
        const criticalTasks = dailyTasks.filter(
          (task) => task.priority === 'HIGH' || task.priority === 'URGENT'
        )

        if (isBottleneck) {
          bottlenecks.push({
            date: currentBottleneckDate.toISOString().split('T')[0],
            taskCount: dailyTasks.length,
            maxWorkload,
            isBottleneck,
            tasks: tasksForAnalyzer.filter((task) => {
              if (!task.startDate || !task.endDate) return false
              const taskStart = new Date(task.startDate)
              const taskEnd = new Date(task.endDate)
              const checkDate = new Date(currentBottleneckDate)

              taskStart.setHours(0, 0, 0, 0)
              taskEnd.setHours(0, 0, 0, 0)
              checkDate.setHours(0, 0, 0, 0)

              return checkDate >= taskStart && checkDate <= taskEnd
            }),
            criticalTasks: tasksForAnalyzer.filter((task) => {
              const isInDate = (() => {
                if (!task.startDate || !task.endDate) return false
                const taskStart = new Date(task.startDate)
                const taskEnd = new Date(task.endDate)
                const checkDate = new Date(currentBottleneckDate)

                taskStart.setHours(0, 0, 0, 0)
                taskEnd.setHours(0, 0, 0, 0)
                checkDate.setHours(0, 0, 0, 0)

                return checkDate >= taskStart && checkDate <= taskEnd
              })()
              return (
                isInDate &&
                (task.priority === 'HIGH' || task.priority === 'URGENT')
              )
            }),
          })
        }

        currentBottleneckDate.setDate(currentBottleneckDate.getDate() + 1)
      }
      setBottleneckData(bottlenecks)
    }
  }, [tasks, project, users])

  const isWorkingDay = (date: Date) => {
    const day = date.getDay()
    return day >= 1 && day <= 5 // Monday to Friday
  }

  const getTasksForDate = (date: Date) => {
    return tasks.filter((task) => {
      if (!task.startDate || !task.endDate) return false
      const taskStart = new Date(task.startDate)
      const taskEnd = new Date(task.endDate)
      const checkDate = new Date(date)

      // Normalize dates to compare only date parts
      checkDate.setHours(0, 0, 0, 0)
      taskStart.setHours(0, 0, 0, 0)
      taskEnd.setHours(0, 0, 0, 0)

      return checkDate >= taskStart && checkDate <= taskEnd
    })
  }

  const getWorkloadForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return workloadData.filter((w) => w.date === dateStr)
  }

  const getBottleneckForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return bottleneckData.find((b) => b.date === dateStr)
  }

  // New function to calculate workload based on mode
  const calculateDisplayWorkload = (workload: WorkloadData[]) => {
    if (workload.length === 0) return 0

    switch (calculationMode) {
      case 'max':
        return Math.max(...workload.map((w) => w.workloadPercent), 0)
      case 'average':
        return Math.round(
          workload.reduce((sum, w) => sum + w.workloadPercent, 0) /
            workload.length
        )
      case 'individual':
        // For individual mode, we might want to show the first user's workload or handle differently
        return workload[0]?.workloadPercent || 0
      default:
        return Math.max(...workload.map((w) => w.workloadPercent), 0)
    }
  }

  const handleTaskStatusChange = (
    taskId: string,
    newStatus: Task['status']
  ) => {
    const task = tasks.find((t) => t.id === taskId)
    if (!task) return

    // Calculate time tracking
    const now = new Date()

    // If task is being completed early, offer to reschedule dependent tasks
    if (
      newStatus === 'COMPLETED' &&
      task.endDate &&
      now < new Date(task.endDate)
    ) {
      const earlyDays = Math.ceil(
        (new Date(task.endDate).getTime() - now.getTime()) /
          (1000 * 60 * 60 * 24)
      )
      const rescheduleOpts = workloadAnalyzer.calculateRescheduleOptions(
        taskId,
        -earlyDays
      )
      if (rescheduleOpts) {
        setRescheduleOptions(rescheduleOpts)
        setShowRescheduleModal(true)
      }
    }

    // If task is being delayed, calculate impact
    if (
      newStatus === 'IN_PROGRESS' &&
      task.endDate &&
      now > new Date(task.endDate)
    ) {
      const delayDays = Math.ceil(
        (now.getTime() - new Date(task.endDate).getTime()) /
          (1000 * 60 * 60 * 24)
      )
      onTaskUpdate(taskId, {
        status: newStatus,
        delayDays: delayDays,
        delayReason: 'Geç başlatıldı',
      })
    } else {
      onTaskUpdate(taskId, { status: newStatus })
    }
  }

  const handleReschedule = (rescheduleType: string) => {
    if (rescheduleOptions) {
      onProjectReschedule(rescheduleType)
      setShowRescheduleModal(false)
      setRescheduleOptions(null)
    }
  }

  const renderCalendarDay = (date: Date) => {
    const dayTasks = getTasksForDate(date)
    const workload = getWorkloadForDate(date)
    const bottleneck = getBottleneckForDate(date)
    const isToday = date.toDateString() === new Date().toDateString()
    const isSelected =
      selectedDate && date.toDateString() === selectedDate.toDateString()
    const displayWorkload = calculateDisplayWorkload(workload)

    return (
      <div
        key={date.toISOString()}
        className={`
          min-h-[120px] p-2 border border-gray-200 cursor-pointer transition-all duration-200
          ${isToday ? 'bg-blue-50 border-blue-300' : ''}
          ${isSelected ? 'bg-yellow-50 border-yellow-300' : ''}
          ${bottleneck ? 'bg-red-50 border-red-300' : ''}
          ${displayWorkload > 100 ? 'bg-orange-50' : ''}
          hover:bg-gray-50
        `}
        onClick={() => setSelectedDate(date)}
      >
        <div className='flex justify-between items-start mb-2'>
          <span
            className={`text-sm font-medium ${
              isToday ? 'text-blue-600' : 'text-gray-600'
            }`}
          >
            {date.getDate()}
          </span>
          {bottleneck && <AlertTriangle className='w-4 h-4 text-red-500' />}
        </div>

        {/* Workload Indicator - Using configurable calculation method */}
        {workload.length > 0 && (
          <div className='mb-2'>
            <div className='flex items-center gap-1 mb-1'>
              <Users className='w-3 h-3 text-gray-400' />
              <span className='text-xs text-gray-500'>
                {displayWorkload}%{' '}
                {calculationMode === 'max'
                  ? 'max'
                  : calculationMode === 'average'
                  ? 'ort'
                  : 'doluluk'}
              </span>
            </div>
            <div className='w-full bg-gray-200 rounded-full h-1'>
              <div
                className='h-1 rounded-full transition-all'
                style={{
                  width: `${Math.min(displayWorkload, 100)}%`,
                  backgroundColor: getWorkloadColor(displayWorkload),
                }}
              />
            </div>
          </div>
        )}

        {/* Tasks */}
        <div className='space-y-1'>
          {dayTasks.slice(0, 3).map((task) => (
            <div
              key={task.id}
              className={`
                text-xs p-1 rounded text-white font-medium truncate
                ${task.status === 'TODO' ? 'bg-gray-400' : ''}
                ${task.status === 'IN_PROGRESS' ? 'bg-blue-500' : ''}
                ${task.status === 'REVIEW' ? 'bg-yellow-500' : ''}
                ${task.status === 'COMPLETED' ? 'bg-green-500' : ''}
                ${task.isBottleneck ? 'ring-2 ring-red-300' : ''}
              `}
              title={`${task.title} - ${task.status}`}
            >
              <div className='flex items-center gap-1'>
                {task.delayDays > 0 && <Timer className='w-3 h-3' />}
                {task.priority === 'HIGH' || task.priority === 'URGENT' ? (
                  <Zap className='w-3 h-3' />
                ) : null}
                <span className='truncate'>{task.title}</span>
              </div>
            </div>
          ))}
          {dayTasks.length > 3 && (
            <div className='text-xs text-gray-500 text-center'>
              +{dayTasks.length - 3} görev daha
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderCalendarGrid = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())

    const days = []
    const currentDay = new Date(startDate)

    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDay))
      currentDay.setDate(currentDay.getDate() + 1)
    }

    return (
      <div className='grid grid-cols-7 gap-1'>
        {[
          'Pazar',
          'Pazartesi',
          'Salı',
          'Çarşamba',
          'Perşembe',
          'Cuma',
          'Cumartesi',
        ].map((day) => (
          <div
            key={day}
            className='p-2 text-center font-medium text-gray-500 border-b'
          >
            {day}
          </div>
        ))}
        {days.map((day) => renderCalendarDay(day))}
      </div>
    )
  }

  return (
    <div className='bg-white rounded-lg shadow-lg p-6'>
      <div className='flex items-center justify-between mb-6'>
        <h2 className='text-2xl font-bold text-gray-800'>
          {title} - {project.name}
        </h2>

        <div className='flex items-center gap-4'>
          {/* Calculation Mode Indicator */}
          <div className='px-3 py-2 bg-blue-100 rounded-lg text-sm font-medium text-blue-700'>
            {calculationMode === 'max'
              ? 'Maksimum Doluluk'
              : calculationMode === 'average'
              ? 'Ortalama Doluluk'
              : 'Bireysel Doluluk'}
          </div>

          {/* Date Indicator */}
          <div className='px-3 py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-700'>
            Görüntülenen:{' '}
            {(selectedDate || currentDate).toLocaleDateString('tr-TR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </div>

          {/* Auto-reschedule Button */}
          <button
            onClick={() => onProjectReschedule('auto')}
            className='flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors'
          >
            <RefreshCw className='w-4 h-4' />
            Yeniden Planla
          </button>
        </div>
      </div>

      {/* Project Status Bar */}
      {project.delayDays > 0 && (
        <div className='mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg'>
          <div className='flex items-center gap-2'>
            <AlertTriangle className='w-5 h-5 text-yellow-600' />
            <span className='font-medium text-yellow-800'>
              Proje {project.delayDays} gün gecikmede
            </span>
            {project.originalEndDate && project.endDate && (
              <span className='text-yellow-600'>
                (Orijinal:{' '}
                {new Date(project.originalEndDate).toLocaleDateString('tr-TR')}{' '}
                → Yeni: {new Date(project.endDate).toLocaleDateString('tr-TR')})
              </span>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className='flex items-center justify-between mb-6'>
        <button
          onClick={() =>
            setCurrentDate(
              new Date(currentDate.getFullYear(), currentDate.getMonth() - 1)
            )
          }
          className='px-3 py-1 border rounded hover:bg-gray-50'
        >
          ← Önceki Ay
        </button>

        <h3 className='text-xl font-semibold'>
          {currentDate.toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'long',
          })}
        </h3>

        <button
          onClick={() =>
            setCurrentDate(
              new Date(currentDate.getFullYear(), currentDate.getMonth() + 1)
            )
          }
          className='px-3 py-1 border rounded hover:bg-gray-50'
        >
          Sonraki Ay →
        </button>
      </div>

      {/* Content - Always show calendar grid */}
      {renderCalendarGrid()}

      {/* Reschedule Modal */}
      {showRescheduleModal && rescheduleOptions && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg p-6 max-w-md w-full mx-4'>
            <h3 className='text-lg font-semibold mb-4'>
              Yeniden Planlama Seçenekleri
            </h3>
            <p className='text-gray-600 mb-4'>
              "{rescheduleOptions.delayedTask.title}" görevi için{' '}
              {Math.abs(rescheduleOptions.delayDays)} gün
              {rescheduleOptions.delayDays > 0 ? 'gecikme' : 'erkene alma'}{' '}
              tespit edildi.
            </p>

            <div className='space-y-3'>
              {rescheduleOptions.rescheduleOptions.map(
                (option: any, index: number) => (
                  <button
                    key={index}
                    onClick={() => handleReschedule(option.type)}
                    className='w-full p-3 text-left border rounded-lg hover:bg-gray-50'
                  >
                    <div className='font-medium'>{option.description}</div>
                    <div className='text-sm text-gray-500'>
                      Yeni bitiş:{' '}
                      {option.newProjectEndDate.toLocaleDateString('tr-TR')}(
                      {option.affectedTasks} görev etkilenecek)
                    </div>
                  </button>
                )
              )}
            </div>

            <div className='flex gap-2 mt-4'>
              <button
                onClick={() => setShowRescheduleModal(false)}
                className='flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50'
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EnhancedCalendar2
