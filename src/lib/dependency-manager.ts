import { WorkloadAnalyzer } from './workload-analysis'

export interface Task {
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
  taskType: 'INDEPENDENT' | 'CONNECTED'
  dependencies?: string[]
  dependents?: string[]
  scheduleType?: 'SECURE' | 'AUTO' | 'STANDARD'
  estimatedFinishDate?: Date
  actualFinishDate?: Date
  assignedUser?: {
    id: string
    name: string
    maxHoursPerDay: number
  }
}

export interface DependencyUpdate {
  taskId: string
  updatedTask?: Task  // The task that was updated
  affectedTasks: string[]
  scheduleChanges: ScheduleChange[]
  visualizationData: DependencyVisualization
  strategyUsed?: 'SECURE' | 'AUTO' | 'STANDARD'  // The strategy used for rescheduling
}

export interface ScheduleChange {
  taskId: string
  oldStartDate?: Date
  newStartDate?: Date
  oldEndDate?: Date
  newEndDate?: Date
  reason: string
  impactDays: number
}

export interface DependencyVisualization {
  nodes: TaskNode[]
  edges: TaskEdge[]
  criticalPath: string[]
}

export interface TaskNode {
  id: string
  title: string
  status: string
  taskType: 'INDEPENDENT' | 'CONNECTED'
  scheduleType?: 'SECURE' | 'AUTO' | 'STANDARD'
  startDate?: Date
  endDate?: Date
  isOnCriticalPath: boolean
  impactLevel: 'HIGH' | 'MEDIUM' | 'LOW'
}

export interface TaskEdge {
  from: string
  to: string
  type: 'DEPENDENCY'
  delay: number
}

export class DependencyManager {
  private tasks: Task[]
  private users: any[]
  private workloadAnalyzer: WorkloadAnalyzer

  constructor(tasks: Task[], users: any[]) {
    this.tasks = tasks
    this.users = users
    this.workloadAnalyzer = new WorkloadAnalyzer(users, tasks as any[])
  }

  // Main function to handle task status updates
  public handleTaskCompletion(taskId: string, actualFinishDate: Date): DependencyUpdate {
    const task = this.tasks.find(t => t.id === taskId)
    if (!task) throw new Error('Task not found')

    // Update the task's actual finish date
    task.actualFinishDate = actualFinishDate
    task.status = 'COMPLETED'

    if (task.taskType === 'INDEPENDENT') {
      return this.handleIndependentTaskCompletion(task)
    } else {
      return this.handleConnectedTaskCompletion(task)
    }
  }

  private handleIndependentTaskCompletion(task: Task): DependencyUpdate {
    // For independent tasks, just log the difference
    const estimatedDate = task.estimatedFinishDate || task.endDate
    const actualDate = task.actualFinishDate!
    
    const dayDifference = estimatedDate ? 
      Math.floor((actualDate.getTime() - estimatedDate.getTime()) / (1000 * 60 * 60 * 24)) : 0

    return {
      taskId: task.id,
      updatedTask: task,
      affectedTasks: [],
      scheduleChanges: [{
        taskId: task.id,
        oldEndDate: estimatedDate,
        newEndDate: actualDate,
        reason: dayDifference > 0 ? 
          `Task completed ${dayDifference} days late` : 
          `Task completed ${Math.abs(dayDifference)} days early`,
        impactDays: dayDifference
      }],
      visualizationData: this.generateVisualization([task.id]),
      strategyUsed: undefined // Independent tasks don't use strategies
    }
  }

