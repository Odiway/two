'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import {
  Calendar,
  Plus,
  Users,
  BarChart3,
  Clock,
  Settings,
  AlertTriangle,
  Link,
  GitBranch,
} from 'lucide-react'
import type { Project, Task, User } from '@prisma/client'
import EnhancedCalendar from '@/components/EnhancedCalendar'

interface ExtendedProject extends Project {
  tasks: ExtendedTask[]
  users: User[]
}

interface ExtendedTask extends Task {
  assignedUser?: User
  dependencies?: Task[]
  subtasks?: Task[]
}

interface TaskUpdatePayload {
  id: string
  title?: string
  description?: string
  status?: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED'
  priority?: 'LOW' | 'MEDIUM' | 'HIGH'
  startDate?: string | null
  endDate?: string | null
  assignedUserId?: string | null
  estimatedHours?: number
  actualHours?: number
}

interface ProjectReschedulePayload {
  id: string
  strategy:
    | 'early_completion'
    | 'delay_handling'
    | 'resource_reallocation'
    | 'parallel_optimization'
    | 'critical_path'
  reason?: string
}

export default function ProjectDetailsPage() {
  const params = useParams()
  const projectId = params.id as string

  const [project, setProject] = useState<ExtendedProject | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<
    'overview' | 'calendar' | 'analytics' | 'linking' | 'edit'
  >('overview')

  // Task modal state
  const [selectedTask, setSelectedTask] = useState<ExtendedTask | null>(null)
  const [showTaskModal, setShowTaskModal] = useState(false)

  // Task linking modal state
  const [showDependencyModal, setShowDependencyModal] = useState(false)
  const [selectedTaskForDependency, setSelectedTaskForDependency] =
    useState<ExtendedTask | null>(null)
  const [taskDependencies, setTaskDependencies] = useState<{
    [taskId: string]: string[]
  }>({})
  const [taskDependents, setTaskDependents] = useState<{
    [taskId: string]: string[]
  }>({})

  // Fetch project data
  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/projects/${projectId}`)
        if (!response.ok) {
          throw new Error('Proje bulunamadı')
        }
        const data = await response.json()
        setProject(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Bir hata oluştu')
      } finally {
        setLoading(false)
      }
    }

    if (projectId) {
      fetchProject()
    }
  }, [projectId])

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users')
        if (response.ok) {
          const data = await response.json()
          setUsers(data)
        }
      } catch (err) {
        console.error('Kullanıcılar yüklenemedi:', err)
      }
    }

    fetchUsers()
  }, [])

  // Handle task updates
  const handleTaskUpdate = async (
    taskId: string,
    updates: Partial<TaskUpdatePayload>
  ) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        throw new Error('Görev güncellenemedi')
      }

      const updatedTask = await response.json()

      // Update local state
      setProject((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          tasks: prev.tasks.map((task) =>
            task.id === taskId ? { ...task, ...updatedTask } : task
          ),
        }
      })
    } catch (err) {
      console.error('Görev güncelleme hatası:', err)
    }
  }

  // Handle project reschedule
  const handleProjectReschedule = async (payload: ProjectReschedulePayload) => {
    try {
      const response = await fetch('/api/projects/reschedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error('Proje yeniden zamanlanamadı')
      }

      const result = await response.json()

      // Refresh project data
      const projectResponse = await fetch(`/api/projects/${projectId}`)
      if (projectResponse.ok) {
        const updatedProject = await projectResponse.json()
        setProject(updatedProject)
      }
    } catch (err) {
      console.error('Proje yeniden zamanlama hatası:', err)
    }
  }

  if (loading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4'></div>
          <p className='text-gray-600'>Proje yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center'>
        <div className='text-center'>
          <AlertTriangle className='w-12 h-12 text-red-500 mx-auto mb-4' />
          <h1 className='text-2xl font-bold text-gray-800 mb-2'>Hata</h1>
          <p className='text-gray-600'>{error}</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold text-gray-800 mb-2'>
            Proje Bulunamadı
          </h1>
          <p className='text-gray-600'>Belirtilen proje mevcut değil.</p>
        </div>
      </div>
    )
  }

  // Calculate project statistics
  const totalTasks = project.tasks.length
  const completedTasks = project.tasks.filter(
    (task) => task.status === 'COMPLETED'
  ).length
  const inProgressTasks = project.tasks.filter(
    (task) => task.status === 'IN_PROGRESS'
  ).length
  const overdueToday = new Date()
  const delayedTasks = project.tasks.filter(
    (task) =>
      task.endDate &&
      new Date(task.endDate) < overdueToday &&
      task.status !== 'COMPLETED'
  ).length
  const completionPercentage =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50'>
      <div className='container mx-auto px-4 py-8'>
        {/* Header */}
        <div className='mb-8'>
          <div className='bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-8'>
            <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6'>
              <div>
                <h1 className='text-4xl font-bold text-gray-800 mb-2'>
                  {project.name}
                </h1>
                <p className='text-gray-600 text-lg'>{project.description}</p>
                <div className='flex items-center gap-4 mt-4'>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      project.status === 'COMPLETED'
                        ? 'bg-green-100 text-green-800'
                        : project.status === 'IN_PROGRESS'
                        ? 'bg-blue-100 text-blue-800'
                        : project.status === 'ON_HOLD'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {project.status === 'COMPLETED'
                      ? 'Tamamlandı'
                      : project.status === 'IN_PROGRESS'
                      ? 'Devam Ediyor'
                      : project.status === 'ON_HOLD'
                      ? 'Beklemede'
                      : project.status === 'PLANNING'
                      ? 'Planlanıyor'
                      : 'Beklemede'}
                  </span>
                  <span className='text-sm text-gray-500'>
                    {project.startDate &&
                      `Başlangıç: ${new Date(
                        project.startDate
                      ).toLocaleDateString('tr-TR')}`}
                  </span>
                  <span className='text-sm text-gray-500'>
                    {project.endDate &&
                      `Bitiş: ${new Date(project.endDate).toLocaleDateString(
                        'tr-TR'
                      )}`}
                  </span>
                </div>
              </div>

              <div className='flex flex-col gap-4'>
                <div className='text-center'>
                  <div className='text-3xl font-bold text-blue-600'>
                    {completionPercentage}%
                  </div>
                  <div className='text-sm text-gray-500'>Tamamlanma</div>
                </div>
                <div className='w-32 bg-gray-200 rounded-full h-2'>
                  <div
                    className='bg-blue-500 h-2 rounded-full transition-all duration-300'
                    style={{ width: `${completionPercentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className='mb-8'>
          <div className='bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-2'>
            <div className='flex gap-2'>
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                  activeTab === 'overview'
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-white/50'
                }`}
              >
                <BarChart3 className='w-4 h-4' />
                Genel Bakış
              </button>
              <button
                onClick={() => setActiveTab('calendar')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                  activeTab === 'calendar'
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-white/50'
                }`}
              >
                <Calendar className='w-4 h-4' />
                Gelişmiş Takvim
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                  activeTab === 'analytics'
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-white/50'
                }`}
              >
                <BarChart3 className='w-4 h-4' />
                İstatistikler
              </button>
              <button
                onClick={() => setActiveTab('linking')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                  activeTab === 'linking'
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-white/50'
                }`}
              >
                <GitBranch className='w-4 h-4' />
                Görev Bağlantıları
              </button>
              <button
                onClick={() => setActiveTab('edit')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                  activeTab === 'edit'
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-white/50'
                }`}
              >
                <Settings className='w-4 h-4' />
                Proje Düzenle
              </button>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className='tab-content'>
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className='space-y-6'>
              {/* Statistics Cards */}
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
                <div className='bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-6'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <h3 className='text-lg font-semibold text-gray-800'>
                        Toplam Görev
                      </h3>
                      <p className='text-3xl font-bold text-blue-600'>
                        {totalTasks}
                      </p>
                    </div>
                    <BarChart3 className='w-8 h-8 text-blue-500' />
                  </div>
                </div>

                <div className='bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-6'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <h3 className='text-lg font-semibold text-gray-800'>
                        Tamamlanan
                      </h3>
                      <p className='text-3xl font-bold text-green-600'>
                        {completedTasks}
                      </p>
                    </div>
                    <div className='w-8 h-8 bg-green-100 rounded-full flex items-center justify-center'>
                      <div className='w-4 h-4 bg-green-500 rounded-full'></div>
                    </div>
                  </div>
                </div>

                <div className='bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-6'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <h3 className='text-lg font-semibold text-gray-800'>
                        Devam Eden
                      </h3>
                      <p className='text-3xl font-bold text-blue-600'>
                        {inProgressTasks}
                      </p>
                    </div>
                    <Clock className='w-8 h-8 text-blue-500' />
                  </div>
                </div>

                <div className='bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-6'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <h3 className='text-lg font-semibold text-gray-800'>
                        Geciken
                      </h3>
                      <p className='text-3xl font-bold text-red-600'>
                        {delayedTasks}
                      </p>
                    </div>
                    <AlertTriangle className='w-8 h-8 text-red-500' />
                  </div>
                </div>
              </div>

              {/* Enhanced Tasks List */}
              <div className='bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-8'>
                <div className='flex items-center justify-between mb-6'>
                  <h2 className='text-2xl font-bold text-gray-800'>
                    Görevler{' '}
                    <span className='text-sm font-normal text-gray-500'>
                      ({project.tasks.length})
                    </span>
                  </h2>
                  <div className='flex gap-3'>
                    <button className='flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors shadow-lg hover:shadow-xl'>
                      <Plus className='w-4 h-4' />
                      Yeni Görev
                    </button>
                    <button
                      onClick={() => setActiveTab('linking')}
                      className='flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors shadow-lg hover:shadow-xl'
                    >
                      <Link className='w-4 h-4' />
                      Görevleri Bağla
                    </button>
                  </div>
                </div>

                <div className='grid gap-4'>
                  {project.tasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => {
                        setSelectedTask(task)
                        setShowTaskModal(true)
                      }}
                      className='group bg-gradient-to-r from-white/60 to-white/40 backdrop-blur-sm rounded-xl p-6 border border-white/30 hover:border-blue-300 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:scale-[1.02]'
                    >
                      <div className='flex items-start justify-between'>
                        <div className='flex-1'>
                          {/* Task Header */}
                          <div className='flex items-center gap-3 mb-3'>
                            <div
                              className={`w-3 h-3 rounded-full ${
                                task.status === 'COMPLETED'
                                  ? 'bg-green-500'
                                  : task.status === 'IN_PROGRESS'
                                  ? 'bg-blue-500'
                                  : task.status === 'REVIEW'
                                  ? 'bg-yellow-500'
                                  : 'bg-gray-400'
                              }`}
                            />
                            <h3 className='text-lg font-semibold text-gray-800 group-hover:text-blue-700 transition-colors'>
                              {task.title}
                            </h3>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                task.priority === 'HIGH'
                                  ? 'bg-red-100 text-red-700'
                                  : task.priority === 'MEDIUM'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-green-100 text-green-700'
                              }`}
                            >
                              {task.priority === 'HIGH'
                                ? '🔥 Yüksek'
                                : task.priority === 'MEDIUM'
                                ? '⚡ Orta'
                                : '🌱 Düşük'}
                            </span>

                            {/* Dependency Indicators */}
                            {(taskDependencies[task.id] || []).length > 0 && (
                              <span
                                className='px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium'
                                title='Bu görevin bağımlılıkları var'
                              >
                                🔗 {(taskDependencies[task.id] || []).length}
                              </span>
                            )}
                            {(taskDependents[task.id] || []).length > 0 && (
                              <span
                                className='px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium'
                                title='Bu göreve bağlı görevler var'
                              >
                                🔀 {(taskDependents[task.id] || []).length}
                              </span>
                            )}
                          </div>

                          {/* Task Description */}
                          {task.description && (
                            <p className='text-gray-600 mb-4 line-clamp-2'>
                              {task.description}
                            </p>
                          )}

                          {/* Task Info Grid */}
                          <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-sm'>
                            {task.assignedUser && (
                              <div className='flex items-center gap-2'>
                                <Users className='w-4 h-4 text-gray-400' />
                                <span className='text-gray-600'>
                                  {task.assignedUser.name}
                                </span>
                              </div>
                            )}

                            {task.startDate && (
                              <div className='flex items-center gap-2'>
                                <Calendar className='w-4 h-4 text-green-500' />
                                <span className='text-gray-600'>
                                  {new Date(task.startDate).toLocaleDateString(
                                    'tr-TR'
                                  )}
                                </span>
                              </div>
                            )}

                            {task.endDate && (
                              <div className='flex items-center gap-2'>
                                <Clock className='w-4 h-4 text-red-500' />
                                <span className='text-gray-600'>
                                  {new Date(task.endDate).toLocaleDateString(
                                    'tr-TR'
                                  )}
                                </span>
                              </div>
                            )}

                            {task.estimatedHours && (
                              <div className='flex items-center gap-2'>
                                <BarChart3 className='w-4 h-4 text-blue-500' />
                                <span className='text-gray-600'>
                                  {task.estimatedHours}h
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Task Status & Actions */}
                        <div className='flex flex-col items-end gap-3'>
                          <span
                            className={`px-3 py-2 rounded-full text-sm font-medium shadow-sm ${
                              task.status === 'COMPLETED'
                                ? 'bg-green-100 text-green-800 border border-green-200'
                                : task.status === 'IN_PROGRESS'
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : task.status === 'REVIEW'
                                ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                : 'bg-gray-100 text-gray-800 border border-gray-200'
                            }`}
                          >
                            {task.status === 'COMPLETED'
                              ? '✅ Tamamlandı'
                              : task.status === 'IN_PROGRESS'
                              ? '🔄 Devam Ediyor'
                              : task.status === 'REVIEW'
                              ? '👁️ İncelemede'
                              : '⏳ Beklemede'}
                          </span>

                          {/* Action Buttons */}
                          <div className='flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity'>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedTaskForDependency(task)
                                setShowDependencyModal(true)
                              }}
                              className='p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors'
                              title='Görevleri Bağla'
                            >
                              <Link className='w-5 h-5' />
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                console.log('Task actions for:', task.title)
                              }}
                              className='p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors'
                              title='Görev Ayarları'
                            >
                              <Settings className='w-5 h-5' />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar (if task has estimated hours) */}
                      {task.estimatedHours && (
                        <div className='mt-4 pt-4 border-t border-gray-200'>
                          <div className='flex items-center justify-between text-sm text-gray-600 mb-2'>
                            <span>İlerleme</span>
                            <span>
                              {task.actualHours || 0}/{task.estimatedHours}h
                            </span>
                          </div>
                          <div className='w-full bg-gray-200 rounded-full h-2'>
                            <div
                              className={`h-2 rounded-full transition-all ${
                                task.status === 'COMPLETED'
                                  ? 'bg-green-500'
                                  : task.status === 'IN_PROGRESS'
                                  ? 'bg-blue-500'
                                  : 'bg-gray-400'
                              }`}
                              style={{
                                width: `${Math.min(
                                  ((task.actualHours || 0) /
                                    task.estimatedHours) *
                                    100,
                                  100
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Empty State */}
                  {project.tasks.length === 0 && (
                    <div className='text-center py-12'>
                      <div className='w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                        <Plus className='w-8 h-8 text-gray-400' />
                      </div>
                      <h3 className='text-lg font-semibold text-gray-800 mb-2'>
                        Henüz görev yok
                      </h3>
                      <p className='text-gray-600 mb-4'>
                        Proje için ilk görevinizi oluşturun
                      </p>
                      <button className='px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors'>
                        İlk Görevi Oluştur
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Calendar Tab */}
          {activeTab === 'calendar' && project && (
            <div className='space-y-6'>
              <EnhancedCalendar
                tasks={project.tasks.map((task) => ({
                  id: task.id,
                  title: task.title,
                  description: task.description || undefined,
                  status: task.status,
                  priority: task.priority,
                  startDate: task.startDate
                    ? new Date(task.startDate)
                    : undefined,
                  endDate: task.endDate ? new Date(task.endDate) : undefined,
                  assignedId: task.assignedId || undefined,
                  estimatedHours: task.estimatedHours || undefined,
                  actualHours: task.actualHours || undefined,
                  delayReason: task.delayReason || undefined,
                  delayDays: task.delayDays || 0,
                  workloadPercentage: task.workloadPercentage || 0,
                  isBottleneck: task.isBottleneck || false,
                  originalEndDate: task.originalEndDate
                    ? new Date(task.originalEndDate)
                    : undefined,
                  // Dependency properties
                  taskType: (task as any).taskType || 'INDEPENDENT',
                  dependencies: (task as any).dependencies || [],
                  dependents: (task as any).dependents || [],
                  scheduleType: (task as any).scheduleType || 'STANDARD',
                  estimatedFinishDate: (task as any).estimatedFinishDate
                    ? new Date((task as any).estimatedFinishDate)
                    : task.endDate
                    ? new Date(task.endDate)
                    : undefined,
                  actualFinishDate: (task as any).actualFinishDate
                    ? new Date((task as any).actualFinishDate)
                    : undefined,
                  assignedUser: task.assignedUser
                    ? {
                        ...task.assignedUser,
                        maxHoursPerDay: 8,
                      }
                    : undefined,
                }))}
                project={{
                  ...project,
                  startDate: project.startDate
                    ? new Date(project.startDate)
                    : undefined,
                  endDate: project.endDate
                    ? new Date(project.endDate)
                    : undefined,
                  originalEndDate: project.originalEndDate
                    ? new Date(project.originalEndDate)
                    : undefined,
                  delayDays: project.delayDays || 0,
                  autoReschedule: project.autoReschedule || true,
                }}
                users={users.map((user) => ({
                  ...user,
                  maxHoursPerDay: 8,
                }))}
                onTaskUpdate={async (taskId: string, updates: any) => {
                  await handleTaskUpdate(taskId, updates)
                }}
                onProjectReschedule={(strategy: string) => {
                  handleProjectReschedule({
                    id: project.id,
                    strategy: strategy as any,
                    reason: `Auto reschedule using ${strategy} strategy`,
                  })
                }}
              />
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className='space-y-6'>
              <div className='bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-8'>
                <div className='flex items-center gap-2 mb-6'>
                  <BarChart3 className='w-6 h-6 text-blue-500' />
                  <h2 className='text-2xl font-bold text-gray-800'>
                    Proje Analitikleri
                  </h2>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
                  <div className='bg-white/50 rounded-xl p-6'>
                    <h3 className='text-lg font-semibold text-gray-800 mb-2'>
                      Ortalama Görev Süresi
                    </h3>
                    <p className='text-2xl font-bold text-blue-600'>
                      {project.tasks.length > 0
                        ? Math.round(
                            project.tasks.reduce(
                              (acc, task) => acc + (task.estimatedHours || 0),
                              0
                            ) / project.tasks.length
                          )
                        : 0}{' '}
                      saat
                    </p>
                  </div>

                  <div className='bg-white/50 rounded-xl p-6'>
                    <h3 className='text-lg font-semibold text-gray-800 mb-2'>
                      Toplam Çalışma Saati
                    </h3>
                    <p className='text-2xl font-bold text-green-600'>
                      {project.tasks.reduce(
                        (acc, task) => acc + (task.actualHours || 0),
                        0
                      )}{' '}
                      saat
                    </p>
                  </div>

                  <div className='bg-white/50 rounded-xl p-6'>
                    <h3 className='text-lg font-semibold text-gray-800 mb-2'>
                      Verimlilik
                    </h3>
                    <p className='text-2xl font-bold text-purple-600'>
                      {totalTasks > 0
                        ? Math.round((completedTasks / totalTasks) * 100)
                        : 0}
                      %
                    </p>
                  </div>

                  <div className='bg-white/50 rounded-xl p-6'>
                    <h3 className='text-lg font-semibold text-gray-800 mb-2'>
                      Aktif Kullanıcılar
                    </h3>
                    <p className='text-2xl font-bold text-orange-600'>
                      {
                        new Set(
                          project.tasks
                            .filter((task) => task.assignedUser?.id)
                            .map((task) => task.assignedUser?.id)
                        ).size
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Task Linking Tab */}
          {activeTab === 'linking' && (
            <div className='space-y-6'>
              {/* Header */}
              <div className='bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-8'>
                <div className='flex items-center justify-between mb-6'>
                  <div className='flex items-center gap-2'>
                    <GitBranch className='w-6 h-6 text-purple-500' />
                    <h2 className='text-2xl font-bold text-gray-800'>
                      Görev Bağlantı Yöneticisi
                    </h2>
                  </div>
                  <div className='flex gap-3'>
                    <button
                      onClick={() => {
                        // Clear all dependencies
                        setTaskDependencies({})
                        setTaskDependents({})
                        alert('Tüm bağlantılar temizlendi!')
                      }}
                      className='px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors'
                    >
                      🗑️ Tümünü Temizle
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          // Save all dependencies
                          console.log('Saving all dependencies:', {
                            dependencies: taskDependencies,
                            dependents: taskDependents,
                          })

                          // Here you would call your API to save all dependencies
                          // For now, we'll just show a success message
                          const totalConnections =
                            Object.values(taskDependencies).reduce(
                              (acc, deps) => acc + deps.length,
                              0
                            ) +
                            Object.values(taskDependents).reduce(
                              (acc, deps) => acc + deps.length,
                              0
                            )

                          alert(
                            `✅ Tüm bağlantılar kaydedildi!\n\nToplam bağlantı sayısı: ${totalConnections}`
                          )
                        } catch (error) {
                          console.error('Error saving dependencies:', error)
                          alert('❌ Bağlantılar kaydedilirken hata oluştu!')
                        }
                      }}
                      className='px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-semibold'
                    >
                      💾 Tüm Değişiklikleri Kaydet
                    </button>
                  </div>
                </div>

                {/* Stats */}
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
                  <div className='bg-blue-50 rounded-xl p-4'>
                    <div className='text-center'>
                      <div className='text-2xl font-bold text-blue-600'>
                        {Object.values(taskDependencies).reduce(
                          (acc, deps) => acc + deps.length,
                          0
                        )}
                      </div>
                      <div className='text-sm text-blue-700'>
                        Toplam Bağımlılık
                      </div>
                    </div>
                  </div>
                  <div className='bg-purple-50 rounded-xl p-4'>
                    <div className='text-center'>
                      <div className='text-2xl font-bold text-purple-600'>
                        {Object.values(taskDependents).reduce(
                          (acc, deps) => acc + deps.length,
                          0
                        )}
                      </div>
                      <div className='text-sm text-purple-700'>
                        Toplam Bağlantı
                      </div>
                    </div>
                  </div>
                  <div className='bg-green-50 rounded-xl p-4'>
                    <div className='text-center'>
                      <div className='text-2xl font-bold text-green-600'>
                        {project.tasks.length}
                      </div>
                      <div className='text-sm text-green-700'>Toplam Görev</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Task Linking Interface */}
              <div className='bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-8'>
                <h3 className='text-xl font-bold text-gray-800 mb-6 flex items-center gap-2'>
                  🔗 Görev Bağlantı Matrisi
                </h3>

                <div className='space-y-6'>
                  {project.tasks.map((task, index) => (
                    <div
                      key={task.id}
                      className='bg-white/60 rounded-xl p-6 border border-gray-200'
                    >
                      {/* Task Header */}
                      <div className='flex items-center justify-between mb-4'>
                        <div className='flex items-center gap-3'>
                          <div
                            className={`w-4 h-4 rounded-full ${
                              task.status === 'COMPLETED'
                                ? 'bg-green-500'
                                : task.status === 'IN_PROGRESS'
                                ? 'bg-blue-500'
                                : task.status === 'REVIEW'
                                ? 'bg-yellow-500'
                                : 'bg-gray-400'
                            }`}
                          />
                          <h4 className='text-lg font-semibold text-gray-800'>
                            {task.title}
                          </h4>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              task.priority === 'HIGH'
                                ? 'bg-red-100 text-red-700'
                                : task.priority === 'MEDIUM'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-green-100 text-green-700'
                            }`}
                          >
                            {task.priority === 'HIGH'
                              ? '🔥 Yüksek'
                              : task.priority === 'MEDIUM'
                              ? '⚡ Orta'
                              : '🌱 Düşük'}
                          </span>
                        </div>

                        <div className='flex gap-2'>
                          <span className='px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium'>
                            Bağımlı: {(taskDependencies[task.id] || []).length}
                          </span>
                          <span className='px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium'>
                            Bağlı: {(taskDependents[task.id] || []).length}
                          </span>
                        </div>
                      </div>

                      {/* Task Description */}
                      {task.description && (
                        <p className='text-gray-600 mb-4 text-sm'>
                          {task.description}
                        </p>
                      )}

                      {/* Dependencies Grid */}
                      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                        {/* This task depends on */}
                        <div>
                          <h5 className='font-semibold text-gray-700 mb-3 flex items-center gap-2'>
                            ⬆️ Bu görev şunlara bağımlı:
                          </h5>
                          <div className='grid grid-cols-1 gap-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3'>
                            {project.tasks
                              .filter((t) => t.id !== task.id)
                              .map((dependencyTask) => (
                                <label
                                  key={dependencyTask.id}
                                  className='flex items-center gap-3 hover:bg-gray-50 p-2 rounded'
                                >
                                  <input
                                    type='checkbox'
                                    className='rounded'
                                    checked={
                                      taskDependencies[task.id]?.includes(
                                        dependencyTask.id
                                      ) || false
                                    }
                                    onChange={(e) => {
                                      const currentDeps =
                                        taskDependencies[task.id] || []
                                      if (e.target.checked) {
                                        setTaskDependencies((prev) => ({
                                          ...prev,
                                          [task.id]: [
                                            ...currentDeps,
                                            dependencyTask.id,
                                          ],
                                        }))
                                      } else {
                                        setTaskDependencies((prev) => ({
                                          ...prev,
                                          [task.id]: currentDeps.filter(
                                            (id) => id !== dependencyTask.id
                                          ),
                                        }))
                                      }
                                    }}
                                  />
                                  <div className='flex-1'>
                                    <div className='text-sm font-medium text-gray-900'>
                                      {dependencyTask.title}
                                    </div>
                                    <div className='text-xs text-gray-500'>
                                      {dependencyTask.status === 'COMPLETED'
                                        ? '✅ Tamamlandı'
                                        : dependencyTask.status ===
                                          'IN_PROGRESS'
                                        ? '🔄 Devam Ediyor'
                                        : dependencyTask.status === 'REVIEW'
                                        ? '👁️ İncelemede'
                                        : '⏳ Bekliyor'}
                                    </div>
                                  </div>
                                </label>
                              ))}
                          </div>
                        </div>

                        {/* Tasks that depend on this */}
                        <div>
                          <h5 className='font-semibold text-gray-700 mb-3 flex items-center gap-2'>
                            ⬇️ Bu göreve bağlı görevler:
                          </h5>
                          <div className='grid grid-cols-1 gap-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3'>
                            {project.tasks
                              .filter((t) => t.id !== task.id)
                              .map((dependentTask) => (
                                <label
                                  key={dependentTask.id}
                                  className='flex items-center gap-3 hover:bg-gray-50 p-2 rounded'
                                >
                                  <input
                                    type='checkbox'
                                    className='rounded'
                                    checked={
                                      taskDependents[task.id]?.includes(
                                        dependentTask.id
                                      ) || false
                                    }
                                    onChange={(e) => {
                                      const currentDeps =
                                        taskDependents[task.id] || []
                                      if (e.target.checked) {
                                        setTaskDependents((prev) => ({
                                          ...prev,
                                          [task.id]: [
                                            ...currentDeps,
                                            dependentTask.id,
                                          ],
                                        }))
                                      } else {
                                        setTaskDependents((prev) => ({
                                          ...prev,
                                          [task.id]: currentDeps.filter(
                                            (id) => id !== dependentTask.id
                                          ),
                                        }))
                                      }
                                    }}
                                  />
                                  <div className='flex-1'>
                                    <div className='text-sm font-medium text-gray-900'>
                                      {dependentTask.title}
                                    </div>
                                    <div className='text-xs text-gray-500'>
                                      {dependentTask.status === 'COMPLETED'
                                        ? '✅ Tamamlandı'
                                        : dependentTask.status === 'IN_PROGRESS'
                                        ? '🔄 Devam Ediyor'
                                        : dependentTask.status === 'REVIEW'
                                        ? '👁️ İncelemede'
                                        : '⏳ Bekliyor'}
                                    </div>
                                  </div>
                                </label>
                              ))}
                          </div>
                        </div>
                      </div>

                      {/* Individual Save Button */}
                      <div className='mt-4 pt-4 border-t border-gray-200 flex justify-end'>
                        <button
                          onClick={() => {
                            const dependencies = taskDependencies[task.id] || []
                            const dependents = taskDependents[task.id] || []
                            console.log(
                              `Saving dependencies for task: ${task.title}`,
                              {
                                taskId: task.id,
                                dependencies,
                                dependents,
                              }
                            )
                            alert(
                              `✅ "${task.title}" görevinin bağlantıları kaydedildi!\n\nBağımlılık: ${dependencies.length}\nBağlı: ${dependents.length}`
                            )
                          }}
                          className='px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm'
                        >
                          💾 Bu Görevi Kaydet
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Project Edit Tab */}
          {activeTab === 'edit' && (
            <div className='space-y-6'>
              {/* Project Basic Info */}
              <div className='bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-8'>
                <div className='flex items-center gap-2 mb-6'>
                  <Settings className='w-6 h-6 text-blue-500' />
                  <h2 className='text-2xl font-bold text-gray-800'>
                    Proje Bilgileri
                  </h2>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Proje Adı
                    </label>
                    <input
                      type='text'
                      value={project.name}
                      className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                      placeholder='Proje adını girin'
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Durum
                    </label>
                    <select className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'>
                      <option value='PLANNING'>Planlanıyor</option>
                      <option value='IN_PROGRESS'>Devam Ediyor</option>
                      <option value='ON_HOLD'>Beklemede</option>
                      <option value='COMPLETED'>Tamamlandı</option>
                    </select>
                  </div>

                  <div className='md:col-span-2'>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Açıklama
                    </label>
                    <textarea
                      value={project.description || ''}
                      rows={3}
                      className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                      placeholder='Proje açıklamasını girin'
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Başlangıç Tarihi
                    </label>
                    <input
                      type='date'
                      value={
                        project.startDate
                          ? new Date(project.startDate)
                              .toISOString()
                              .split('T')[0]
                          : ''
                      }
                      className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Bitiş Tarihi
                    </label>
                    <input
                      type='date'
                      value={
                        project.endDate
                          ? new Date(project.endDate)
                              .toISOString()
                              .split('T')[0]
                          : ''
                      }
                      className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    />
                  </div>
                </div>

                <div className='mt-6 flex gap-4'>
                  <button className='px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors'>
                    Değişiklikleri Kaydet
                  </button>
                  <button className='px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors'>
                    İptal
                  </button>
                </div>
              </div>

              {/* Team Management */}
              <div className='bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-8'>
                <div className='flex items-center gap-2 mb-6'>
                  <Users className='w-6 h-6 text-blue-500' />
                  <h2 className='text-2xl font-bold text-gray-800'>
                    Takım Yönetimi
                  </h2>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                  {users.map((user) => {
                    const userTasks = project.tasks.filter(
                      (task) => task.assignedUser?.id === user.id
                    )
                    const completedUserTasks = userTasks.filter(
                      (task) => task.status === 'COMPLETED'
                    )
                    const userCompletionRate =
                      userTasks.length > 0
                        ? Math.round(
                            (completedUserTasks.length / userTasks.length) * 100
                          )
                        : 0

                    return (
                      <div key={user.id} className='bg-white/50 rounded-xl p-6'>
                        <div className='text-center'>
                          <div className='w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                            <span className='text-blue-600 font-bold text-xl'>
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <h3 className='text-lg font-semibold text-gray-800 mb-1'>
                            {user.name}
                          </h3>
                          <p className='text-gray-600 text-sm mb-4'>
                            {user.email}
                          </p>

                          <div className='space-y-2'>
                            <div className='flex justify-between items-center'>
                              <span className='text-sm text-gray-600'>
                                Görevler
                              </span>
                              <span className='font-semibold'>
                                {userTasks.length}
                              </span>
                            </div>
                            <div className='flex justify-between items-center'>
                              <span className='text-sm text-gray-600'>
                                Tamamlanan
                              </span>
                              <span className='font-semibold text-green-600'>
                                {completedUserTasks.length}
                              </span>
                            </div>
                            <div className='flex justify-between items-center'>
                              <span className='text-sm text-gray-600'>
                                Başarı Oranı
                              </span>
                              <span className='font-semibold text-blue-600'>
                                {userCompletionRate}%
                              </span>
                            </div>
                          </div>

                          <div className='mt-4'>
                            <div className='w-full bg-gray-200 rounded-full h-2'>
                              <div
                                className='bg-blue-500 h-2 rounded-full transition-all duration-300'
                                style={{ width: `${userCompletionRate}%` }}
                              ></div>
                            </div>
                          </div>

                          <div className='mt-4 flex gap-2'>
                            <button className='flex-1 px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors'>
                              Düzenle
                            </button>
                            <button className='flex-1 px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition-colors'>
                              Kaldır
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className='mt-6'>
                  <button className='px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors'>
                    Yeni Üye Ekle
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Task Detail Modal */}
      {showTaskModal && selectedTask && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl'>
            {/* Modal Header */}
            <div className='bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4'>
              <div className='flex items-center justify-between'>
                <div className='text-white'>
                  <h3 className='text-xl font-bold'>Görev Detayları</h3>
                  <p className='text-blue-100 text-sm'>{selectedTask.title}</p>
                </div>
                <button
                  onClick={() => {
                    setShowTaskModal(false)
                    setSelectedTask(null)
                  }}
                  className='text-white hover:text-gray-200 p-2 hover:bg-white/20 rounded-lg transition-colors'
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className='p-6 overflow-y-auto max-h-[75vh]'>
              <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
                {/* Main Content */}
                <div className='lg:col-span-2 space-y-6'>
                  {/* Task Info */}
                  <div className='bg-gray-50 rounded-xl p-6'>
                    <h4 className='font-semibold text-gray-800 mb-4 flex items-center gap-2'>
                      <BarChart3 className='w-5 h-5 text-blue-600' />
                      Görev Bilgileri
                    </h4>

                    <div className='space-y-4'>
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>
                          Başlık
                        </label>
                        <input
                          type='text'
                          value={selectedTask.title}
                          className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                          readOnly
                        />
                      </div>

                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>
                          Açıklama
                        </label>
                        <textarea
                          value={selectedTask.description || 'Açıklama yok'}
                          rows={3}
                          className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                          readOnly
                        />
                      </div>

                      <div className='grid grid-cols-2 gap-4'>
                        <div>
                          <label className='block text-sm font-medium text-gray-700 mb-1'>
                            Durum
                          </label>
                          <select
                            value={selectedTask.status}
                            className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                          >
                            <option value='TODO'>⏳ Beklemede</option>
                            <option value='IN_PROGRESS'>🔄 Devam Ediyor</option>
                            <option value='REVIEW'>👁️ İncelemede</option>
                            <option value='COMPLETED'>✅ Tamamlandı</option>
                          </select>
                        </div>

                        <div>
                          <label className='block text-sm font-medium text-gray-700 mb-1'>
                            Öncelik
                          </label>
                          <select
                            value={selectedTask.priority}
                            className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                          >
                            <option value='LOW'>🌱 Düşük</option>
                            <option value='MEDIUM'>⚡ Orta</option>
                            <option value='HIGH'>🔥 Yüksek</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Dates & Time */}
                  <div className='bg-blue-50 rounded-xl p-6'>
                    <h4 className='font-semibold text-gray-800 mb-4 flex items-center gap-2'>
                      <Calendar className='w-5 h-5 text-blue-600' />
                      Tarih ve Süre
                    </h4>

                    <div className='grid grid-cols-2 gap-4'>
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>
                          Başlangıç Tarihi
                        </label>
                        <input
                          type='date'
                          value={
                            selectedTask.startDate
                              ? new Date(selectedTask.startDate)
                                  .toISOString()
                                  .split('T')[0]
                              : ''
                          }
                          className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                        />
                      </div>

                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>
                          Bitiş Tarihi
                        </label>
                        <input
                          type='date'
                          value={
                            selectedTask.endDate
                              ? new Date(selectedTask.endDate)
                                  .toISOString()
                                  .split('T')[0]
                              : ''
                          }
                          className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                        />
                      </div>

                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>
                          Tahmini Süre (saat)
                        </label>
                        <input
                          type='number'
                          value={selectedTask.estimatedHours || ''}
                          className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                          placeholder='0'
                        />
                      </div>

                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>
                          Harcanan Süre (saat)
                        </label>
                        <input
                          type='number'
                          value={selectedTask.actualHours || ''}
                          className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                          placeholder='0'
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sidebar */}
                <div className='space-y-6'>
                  {/* Assigned User */}
                  <div className='bg-green-50 rounded-xl p-6'>
                    <h4 className='font-semibold text-gray-800 mb-4 flex items-center gap-2'>
                      <Users className='w-5 h-5 text-green-600' />
                      Atanan Kişi
                    </h4>

                    {selectedTask.assignedUser ? (
                      <div className='flex items-center gap-3'>
                        <div className='w-10 h-10 bg-green-200 rounded-full flex items-center justify-center'>
                          <span className='text-green-700 font-medium'>
                            {selectedTask.assignedUser.name
                              .charAt(0)
                              .toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className='font-medium text-gray-900'>
                            {selectedTask.assignedUser.name}
                          </div>
                          <div className='text-sm text-gray-600'>
                            {selectedTask.assignedUser.email}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className='text-center py-4'>
                        <Users className='w-8 h-8 text-gray-400 mx-auto mb-2' />
                        <p className='text-gray-600 text-sm'>Henüz atanmamış</p>
                        <button className='mt-2 px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors'>
                          Kişi Ata
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Progress */}
                  {selectedTask.estimatedHours && (
                    <div className='bg-purple-50 rounded-xl p-6'>
                      <h4 className='font-semibold text-gray-800 mb-4 flex items-center gap-2'>
                        <Clock className='w-5 h-5 text-purple-600' />
                        İlerleme
                      </h4>

                      <div className='space-y-3'>
                        <div className='flex justify-between text-sm'>
                          <span className='text-gray-600'>
                            Tamamlanma Oranı
                          </span>
                          <span className='font-medium'>
                            {Math.round(
                              ((selectedTask.actualHours || 0) /
                                selectedTask.estimatedHours) *
                                100
                            )}
                            %
                          </span>
                        </div>

                        <div className='w-full bg-gray-200 rounded-full h-3'>
                          <div
                            className='bg-purple-500 h-3 rounded-full transition-all'
                            style={{
                              width: `${Math.min(
                                ((selectedTask.actualHours || 0) /
                                  selectedTask.estimatedHours) *
                                  100,
                                100
                              )}%`,
                            }}
                          />
                        </div>

                        <div className='flex justify-between text-sm text-gray-600'>
                          <span>{selectedTask.actualHours || 0}h harcandı</span>
                          <span>{selectedTask.estimatedHours}h tahmini</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div className='bg-yellow-50 rounded-xl p-6'>
                    <h4 className='font-semibold text-gray-800 mb-4 flex items-center gap-2'>
                      <Settings className='w-5 h-5 text-yellow-600' />
                      Hızlı İşlemler
                    </h4>

                    <div className='space-y-2'>
                      <button className='w-full px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm'>
                        📋 Görev Kopyala
                      </button>
                      <button
                        onClick={() => {
                          setShowTaskModal(false)
                          setSelectedTaskForDependency(selectedTask)
                          setShowDependencyModal(true)
                        }}
                        className='w-full px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm'
                      >
                        🔗 Bağımlılık Ekle
                      </button>
                      <button className='w-full px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm'>
                        📁 Alt Görev Ekle
                      </button>
                      <button className='w-full px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm'>
                        🗑️ Görevi Sil
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className='bg-gray-50 px-6 py-4 border-t flex justify-between items-center'>
              <div className='text-sm text-gray-600'>
                Son güncelleme:{' '}
                {selectedTask.updatedAt
                  ? new Date(selectedTask.updatedAt).toLocaleDateString('tr-TR')
                  : 'Bilinmiyor'}
              </div>
              <div className='flex gap-3'>
                <button
                  onClick={() => {
                    setShowTaskModal(false)
                    setSelectedTask(null)
                  }}
                  className='px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors'
                >
                  İptal
                </button>
                <button
                  onClick={() => {
                    // Save task changes logic here
                    console.log('Saving task changes:', selectedTask)
                    setShowTaskModal(false)
                    setSelectedTask(null)
                  }}
                  className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
                >
                  Değişiklikleri Kaydet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dependency Modal */}
      {showDependencyModal && selectedTaskForDependency && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden'>
            {/* Modal Header */}
            <div className='bg-blue-50 px-6 py-4 border-b'>
              <div className='flex items-center justify-between'>
                <div>
                  <h3 className='text-lg font-semibold text-gray-900'>
                    Görev Bağımlılıkları
                  </h3>
                  <p className='text-sm text-gray-600'>
                    {selectedTaskForDependency.title}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowDependencyModal(false)
                    setSelectedTaskForDependency(null)
                  }}
                  className='text-gray-400 hover:text-gray-600 p-2'
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className='p-6 overflow-y-auto max-h-[60vh]'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                {/* Dependencies (Tasks this task depends on) */}
                <div>
                  <h4 className='font-semibold text-gray-800 mb-3'>
                    🔗 Bu görev şunlara bağımlı:
                  </h4>
                  <div className='space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3'>
                    {project.tasks
                      .filter((t) => t.id !== selectedTaskForDependency.id)
                      .map((task) => (
                        <label
                          key={task.id}
                          className='flex items-center gap-3 hover:bg-gray-50 p-2 rounded'
                        >
                          <input
                            type='checkbox'
                            className='rounded'
                            checked={
                              taskDependencies[
                                selectedTaskForDependency.id
                              ]?.includes(task.id) || false
                            }
                            onChange={(e) => {
                              const currentDeps =
                                taskDependencies[
                                  selectedTaskForDependency.id
                                ] || []
                              if (e.target.checked) {
                                setTaskDependencies((prev) => ({
                                  ...prev,
                                  [selectedTaskForDependency.id]: [
                                    ...currentDeps,
                                    task.id,
                                  ],
                                }))
                              } else {
                                setTaskDependencies((prev) => ({
                                  ...prev,
                                  [selectedTaskForDependency.id]:
                                    currentDeps.filter((id) => id !== task.id),
                                }))
                              }
                            }}
                          />
                          <div className='flex-1'>
                            <div className='text-sm font-medium text-gray-900'>
                              {task.title}
                            </div>
                            <div className='text-xs text-gray-500'>
                              {task.status === 'COMPLETED'
                                ? '✅ Tamamlandı'
                                : task.status === 'IN_PROGRESS'
                                ? '🔄 Devam Ediyor'
                                : task.status === 'REVIEW'
                                ? '👁️ İncelemede'
                                : '⏳ Bekliyor'}
                            </div>
                          </div>
                        </label>
                      ))}
                  </div>
                </div>

                {/* Dependents (Tasks that depend on this task) */}
                <div>
                  <h4 className='font-semibold text-gray-800 mb-3'>
                    ⬇️ Bu göreve bağlı görevler:
                  </h4>
                  <div className='space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3'>
                    {project.tasks
                      .filter((t) => t.id !== selectedTaskForDependency.id)
                      .map((task) => (
                        <label
                          key={task.id}
                          className='flex items-center gap-3 hover:bg-gray-50 p-2 rounded'
                        >
                          <input
                            type='checkbox'
                            className='rounded'
                            checked={
                              taskDependents[
                                selectedTaskForDependency.id
                              ]?.includes(task.id) || false
                            }
                            onChange={(e) => {
                              const currentDeps =
                                taskDependents[selectedTaskForDependency.id] ||
                                []
                              if (e.target.checked) {
                                setTaskDependents((prev) => ({
                                  ...prev,
                                  [selectedTaskForDependency.id]: [
                                    ...currentDeps,
                                    task.id,
                                  ],
                                }))
                              } else {
                                setTaskDependents((prev) => ({
                                  ...prev,
                                  [selectedTaskForDependency.id]:
                                    currentDeps.filter((id) => id !== task.id),
                                }))
                              }
                            }}
                          />
                          <div className='flex-1'>
                            <div className='text-sm font-medium text-gray-900'>
                              {task.title}
                            </div>
                            <div className='text-xs text-gray-500'>
                              {task.status === 'COMPLETED'
                                ? '✅ Tamamlandı'
                                : task.status === 'IN_PROGRESS'
                                ? '🔄 Devam Ediyor'
                                : task.status === 'REVIEW'
                                ? '👁️ İncelemede'
                                : '⏳ Bekliyor'}
                            </div>
                          </div>
                        </label>
                      ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className='bg-gray-50 px-6 py-4 border-t'>
              <div className='flex justify-between items-center'>
                <div className='text-sm text-gray-600'>
                  Bağımlılık:{' '}
                  {
                    (taskDependencies[selectedTaskForDependency.id] || [])
                      .length
                  }{' '}
                  • Bağlı:{' '}
                  {(taskDependents[selectedTaskForDependency.id] || []).length}
                </div>
                <div className='flex gap-3'>
                  <button
                    onClick={() => {
                      setShowDependencyModal(false)
                      setSelectedTaskForDependency(null)
                    }}
                    className='px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors'
                  >
                    İptal
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        // Save dependencies logic here
                        const dependencies =
                          taskDependencies[selectedTaskForDependency.id] || []
                        const dependents =
                          taskDependents[selectedTaskForDependency.id] || []

                        console.log('Saving dependencies:', {
                          taskId: selectedTaskForDependency.id,
                          dependencies,
                          dependents,
                        })

                        // Here you would call your API to save the dependencies
                        // For now, we'll just update the local state
                        alert(
                          `Bağımlılıklar kaydedildi!\n\nBağımlılık sayısı: ${dependencies.length}\nBağlı görev sayısı: ${dependents.length}`
                        )

                        setShowDependencyModal(false)
                        setSelectedTaskForDependency(null)
                      } catch (error) {
                        console.error('Error saving dependencies:', error)
                        alert('Bağımlılıklar kaydedilirken hata oluştu!')
                      }
                    }}
                    className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
                  >
                    💾 Kaydet
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
