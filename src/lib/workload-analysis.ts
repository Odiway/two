// Enhanced workload and bottleneck analysis utilities

import { Task, User, Project, TaskStatus, Priority } from '@prisma/client'

// Type definitions
export interface WorkloadData {
  userId: string
  userName: string
  date: string
  workloadPercent: number
  hoursAllocated: number
  hoursAvailable: number
  isOverloaded: boolean
  tasks: Task[]
}

export interface DailyWorkload {
  date: string
  workload: number
  percentage: number
  tasks: number
}

export interface WorkloadReport {
  startDate: string
  endDate: string
  dailyWorkloads: DailyWorkload[]
  bottlenecks: BottleneckData[]
  averageWorkload: number
  maxWorkload: number
  totalTasks: number
}

export interface BottleneckData {
  date: string
  taskCount: number
  maxWorkload: number
  isBottleneck: boolean
  tasks: Task[]
  criticalTasks: Task[]
}

export interface TaskTimeData {
  taskId: string
  timeInTodo: number
  timeInProgress: number
  timeInReview: number
  totalTime: number
}

// Utility functions
export function getWorkloadColor(percentage: number): string {
  if (percentage <= 50) return '#10B981' // Green - Light workload
  if (percentage <= 70) return '#F59E0B' // Yellow - Moderate workload
  if (percentage <= 85) return '#F97316' // Orange - High workload
  if (percentage <= 100) return '#EF4444' // Red - Heavy workload
  return '#7C2D12' // Dark red - Overloaded
}

export function getWorkloadLabel(percentage: number): string {
  if (percentage <= 50) return 'Hafif'
  if (percentage <= 70) return 'Orta'
  if (percentage <= 85) return 'Yoğun'
  if (percentage <= 100) return 'Çok Yoğun'
  return 'Aşırı Yük'
}

export function calculateWorkloadPercentage(
  hoursAllocated: number,
  hoursAvailable: number
): number {
  return Math.round((hoursAllocated / hoursAvailable) * 100)
}

// Main WorkloadAnalyzer class
export class WorkloadAnalyzer {
  static calculateDailyWorkload(tasks: Task[], date: Date): number {
    const dateStr = date.toISOString().split('T')[0]
    const dayTasks = tasks.filter(task => {
      const taskDate = new Date(task.endDate || task.createdAt).toISOString().split('T')[0]
      return taskDate === dateStr
    })

    return dayTasks.reduce((total, task) => {
      switch (task.priority) {
        case 'HIGH': return total + 40
        case 'MEDIUM': return total + 25
        case 'LOW': return total + 15
        default: return total + 20
      }
    }, 0)
  }

  static detectBottlenecks(tasks: Task[], startDate: Date, endDate: Date): BottleneckData[] {
    const bottlenecks: BottleneckData[] = []
    const current = new Date(startDate)

    while (current <= endDate) {
      const dateStr = current.toISOString().split('T')[0]
      const dayTasks = tasks.filter(task => {
        const taskDate = new Date(task.endDate || task.createdAt).toISOString().split('T')[0]
        return taskDate === dateStr
      })

      const workload = this.calculateDailyWorkload(dayTasks, current)
      const taskCount = dayTasks.length
      const criticalTasks = dayTasks.filter(task => task.priority === 'HIGH')

      // Updated bottleneck detection criteria - more realistic thresholds
      const avgWorkload = workload / Math.max(taskCount, 1)
      const isBottleneck = (
        avgWorkload >= 90 ||  // 90% average workload
        workload >= 120 ||    // 120% max workload
        (taskCount >= 8 && avgWorkload >= 75) // 8+ tasks with 75% average
      )

      if (isBottleneck) {
        bottlenecks.push({
          date: dateStr,
          taskCount,
          maxWorkload: workload,
          isBottleneck: true,
          tasks: dayTasks,
          criticalTasks
        })
      }

      current.setDate(current.getDate() + 1)
    }

    return bottlenecks
  }

  static generateWorkloadReport(tasks: Task[], startDate: Date, endDate: Date): WorkloadReport {
    const dailyWorkloads: DailyWorkload[] = []
    const current = new Date(startDate)
    let totalWorkload = 0

    while (current <= endDate) {
      const workload = this.calculateDailyWorkload(tasks, current)
      const dateStr = current.toISOString().split('T')[0]

      dailyWorkloads.push({
        date: dateStr,
        workload: workload,
        percentage: Math.min(100, (workload / 100) * 100),
        tasks: tasks.filter(task => {
          const taskDate = new Date(task.endDate || task.createdAt).toISOString().split('T')[0]
          return taskDate === dateStr
        }).length
      })

      totalWorkload += workload
      current.setDate(current.getDate() + 1)
    }

    const bottlenecks = this.detectBottlenecks(tasks, startDate, endDate)
    const avgWorkload = totalWorkload / dailyWorkloads.length

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      dailyWorkloads,
      bottlenecks,
      averageWorkload: avgWorkload,
      maxWorkload: Math.max(...dailyWorkloads.map(d => d.workload)),
      totalTasks: tasks.length
    }
  }

  // Calculate daily workload data for multiple users
  static calculateDailyWorkloadData(date: Date): WorkloadData[] {
    // This would typically fetch from database
    // For now, return mock data
    return []
  }
}

// Time tracking utilities
export class TaskTimeTracker {
  static calculateTimeInStatus(task: Task, timeTrackingData: TaskTimeData[]): TaskTimeData | null {
    const trackingData = timeTrackingData.find(t => t.taskId === task.id)
    if (!trackingData) return null
    
    return trackingData
  }

  static formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    
    if (hours === 0) {
      return `${mins}dk`
    } else if (mins === 0) {
      return `${hours}sa`
    } else {
      return `${hours}sa ${mins}dk`
    }
  }

  static getStatusColor(status: string): string {
    switch (status) {
      case 'TODO': return '#6B7280'
      case 'IN_PROGRESS': return '#3B82F6'
      case 'REVIEW': return '#F59E0B'
      case 'COMPLETED': return '#10B981'
      default: return '#6B7280'
    }
  }
}

// Project rescheduling utilities
export class ProjectScheduler {
  static async rescheduleProject(projectId: string, strategy: 'conservative' | 'aggressive' | 'balanced' = 'balanced'): Promise<{
    success: boolean
    newEndDate: Date
    adjustedTasks: number
    message: string
  }> {
    // Mock implementation - in real app this would update database
    return {
      success: true,
      newEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
      adjustedTasks: 0,
      message: 'Proje başarıyla yeniden planlandı'
    }
  }

  static calculateOptimalShift(task: Task, strategy: 'conservative' | 'aggressive' | 'balanced'): number {
    // Simple calculation based on strategy
    switch (strategy) {
      case 'conservative': return 3 // 3 days
      case 'aggressive': return 1   // 1 day
      case 'balanced': return 2     // 2 days
      default: return 2
    }
  }
}