  private handleConnectedTaskCompletion(task: Task): DependencyUpdate {
    const estimatedDate = task.estimatedFinishDate || task.endDate
    const actualDate = task.actualFinishDate!
    
    if (!estimatedDate) {
      throw new Error('Connected task must have an estimated finish date')
    }

    const dayDifference = Math.floor((actualDate.getTime() - estimatedDate.getTime()) / (1000 * 60 * 60 * 24))
    const dependentTasks = this.getDependentTasks(task.id)
    
    let scheduleChanges: ScheduleChange[] = []
    let affectedTaskIds: string[] = []

    // Apply scheduling logic based on task's schedule type
    switch (task.scheduleType || 'STANDARD') {
      case 'SECURE':
        ({ scheduleChanges, affectedTaskIds } = this.applySecureSchedule(task, dependentTasks, dayDifference))
        break
      case 'AUTO':
        ({ scheduleChanges, affectedTaskIds } = this.applyAutoSchedule(task, dependentTasks, dayDifference))
        break
      case 'STANDARD':
        ({ scheduleChanges, affectedTaskIds } = this.applyStandardSchedule(task, dependentTasks, dayDifference))
        break
    }

    return {
      taskId: task.id,
      updatedTask: task,
      affectedTasks: affectedTaskIds,
      scheduleChanges,
      visualizationData: this.generateVisualization([task.id, ...affectedTaskIds]),
      strategyUsed: task.scheduleType || 'STANDARD'
    }
  }

  private applySecureSchedule(
    completedTask: Task, 
    dependentTasks: Task[], 
    dayDifference: number
  ): { scheduleChanges: ScheduleChange[], affectedTaskIds: string[] } {
    const scheduleChanges: ScheduleChange[] = []
    const affectedTaskIds: string[] = []

    // Secure schedule: directly adjust all dependent tasks by the same amount
    dependentTasks.forEach(task => {
      const oldStartDate = task.startDate
      const oldEndDate = task.endDate

      if (oldStartDate && oldEndDate) {
        const newStartDate = new Date(oldStartDate)
        newStartDate.setDate(newStartDate.getDate() + dayDifference)
        
        const newEndDate = new Date(oldEndDate)
        newEndDate.setDate(newEndDate.getDate() + dayDifference)

        task.startDate = newStartDate
        task.endDate = newEndDate

        scheduleChanges.push({
          taskId: task.id,
          oldStartDate,
          newStartDate,
          oldEndDate,
          newEndDate,
          reason: `Adjusted due to ${completedTask.title} finishing ${dayDifference > 0 ? 'late' : 'early'}`,
          impactDays: dayDifference
        })

        affectedTaskIds.push(task.id)
      }
    })

    return { scheduleChanges, affectedTaskIds }
  }

  private applyAutoSchedule(
    completedTask: Task, 
    dependentTasks: Task[], 
    dayDifference: number
  ): { scheduleChanges: ScheduleChange[], affectedTaskIds: string[] } {
    const scheduleChanges: ScheduleChange[] = []
    const affectedTaskIds: string[] = []

    // Auto schedule: use workload analyzer to optimize the schedule
    const allAffectedTasks = this.getAllDependentTasks(completedTask.id)
    
    // Calculate optimal reschedule considering workloads and bottlenecks
    const rescheduleResult = this.workloadAnalyzer.calculateOptimalReschedule(
      allAffectedTasks.map(t => t.id),
      dayDifference
    )

    allAffectedTasks.forEach(task => {
      const optimization = rescheduleResult.taskOptimizations?.find(opt => opt.taskId === task.id)
      if (optimization) {
        const oldStartDate = task.startDate
        const oldEndDate = task.endDate

        task.startDate = optimization.newStartDate
        task.endDate = optimization.newEndDate

        scheduleChanges.push({
          taskId: task.id,
          oldStartDate,
          newStartDate: optimization.newStartDate,
          oldEndDate,
          newEndDate: optimization.newEndDate,
          reason: `Auto-optimized considering workload and bottlenecks`,
          impactDays: optimization.dayShift
        })

        affectedTaskIds.push(task.id)
      }
    })

    return { scheduleChanges, affectedTaskIds }
  }

  private applyStandardSchedule(
    completedTask: Task, 
    dependentTasks: Task[], 
    dayDifference: number
  ): { scheduleChanges: ScheduleChange[], affectedTaskIds: string[] } {
    const scheduleChanges: ScheduleChange[] = []
    const affectedTaskIds: string[] = []

    // Standard schedule: only adjust if task finished late
    if (dayDifference > 0) {
      dependentTasks.forEach(task => {
        const oldStartDate = task.startDate
        const oldEndDate = task.endDate

        if (oldStartDate && oldEndDate) {
          const newStartDate = new Date(oldStartDate)
          newStartDate.setDate(newStartDate.getDate() + dayDifference)
          
          const newEndDate = new Date(oldEndDate)
          newEndDate.setDate(newEndDate.getDate() + dayDifference)

          task.startDate = newStartDate
          task.endDate = newEndDate

          scheduleChanges.push({
            taskId: task.id,
            oldStartDate,
            newStartDate,
            oldEndDate,
            newEndDate,
            reason: `Delayed due to ${completedTask.title} finishing late`,
            impactDays: dayDifference
          })

          affectedTaskIds.push(task.id)
        }
      })
    }
    // If finished early, do nothing (no changes)

    return { scheduleChanges, affectedTaskIds }
  }

