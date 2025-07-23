'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Calendar,
  Plus,
  Users,
  BarChart3,
  Clock,
  Settings,
  AlertTriangle,
} from 'lucide-react'
import type { Project, Task, User } from '@prisma/client'
import EnhancedCalendar from '@/components/EnhancedCalendar'
import TaskCreationModal from '@/components/TaskCreationModal'

interface ExtendedProject extends Project {
  tasks: ExtendedTask[]
  users: User[]
}

interface ExtendedTask extends Task {
  assignedUser?: User
}

export default function ProjectDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const [project, setProject] = useState<ExtendedProject | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'calendar' | 'analytics'>('overview')
  const [showTaskModal, setShowTaskModal] = useState(false)

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
  const handleTaskUpdate = async (taskId: string, updates: any) => {
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
      console.error('Görev güncellenirken hata:', err)
    }
  }

  // Handle project reschedule
  const handleProjectReschedule = async (strategy: string) => {
    try {
      const response = await fetch(`/api/projects/reschedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          strategy,
        }),
      })

      if (!response.ok) {
        throw new Error('Proje yeniden planlanamadı')
      }

      // Reload project data
      window.location.reload()
    } catch (err) {
      console.error('Proje yeniden planlanırken hata:', err)
    }
  }

  // Handle single task creation
  const handleCreateTask = async (taskData: any) => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...taskData,
          projectId,
          startDate: taskData.startDate ? new Date(taskData.startDate).toISOString() : null,
          endDate: taskData.endDate ? new Date(taskData.endDate).toISOString() : null,
          estimatedHours: taskData.estimatedHours ? parseInt(taskData.estimatedHours) : null,
        }),
      })

      if (!response.ok) {
        throw new Error('Görev oluşturulamadı')
      }

      // Reload project data
      window.location.reload()
    } catch (err) {
      console.error('Görev oluşturulurken hata:', err)
    }
  }

  // Handle task group creation
  const handleCreateTaskGroup = async (groupData: any) => {
    try {
      // First create the parent task
      const parentResponse = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: groupData.groupTitle,
          description: groupData.groupDescription,
          projectId,
          taskType: 'GROUP',
          isGroupParent: true,
          status: 'TODO',
          priority: 'MEDIUM',
        }),
      })

      if (!parentResponse.ok) {
        throw new Error('Ana görev oluşturulamadı')
      }

      const parentTask = await parentResponse.json()

      // Then create child tasks
      for (let i = 0; i < groupData.tasks.length; i++) {
        const childTask = groupData.tasks[i]
        await fetch('/api/tasks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: childTask.title,
            description: childTask.description,
            projectId,
            assignedId: childTask.assignedId || null,
            priority: childTask.priority,
            estimatedHours: childTask.estimatedHours ? parseInt(childTask.estimatedHours) : null,
            taskType: 'GROUP',
            parentTaskId: parentTask.id,
            groupOrder: childTask.order,
            isGroupParent: false,
            status: 'TODO',
          }),
        })
      }

      // Reload project data
      window.location.reload()
    } catch (err) {
      console.error('Görev grubu oluşturulurken hata:', err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Proje yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Hata</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/projects')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Projelere Dön
          </button>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Proje Bulunamadı</h1>
          <button
            onClick={() => router.push('/projects')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Projelere Dön
          </button>
        </div>
      </div>
    )
  }

  // Calculate project statistics
  const totalTasks = project.tasks.length
  const completedTasks = project.tasks.filter(task => task.status === 'COMPLETED').length
  const inProgressTasks = project.tasks.filter(task => task.status === 'IN_PROGRESS').length
  const todoTasks = project.tasks.filter(task => task.status === 'TODO').length
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
              {project.description && (
                <p className="text-gray-600 mt-2">{project.description}</p>
              )}
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {project.startDate ? new Date(project.startDate).toLocaleDateString('tr-TR') : 'Başlangıç tarihi belirtilmemiş'}
                    {' - '}
                    {project.endDate ? new Date(project.endDate).toLocaleDateString('tr-TR') : 'Bitiş tarihi belirtilmemiş'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-600">{totalTasks} görev</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowTaskModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Yeni Görev
              </button>
              <button
                onClick={() => router.push(`/projects/${projectId}/settings`)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Settings className="w-4 h-4" />
                Ayarlar
              </button>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Proje İlerlemesi</h2>
            <span className="text-2xl font-bold text-blue-600">{progressPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{totalTasks}</div>
              <div className="text-sm text-gray-600">Toplam Görev</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{completedTasks}</div>
              <div className="text-sm text-gray-600">Tamamlanan</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{inProgressTasks}</div>
              <div className="text-sm text-gray-600">Devam Eden</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{todoTasks}</div>
              <div className="text-sm text-gray-600">Bekleyen</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex">
              {[
                { key: 'overview', label: 'Genel Bakış', icon: BarChart3 },
                { key: 'calendar', label: 'Takvim', icon: Calendar },
                { key: 'analytics', label: 'Analitik', icon: BarChart3 },
              ].map(tab => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.key
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                )
              })}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Recent Tasks */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Son Görevler</h3>
                    <div className="space-y-3">
                      {project.tasks.slice(0, 5).map(task => (
                        <div key={task.id} className="p-3 border border-gray-200 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-gray-900">{task.title}</h4>
                              <p className="text-sm text-gray-600">
                                {task.assignedUser?.name || 'Atanmamış'}
                              </p>
                            </div>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              task.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                              task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                              task.status === 'REVIEW' ? 'bg-purple-100 text-purple-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {task.status === 'COMPLETED' ? 'Tamamlandı' :
                               task.status === 'IN_PROGRESS' ? 'Devam Ediyor' :
                               task.status === 'REVIEW' ? 'İncelemede' : 'Bekliyor'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Team Members */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Takım Üyeleri</h3>
                    <div className="space-y-3">
                      {users.map(user => {
                        const userTasks = project.tasks.filter(task => task.assignedId === user.id)
                        const completedUserTasks = userTasks.filter(task => task.status === 'COMPLETED')
                        const userProgress = userTasks.length > 0 ? Math.round((completedUserTasks.length / userTasks.length) * 100) : 0
                        
                        return (
                          <div key={user.id} className="p-3 border border-gray-200 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium text-gray-900">{user.name}</h4>
                                <p className="text-sm text-gray-600">{userTasks.length} görev</p>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-medium text-gray-900">{userProgress}%</div>
                                <div className="w-16 bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-blue-600 h-2 rounded-full"
                                    style={{ width: `${userProgress}%` }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Calendar Tab */}
            {activeTab === 'calendar' && (
              <EnhancedCalendar
                tasks={project.tasks.map(task => ({
                  ...task,
                  description: task.description || undefined,
                  startDate: task.startDate || undefined,
                  endDate: task.endDate || undefined,
                  originalEndDate: task.originalEndDate || undefined,
                  assignedId: task.assignedId || undefined,
                  estimatedHours: task.estimatedHours || undefined,
                  actualHours: task.actualHours || undefined,
                  assignedUser: task.assignedUser ? {
                    id: task.assignedUser.id,
                    name: task.assignedUser.name,
                    maxHoursPerDay: task.assignedUser.maxHoursPerDay || 8
                  } : undefined
                }) as any)}
                project={{
                  id: project.id,
                  name: project.name,
                  startDate: project.startDate || undefined,
                  endDate: project.endDate || undefined,
                  originalEndDate: project.originalEndDate || undefined,
                  delayDays: project.delayDays || 0,
                  autoReschedule: project.autoReschedule || false
                }}
                users={users}
                onTaskUpdate={handleTaskUpdate}
                onProjectReschedule={handleProjectReschedule}
              />
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div className="space-y-6">
                <div className="text-center py-12">
                  <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Analitik Görünümü</h3>
                  <p className="text-gray-600">
                    Detaylı proje analitiği yakında eklenecek
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Task Creation Modal */}
      <TaskCreationModal
        isOpen={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        onCreateTask={handleCreateTask}
        onCreateTaskGroup={handleCreateTaskGroup}
        projectId={projectId}
        users={users}
      />
    </div>
  )
}
