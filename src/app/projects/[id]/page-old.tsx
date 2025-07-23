'use client'

import { useEffect, useState, use, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Navbar from '@/components/Navbar'
import WorkflowProgress from '@/components/WorkflowProgress'
import EnhancedCalendar from '@/components/EnhancedCalendar'
import AnimatedCard from '@/components/ui/AnimatedCard'
import { GradientBackground } from '@/components/ui/FloatingElements'
import StatsCard from '@/components/ui/StatsCard'
import ModernTabs from '@/components/ui/ModernTabs'
import InteractiveAccordion from '@/components/ui/InteractiveAccordion'
import {
  ArrowLeft,
  Plus,
  Calendar,
  Users,
  Trash2,
  Edit,
  Check,
  ChevronDown,
  ChevronUp,
  BarChart3,
  AlertTriangle,
  Clock,
  Zap,
  Target,
  TrendingUp,
  Sparkles,
  Rocket,
  Brain,
  Eye,
  Shield,
  Award,
  Link as LinkIcon,
  GitBranch,
  Network,
  Unlink,
  Settings
} from 'lucide-react'
import {
  getStatusColor,
  getStatusText,
  getPriorityColor,
  getPriorityText,
  formatDate,
} from '@/lib/utils'
import Link from 'next/link'

interface User {
  id: string
  name: string
  email: string
}

interface WorkflowStep {
  id: string
  name: string
  color: string
  order: number
}

interface Task {
  id: string
  title: string
  description: string | null
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  startDate: string | null
  endDate: string | null
  workflowStepId: string | null
  assignedUser: User | null
  workflowStep: WorkflowStep | null
  assignedUsers: {
    id: string
    user: User
  }[]
  projectId: string
  createdAt: string
  updatedAt: string
  project?: Project
  // Enhanced calendar properties
  estimatedHours?: number
  actualHours?: number
  delayReason?: string
  delayDays?: number
  workloadPercentage?: number
  isBottleneck?: boolean
  originalEndDate?: string | null
  // Task dependency properties
  taskType?: 'INDEPENDENT' | 'CONNECTED'
  dependencies?: string[] // Array of task IDs this task depends on
  dependents?: string[] // Array of task IDs that depend on this task
  scheduleType?: 'SECURE' | 'AUTO' | 'STANDARD'
}

interface ProjectMember {
  id: string
  role: string
  user: User
}

interface Project {
  id: string
  name: string
  description: string | null
  status: 'PLANNING' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD'
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  startDate: string | null
  endDate: string | null
  originalEndDate?: string | null
  delayDays: number
  autoReschedule: boolean
  tasks: Task[]
  members: ProjectMember[]
  workflowSteps: WorkflowStep[]
}

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const resolvedParams = use(params)

  // State management
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set())
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set())
  const [showTeamModal, setShowTeamModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'calendar' | 'analytics'>('overview')
  const [users, setUsers] = useState<User[]>([])
  
  // Task linking state
  const [linkingMode, setLinkingMode] = useState(false)
  const [sourceTask, setSourceTask] = useState<string | null>(null)
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [selectedTaskForLinking, setSelectedTaskForLinking] = useState<string | null>(null)

  // Fetch users for enhanced calendar
  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }, [])

  // Fetch project data
  const fetchProject = useCallback(async () => {
    try {
      console.log('Fetching project data for ID:', resolvedParams.id)
      const response = await fetch(`/api/projects/${resolvedParams.id}`)
      if (response.ok) {
        const data = await response.json()
        console.log('Project data fetched successfully:', data)
        console.log('Tasks count:', data.tasks?.length || 0)
        setProject(data)
      } else if (response.status === 404) {
        console.error('Project not found, redirecting to projects list')
        router.push('/projects')
      } else {
        console.error('Error fetching project:', response.status, await response.text())
      }
    } catch (error) {
      console.error('Error fetching project:', error)
    } finally {
      setLoading(false)
    }
  }, [resolvedParams.id, router])

  // Event handlers
  const toggleTaskExpansion = (taskId: string) => {
    const newExpandedTasks = new Set(expandedTasks)
    if (newExpandedTasks.has(taskId)) {
      newExpandedTasks.delete(taskId)
    } else {
      newExpandedTasks.add(taskId)
    }
    setExpandedTasks(newExpandedTasks)
  }

  const handleTaskStatusChange = async (
    taskId: string,
    newStatus: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED'
  ) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        setProject((prev) => {
          if (!prev) return prev
          return {
            ...prev,
            tasks: prev.tasks.map((task) =>
              task.id === taskId ? { ...task, status: newStatus } : task
            ),
          }
        })
      } else {
        console.error('Failed to update task status')
      }
    } catch (error) {
      console.error('Error updating task status:', error)
    }
  }

  const handleTaskStatusToggle = async (
    taskId: string,
    currentStatus: string
  ) => {
    const newStatus = currentStatus === 'COMPLETED' ? 'TODO' : 'COMPLETED'
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        await fetchProject()
      } else {
        console.error('Görev durumu güncellenirken hata oluştu')
      }
    } catch (error) {
      console.error('Görev durumu güncellenirken hata oluştu:', error)
    }
  }

  const handleStepComplete = async (stepId: string) => {
    try {
      const response = await fetch(
        `/api/projects/${resolvedParams.id}/workflow/${stepId}`,
        {
          method: 'POST',
        }
      )

      if (response.ok) {
        await fetchProject()
      } else {
        console.error('Error completing step')
      }
    } catch (error) {
      console.error('Error completing step:', error)
    }
  }

  const handleDeleteProject = async () => {
    if (
      !confirm(
        'Bu projeyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.'
      )
    ) {
      return
    }

    setDeleting(true)
    try {
      const response = await fetch(`/api/projects/${resolvedParams.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.push('/projects')
      } else {
        alert('Proje silinirken bir hata oluştu.')
      }
    } catch (error) {
      console.error('Error deleting project:', error)
      alert('Proje silinirken bir hata oluştu.')
    } finally {
      setDeleting(false)
    }
  }

  // Enhanced Calendar Handlers
  const handleTaskUpdate = async (taskId: string, updates: any) => {
    try {
      console.log('Updating task:', taskId, 'with updates:', updates)
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (response.ok) {
        const updatedTask = await response.json()
        console.log('Task updated successfully:', updatedTask)
        
        // Refresh project data without setting loading state
        const projectResponse = await fetch(`/api/projects/${resolvedParams.id}`)
        if (projectResponse.ok) {
          const projectData = await projectResponse.json()
          console.log('Project refetched after task update, tasks count:', projectData.tasks?.length || 0)
          setProject(projectData)
        } else {
          console.error('Error refetching project:', projectResponse.status, await projectResponse.text())
        }
      } else {
        const errorData = await response.text()
        console.error('Görev güncellenirken hata oluştu:', response.status, errorData)
      }
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }

  const handleProjectReschedule = async (strategy: string = 'auto') => {
    try {
      console.log('Project reschedule started with strategy:', strategy)
      const response = await fetch(`/api/projects/reschedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          projectId: resolvedParams.id, 
          rescheduleType: strategy 
        }),
      })

      console.log('Reschedule API response status:', response.status)
      
      if (response.ok) {
        const result = await response.json()
        console.log('Reschedule successful:', result)
        await fetchProject()
        console.log('Project successfully rescheduled')
      } else {
        const errorData = await response.text()
        console.error('Proje yeniden planlanırken hata oluştu:', response.status, errorData)
      }
    } catch (error) {
      console.error('Error rescheduling project:', error)
    }
  }

  // Effects
  useEffect(() => {
    fetchProject()
    fetchUsers()
  }, [fetchProject, fetchUsers])

  const handleCompleteProject = async () => {
    if (
      !confirm(
        'Tüm aşamalar tamamlandı. Projeyi "Tamamlandı" olarak işaretlemek istiyor musunuz?'
      )
    ) {
      return
    }

    try {
      const response = await fetch(`/api/projects/${resolvedParams.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'COMPLETED' }),
      })

      if (response.ok) {
        await fetchProject()
      } else {
        alert('Proje tamamlanırken bir hata oluştu.')
      }
    } catch (error) {
      console.error('Error completing project:', error)
      alert('Proje tamamlanırken bir hata oluştu.')
    }
  }

  // Task Linking Functions
  const handleLinkTasks = async (sourceTaskId: string, targetTaskId: string, linkType: 'DEPENDENCY' | 'PREREQUISITE' = 'DEPENDENCY') => {
    try {
      console.log('Linking tasks:', sourceTaskId, 'to', targetTaskId, 'type:', linkType)
      
      // Update the source task to include the target as a dependency
      const sourceTask = project?.tasks.find(t => t.id === sourceTaskId)
      const targetTask = project?.tasks.find(t => t.id === targetTaskId)
      
      if (!sourceTask || !targetTask) {
        console.error('Source or target task not found')
        return
      }

      // Determine the dependency relationship
      let sourceDependencies = sourceTask.dependencies || []
      let sourceDependents = sourceTask.dependents || []
      let targetDependencies = targetTask.dependencies || []
      let targetDependents = targetTask.dependents || []

      if (linkType === 'DEPENDENCY') {
        // Source depends on target (target must complete before source)
        if (!sourceDependencies.includes(targetTaskId)) {
          sourceDependencies = [...sourceDependencies, targetTaskId]
        }
        if (!targetDependents.includes(sourceTaskId)) {
          targetDependents = [...targetDependents, sourceTaskId]
        }
      } else {
        // Source is prerequisite of target (source must complete before target)  
        if (!targetDependencies.includes(sourceTaskId)) {
          targetDependencies = [...targetDependencies, sourceTaskId]
        }
        if (!sourceDependents.includes(targetTaskId)) {
          sourceDependents = [...sourceDependents, targetTaskId]
        }
      }

      // Update both tasks
      await handleTaskUpdate(sourceTaskId, {
        dependencies: sourceDependencies,
        dependents: sourceDependents,
        taskType: 'CONNECTED'
      })

      await handleTaskUpdate(targetTaskId, {
        dependencies: targetDependencies,
        dependents: targetDependents,
        taskType: 'CONNECTED'
      })

      console.log('Tasks linked successfully')
    } catch (error) {
      console.error('Error linking tasks:', error)
    }
  }

  const handleUnlinkTasks = async (sourceTaskId: string, targetTaskId: string) => {
    try {
      console.log('Unlinking tasks:', sourceTaskId, 'from', targetTaskId)
      
      const sourceTask = project?.tasks.find(t => t.id === sourceTaskId)
      const targetTask = project?.tasks.find(t => t.id === targetTaskId)
      
      if (!sourceTask || !targetTask) {
        console.error('Source or target task not found')
        return
      }

      // Remove the connection in both directions
      const sourceDependencies = (sourceTask.dependencies || []).filter(id => id !== targetTaskId)
      const sourceDependents = (sourceTask.dependents || []).filter(id => id !== targetTaskId)
      const targetDependencies = (targetTask.dependencies || []).filter(id => id !== sourceTaskId)
      const targetDependents = (targetTask.dependents || []).filter(id => id !== sourceTaskId)

      // Update source task
      await handleTaskUpdate(sourceTaskId, {
        dependencies: sourceDependencies,
        dependents: sourceDependents,
        taskType: (sourceDependencies.length === 0 && sourceDependents.length === 0) ? 'INDEPENDENT' : 'CONNECTED'
      })

      // Update target task
      await handleTaskUpdate(targetTaskId, {
        dependencies: targetDependencies,
        dependents: targetDependents,
        taskType: (targetDependencies.length === 0 && targetDependents.length === 0) ? 'INDEPENDENT' : 'CONNECTED'
      })

      console.log('Tasks unlinked successfully')
    } catch (error) {
      console.error('Error unlinking tasks:', error)
    }
  }

  const handleTaskClick = (task: Task) => {
    if (linkingMode && sourceTask && sourceTask !== task.id) {
      // Link the source task to this task
      handleLinkTasks(sourceTask, task.id, 'PREREQUISITE')
      setLinkingMode(false)
      setSourceTask(null)
    } else {
      // Normal task expansion
      const newExpanded = new Set(expandedTasks)
      if (newExpanded.has(task.id)) {
        newExpanded.delete(task.id)
      } else {
        newExpanded.add(task.id)
      }
      setExpandedTasks(newExpanded)
    }
  }

  const startLinkingMode = (taskId: string) => {
    setLinkingMode(true)
    setSourceTask(taskId)
  }

  const cancelLinkingMode = () => {
    setLinkingMode(false)
    setSourceTask(null)
  }

  const openLinkModal = (taskId: string) => {
    setSelectedTaskForLinking(taskId)
    setShowLinkModal(true)
  }

  const getTaskTypeColor = (task: Task) => {
    const taskType = task.taskType || 'INDEPENDENT'
    const hasConnections = (task.dependencies?.length || 0) > 0 || (task.dependents?.length || 0) > 0
    
    if (taskType === 'CONNECTED' || hasConnections) {
      return 'border-blue-300 bg-blue-50'
    }
    return 'border-gray-200 bg-white'
  }

  const getTaskTypeIcon = (task: Task) => {
    const taskType = task.taskType || 'INDEPENDENT'
    const hasConnections = (task.dependencies?.length || 0) > 0 || (task.dependents?.length || 0) > 0
    
    if (taskType === 'CONNECTED' || hasConnections) {
      return <Network className="w-4 h-4 text-blue-600" />
    }
    return <div className="w-4 h-4" /> // Empty space to maintain alignment
  }

  // Helper functions
  const getAllTeamMembers = () => {
    if (!project) return []

    const memberUsers = new Map()

    // Add official project members
    project.members.forEach((member) => {
      memberUsers.set(member.user.id, {
        ...member.user,
        role: member.role,
        isOfficialMember: true,
      })
    })

    // Add users assigned to tasks
    project.tasks.forEach((task) => {
      // Check assignedUsers (new format)
      if (task.assignedUsers && task.assignedUsers.length > 0) {
        task.assignedUsers.forEach((assignment) => {
          if (!memberUsers.has(assignment.user.id)) {
            memberUsers.set(assignment.user.id, {
              ...assignment.user,
              role: 'Görev Üyesi',
              isOfficialMember: false,
            })
          }
        })
      }

      // Check legacy assignedUser
      if (task.assignedUser && !memberUsers.has(task.assignedUser.id)) {
        memberUsers.set(task.assignedUser.id, {
          ...task.assignedUser,
          role: 'Görev Üyesi',
          isOfficialMember: false,
        })
      }
    })

    return Array.from(memberUsers.values())
  }

  const toggleStepExpansion = (stepId: string) => {
    const newExpanded = new Set(expandedSteps)
    if (newExpanded.has(stepId)) {
      newExpanded.delete(stepId)
    } else {
      newExpanded.add(stepId)
    }
    setExpandedSteps(newExpanded)
  }

  const getStepStats = (stepId: string) => {
    if (!project) return { total: 0, completed: 0, isCompleted: false }

    const stepTasks = project.tasks.filter(
      (task) => task.workflowStepId === stepId
    )
    const completedTasks = stepTasks.filter(
      (task) => task.status === 'COMPLETED'
    )
    return {
      total: stepTasks.length,
      completed: completedTasks.length,
      isCompleted:
        stepTasks.length === 0 || completedTasks.length === stepTasks.length,
    }
  }

  // Effects
  useEffect(() => {
    fetchProject()
  }, [fetchProject])

  // Loading and error states
  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50'>
        <Navbar />
        <div className='max-w-7xl mx-auto py-6 sm:px-6 lg:px-8'>
          <div className='px-4 py-6 sm:px-0'>
            <div className='text-center'>
              <div className='text-lg text-gray-600'>Yükleniyor...</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className='min-h-screen bg-gray-50'>
        <Navbar />
        <div className='max-w-7xl mx-auto py-6 sm:px-6 lg:px-8'>
          <div className='px-4 py-6 sm:px-0'>
            <div className='text-center'>
              <div className='text-lg text-gray-600'>Proje bulunamadı</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Calculate derived data
  const completedTasks = project.tasks.filter(
    (task) => task.status === 'COMPLETED'
  ).length
  const totalTasks = project.tasks.length
  const progressPercentage =
    totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

  // Group tasks by workflow step
  const tasksByStep = project.workflowSteps.reduce((acc, step) => {
    acc[step.id] = project.tasks.filter(
      (task) => task.workflowStepId === step.id
    )
    return acc
  }, {} as Record<string, Task[]>)

  // Tasks without workflow step
  const unassignedTasks = project.tasks.filter((task) => !task.workflowStepId)

  // Check if all workflow steps are completed
  const allWorkflowStepsCompleted = project.workflowSteps.every(
    (step) => getStepStats(step.id).isCompleted
  )

  const canCompleteProject =
    allWorkflowStepsCompleted && project.status !== 'COMPLETED'

  // Get all team members
  const allTeamMembers = getAllTeamMembers()

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30'>
      <Navbar />

      <div className='max-w-8xl mx-auto py-8 px-4 sm:px-6 lg:px-8'>
        <div className='space-y-8'>
          {/* Header */}
          <div className='bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-8'>
            <div className='flex items-center mb-6'>
              <Link
                href='/projects'
                className='mr-6 p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200'
              >
                <ArrowLeft className='w-6 h-6' />
              </Link>
              <div className='flex-1'>
                <h1 className='text-4xl font-bold bg-gradient-to-r from-gray-800 via-gray-700 to-gray-600 bg-clip-text text-transparent'>
                  {project.name}
                </h1>
                <p className='text-xl text-gray-600 mt-2'>
                  {project.description}
                </p>
              </div>
              <div className='flex items-center space-x-4'>
                <Link
                  href={`/calendar?project=${project.id}`}
                  className='inline-flex items-center px-6 py-3 border border-blue-200 text-sm font-medium rounded-xl text-blue-700 bg-blue-50 hover:bg-blue-100 transition-all duration-200 shadow-sm hover:shadow-md'
                >
                  <Calendar className='w-5 h-5 mr-2' />
                  Takvim Görünümü
                </Link>

                <span
                  className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold shadow-sm ${getStatusColor(
                    project.status
                  )}`}
                >
                  {getStatusText(project.status)}
                </span>
                <span
                  className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold shadow-sm ${getPriorityColor(
                    project.priority
                  )}`}
                >
                  {getPriorityText(project.priority)}
                </span>

                {/* Complete Project Button */}
                {canCompleteProject && (
                  <button
                    onClick={handleCompleteProject}
                    className='inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 transition-all duration-300 shadow-lg hover:shadow-xl'
                  >
                    <Check className='w-5 h-5 mr-2' />
                    Projeyi Tamamla
                  </button>
                )}

                <button
                  onClick={handleDeleteProject}
                  disabled={deleting}
                  className='inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:opacity-50 transition-all duration-300 shadow-lg hover:shadow-xl'
                >
                  <Trash2 className='w-5 h-5 mr-2' />
                  {deleting ? 'Siliniyor...' : 'Projeyi Sil'}
                </button>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className='bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-2'>
            <div className='flex space-x-1'>
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex-1 flex items-center justify-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  activeTab === 'overview'
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Users className='w-4 h-4 mr-2' />
                Genel Bakış
              </button>
              <button
                onClick={() => setActiveTab('calendar')}
                className={`flex-1 flex items-center justify-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  activeTab === 'calendar'
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Calendar className='w-4 h-4 mr-2' />
                Gelişmiş Takvim
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`flex-1 flex items-center justify-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  activeTab === 'analytics'
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <BarChart3 className='w-4 h-4 mr-2' />
                İstatistikler
              </button>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
          <div className='space-y-8'>
            {/* Progress Overview */}
            <div className='bg-gradient-to-br from-white via-blue-50 to-indigo-50 shadow-xl rounded-2xl p-8 border border-blue-100/50'>
              <div className='flex items-center justify-between mb-6'>
                <div className='flex-1'>
                  <h2 className='text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent'>
                    Proje İlerlemesi
                  </h2>
                </div>
                <div className='flex items-center space-x-4'>
                  <button
                    onClick={() => setShowTeamModal(true)}
                    className='inline-flex items-center px-4 py-2 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-blue-200/50 text-blue-600 hover:bg-blue-50 transition-all duration-200'
                  >
                    <Users className='w-5 h-5 mr-2' />
                    Takım Üyeleri ({allTeamMembers.length})
                  </button>
                  <div className='bg-white/80 backdrop-blur-sm rounded-xl px-4 py-2 shadow-sm border border-blue-200/50'>
                    <span className='text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'>
                      {completedTasks}/{totalTasks} görev tamamlandı
                    </span>
                  </div>
                </div>
              </div>
              <div className='relative w-full bg-gradient-to-r from-gray-200 to-gray-300 rounded-full h-6 mb-6 shadow-inner'>
                <div
                  className='bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 h-6 rounded-full transition-all duration-1000 shadow-lg relative overflow-hidden'
                  style={{ width: `${progressPercentage}%` }}
                >
                  <div className='absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse'></div>
                </div>
              </div>
              <div className='flex justify-between text-sm font-medium text-gray-700'>
                <span className='flex items-center'>
                  <div className='w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mr-2'></div>
                  %{Math.round(progressPercentage)} tamamlandı
                </span>
                <span className='flex items-center'>
                  <Calendar className='w-4 h-4 mr-1 text-gray-500' />
                  {formatDate(project.endDate)} tarihinde teslim
                </span>
              </div>
            </div>

            {/* Workflow Progress */}
            <div className='bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100'>
              <WorkflowProgress
                workflowSteps={project.workflowSteps}
                tasks={project.tasks}
                projectId={project.id}
                onStepComplete={handleStepComplete}
              />
            </div>

            {/* Workflow Steps - Accordion Style */}
            <div className='bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100'>
              <div className='p-6 border-b border-gray-200'>
                <div className='flex items-center justify-between'>
                  <div>
                    <h2 className='text-xl font-bold text-gray-900'>
                      Proje Akış Adımları
                    </h2>
                    <p className='text-sm text-gray-600 mt-1'>
                      Adımları genişleterek görevleri görüntüleyin ve yönetin
                    </p>
                  </div>
                  <div className='flex items-center space-x-3'>
                    <button
                      onClick={() => linkingMode ? cancelLinkingMode() : setLinkingMode(true)}
                      className={`inline-flex items-center px-4 py-2 border text-sm font-medium rounded-lg transition-colors ${
                        linkingMode 
                          ? 'border-purple-600 bg-purple-600 text-white hover:bg-purple-700' 
                          : 'border-purple-300 text-purple-700 bg-white hover:bg-purple-50'
                      }`}
                    >
                      {linkingMode ? (
                        <>
                          <Unlink className='w-4 h-4 mr-2' />
                          Bağlamayı İptal Et
                        </>
                      ) : (
                        <>
                          <LinkIcon className='w-4 h-4 mr-2' />
                          Görev Bağla
                        </>
                      )}
                    </button>
                    <Link
                      href={`/calendar?project=${project.id}`}
                      className='inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors'
                    >
                      <Calendar className='w-4 h-4 mr-2' />
                      Takvim
                    </Link>
                    <Link
                      href={`/projects/${project.id}/tasks/new`}
                      className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors'
                    >
                      <Plus className='w-4 h-4 mr-2' />
                      Yeni Görev
                    </Link>
                  </div>
                </div>
              </div>

              <div className='divide-y divide-gray-200'>
                {project.workflowSteps.map((step) => {
                  const stepTasks = tasksByStep[step.id] || []
                  const isExpanded = expandedSteps.has(step.id)
                  const stepStats = getStepStats(step.id)

                  return (
                    <div key={step.id} className='bg-white'>
                      <button
                        onClick={() => toggleStepExpansion(step.id)}
                        className='w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors'
                      >
                        <div className='flex items-center space-x-4'>
                          <div
                            className='w-4 h-4 rounded-full shadow-sm'
                            style={{ backgroundColor: step.color }}
                          ></div>
                          <div className='text-left'>
                            <h3 className='font-bold text-gray-900 text-lg'>
                              {step.name}
                            </h3>
                            <p className='text-sm text-gray-500'>
                              {stepStats.completed}/{stepStats.total} görev
                              tamamlandı
                            </p>
                          </div>
                        </div>
                        <div className='flex items-center space-x-3'>
                          <div className='flex items-center space-x-2'>
                            <div className='bg-gray-100 rounded-full px-3 py-1 text-sm font-semibold text-gray-600'>
                              {stepTasks.length} görev
                            </div>
                            {stepStats.isCompleted && (
                              <div className='bg-green-100 text-green-800 rounded-full px-3 py-1 text-sm font-semibold'>
                                ✓ Tamamlandı
                              </div>
                            )}
                          </div>
                          {isExpanded ? (
                            <ChevronUp className='w-5 h-5 text-gray-400' />
                          ) : (
                            <ChevronDown className='w-5 h-5 text-gray-400' />
                          )}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className='px-6 pb-6 bg-gray-50'>
                          <div className='space-y-4'>
                            {stepTasks.map((task) => {
                              const isTaskExpanded = expandedTasks.has(task.id)
                              const isLinkingTarget = linkingMode && sourceTask !== task.id
                              const isLinkingSource = sourceTask === task.id
                              
                              return (
                                <div 
                                  key={task.id} 
                                  className={`rounded-xl shadow-sm border-2 transition-all duration-200 ${
                                    isLinkingTarget 
                                      ? 'border-blue-400 bg-blue-50 shadow-lg transform scale-105' 
                                      : isLinkingSource
                                      ? 'border-green-400 bg-green-50 shadow-lg'
                                      : getTaskTypeColor(task)
                                  }`}
                                >
                                  <div
                                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-all duration-200 ${
                                      task.status === 'COMPLETED'
                                        ? 'bg-green-50 border-green-200'
                                        : isLinkingTarget
                                        ? 'hover:bg-blue-100'
                                        : 'hover:border-blue-300'
                                    } ${
                                      linkingMode ? 'relative' : ''
                                    }`}
                                    onClick={(e) => {
                                      if (linkingMode) {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        handleTaskClick(task)
                                      } else {
                                        handleTaskClick(task)
                                      }
                                    }}
                                  >
                                    {/* Linking Mode Overlay */}
                                    {isLinkingTarget && (
                                      <div className="absolute inset-0 bg-blue-500 bg-opacity-10 rounded-xl flex items-center justify-center pointer-events-none">
                                        <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                                          Bağlamak için tıklayın
                                        </div>
                                      </div>
                                    )}
                                    
                                    {isLinkingSource && (
                                      <div className="absolute inset-0 bg-green-500 bg-opacity-10 rounded-xl flex items-center justify-center pointer-events-none">
                                        <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                                          Kaynak Görev
                                        </div>
                                      </div>
                                    )}

                                    <div className='flex items-start justify-between mb-3'>
                                      <div className='flex items-start space-x-2 flex-1'>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            if (!linkingMode) {
                                              handleTaskStatusToggle(task.id, task.status)
                                            }
                                          }}
                                          className={`mt-0.5 w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${
                                            task.status === 'COMPLETED'
                                              ? 'bg-green-500 border-green-500 text-white shadow-lg'
                                              : 'border-gray-300 hover:border-green-500 hover:bg-green-50'
                                          } ${linkingMode ? 'pointer-events-none opacity-50' : ''}`}
                                        >
                                          {task.status === 'COMPLETED' && (
                                            <Check className='w-3 h-3' />
                                          )}
                                        </button>
                                        <div className='flex-1'>
                                          <div className="flex items-center space-x-2 mb-1">
                                            <h4
                                              className={`text-sm font-semibold leading-tight ${
                                                task.status === 'COMPLETED'
                                                  ? 'text-gray-500 line-through'
                                                  : 'text-gray-900'
                                              }`}
                                            >
                                              {task.title}
                                            </h4>
                                            {getTaskTypeIcon(task)}
                                          </div>
                                          
                                          {/* Task Dependencies Info */}
                                          {((task.dependencies && task.dependencies.length > 0) || (task.dependents && task.dependents.length > 0)) && (
                                            <div className="flex items-center space-x-2 text-xs text-blue-600 mb-1">
                                              <GitBranch className="w-3 h-3" />
                                              <span>
                                                {task.dependencies?.length || 0} bağımlılık, {task.dependents?.length || 0} bağımlı
                                              </span>
                                            </div>
                                          )}
                                          
                                          {task.description && !isTaskExpanded && (
                                            <p className='text-xs text-gray-500 mt-1 line-clamp-1'>
                                              {task.description}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                      <div className='flex items-center space-x-2'>
                                        {/* Task Linking Controls */}
                                        {!linkingMode && (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              startLinkingMode(task.id)
                                            }}
                                            className='text-purple-400 hover:text-purple-600 p-1.5 rounded-lg hover:bg-purple-50 transition-colors'
                                            title='Görev Bağla'
                                          >
                                            <LinkIcon className='w-4 h-4' />
                                          </button>
                                        )}
                                        
                                        {linkingMode && sourceTask === task.id && (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              cancelLinkingMode()
                                            }}
                                            className='text-red-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors'
                                            title='Bağlama İptal'
                                          >
                                            <Unlink className='w-4 h-4' />
                                          </button>
                                        )}

                                        {((task.dependencies && task.dependencies.length > 0) || (task.dependents && task.dependents.length > 0)) && (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              openLinkModal(task.id)
                                            }}
                                            className='text-blue-400 hover:text-blue-600 p-1.5 rounded-lg hover:bg-blue-50 transition-colors'
                                            title='Bağlantıları Yönet'
                                          >
                                            <Settings className='w-4 h-4' />
                                          </button>
                                        )}
                                        
                                        <Link
                                          href={`/projects/${project.id}/tasks/${task.id}/edit`}
                                          className={`text-blue-400 hover:text-blue-600 p-1.5 rounded-lg hover:bg-blue-50 transition-colors ${linkingMode ? 'pointer-events-none opacity-50' : ''}`}
                                          title='Görevi düzenle'
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <Edit className='w-4 h-4' />
                                        </Link>
                                        {isTaskExpanded ? (
                                          <ChevronUp className='w-4 h-4 text-gray-400' />
                                        ) : (
                                          <ChevronDown className='w-4 h-4 text-gray-400' />
                                        )}
                                      </div>
                                    </div>

                                    <div className='flex items-center justify-between text-xs'>
                                      <div className='flex items-center space-x-2'>
                                        <span
                                          className={`inline-flex items-center px-2 py-1 rounded-full font-medium shadow-sm ${getPriorityColor(
                                            task.priority
                                          )}`}
                                        >
                                          {getPriorityText(task.priority)}
                                        </span>
                                        <span
                                          className={`inline-flex items-center px-2 py-1 rounded-full font-medium shadow-sm ${getStatusColor(
                                            task.status
                                          )}`}
                                        >
                                          {getStatusText(task.status)}
                                        </span>
                                      </div>

                                      {/* Multiple Users Display */}
                                      <div className='flex items-center -space-x-1'>
                                        {task.assignedUsers &&
                                        task.assignedUsers.length > 0 ? (
                                          <>
                                            {task.assignedUsers
                                              .slice(0, 3)
                                              .map((assignment, index) => (
                                                <div
                                                  key={assignment.id}
                                                  className='w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center border-2 border-white'
                                                  title={assignment.user.name}
                                                  style={{
                                                    zIndex:
                                                      task.assignedUsers.length - index,
                                                  }}
                                                >
                                                  <span className='text-xs font-medium text-gray-600'>
                                                    {assignment.user.name.charAt(0)}
                                                  </span>
                                                </div>
                                              ))}
                                            {task.assignedUsers.length > 3 && (
                                              <div
                                                className='w-6 h-6 bg-gray-500 rounded-full flex items-center justify-center border-2 border-white text-white'
                                                title={`+${
                                                  task.assignedUsers.length - 3
                                                } kişi daha`}
                                              >
                                                <span className='text-xs font-medium'>
                                                  +{task.assignedUsers.length - 3}
                                                </span>
                                              </div>
                                            )}
                                          </>
                                        ) : task.assignedUser ? (
                                          <div
                                            className='w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center border-2 border-white'
                                            title={task.assignedUser.name}
                                          >
                                            <span className='text-xs font-medium text-gray-600'>
                                              {task.assignedUser.name.charAt(0)}
                                            </span>
                                          </div>
                                        ) : (
                                          <div
                                            className='w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center border-2 border-white'
                                            title='Atanmamış'
                                          >
                                            <Users className='w-3 h-3 text-gray-400' />
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Task Details Accordion */}
                                  {isTaskExpanded && (
                                    <div className='border-t border-gray-200 p-4 bg-gray-50'>
                                      <div className='space-y-4'>
                                        {/* Description */}
                                        {task.description && (
                                          <div>
                                            <h5 className='text-sm font-medium text-gray-900 mb-2'>Açıklama</h5>
                                            <p className='text-sm text-gray-600 bg-white p-3 rounded-lg border'>
                                              {task.description}
                                            </p>
                                          </div>
                                        )}

                                        {/* Dates */}
                                        {(task.startDate || task.endDate) && (
                                          <div>
                                            <h5 className='text-sm font-medium text-gray-900 mb-2'>Tarihler</h5>
                                            <div className='grid grid-cols-2 gap-4'>
                                              {task.startDate && (
                                                <div className='bg-white p-3 rounded-lg border'>
                                                  <div className='text-xs text-gray-500'>Başlangıç</div>
                                                  <div className='text-sm font-medium'>{formatDate(task.startDate)}</div>
                                                </div>
                                              )}
                                              {task.endDate && (
                                                <div className='bg-white p-3 rounded-lg border'>
                                                  <div className='text-xs text-gray-500'>Bitiş</div>
                                                  <div className='text-sm font-medium'>{formatDate(task.endDate)}</div>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        )}

                                        {/* Assigned Users */}
                                        {((task.assignedUsers && task.assignedUsers.length > 0) || task.assignedUser) && (
                                          <div>
                                            <h5 className='text-sm font-medium text-gray-900 mb-2'>Atanan Kişiler</h5>
                                            <div className='space-y-2'>
                                              {task.assignedUsers && task.assignedUsers.length > 0 ? (
                                                task.assignedUsers.map((assignment) => (
                                                  <div key={assignment.id} className='flex items-center space-x-3 bg-white p-3 rounded-lg border'>
                                                    <div className='w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center'>
                                                      <span className='text-white text-sm font-medium'>
                                                        {assignment.user.name.charAt(0)}
                                                      </span>
                                                    </div>
                                                    <div>
                                                      <div className='text-sm font-medium text-gray-900'>{assignment.user.name}</div>
                                                      <div className='text-xs text-gray-500'>{assignment.user.email}</div>
                                                    </div>
                                                  </div>
                                                ))
                                              ) : task.assignedUser ? (
                                                <div className='flex items-center space-x-3 bg-white p-3 rounded-lg border'>
                                                  <div className='w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center'>
                                                    <span className='text-white text-sm font-medium'>
                                                      {task.assignedUser.name.charAt(0)}
                                                    </span>
                                                  </div>
                                                  <div>
                                                    <div className='text-sm font-medium text-gray-900'>{task.assignedUser.name}</div>
                                                    <div className='text-xs text-gray-500'>{task.assignedUser.email}</div>
                                                  </div>
                                                </div>
                                              ) : null}
                                            </div>
                                          </div>
                                        )}

                                        {/* Status Control Buttons */}
                                        <div>
                                          <h5 className='text-sm font-medium text-gray-900 mb-2'>Durum Değiştir</h5>
                                          <div className='flex items-center space-x-2 flex-wrap gap-2'>
                                            {task.status !== 'TODO' && (
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation()
                                                  handleTaskStatusChange(task.id, 'TODO')
                                                }}
                                                className='flex items-center px-3 py-2 text-sm font-medium rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors'
                                                title='Beklemeye Al'
                                              >
                                                ⏸️ Beklet
                                              </button>
                                            )}
                                            {task.status !== 'IN_PROGRESS' &&
                                              task.status !== 'COMPLETED' && (
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleTaskStatusChange(
                                                      task.id,
                                                      'IN_PROGRESS'
                                                    )
                                                  }}
                                                  className='flex items-center px-3 py-2 text-sm font-medium rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors'
                                                  title='Devam Et'
                                                >
                                                  ▶️ Başla
                                                </button>
                                              )}
                                            {task.status === 'IN_PROGRESS' && (
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation()
                                                  handleTaskStatusChange(task.id, 'REVIEW')
                                                }}
                                                className='flex items-center px-3 py-2 text-sm font-medium rounded-lg bg-purple-100 text-purple-600 hover:bg-purple-200 transition-colors'
                                                title='İncelemeye Gönder'
                                              >
                                                👁️ İncele
                                              </button>
                                            )}
                                            {task.status === 'REVIEW' && (
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation()
                                                  handleTaskStatusChange(task.id, 'COMPLETED')
                                                }}
                                                className='flex items-center px-3 py-2 text-sm font-medium rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-colors'
                                                title='Tamamla'
                                              >
                                                ✅ Bitir
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                            {stepTasks.length === 0 && (
                              <div className='text-center py-8 text-gray-500'>
                                <div className='text-lg mb-2'>Bu adımda henüz görev yok</div>
                                <Link
                                  href={`/projects/${project.id}/tasks/new?step=${step.id}`}
                                  className='inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
                                >
                                  <Plus className='w-4 h-4 mr-2' />
                                  İlk Görevi Ekle
                                </Link>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}

                {/* Unassigned Tasks Section */}
                {unassignedTasks.length > 0 && (
                  <div className='bg-white border-t border-gray-200'>
                    <button
                      onClick={() => toggleStepExpansion('unassigned')}
                      className='w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors'
                    >
                      <div className='flex items-center space-x-4'>
                        <div className='w-4 h-4 rounded-full bg-gray-400 shadow-sm'></div>
                        <div className='text-left'>
                          <h3 className='font-bold text-gray-900 text-lg'>
                            Adım Atanmamış Görevler
                          </h3>
                          <p className='text-sm text-gray-500'>
                            {unassignedTasks.length} görev
                          </p>
                        </div>
                      </div>
                      <div className='flex items-center space-x-3'>
                        <div className='bg-orange-100 text-orange-800 rounded-full px-3 py-1 text-sm font-semibold'>
                          Adım Atanması Gerekli
                        </div>
                        {expandedSteps.has('unassigned') ? (
                          <ChevronUp className='w-5 h-5 text-gray-400' />
                        ) : (
                          <ChevronDown className='w-5 h-5 text-gray-400' />
                        )}
                      </div>
                    </button>

                    {expandedSteps.has('unassigned') && (
                      <div className='px-6 pb-6 bg-gray-50'>
                        <div className='space-y-4'>
                          {unassignedTasks.map((task) => {
                            const isTaskExpanded = expandedTasks.has(task.id)
                            
                            return (
                              <div key={task.id} className='bg-white rounded-xl shadow-sm border border-gray-200'>
                                <div
                                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-all duration-200 ${
                                    task.status === 'COMPLETED'
                                      ? 'bg-green-50 border-green-200'
                                      : 'border-orange-200 hover:border-orange-300'
                                  }`}
                                  onClick={() => handleTaskClick(task)}
                                >
                                  <div className='flex items-start justify-between mb-3'>
                                    <div className='flex items-start space-x-2 flex-1'>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleTaskStatusToggle(task.id, task.status)
                                        }}
                                        className={`mt-0.5 w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${
                                          task.status === 'COMPLETED'
                                            ? 'bg-green-500 border-green-500 text-white shadow-lg'
                                            : 'border-gray-300 hover:border-green-500 hover:bg-green-50'
                                        }`}
                                      >
                                        {task.status === 'COMPLETED' && (
                                          <Check className='w-3 h-3' />
                                        )}
                                      </button>
                                      <div className='flex-1'>
                                        <h4
                                          className={`text-sm font-semibold leading-tight ${
                                            task.status === 'COMPLETED'
                                              ? 'text-gray-500 line-through'
                                              : 'text-gray-900'
                                          }`}
                                        >
                                          {task.title}
                                        </h4>
                                        {task.description && !isTaskExpanded && (
                                          <p className='text-xs text-gray-500 mt-1 line-clamp-1'>
                                            {task.description}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                    <div className='flex items-center space-x-2'>
                                      <Link
                                        href={`/projects/${project.id}/tasks/${task.id}/edit`}
                                        className='text-blue-400 hover:text-blue-600 p-1.5 rounded-lg hover:bg-blue-50 transition-colors'
                                        title='Görevi düzenle'
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <Edit className='w-4 h-4' />
                                      </Link>
                                      {isTaskExpanded ? (
                                        <ChevronUp className='w-4 h-4 text-gray-400' />
                                      ) : (
                                        <ChevronDown className='w-4 h-4 text-gray-400' />
                                      )}
                                    </div>
                                  </div>

                                  <div className='flex items-center justify-between text-xs'>
                                    <div className='flex items-center space-x-2'>
                                      <span
                                        className={`inline-flex items-center px-2 py-1 rounded-full font-medium shadow-sm ${getPriorityColor(
                                          task.priority
                                        )}`}
                                      >
                                        {getPriorityText(task.priority)}
                                      </span>
                                      <span
                                        className={`inline-flex items-center px-2 py-1 rounded-full font-medium shadow-sm ${getStatusColor(
                                          task.status
                                        )}`}
                                      >
                                        {getStatusText(task.status)}
                                      </span>
                                    </div>

                                    <div className='flex items-center -space-x-1'>
                                      {task.assignedUsers && task.assignedUsers.length > 0 ? (
                                        <>
                                          {task.assignedUsers
                                            .slice(0, 3)
                                            .map((assignment, index) => (
                                              <div
                                                key={assignment.id}
                                                className='w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center border-2 border-white'
                                                title={assignment.user.name}
                                                style={{
                                                  zIndex: task.assignedUsers.length - index,
                                                }}
                                              >
                                                <span className='text-xs font-medium text-gray-600'>
                                                  {assignment.user.name.charAt(0)}
                                                </span>
                                              </div>
                                            ))}
                                          {task.assignedUsers.length > 3 && (
                                            <div
                                              className='w-6 h-6 bg-gray-500 rounded-full flex items-center justify-center border-2 border-white text-white'
                                              title={`+${task.assignedUsers.length - 3} kişi daha`}
                                            >
                                              <span className='text-xs font-medium'>
                                                +{task.assignedUsers.length - 3}
                                              </span>
                                            </div>
                                          )}
                                        </>
                                      ) : task.assignedUser ? (
                                        <div
                                          className='w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center border-2 border-white'
                                          title={task.assignedUser.name}
                                        >
                                          <span className='text-xs font-medium text-gray-600'>
                                            {task.assignedUser.name.charAt(0)}
                                          </span>
                                        </div>
                                      ) : (
                                        <div
                                          className='w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center border-2 border-white'
                                          title='Atanmamış'
                                        >
                                          <Users className='w-3 h-3 text-gray-400' />
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Task Details Accordion */}
                                {isTaskExpanded && (
                                  <div className='border-t border-gray-200 p-4 bg-gray-50'>
                                    <div className='space-y-4'>
                                      {/* Description */}
                                      {task.description && (
                                        <div>
                                          <h5 className='text-sm font-medium text-gray-900 mb-2'>Açıklama</h5>
                                          <p className='text-sm text-gray-600 bg-white p-3 rounded-lg border'>
                                            {task.description}
                                          </p>
                                        </div>
                                      )}

                                      {/* Dates */}
                                      {(task.startDate || task.endDate) && (
                                        <div>
                                          <h5 className='text-sm font-medium text-gray-900 mb-2'>Tarihler</h5>
                                          <div className='grid grid-cols-2 gap-4'>
                                            {task.startDate && (
                                              <div className='bg-white p-3 rounded-lg border'>
                                                <div className='text-xs text-gray-500'>Başlangıç</div>
                                                <div className='text-sm font-medium'>{formatDate(task.startDate)}</div>
                                              </div>
                                            )}
                                            {task.endDate && (
                                              <div className='bg-white p-3 rounded-lg border'>
                                                <div className='text-xs text-gray-500'>Bitiş</div>
                                                <div className='text-sm font-medium'>{formatDate(task.endDate)}</div>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      )}

                                      {/* Assigned Users */}
                                      {((task.assignedUsers && task.assignedUsers.length > 0) || task.assignedUser) && (
                                        <div>
                                          <h5 className='text-sm font-medium text-gray-900 mb-2'>Atanan Kişiler</h5>
                                          <div className='space-y-2'>
                                            {task.assignedUsers && task.assignedUsers.length > 0 ? (
                                              task.assignedUsers.map((assignment) => (
                                                <div key={assignment.id} className='flex items-center space-x-3 bg-white p-3 rounded-lg border'>
                                                  <div className='w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center'>
                                                    <span className='text-white text-sm font-medium'>
                                                      {assignment.user.name.charAt(0)}
                                                    </span>
                                                  </div>
                                                  <div>
                                                    <div className='text-sm font-medium text-gray-900'>{assignment.user.name}</div>
                                                    <div className='text-xs text-gray-500'>{assignment.user.email}</div>
                                                  </div>
                                                </div>
                                              ))
                                            ) : task.assignedUser ? (
                                              <div className='flex items-center space-x-3 bg-white p-3 rounded-lg border'>
                                                <div className='w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center'>
                                                  <span className='text-white text-sm font-medium'>
                                                    {task.assignedUser.name.charAt(0)}
                                                  </span>
                                                </div>
                                                <div>
                                                  <div className='text-sm font-medium text-gray-900'>{task.assignedUser.name}</div>
                                                  <div className='text-xs text-gray-500'>{task.assignedUser.email}</div>
                                                </div>
                                              </div>
                                            ) : null}
                                          </div>
                                        </div>
                                      )}

                                      {/* Status Control Buttons */}
                                      <div>
                                        <h5 className='text-sm font-medium text-gray-900 mb-2'>Durum Değiştir</h5>
                                        <div className='flex items-center space-x-2 flex-wrap gap-2'>
                                          {task.status !== 'TODO' && (
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation()
                                                handleTaskStatusChange(task.id, 'TODO')
                                              }}
                                              className='flex items-center px-3 py-2 text-sm font-medium rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors'
                                              title='Beklemeye Al'
                                            >
                                              ⏸️ Beklet
                                            </button>
                                          )}
                                          {task.status !== 'IN_PROGRESS' &&
                                            task.status !== 'COMPLETED' && (
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation()
                                                  handleTaskStatusChange(
                                                    task.id,
                                                    'IN_PROGRESS'
                                                  )
                                                }}
                                                className='flex items-center px-3 py-2 text-sm font-medium rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors'
                                                title='Devam Et'
                                              >
                                                ▶️ Başla
                                              </button>
                                            )}
                                          {task.status === 'IN_PROGRESS' && (
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation()
                                                handleTaskStatusChange(task.id, 'REVIEW')
                                              }}
                                              className='flex items-center px-3 py-2 text-sm font-medium rounded-lg bg-purple-100 text-purple-600 hover:bg-purple-200 transition-colors'
                                              title='İncelemeye Gönder'
                                            >
                                              👁️ İncele
                                            </button>
                                          )}
                                          {task.status === 'REVIEW' && (
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation()
                                                handleTaskStatusChange(task.id, 'COMPLETED')
                                              }}
                                              className='flex items-center px-3 py-2 text-sm font-medium rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-colors'
                                              title='Tamamla'
                                            >
                                              ✅ Bitir
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Unassigned Tasks Section */}
            {unassignedTasks.length > 0 && (
              <div className='bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100 mt-6'>
                <div className='p-6 border-b border-gray-200'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <h2 className='text-xl font-bold text-gray-900'>
                        Aşamaya Atanmamış Görevler
                      </h2>
                      <p className='text-sm text-gray-600 mt-1'>
                        Henüz bir iş akışı aşamasına atanmamış görevler
                      </p>
                    </div>
                    <div className='bg-yellow-100 rounded-full px-3 py-1 text-sm font-semibold text-yellow-800'>
                      {unassignedTasks.length} görev
                    </div>
                  </div>
                </div>

                <div className='p-6 bg-yellow-50'>
                  <div className='space-y-4'>
                    {unassignedTasks.map((task) => {
                      const isTaskExpanded = expandedTasks.has(task.id)
                      const isLinkingTarget = linkingMode && sourceTask !== task.id
                      const isLinkingSource = sourceTask === task.id
                      
                      return (
                        <div 
                          key={task.id} 
                          className={`rounded-xl shadow-sm border-2 transition-all duration-200 ${
                            isLinkingTarget 
                              ? 'border-blue-400 bg-blue-50 shadow-lg transform scale-105' 
                              : isLinkingSource
                              ? 'border-green-400 bg-green-50 shadow-lg'
                              : getTaskTypeColor(task)
                          }`}
                        >
                          <div
                            className={`p-4 cursor-pointer hover:bg-gray-50 transition-all duration-200 ${
                              task.status === 'COMPLETED'
                                ? 'bg-green-50 border-green-200'
                                : isLinkingTarget
                                ? 'hover:bg-blue-100'
                                : 'hover:border-blue-300'
                            } ${
                              linkingMode ? 'relative' : ''
                            }`}
                            onClick={(e) => {
                              if (linkingMode) {
                                e.preventDefault()
                                e.stopPropagation()
                                handleTaskClick(task)
                              } else {
                                handleTaskClick(task)
                              }
                            }}
                          >
                            {/* Linking Mode Overlay */}
                            {isLinkingTarget && (
                              <div className="absolute inset-0 bg-blue-500 bg-opacity-10 rounded-xl flex items-center justify-center pointer-events-none">
                                <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                                  Bağlamak için tıklayın
                                </div>
                              </div>
                            )}
                            
                            {isLinkingSource && (
                              <div className="absolute inset-0 bg-green-500 bg-opacity-10 rounded-xl flex items-center justify-center pointer-events-none">
                                <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                                  Kaynak Görev
                                </div>
                              </div>
                            )}

                            <div className='flex items-start justify-between mb-3'>
                              <div className='flex items-start space-x-2 flex-1'>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    if (!linkingMode) {
                                      handleTaskStatusToggle(task.id, task.status)
                                    }
                                  }}
                                  className={`mt-0.5 w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${
                                    task.status === 'COMPLETED'
                                      ? 'bg-green-500 border-green-500 text-white shadow-lg'
                                      : 'border-gray-300 hover:border-green-500 hover:bg-green-50'
                                  } ${linkingMode ? 'pointer-events-none opacity-50' : ''}`}
                                >
                                  {task.status === 'COMPLETED' && (
                                    <Check className='w-3 h-3' />
                                  )}
                                </button>
                                <div className='flex-1'>
                                  <div className="flex items-center space-x-2 mb-1">
                                    <h4
                                      className={`text-sm font-semibold leading-tight ${
                                        task.status === 'COMPLETED'
                                          ? 'text-gray-500 line-through'
                                          : 'text-gray-900'
                                      }`}
                                    >
                                      {task.title}
                                    </h4>
                                    {getTaskTypeIcon(task)}
                                  </div>
                                  
                                  {/* Task Dependencies Info */}
                                  {((task.dependencies && task.dependencies.length > 0) || (task.dependents && task.dependents.length > 0)) && (
                                    <div className="flex items-center space-x-2 text-xs text-blue-600 mb-1">
                                      <GitBranch className="w-3 h-3" />
                                      <span>
                                        {task.dependencies?.length || 0} bağımlılık, {task.dependents?.length || 0} bağımlı
                                      </span>
                                    </div>
                                  )}
                                  
                                  {task.description && !isTaskExpanded && (
                                    <p className='text-xs text-gray-500 mt-1 line-clamp-1'>
                                      {task.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className='flex items-center space-x-2'>
                                {/* Task Linking Controls */}
                                {!linkingMode && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      startLinkingMode(task.id)
                                    }}
                                    className='text-purple-400 hover:text-purple-600 p-1.5 rounded-lg hover:bg-purple-50 transition-colors'
                                    title='Görev Bağla'
                                  >
                                    <LinkIcon className='w-4 h-4' />
                                  </button>
                                )}
                                
                                {linkingMode && sourceTask === task.id && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      cancelLinkingMode()
                                    }}
                                    className='text-red-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors'
                                    title='Bağlama İptal'
                                  >
                                    <Unlink className='w-4 h-4' />
                                  </button>
                                )}

                                {((task.dependencies && task.dependencies.length > 0) || (task.dependents && task.dependents.length > 0)) && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      openLinkModal(task.id)
                                    }}
                                    className='text-blue-400 hover:text-blue-600 p-1.5 rounded-lg hover:bg-blue-50 transition-colors'
                                    title='Bağlantıları Yönet'
                                  >
                                    <Settings className='w-4 h-4' />
                                  </button>
                                )}
                                
                                <Link
                                  href={`/projects/${project.id}/tasks/${task.id}/edit`}
                                  className={`text-blue-400 hover:text-blue-600 p-1.5 rounded-lg hover:bg-blue-50 transition-colors ${linkingMode ? 'pointer-events-none opacity-50' : ''}`}
                                  title='Görevi düzenle'
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Edit className='w-4 h-4' />
                                </Link>
                                {isTaskExpanded ? (
                                  <ChevronUp className='w-4 h-4 text-gray-400' />
                                ) : (
                                  <ChevronDown className='w-4 h-4 text-gray-400' />
                                )}
                              </div>
                            </div>

                            <div className='flex items-center justify-between text-xs'>
                              <div className='flex items-center space-x-2'>
                                <span
                                  className={`inline-flex items-center px-2 py-1 rounded-full font-medium shadow-sm ${getPriorityColor(
                                    task.priority
                                  )}`}
                                >
                                  {getPriorityText(task.priority)}
                                </span>
                                <span
                                  className={`inline-flex items-center px-2 py-1 rounded-full font-medium shadow-sm ${getStatusColor(
                                    task.status
                                  )}`}
                                >
                                  {getStatusText(task.status)}
                                </span>
                              </div>

                              {/* Multiple Users Display */}
                              <div className='flex items-center -space-x-1'>
                                {task.assignedUsers &&
                                task.assignedUsers.length > 0 ? (
                                  <>
                                    {task.assignedUsers
                                      .slice(0, 3)
                                      .map((assignment, index) => (
                                        <div
                                          key={assignment.id}
                                          className='w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center border-2 border-white'
                                          title={assignment.user.name}
                                          style={{
                                            zIndex:
                                              task.assignedUsers.length - index,
                                          }}
                                        >
                                          <span className='text-xs font-medium text-gray-600'>
                                            {assignment.user.name.charAt(0)}
                                          </span>
                                        </div>
                                      ))}
                                    {task.assignedUsers.length > 3 && (
                                      <div
                                        className='w-6 h-6 bg-gray-500 rounded-full flex items-center justify-center border-2 border-white text-white'
                                        title={`+${
                                          task.assignedUsers.length - 3
                                        } kişi daha`}
                                      >
                                        <span className='text-xs font-medium'>
                                          +{task.assignedUsers.length - 3}
                                        </span>
                                      </div>
                                    )}
                                  </>
                                ) : task.assignedUser ? (
                                  <div
                                    className='w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center border-2 border-white'
                                    title={task.assignedUser.name}
                                  >
                                    <span className='text-xs font-medium text-gray-600'>
                                      {task.assignedUser.name.charAt(0)}
                                    </span>
                                  </div>
                                ) : (
                                  <div
                                    className='w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center border-2 border-white'
                                    title='Atanmamış'
                                  >
                                    <Users className='w-3 h-3 text-gray-400' />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Task Details Accordion - Same as in workflow steps */}
                          {isTaskExpanded && (
                            <div className='border-t border-gray-200 p-4 bg-gray-50'>
                              <div className='space-y-4'>
                                {/* Description */}
                                {task.description && (
                                  <div>
                                    <h5 className='text-sm font-medium text-gray-900 mb-2'>Açıklama</h5>
                                    <p className='text-sm text-gray-600 bg-white p-3 rounded-lg border'>
                                      {task.description}
                                    </p>
                                  </div>
                                )}

                                {/* Dates */}
                                {(task.startDate || task.endDate) && (
                                  <div>
                                    <h5 className='text-sm font-medium text-gray-900 mb-2'>Tarihler</h5>
                                    <div className='grid grid-cols-2 gap-4'>
                                      {task.startDate && (
                                        <div className='bg-white p-3 rounded-lg border'>
                                          <div className='text-xs text-gray-500'>Başlangıç</div>
                                          <div className='text-sm font-medium'>{formatDate(task.startDate)}</div>
                                        </div>
                                      )}
                                      {task.endDate && (
                                        <div className='bg-white p-3 rounded-lg border'>
                                          <div className='text-xs text-gray-500'>Bitiş</div>
                                          <div className='text-sm font-medium'>{formatDate(task.endDate)}</div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
          )}

          {/* Enhanced Calendar Tab */}
          {activeTab === 'calendar' && project && (
            <div className='space-y-6'>
              <EnhancedCalendar
                tasks={project.tasks.map(task => ({
                  ...task,
                  description: task.description ?? undefined,
                  startDate: task.startDate ? new Date(task.startDate) : undefined,
                  endDate: task.endDate ? new Date(task.endDate) : undefined,
                  originalEndDate: task.originalEndDate ? new Date(task.originalEndDate) : undefined,
                  delayDays: task.delayDays ?? 0,
                  workloadPercentage: task.workloadPercentage ?? 0,
                  isBottleneck: task.isBottleneck ?? false,
                  taskType: task.taskType || 'INDEPENDENT' as 'INDEPENDENT' | 'CONNECTED',
                  dependencies: task.dependencies || [],
                  dependents: task.dependents || [],
                  scheduleType: task.scheduleType || 'STANDARD' as 'SECURE' | 'AUTO' | 'STANDARD',
                  assignedUser: task.assignedUser ? {
                    ...task.assignedUser,
                    maxHoursPerDay: 8
                  } : undefined
                }))}
                project={{
                  ...project,
                  startDate: project.startDate ? new Date(project.startDate) : undefined,
                  endDate: project.endDate ? new Date(project.endDate) : undefined,
                  originalEndDate: project.originalEndDate ? new Date(project.originalEndDate) : undefined,
                  delayDays: project.delayDays || 0,
                  autoReschedule: project.autoReschedule || true
                }}
                users={users.map(user => ({
                  ...user,
                  department: 'Genel', // Using fixed value since department doesn't exist
                  maxHoursPerDay: 8
                }))}
                onTaskUpdate={handleTaskUpdate}
                onProjectReschedule={handleProjectReschedule}
              />
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className='space-y-6'>
              <div className='bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-8'>
                <div className='flex items-center gap-2 mb-6'>
                  <BarChart3 className='w-6 h-6 text-blue-500' />
                  <h2 className='text-2xl font-bold text-gray-800'>Proje Analitikleri</h2>
                </div>
                
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
                  <div className='bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white'>
                    <div className='flex items-center justify-between'>
                      <div>
                        <p className='text-blue-100'>Toplam Görev</p>
                        <p className='text-3xl font-bold'>{totalTasks}</p>
                      </div>
                      <Users className='w-8 h-8 text-blue-200' />
                    </div>
                  </div>
                  
                  <div className='bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white'>
                    <div className='flex items-center justify-between'>
                      <div>
                        <p className='text-green-100'>Tamamlanan</p>
                        <p className='text-3xl font-bold'>{completedTasks}</p>
                      </div>
                      <Check className='w-8 h-8 text-green-200' />
                    </div>
                  </div>
                  
                  <div className='bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white'>
                    <div className='flex items-center justify-between'>
                      <div>
                        <p className='text-orange-100'>İlerleme</p>
                        <p className='text-3xl font-bold'>{Math.round(progressPercentage)}%</p>
                      </div>
                      <Clock className='w-8 h-8 text-orange-200' />
                    </div>
                  </div>
                  
                  <div className='bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white'>
                    <div className='flex items-center justify-between'>
                      <div>
                        <p className='text-purple-100'>Takım Üyesi</p>
                        <p className='text-3xl font-bold'>{allTeamMembers.length}</p>
                      </div>
                      <Users className='w-8 h-8 text-purple-200' />
                    </div>
                  </div>
                </div>

                <div className='mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6'>
                  <div className='bg-white rounded-xl p-6 shadow-sm'>
                    <h3 className='text-lg font-semibold mb-4'>Görev Durumları</h3>
                    <div className='space-y-3'>
                      {['TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED'].map(status => {
                        const count = project.tasks.filter(task => task.status === status).length
                        const percentage = totalTasks > 0 ? (count / totalTasks) * 100 : 0
                        return (
                          <div key={status} className='flex items-center justify-between'>
                            <div className='flex items-center gap-2'>
                              <div className={`w-3 h-3 rounded-full ${getStatusColor(status)}`} />
                              <span className='text-sm font-medium'>{getStatusText(status)}</span>
                            </div>
                            <div className='flex items-center gap-2'>
                              <span className='text-sm text-gray-500'>{count} görev</span>
                              <span className='text-xs text-gray-400'>({Math.round(percentage)}%)</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div className='bg-white rounded-xl p-6 shadow-sm'>
                    <h3 className='text-lg font-semibold mb-4'>Öncelik Dağılımı</h3>
                    <div className='space-y-3'>
                      {['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map(priority => {
                        const count = project.tasks.filter(task => task.priority === priority).length
                        const percentage = totalTasks > 0 ? (count / totalTasks) * 100 : 0
                        return (
                          <div key={priority} className='flex items-center justify-between'>
                            <div className='flex items-center gap-2'>
                              <div className={`w-3 h-3 rounded-full ${getPriorityColor(priority)}`} />
                              <span className='text-sm font-medium'>{getPriorityText(priority)}</span>
                            </div>
                            <div className='flex items-center gap-2'>
                              <span className='text-sm text-gray-500'>{count} görev</span>
                              <span className='text-xs text-gray-400'>({Math.round(percentage)}%)</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && project && (
            <div className='space-y-6'>
              <div className='bg-white rounded-xl shadow-lg p-6'>
                <h3 className='text-xl font-bold mb-6 flex items-center'>
                  <BarChart3 className='w-6 h-6 mr-2 text-blue-500' />
                  Proje Analitikleri
                </h3>
                
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
                  <div className='bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white'>
                    <div className='flex items-center justify-between'>
                      <div>
                        <p className='text-blue-100'>Toplam Görev</p>
                        <p className='text-3xl font-bold'>{totalTasks}</p>
                      </div>
                      <Users className='w-8 h-8 text-blue-200' />
                    </div>
                  </div>
                  
                  <div className='bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white'>
                    <div className='flex items-center justify-between'>
                      <div>
                        <p className='text-green-100'>Tamamlanan</p>
                        <p className='text-3xl font-bold'>{completedTasks}</p>
                      </div>
                      <Check className='w-8 h-8 text-green-200' />
                    </div>
                  </div>
                  
                  <div className='bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white'>
                    <div className='flex items-center justify-between'>
                      <div>
                        <p className='text-orange-100'>Devam Eden</p>
                        <p className='text-3xl font-bold'>
                          {project.tasks.filter(t => t.status === 'IN_PROGRESS').length}
                        </p>
                      </div>
                      <Clock className='w-8 h-8 text-orange-200' />
                    </div>
                  </div>
                  
                  <div className='bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white'>
                    <div className='flex items-center justify-between'>
                      <div>
                        <p className='text-purple-100'>Gecikmiş</p>
                        <p className='text-3xl font-bold'>
                          {project.tasks.filter(t => 
                            t.endDate && new Date(t.endDate) < new Date() && t.status !== 'COMPLETED'
                          ).length}
                        </p>
                      </div>
                      <AlertTriangle className='w-8 h-8 text-purple-200' />
                    </div>
                  </div>
                </div>

                <div className='mt-8'>
                  <h4 className='text-lg font-semibold mb-4'>İlerleme Durumu</h4>
                  <div className='bg-gray-200 rounded-full h-4 mb-4'>
                    <div
                      className='bg-gradient-to-r from-blue-500 to-green-500 h-4 rounded-full transition-all duration-500'
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                  <div className='flex justify-between text-sm text-gray-600'>
                    <span>%{Math.round(progressPercentage)} Tamamlandı</span>
                    <span>{completedTasks}/{totalTasks} Görev</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Team Modal */}
      {showTeamModal && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
          <div className='bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto'>
            <div className='p-6 border-b border-gray-200'>
              <div className='flex items-center justify-between'>
                <h3 className='text-xl font-bold text-gray-900'>
                  Takım Üyeleri
                </h3>
                <button
                  onClick={() => setShowTeamModal(false)}
                  className='text-gray-400 hover:text-gray-600 transition-colors'
                >
                  ✕
                </button>
              </div>
            </div>
            <div className='p-6'>
              <div className='space-y-4'>
                {allTeamMembers.map((member) => (
                  <div
                    key={member.id}
                    className='flex items-center justify-between p-4 bg-gray-50 rounded-xl'
                  >
                    <div className='flex items-center space-x-4'>
                      <div className='w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center'>
                        <span className='text-white font-medium'>
                          {member.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <div className='font-medium text-gray-900'>
                          {member.name}
                        </div>
                        <div className='text-sm text-gray-500'>
                          {member.email}
                        </div>
                      </div>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          member.isOfficialMember
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {member.role}
                      </span>
                    </div>
                  </div>
                ))}
                {allTeamMembers.length === 0 && (
                  <div className='text-center py-8 text-gray-500'>
                    Bu projede henüz takım üyesi yok
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Task Linking Modal */}
      {showLinkModal && selectedTaskForLinking && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
          <div className='bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[80vh] overflow-y-auto'>
            <div className='p-6 border-b border-gray-200'>
              <div className='flex items-center justify-between'>
                <div>
                  <h3 className='text-xl font-bold text-gray-900'>
                    Görev Bağlantıları Yönetimi
                  </h3>
                  <p className='text-sm text-gray-600 mt-1'>
                    {project?.tasks.find(t => t.id === selectedTaskForLinking)?.title || 'Seçili Görev'}
                  </p>
                </div>
                <button
                  onClick={() => setShowLinkModal(false)}
                  className='text-gray-400 hover:text-gray-600 transition-colors'
                >
                  <Edit className='w-6 h-6' />
                </button>
              </div>
            </div>

            <div className='p-6'>
              {(() => {
                const selectedTask = project?.tasks.find(t => t.id === selectedTaskForLinking)
                if (!selectedTask) return null

                return (
                  <div className='space-y-6'>
                    {/* Dependencies - Tasks this task depends on */}
                    <div>
                      <h4 className='text-lg font-semibold text-gray-900 mb-3 flex items-center'>
                        <GitBranch className='w-5 h-5 text-blue-600 mr-2' />
                        Bu görev şu görevlere bağımlı ({selectedTask.dependencies?.length || 0})
                      </h4>
                      <div className='space-y-2'>
                        {selectedTask.dependencies && selectedTask.dependencies.length > 0 ? (
                          selectedTask.dependencies.map(depId => {
                            const depTask = project?.tasks.find(t => t.id === depId)
                            if (!depTask) return null
                            return (
                              <div key={depId} className='flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg'>
                                <div className='flex items-center space-x-3'>
                                  <div className={`w-3 h-3 rounded-full ${
                                    depTask.status === 'COMPLETED' ? 'bg-green-500' : 'bg-gray-400'
                                  }`}></div>
                                  <div>
                                    <div className='font-medium text-gray-900'>{depTask.title}</div>
                                    <div className='text-sm text-gray-600'>{getStatusText(depTask.status)}</div>
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleUnlinkTasks(selectedTaskForLinking, depId)}
                                  className='text-red-500 hover:text-red-700 p-1 rounded'
                                  title='Bağlantıyı Kaldır'
                                >
                                  <Unlink className='w-4 h-4' />
                                </button>
                              </div>
                            )
                          })
                        ) : (
                          <p className='text-gray-500 text-sm'>Bu görev başka görevlere bağımlı değil</p>
                        )}
                      </div>
                    </div>

                    {/* Dependents - Tasks that depend on this task */}
                    <div>
                      <h4 className='text-lg font-semibold text-gray-900 mb-3 flex items-center'>
                        <Network className='w-5 h-5 text-green-600 mr-2' />
                        Bu göreve bağımlı görevler ({selectedTask.dependents?.length || 0})
                      </h4>
                      <div className='space-y-2'>
                        {selectedTask.dependents && selectedTask.dependents.length > 0 ? (
                          selectedTask.dependents.map(depId => {
                            const depTask = project?.tasks.find(t => t.id === depId)
                            if (!depTask) return null
                            return (
                              <div key={depId} className='flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg'>
                                <div className='flex items-center space-x-3'>
                                  <div className={`w-3 h-3 rounded-full ${
                                    depTask.status === 'COMPLETED' ? 'bg-green-500' : 'bg-gray-400'
                                  }`}></div>
                                  <div>
                                    <div className='font-medium text-gray-900'>{depTask.title}</div>
                                    <div className='text-sm text-gray-600'>{getStatusText(depTask.status)}</div>
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleUnlinkTasks(depId, selectedTaskForLinking)}
                                  className='text-red-500 hover:text-red-700 p-1 rounded'
                                  title='Bağlantıyı Kaldır'
                                >
                                  <Unlink className='w-4 h-4' />
                                </button>
                              </div>
                            )
                          })
                        ) : (
                          <p className='text-gray-500 text-sm'>Bu göreve bağımlı başka görev yok</p>
                        )}
                      </div>
                    </div>

                    {/* Add New Links */}
                    <div>
                      <h4 className='text-lg font-semibold text-gray-900 mb-3 flex items-center'>
                        <Plus className='w-5 h-5 text-purple-600 mr-2' />
                        Yeni Bağlantı Ekle
                      </h4>
                      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        {project?.tasks
                          .filter(t => 
                            t.id !== selectedTaskForLinking && 
                            !selectedTask.dependencies?.includes(t.id) && 
                            !selectedTask.dependents?.includes(t.id)
                          )
                          .map(task => (
                            <div key={task.id} className='flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg'>
                              <div className='flex items-center space-x-3'>
                                <div className={`w-3 h-3 rounded-full ${
                                  task.status === 'COMPLETED' ? 'bg-green-500' : 'bg-gray-400'
                                }`}></div>
                                <div>
                                  <div className='font-medium text-gray-900 text-sm'>{task.title}</div>
                                  <div className='text-xs text-gray-600'>{getStatusText(task.status)}</div>
                                </div>
                              </div>
                              <div className='flex space-x-2'>
                                <button
                                  onClick={() => {
                                    handleLinkTasks(selectedTaskForLinking, task.id, 'DEPENDENCY')
                                    setShowLinkModal(false)
                                  }}
                                  className='text-blue-500 hover:text-blue-700 p-1 rounded text-xs'
                                  title='Bu görevi seçili göreve bağımlı yap'
                                >
                                  ← Bağımlı
                                </button>
                                <button
                                  onClick={() => {
                                    handleLinkTasks(task.id, selectedTaskForLinking, 'DEPENDENCY')
                                    setShowLinkModal(false)
                                  }}
                                  className='text-green-500 hover:text-green-700 p-1 rounded text-xs'
                                  title='Bu görevi seçili görevden bağımlı yap'
                                >
                                  Öncül →
                                </button>
                              </div>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Linking Mode Instructions */}
      {linkingMode && (
        <div className='fixed bottom-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-40'>
          <div className='flex items-center space-x-3'>
            <LinkIcon className='w-5 h-5' />
            <div>
              <div className='font-medium'>Bağlama Modu Aktif</div>
              <div className='text-sm opacity-90'>Bağlamak istediğiniz görevi tıklayın</div>
            </div>
            <button
              onClick={cancelLinkingMode}
              className='text-white hover:text-gray-200 ml-4'
            >
              <Unlink className='w-4 h-4' />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