  private getDependentTasks(taskId: string): Task[] {
    const task = this.tasks.find(t => t.id === taskId)
    if (!task || !task.dependents) return []

    return this.tasks.filter(t => task.dependents!.includes(t.id))
  }

  private getAllDependentTasks(taskId: string): Task[] {
    const directDependents = this.getDependentTasks(taskId)
    const allDependents: Task[] = [...directDependents]

    // Recursively get all dependent tasks
    directDependents.forEach(task => {
      const subDependents = this.getAllDependentTasks(task.id)
      subDependents.forEach(subTask => {
        if (!allDependents.find(t => t.id === subTask.id)) {
          allDependents.push(subTask)
        }
      })
    })

    return allDependents
  }

  private generateVisualization(highlightedTaskIds: string[]): DependencyVisualization {
    const nodes: TaskNode[] = this.tasks.map(task => ({
      id: task.id,
      title: task.title,
      status: task.status,
      taskType: task.taskType,
      scheduleType: task.scheduleType,
      startDate: task.startDate,
      endDate: task.endDate,
      isOnCriticalPath: this.isOnCriticalPath(task.id),
      impactLevel: this.calculateImpactLevel(task.id)
    }))

    const edges: TaskEdge[] = []
    this.tasks.forEach(task => {
      if (task.dependencies) {
        task.dependencies.forEach(depId => {
          edges.push({
            from: depId,
            to: task.id,
            type: 'DEPENDENCY',
            delay: 0 // Calculate actual delay if needed
          })
        })
      }
    })

    return {
      nodes,
      edges,
      criticalPath: this.calculateCriticalPath()
    }
  }

  private isOnCriticalPath(taskId: string): boolean {
    // Simplified critical path calculation
    const criticalPath = this.calculateCriticalPath()
    return criticalPath.includes(taskId)
  }

  private calculateImpactLevel(taskId: string): 'HIGH' | 'MEDIUM' | 'LOW' {
    const dependentCount = this.getAllDependentTasks(taskId).length
    if (dependentCount >= 5) return 'HIGH'
    if (dependentCount >= 2) return 'MEDIUM'
    return 'LOW'
  }

  private calculateCriticalPath(): string[] {
    // Simplified critical path calculation
    // In a real implementation, this would use proper CPM algorithm
    const connectedTasks = this.tasks.filter(t => t.taskType === 'CONNECTED')
    
    // Sort by priority and dependency count for now
    return connectedTasks
      .sort((a, b) => {
        const aDeps = this.getAllDependentTasks(a.id).length
        const bDeps = this.getAllDependentTasks(b.id).length
        return bDeps - aDeps
      })
      .slice(0, Math.ceil(connectedTasks.length * 0.3))
      .map(t => t.id)
  }

  // Public method to get dependency relationships
  public getDependencyGraph(): DependencyVisualization {
    return this.generateVisualization([])
  }

  // Public method to validate dependencies (no circular dependencies)
  public validateDependencies(): { valid: boolean, errors: string[] } {
    const errors: string[] = []
    
    // Check for circular dependencies
    this.tasks.forEach(task => {
      if (this.hasCircularDependency(task.id, [])) {
        errors.push(`Circular dependency detected involving task: ${task.title}`)
      }
    })

    return { valid: errors.length === 0, errors }
  }

  private hasCircularDependency(taskId: string, visited: string[]): boolean {
    if (visited.includes(taskId)) return true
    
    const task = this.tasks.find(t => t.id === taskId)
    if (!task || !task.dependencies) return false

    const newVisited = [...visited, taskId]
    return task.dependencies.some(depId => this.hasCircularDependency(depId, newVisited))
  }
}
