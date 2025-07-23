'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Calendar, 
  Clock, 
  AlertTriangle, 
  Users, 
  BarChart3, 
  RefreshCw, 
  Timer, 
  Zap,
  ChevronLeft,
  ChevronRight,
  Eye,
  TrendingUp,
  Activity
} from 'lucide-react'

interface WorkloadUser {
  id: string
  name: string
  department: string
  maxHoursPerDay: number
  workloadPercentage: number
  totalHours: number
  tasks: any[]
}

interface WorkloadViewerProps {
  users: any[]
  tasks: any[]
  currentDate: Date
  onDateChange: (date: Date) => void
}

export default function WorkloadViewer({ users, tasks, currentDate, onDateChange }: WorkloadViewerProps) {
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly'>('daily')
  const [workloadData, setWorkloadData] = useState<WorkloadUser[]>([])

  // Recalculate workload when viewMode or currentDate changes
  useEffect(() => {
    const newWorkloadData = calculateWorkloadForDate(currentDate)
    setWorkloadData(newWorkloadData)
  }, [viewMode, currentDate, users, tasks])

  // Get current month name in Turkish
  const getMonthName = (date: Date) => {
    const months = [
      'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
      'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ]
    return months[date.getMonth()]
  }

  // Calculate workload for a specific date or period
  const calculateWorkloadForDate = (date: Date): WorkloadUser[] => {
    return users.map(user => {
      let totalHours = 0
      let relevantTasks = []
      let maxHours = user.maxHoursPerDay || 8

      if (viewMode === 'daily') {
        // Daily calculation - exact same as before
        const dateStr = date.toISOString().split('T')[0]
        
        const userTasks = tasks.filter(task => {
          if (!task.startDate || !task.endDate || task.assignedId !== user.id) return false
          
          const taskStart = new Date(task.startDate)
          const taskEnd = new Date(task.endDate)
          const checkDate = new Date(date)
          
          taskStart.setHours(0, 0, 0, 0)
          taskEnd.setHours(0, 0, 0, 0)
          checkDate.setHours(0, 0, 0, 0)
          
          return checkDate >= taskStart && checkDate <= taskEnd
        })

        totalHours = userTasks.reduce((sum, task) => {
          if (!task.startDate || !task.endDate) {
            return sum + (task.estimatedHours || 4)
          }
          
          const taskStart = new Date(task.startDate)
          const taskEnd = new Date(task.endDate)
          const workingDays = getWorkingDaysBetween(taskStart, taskEnd)
          
          if (workingDays <= 0) {
            return sum + (task.estimatedHours || 4)
          }
          
          const totalTaskHours = task.estimatedHours || (workingDays * 4)
          const hoursPerWorkingDay = totalTaskHours / workingDays
          
          const isWeekend = date.getDay() === 0 || date.getDay() === 6
          if (isWeekend) {
            return sum + (hoursPerWorkingDay * 0.3)
          }
          
          return sum + hoursPerWorkingDay
        }, 0)

        relevantTasks = userTasks

      } else if (viewMode === 'weekly') {
        // Weekly calculation - sum all days in the week
        const startOfWeek = new Date(date)
        startOfWeek.setDate(date.getDate() - date.getDay()) // Go to Sunday
        
        let weeklyHours = 0
        for (let i = 0; i < 7; i++) {
          const dayDate = new Date(startOfWeek)
          dayDate.setDate(startOfWeek.getDate() + i)
          
          const dayTasks = tasks.filter(task => {
            if (!task.startDate || !task.endDate || task.assignedId !== user.id) return false
            
            const taskStart = new Date(task.startDate)
            const taskEnd = new Date(task.endDate)
            const checkDate = new Date(dayDate)
            
            taskStart.setHours(0, 0, 0, 0)
            taskEnd.setHours(0, 0, 0, 0)
            checkDate.setHours(0, 0, 0, 0)
            
            return checkDate >= taskStart && checkDate <= taskEnd
          })

          const dayHours = dayTasks.reduce((sum, task) => {
            if (!task.startDate || !task.endDate) {
              return sum + (task.estimatedHours || 4)
            }
            
            const taskStart = new Date(task.startDate)
            const taskEnd = new Date(task.endDate)
            const workingDays = getWorkingDaysBetween(taskStart, taskEnd)
            
            if (workingDays <= 0) {
              return sum + (task.estimatedHours || 4)
            }
            
            const totalTaskHours = task.estimatedHours || (workingDays * 4)
            const hoursPerWorkingDay = totalTaskHours / workingDays
            
            const isWeekend = dayDate.getDay() === 0 || dayDate.getDay() === 6
            if (isWeekend) {
              return sum + (hoursPerWorkingDay * 0.3)
            }
            
            return sum + hoursPerWorkingDay
          }, 0)

          weeklyHours += dayHours
        }
        
        totalHours = weeklyHours
        maxHours = maxHours * 7 // Weekly maximum
        relevantTasks = tasks.filter(task => {
          if (!task.startDate || !task.endDate || task.assignedId !== user.id) return false
          
          const taskStart = new Date(task.startDate)
          const taskEnd = new Date(task.endDate)
          const endOfWeek = new Date(startOfWeek)
          endOfWeek.setDate(startOfWeek.getDate() + 6)
          
          return (taskStart <= endOfWeek && taskEnd >= startOfWeek)
        })

      } else if (viewMode === 'monthly') {
        // Monthly calculation - sum all days in the month
        const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1)
        const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0)
        
        let monthlyHours = 0
        const currentDay = new Date(startOfMonth)
        
        while (currentDay <= endOfMonth) {
          const dayTasks = tasks.filter(task => {
            if (!task.startDate || !task.endDate || task.assignedId !== user.id) return false
            
            const taskStart = new Date(task.startDate)
            const taskEnd = new Date(task.endDate)
            const checkDate = new Date(currentDay)
            
            taskStart.setHours(0, 0, 0, 0)
            taskEnd.setHours(0, 0, 0, 0)
            checkDate.setHours(0, 0, 0, 0)
            
            return checkDate >= taskStart && checkDate <= taskEnd
          })

          const dayHours = dayTasks.reduce((sum, task) => {
            if (!task.startDate || !task.endDate) {
              return sum + (task.estimatedHours || 4)
            }
            
            const taskStart = new Date(task.startDate)
            const taskEnd = new Date(task.endDate)
            const workingDays = getWorkingDaysBetween(taskStart, taskEnd)
            
            if (workingDays <= 0) {
              return sum + (task.estimatedHours || 4)
            }
            
            const totalTaskHours = task.estimatedHours || (workingDays * 4)
            const hoursPerWorkingDay = totalTaskHours / workingDays
            
            const isWeekend = currentDay.getDay() === 0 || currentDay.getDay() === 6
            if (isWeekend) {
              return sum + (hoursPerWorkingDay * 0.3)
            }
            
            return sum + hoursPerWorkingDay
          }, 0)

          monthlyHours += dayHours
          currentDay.setDate(currentDay.getDate() + 1)
        }
        
        totalHours = monthlyHours
        // Calculate working days in month for maximum hours
        const workingDaysInMonth = getWorkingDaysBetween(startOfMonth, endOfMonth)
        maxHours = maxHours * Math.max(workingDaysInMonth, 1)
        
        relevantTasks = tasks.filter(task => {
          if (!task.startDate || !task.endDate || task.assignedId !== user.id) return false
          
          const taskStart = new Date(task.startDate)
          const taskEnd = new Date(task.endDate)
          
          return (taskStart <= endOfMonth && taskEnd >= startOfMonth)
        })
      }

      const workloadPercentage = Math.round((totalHours / maxHours) * 100)

      return {
        id: user.id,
        name: user.name,
        department: user.department || 'Genel',
        maxHoursPerDay: maxHours,
        workloadPercentage,
        totalHours,
        tasks: relevantTasks
      }
    })
  }

  // Helper function to calculate working days between two dates
  const getWorkingDaysBetween = (startDate: Date, endDate: Date): number => {
    let count = 0
    const current = new Date(startDate)
    current.setHours(0, 0, 0, 0)
    const end = new Date(endDate)
    end.setHours(0, 0, 0, 0)
    
    while (current <= end) {
      const dayOfWeek = current.getDay()
      if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Monday to Friday
        count++
      }
      current.setDate(current.getDate() + 1)
    }
    
    return count
  }

  // Navigate dates
  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    if (viewMode === 'daily') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1))
    } else if (viewMode === 'weekly') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7))
    } else {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1))
    }
    onDateChange(newDate)
  }

  // Get workload color
  const getWorkloadColor = (percentage: number) => {
    if (percentage <= 50) return 'from-green-400 to-green-600'
    if (percentage <= 80) return 'from-yellow-400 to-yellow-600'
    if (percentage <= 100) return 'from-orange-400 to-orange-600'
    return 'from-red-400 to-red-600'
  }

  // Get workload status
  const getWorkloadStatus = (percentage: number) => {
    if (percentage <= 50) return { text: 'Hafif', color: 'text-green-600' }
    if (percentage <= 80) return { text: 'Normal', color: 'text-yellow-600' }
    if (percentage <= 100) return { text: 'Yoğun', color: 'text-orange-600' }
    return { text: 'Aşırı Yoğun', color: 'text-red-600' }
  }

  return (
    <div className="space-y-6">
      {/* Header with Navigation */}
      <motion.div 
        className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Activity className="w-8 h-8" />
            <div>
              <h2 className="text-2xl font-bold">Çalışan Doluluk Analizi</h2>
              <p className="text-blue-100">Takım üyelerinin iş yükü dağılımı</p>
            </div>
          </div>
          
          {/* View Mode Selector */}
          <div className="flex bg-white/20 rounded-xl p-1">
            {['daily', 'weekly', 'monthly'].map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  viewMode === mode 
                    ? 'bg-white text-blue-600 shadow-lg' 
                    : 'text-white/80 hover:text-white'
                }`}
              >
                {mode === 'daily' ? 'Günlük' : mode === 'weekly' ? 'Haftalık' : 'Aylık'}
              </button>
            ))}
          </div>
        </div>

        {/* Date Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigateDate('prev')}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-xl hover:bg-white/30 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            {viewMode === 'daily' ? 'Önceki Gün' : viewMode === 'weekly' ? 'Önceki Hafta' : 'Önceki Ay'}
          </button>

          <div className="text-center">
            <div className="text-2xl font-bold">
              {viewMode === 'daily' 
                ? `${currentDate.getDate()} ${getMonthName(currentDate)} ${currentDate.getFullYear()}`
                : viewMode === 'weekly'
                ? `${getMonthName(currentDate)} ${currentDate.getFullYear()} - ${Math.ceil(currentDate.getDate() / 7)}. Hafta`
                : `${getMonthName(currentDate)} ${currentDate.getFullYear()}`
              }
            </div>
            <div className="text-blue-100 text-sm">
              {viewMode === 'daily' && ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'][currentDate.getDay()]}
              {viewMode === 'weekly' && 'Haftalık toplam doluluk'}
              {viewMode === 'monthly' && 'Aylık toplam doluluk'}
            </div>
          </div>

          <button
            onClick={() => navigateDate('next')}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-xl hover:bg-white/30 transition-colors"
          >
            {viewMode === 'daily' ? 'Sonraki Gün' : viewMode === 'weekly' ? 'Sonraki Hafta' : 'Sonraki Ay'}
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </motion.div>

      {/* Workload Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {workloadData.map((user, index) => {
            const status = getWorkloadStatus(user.workloadPercentage)
            
            return (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 cursor-pointer"
                onClick={() => setSelectedUser(selectedUser === user.id ? null : user.id)}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{user.name}</h3>
                      <p className="text-sm text-gray-500">{user.department}</p>
                    </div>
                  </div>
                  <Eye className="w-5 h-5 text-gray-400" />
                </div>

                {/* Workload Progress */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-600">Doluluk</span>
                    <span className={`text-sm font-bold ${status.color}`}>
                      {user.workloadPercentage}% • {status.text}
                    </span>
                  </div>
                  {/* Debug info */}
                  <div className="text-xs text-gray-400 mb-1">
                    {user.totalHours.toFixed(1)}h / {user.maxHoursPerDay}h 
                    {viewMode === 'weekly' && ' (haftalık)'}
                    {viewMode === 'monthly' && ' (aylık)'}
                    {viewMode === 'daily' && ' (günlük)'}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full bg-gradient-to-r ${getWorkloadColor(user.workloadPercentage)} transition-all duration-500`}
                      style={{ width: `${Math.min(user.workloadPercentage, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Hours Info */}
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">
                      {user.totalHours.toFixed(1)}/{user.maxHoursPerDay} 
                      {viewMode === 'daily' ? ' saat' : viewMode === 'weekly' ? ' saat/hafta' : ' saat/ay'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">{user.tasks.length} görev</span>
                  </div>
                </div>

                {/* Expanded Task List */}
                <AnimatePresence>
                  {selectedUser === user.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t border-gray-200"
                    >
                      <h4 className="font-medium text-gray-900 mb-3">Aktif Görevler</h4>
                      {user.tasks.length > 0 ? (
                        <div className="space-y-2">
                          {user.tasks.map((task) => (
                            <div
                              key={task.id}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                            >
                              <div>
                                <p className="font-medium text-sm text-gray-900">{task.title}</p>
                                <p className="text-xs text-gray-500">
                                  {task.estimatedHours || 4} saat • {task.priority} öncelik
                                </p>
                              </div>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                task.status === 'TODO' ? 'bg-gray-100 text-gray-700' :
                                task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                                task.status === 'REVIEW' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-green-100 text-green-700'
                              }`}>
                                {task.status === 'TODO' ? 'Bekliyor' :
                                 task.status === 'IN_PROGRESS' ? 'Devam Ediyor' :
                                 task.status === 'REVIEW' ? 'İncelemede' : 'Tamamlandı'}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">Bu tarihte aktif görev yok</p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Summary Stats */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {[
          {
            label: 'Toplam Çalışan',
            value: workloadData.length,
            icon: Users,
            color: 'from-blue-500 to-blue-600'
          },
          {
            label: 'Aşırı Yoğun',
            value: workloadData.filter(u => u.workloadPercentage > 100).length,
            icon: AlertTriangle,
            color: 'from-red-500 to-red-600'
          },
          {
            label: 'Ortalama Doluluk',
            value: `${Math.round(workloadData.reduce((sum, u) => sum + u.workloadPercentage, 0) / workloadData.length)}%`,
            icon: TrendingUp,
            color: 'from-green-500 to-green-600'
          },
          {
            label: 'Aktif Görevler',
            value: workloadData.reduce((sum, u) => sum + u.tasks.length, 0),
            icon: Activity,
            color: 'from-purple-500 to-purple-600'
          }
        ].map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className={`bg-gradient-to-r ${stat.color} rounded-xl p-4 text-white`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <Icon className="w-8 h-8 text-white/80" />
              </div>
            </div>
          )
        })}
      </motion.div>
    </div>
  )
}
