'use client'

import React, { useState, useEffect } from 'react'
import { Calendar, Clock, AlertTriangle, Users, BarChart3, RefreshCw } from 'lucide-react'
import { WorkloadAnalyzer, WorkloadData, getWorkloadColor, getWorkloadLabel } from '@/lib/workload-analysis'
import WorkloadViewer from '@/components/WorkloadViewer'

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

interface EnhancedCalendarProps {
  tasks: Task[]
  project: Project
  users: any[]
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void
  onProjectReschedule: (rescheduleType: string) => void
}

function EnhancedCalendar({ 
  tasks, 
  project, 
  users, 
  onTaskUpdate, 
  onProjectReschedule 
}: EnhancedCalendarProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date(2025, 6, 23))
  const [viewMode, setViewMode] = useState<'calendar' | 'workload'>('calendar')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [workloadData, setWorkloadData] = useState<WorkloadData[]>([])
  const [dayTasks, setDayTasks] = useState<Task[]>([])
  const [showDayModal, setShowDayModal] = useState(false)

  // Calculate workload data
  useEffect(() => {
    if (project.startDate && project.endDate) {
      const startDate = new Date(project.startDate)
      const endDate = new Date(project.endDate)
      
      const tasksForAnalyzer = tasks.map(task => ({
        ...task,
        projectId: project.id,
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
        delayReason: task.delayReason ?? null,
        delayDays: task.delayDays ?? 0,
        workloadPercentage: task.workloadPercentage ?? 0,
        isBottleneck: task.isBottleneck ?? false,
      }))

      // Calculate workload using static methods
      const dailyWorkload = []
      const currentDay = new Date(startDate)
      while (currentDay <= endDate) {
        // Use WorkloadAnalyzer static method to calculate daily workload
        const dayWorkload = users.map(user => {
          const userTasks = tasksForAnalyzer.filter(task => {
            if (!task.startDate || !task.endDate || task.assignedId !== user.id) return false
            
            const taskStart = new Date(task.startDate)
            const taskEnd = new Date(task.endDate)
            const checkDate = new Date(currentDay)
            
            taskStart.setHours(0, 0, 0, 0)
            taskEnd.setHours(0, 0, 0, 0)
            checkDate.setHours(0, 0, 0, 0)
            
            return checkDate >= taskStart && checkDate <= taskEnd
          })

          const totalHours = userTasks.reduce((sum, task) => {
            if (!task.estimatedHours) return sum + 4 // Default 4 hours
            
            const taskStart = new Date(task.startDate!)
            const taskEnd = new Date(task.endDate!)
            const workingDays = Math.max(1, Math.ceil((taskEnd.getTime() - taskStart.getTime()) / (1000 * 60 * 60 * 24)))
            
            return sum + (task.estimatedHours / workingDays)
          }, 0)

          const maxHours = user.maxHoursPerDay || 8
          const workloadPercent = Math.round((totalHours / maxHours) * 100)

          return {
            userId: user.id,
            userName: user.name,
            date: currentDay.toISOString().split('T')[0],
            workloadPercent,
            hoursAllocated: totalHours,
            hoursAvailable: maxHours,
            isOverloaded: workloadPercent > 100,
            tasks: userTasks
          } as WorkloadData
        })
        
        dailyWorkload.push(...dayWorkload)
        currentDay.setDate(currentDay.getDate() + 1)
      }
      
      setWorkloadData(dailyWorkload)
    }
  }, [tasks, users, project])

  const getTasksForDate = (date: Date): Task[] => {
    return tasks.filter(task => {
      if (!task.startDate || !task.endDate) return false
      
      const taskStart = new Date(task.startDate)
      const taskEnd = new Date(task.endDate)
      const checkDate = new Date(date)
      
      taskStart.setHours(0, 0, 0, 0)
      taskEnd.setHours(0, 0, 0, 0)
      checkDate.setHours(0, 0, 0, 0)
      
      return checkDate >= taskStart && checkDate <= taskEnd
    })
  }

  const getWorkloadForDate = (date: Date): WorkloadData[] => {
    const dateStr = date.toISOString().split('T')[0]
    return workloadData.filter(w => w.date === dateStr)
  }

  const handleTaskStatusChange = (taskId: string, newStatus: Task['status']) => {
    onTaskUpdate(taskId, { status: newStatus })
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

  const renderCalendarDay = (date: Date) => {
    const dayTasks = getTasksForDate(date)
    const workload = getWorkloadForDate(date)
    const isToday = date.toDateString() === new Date().toDateString()
    const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString()
    const maxWorkload = Math.max(...workload.map(w => w.workloadPercent), 0)

    return (
      <div
        key={date.toISOString()}
        className={`
          min-h-[120px] p-2 border border-gray-200 cursor-pointer transition-all duration-200
          ${isToday ? 'bg-blue-50 border-blue-300' : ''}
          ${isSelected ? 'bg-yellow-50 border-yellow-300' : ''}
          ${maxWorkload > 100 ? 'bg-red-50 border-red-300' : ''}
          ${dayTasks.length > 0 ? 'hover:bg-blue-50' : 'hover:bg-gray-50'}
        `}
        onClick={() => {
          setSelectedDate(date)
          if (dayTasks.length > 0) {
            handleDayClick(date)
          }
        }}
        title={dayTasks.length > 0 ? `${dayTasks.length} görev - Detayları görüntülemek için tıklayın` : ''}
      >
        <div className="flex justify-between items-start mb-2">
          <span className={`text-sm font-medium ${isToday ? 'text-blue-600' : 'text-gray-600'}`}>
            {date.getDate()}
          </span>
          {maxWorkload > 100 && (
            <AlertTriangle className="w-4 h-4 text-red-500" />
          )}
        </div>

        {/* Enhanced Workload Indicator - Only show when there's actual workload */}
        {workload.length > 0 && maxWorkload > 0 && (
          <div className="mb-2">
            <div className="flex items-center gap-1 mb-1">
              <Users className="w-3 h-3 text-gray-400" />
              <span className="text-xs text-gray-500">
                {maxWorkload}% doluluk
              </span>
              {maxWorkload > 100 && (
                <div title="Aşırı yük tespit edildi">
                  <AlertTriangle className="w-3 h-3 text-red-500" />
                </div>
              )}
              {maxWorkload > 85 && maxWorkload <= 100 && (
                <div title="Yüksek iş yükü">
                  <AlertTriangle className="w-3 h-3 text-orange-500" />
                </div>
              )}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 relative">
              <div
                className="h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(maxWorkload, 100)}%`,
                  backgroundColor: 
                    maxWorkload > 100 ? '#dc2626' :
                    maxWorkload > 85 ? '#ea580c' :
                    maxWorkload > 70 ? '#d97706' :
                    maxWorkload > 50 ? '#16a34a' :
                    '#22c55e'
                }}
              />
              {maxWorkload > 100 && (
                <div className="absolute right-0 top-0 h-2 w-2 bg-red-600 rounded-full border border-white"></div>
              )}
            </div>
            {/* Removed individual user workload display to clean up calendar view */}
          </div>
        )}

        {/* Task List */}
        <div className="space-y-1">
          {dayTasks.slice(0, 3).map(task => (
            <div
              key={task.id}
              className={`text-xs p-1 rounded truncate cursor-pointer hover:shadow-sm transition-all ${
                task.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                task.status === 'REVIEW' ? 'bg-purple-100 text-purple-800' :
                'bg-gray-100 text-gray-800'
              }`}
              title={task.title}
              onClick={(e) => {
                e.stopPropagation()
                handleTaskStatusChange(task.id, task.status === 'TODO' ? 'IN_PROGRESS' : 
                                     task.status === 'IN_PROGRESS' ? 'REVIEW' :
                                     task.status === 'REVIEW' ? 'COMPLETED' : 'COMPLETED')
              }}
            >
              {task.title}
            </div>
          ))}
          {dayTasks.length > 3 && (
            <div className="text-xs text-gray-500 font-medium">
              +{dayTasks.length - 3} daha...
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
      <div className="grid grid-cols-7 gap-1">
        {['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'].map(day => (
          <div key={day} className="p-2 text-center font-medium text-gray-500 border-b">
            {day}
          </div>
        ))}
        {days.map(day => renderCalendarDay(day))}
      </div>
    )
  }

  const renderWorkloadView = () => {
    return (
      <div className="space-y-6">
        <WorkloadViewer 
          users={users}
          tasks={tasks}
          currentDate={selectedDate || currentDate}
          onDateChange={(date) => {
            setSelectedDate(date)
            setCurrentDate(date)
          }}
        />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Proje Takvimi - {project.name}</h2>
        
        <div className="flex items-center gap-4">
          {/* View Mode Selector */}
          <div className="flex border rounded-lg overflow-hidden">
            {[
              { key: 'calendar', label: 'Takvim', icon: Calendar },
              { key: 'workload', label: 'Doluluk', icon: BarChart3 }
            ].map(mode => {
              const Icon = mode.icon
              return (
                <button
                  key={mode.key}
                  onClick={() => {
                    setViewMode(mode.key as any)
                    if (mode.key === 'workload') {
                      setSelectedDate(currentDate)
                    }
                  }}
                  className={`px-3 py-2 text-sm font-medium flex items-center gap-2 transition-all duration-200 ${
                    viewMode === mode.key
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {mode.label}
                </button>
              )
            })}
          </div>

          {/* Auto-reschedule Button */}
          <button
            onClick={() => onProjectReschedule('auto')}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Yeniden Planla
          </button>
        </div>
      </div>

      {/* Project Status Bar */}
      {project.delayDays > 0 && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <span className="font-medium text-yellow-800">
              Proje {project.delayDays} gün gecikmede
            </span>
            {project.originalEndDate && project.endDate && (
              <span className="text-yellow-600">
                (Orijinal: {new Date(project.originalEndDate).toLocaleDateString('tr-TR')} → 
                Yeni: {new Date(project.endDate).toLocaleDateString('tr-TR')})
              </span>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      {viewMode === 'calendar' && (
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
            className="px-3 py-1 border rounded hover:bg-gray-50"
          >
            ← Önceki Ay
          </button>
          
          <h3 className="text-xl font-semibold">
            {currentDate.toLocaleDateString('tr-TR', { year: 'numeric', month: 'long' })}
          </h3>
          
          <button
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
            className="px-3 py-1 border rounded hover:bg-gray-50"
          >
            Sonraki Ay →
          </button>
        </div>
      )}

      {/* Content */}
      {viewMode === 'calendar' && renderCalendarGrid()}
      {viewMode === 'workload' && renderWorkloadView()}

      {/* Day Details Modal */}
      {showDayModal && selectedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {selectedDate.toLocaleDateString('tr-TR', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </h2>
                  <p className="text-blue-100 text-sm mt-1">
                    {dayTasks.length} görev var
                  </p>
                </div>
                <button
                  onClick={closeDayModal}
                  className="text-white hover:text-blue-200 transition-colors p-2 hover:bg-white/20 rounded-lg"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {/* Workload Summary for the Day */}
              {(() => {
                const selectedDateStr = selectedDate.toISOString().split('T')[0]
                const activeWorkload = workloadData.filter(w => 
                  w.date === selectedDateStr && w.workloadPercent > 0
                )
                
                return activeWorkload.length > 0 && (
                  <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-600" />
                      Günün İş Yükü Dağılımı
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {activeWorkload.map((userWorkload: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                          <span className="text-sm font-medium text-gray-700">
                            {userWorkload.userName}
                          </span>
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div
                                className="h-2 rounded-full transition-all duration-300"
                                style={{
                                  width: `${Math.min(userWorkload.workloadPercent, 100)}%`,
                                  backgroundColor: 
                                    userWorkload.workloadPercent > 100 ? '#dc2626' :
                                    userWorkload.workloadPercent > 85 ? '#ea580c' :
                                    userWorkload.workloadPercent > 70 ? '#d97706' :
                                    userWorkload.workloadPercent > 50 ? '#16a34a' :
                                    '#22c55e'
                                }}
                              />
                            </div>
                            <span className={`text-xs font-medium ${
                              userWorkload.workloadPercent > 100 ? 'text-red-600' :
                              userWorkload.workloadPercent > 85 ? 'text-orange-600' :
                              'text-gray-600'
                            }`}>
                              {userWorkload.workloadPercent}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })()}

              {/* Tasks for the Day */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  Günün Görevleri ({dayTasks.length})
                </h3>
                {dayTasks.map((task) => (
                  <div key={task.id} className="border rounded-lg p-4 hover:shadow-md transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 text-lg">{task.title}</h3>
                        {task.description && (
                          <p className="text-gray-600 text-sm">{task.description}</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`w-3 h-3 rounded-full ${
                          task.status === 'COMPLETED' ? 'bg-green-500' :
                          task.status === 'IN_PROGRESS' ? 'bg-blue-500' :
                          task.status === 'REVIEW' ? 'bg-purple-500' : 'bg-gray-400'
                        }`}></span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Durum:</span>
                        <span className="ml-2 font-medium">
                          {task.status === 'TODO' ? 'Yapılacak' :
                           task.status === 'IN_PROGRESS' ? 'Devam Ediyor' :
                           task.status === 'REVIEW' ? 'İncelemede' : 'Tamamlandı'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Öncelik:</span>
                        <span className="ml-2 font-medium">
                          {task.priority === 'HIGH' ? 'Yüksek' :
                           task.priority === 'URGENT' ? 'Acil' :
                           task.priority === 'MEDIUM' ? 'Orta' : 'Düşük'}
                        </span>
                      </div>
                      {task.assignedUser && (
                        <div>
                          <span className="text-gray-500">Atanan:</span>
                          <span className="ml-2 font-medium text-gray-900">
                            {task.assignedUser.name}
                          </span>
                        </div>
                      )}
                      {task.estimatedHours && (
                        <div>
                          <span className="text-gray-500">Tahmini:</span>
                          <span className="ml-2 font-medium text-gray-900">
                            {task.estimatedHours} saat
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EnhancedCalendar
