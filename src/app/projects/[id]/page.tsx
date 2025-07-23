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
  Edit,
  Trash2,
  Save,
  X,
  CheckCircle,
  Circle,
  AlertCircle,
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
  const [activeTab, setActiveTab] = useState<
    'overview' | 'calendar' | 'analytics'
  >('overview')
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [editingTask, setEditingTask] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<any>({})
  const [draggedTask, setDraggedTask] = useState<string | null>(null)
  const [savingTask, setSavingTask] = useState<string | null>(null)

  // Task management handlers
  const handleTaskEdit = (taskId: string) => {
    const task = project?.tasks.find(t => t.id === taskId)
    if (task) {
      setEditingTask(taskId)
      setEditForm({
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        estimatedHours: task.estimatedHours || 0,
        assignedToId: task.assignedId || ''
      })
    }
  }

  const handleTaskSave = async (taskId: string) => {
    try {
      // Validate required fields
      if (!editForm.title?.trim()) {
        alert('Görev başlığı boş olamaz')
        return
      }

      setSavingTask(taskId)
      
      // Map form fields to API fields
      const updateData = {
        title: editForm.title.trim(),
        description: editForm.description?.trim() || '',
        status: editForm.status,
        priority: editForm.priority,
        estimatedHours: editForm.estimatedHours,
        assignedId: editForm.assignedToId || null
      }

      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })
      
      if (response.ok) {
        await fetchProject()
        setEditingTask(null)
        setEditForm({})
      } else {
        const errorData = await response.json()
        console.error('Task update failed:', errorData)
        alert('Görev güncellenemedi: ' + (errorData.error || 'Bilinmeyen hata'))
      }
    } catch (error) {
      console.error('Error updating task:', error)
      alert('Görev güncellenirken bir hata oluştu')
    } finally {
      setSavingTask(null)
    }
  }

  const handleTaskStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      
      if (response.ok) {
        await fetchProject()
        // Show brief success feedback
        const taskTitle = project?.tasks.find(t => t.id === taskId)?.title || 'Görev'
        console.log(`✅ ${taskTitle} durumu güncellendi: ${newStatus}`)
      } else {
        const errorData = await response.json()
        console.error('Status update failed:', errorData)
        alert('Görev durumu güncellenemedi')
      }
    } catch (error) {
      console.error('Error updating task status:', error)
      alert('Görev durumu güncellenirken bir hata oluştu')
    }
  }

  const handleTaskDelete = async (taskId: string) => {
    if (confirm('Bu görevi silmek istediğinizden emin misiniz?')) {
      try {
        const response = await fetch(`/api/tasks/${taskId}`, {
          method: 'DELETE'
        })
        
        if (response.ok) {
          await fetchProject()
        }
      } catch (error) {
        console.error('Error deleting task:', error)
      }
    }
  }

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTask(taskId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault()
    if (draggedTask) {
      handleTaskStatusChange(draggedTask, newStatus)
      setDraggedTask(null)
    }
  }

  // Fetch project data
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

  useEffect(() => {
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
          // Remove duplicates based on user ID
          const uniqueUsers = data.filter((user: any, index: number, self: any[]) => 
            index === self.findIndex((u) => u.id === user.id)
          )
          setUsers(uniqueUsers)
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
          startDate: taskData.startDate
            ? new Date(taskData.startDate).toISOString()
            : null,
          endDate: taskData.endDate
            ? new Date(taskData.endDate).toISOString()
            : null,
          estimatedHours: taskData.estimatedHours
            ? parseInt(taskData.estimatedHours)
            : null,
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
          status: 'TODO',
          priority: 'MEDIUM',
          createdById: null, // Add this required field
        }),
      })

      if (!parentResponse.ok) {
        const errorText = await parentResponse.text()
        console.error('Parent task creation failed:', errorText)
        throw new Error(`Ana görev oluşturulamadı: ${errorText}`)
      }

      const parentTask = await parentResponse.json()

      // Then create child tasks
      for (let i = 0; i < groupData.tasks.length; i++) {
        const childTask = groupData.tasks[i]
        const childResponse = await fetch('/api/tasks', {
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
            estimatedHours: childTask.estimatedHours
              ? parseInt(childTask.estimatedHours)
              : null,
            status: 'TODO',
            createdById: null,
          }),
        })

        if (!childResponse.ok) {
          const childErrorText = await childResponse.text()
          console.error(`Child task ${i + 1} creation failed:`, childErrorText)
        }
      }

      // Reload project data
      window.location.reload()
    } catch (err) {
      console.error('Görev grubu oluşturulurken hata:', err)
    }
  }

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto'></div>
          <p className='mt-4 text-gray-600'>Proje yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <AlertTriangle className='w-16 h-16 text-red-500 mx-auto mb-4' />
          <h1 className='text-2xl font-bold text-gray-900 mb-2'>Hata</h1>
          <p className='text-gray-600 mb-4'>{error}</p>
          <button
            onClick={() => router.push('/projects')}
            className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
          >
            Projelere Dön
          </button>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold text-gray-900 mb-2'>
            Proje Bulunamadı
          </h1>
          <button
            onClick={() => router.push('/projects')}
            className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
          >
            Projelere Dön
          </button>
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
  const todoTasks = project.tasks.filter(
    (task) => task.status === 'TODO'
  ).length
  const blockedTasks = project.tasks.filter(
    (task) => task.status === 'BLOCKED'
  ).length
  const progressPercentage =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  // Task Card Component
  function TaskCard({ task }: { task: ExtendedTask }) {
    const isEditing = editingTask === task.id

    return (
      <div
        className={`p-4 bg-white border rounded-lg cursor-move transition-all hover:shadow-md ${
          draggedTask === task.id ? 'opacity-50' : ''
        }`}
        draggable
        onDragStart={(e) => handleDragStart(e, task.id)}
      >
        {isEditing ? (
          <div className="space-y-3">
            <input
              type="text"
              value={editForm.title}
              onChange={(e) => setEditForm({...editForm, title: e.target.value})}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.shiftKey === false) {
                  e.preventDefault()
                  handleTaskSave(task.id)
                } else if (e.key === 'Escape') {
                  setEditingTask(null)
                  setEditForm({})
                }
              }}
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Görev başlığı"
              autoFocus
            />
            <textarea
              value={editForm.description}
              onChange={(e) => setEditForm({...editForm, description: e.target.value})}
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Açıklama"
              rows={2}
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                value={editForm.priority}
                onChange={(e) => setEditForm({...editForm, priority: e.target.value})}
                className="p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="LOW">Düşük</option>
                <option value="MEDIUM">Orta</option>
                <option value="HIGH">Yüksek</option>
                <option value="URGENT">Acil</option>
              </select>
              <input
                type="number"
                value={editForm.estimatedHours}
                onChange={(e) => setEditForm({...editForm, estimatedHours: parseInt(e.target.value) || 0})}
                className="p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Saat"
                min="0"
              />
            </div>
            <select
              value={editForm.assignedToId}
              onChange={(e) => setEditForm({...editForm, assignedToId: e.target.value})}
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Atanmamış</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
            <div className="flex space-x-2">
              <button
                onClick={() => handleTaskSave(task.id)}
                disabled={savingTask === task.id}
                className="flex-1 bg-green-600 text-white p-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {savingTask === task.id ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                    Kaydediliyor...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-1" />
                    Kaydet
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setEditingTask(null)
                  setEditForm({})
                }}
                disabled={savingTask === task.id}
                className="flex-1 bg-gray-600 text-white p-2 rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                <X className="w-4 h-4 mr-1" />
                İptal
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-medium text-gray-900 flex items-center">
                {task.status === 'COMPLETED' ? <CheckCircle className="w-4 h-4 text-green-600 mr-2" /> :
                 task.status === 'IN_PROGRESS' ? <AlertCircle className="w-4 h-4 text-blue-600 mr-2" /> :
                 <Circle className="w-4 h-4 text-gray-400 mr-2" />}
                <span className="text-sm">{task.title}</span>
              </h4>
              <div className="flex space-x-1">
                <button
                  onClick={() => handleTaskEdit(task.id)}
                  className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleTaskDelete(task.id)}
                  className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {task.description && (
              <p className="text-xs text-gray-600 mb-2">{task.description}</p>
            )}
            
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                task.priority === 'URGENT' ? 'bg-red-100 text-red-700' :
                task.priority === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                task.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                'bg-green-100 text-green-700'
              }`}>
                {task.priority === 'URGENT' ? 'Acil' :
                 task.priority === 'HIGH' ? 'Yüksek' :
                 task.priority === 'MEDIUM' ? 'Orta' : 'Düşük'}
              </span>
              <div className="flex items-center space-x-2">
                {task.estimatedHours && (
                  <span className="flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {task.estimatedHours}h
                  </span>
                )}
                {task.assignedUser && (
                  <span className="text-blue-600 font-medium">{task.assignedUser.name}</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-7xl mx-auto px-4 py-8'>
        {/* Header */}
        <div className='bg-white rounded-lg shadow-sm p-6 mb-6'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-3xl font-bold text-gray-900'>
                {project.name}
              </h1>
              {project.description && (
                <p className='text-gray-600 mt-2'>{project.description}</p>
              )}
              <div className='flex items-center gap-4 mt-4'>
                <div className='flex items-center gap-2'>
                  <Clock className='w-5 h-5 text-gray-400' />
                  <span className='text-sm text-gray-600'>
                    {project.startDate
                      ? new Date(project.startDate).toLocaleDateString('tr-TR')
                      : 'Başlangıç tarihi belirtilmemiş'}
                    {' - '}
                    {project.endDate
                      ? new Date(project.endDate).toLocaleDateString('tr-TR')
                      : 'Bitiş tarihi belirtilmemiş'}
                  </span>
                </div>
                <div className='flex items-center gap-2'>
                  <Users className='w-5 h-5 text-gray-400' />
                  <span className='text-sm text-gray-600'>
                    {totalTasks} görev
                  </span>
                </div>
              </div>
            </div>
            <div className='flex items-center gap-3'>
              <button
                onClick={() => setShowTaskModal(true)}
                className='flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
              >
                <Plus className='w-4 h-4' />
                Yeni Görev
              </button>
              <button
                onClick={() => router.push(`/projects/${projectId}/settings`)}
                className='flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors'
              >
                <Settings className='w-4 h-4' />
                Ayarlar
              </button>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className='bg-white rounded-lg shadow-sm p-6 mb-6'>
          <div className='flex items-center justify-between mb-4'>
            <h2 className='text-lg font-semibold text-gray-900'>
              Proje İlerlemesi
            </h2>
            <span className='text-2xl font-bold text-blue-600'>
              {progressPercentage}%
            </span>
          </div>
          <div className='w-full bg-gray-200 rounded-full h-3 mb-4'>
            <div
              className='bg-blue-600 h-3 rounded-full transition-all duration-300'
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <div className='grid grid-cols-5 gap-4'>
            <div className='text-center'>
              <div className='text-2xl font-bold text-gray-900'>
                {totalTasks}
              </div>
              <div className='text-sm text-gray-600'>Toplam Görev</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-green-600'>
                {completedTasks}
              </div>
              <div className='text-sm text-gray-600'>Tamamlanan</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-blue-600'>
                {inProgressTasks}
              </div>
              <div className='text-sm text-gray-600'>Devam Eden</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-red-600'>
                {blockedTasks}
              </div>
              <div className='text-sm text-gray-600'>Engellenen</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-gray-600'>
                {todoTasks}
              </div>
              <div className='text-sm text-gray-600'>Bekleyen</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className='bg-white rounded-lg shadow-sm mb-6'>
          <div className='border-b border-gray-200'>
            <nav className='flex'>
              {[
                { key: 'overview', label: 'Genel Bakış', icon: BarChart3 },
                { key: 'calendar', label: 'Takvim', icon: Calendar },
                { key: 'analytics', label: 'Analitik', icon: BarChart3 },
              ].map((tab) => {
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
                    <Icon className='w-4 h-4' />
                    {tab.label}
                  </button>
                )
              })}
            </nav>
          </div>

          <div className='p-6'>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className='space-y-6'>
                {/* Interactive Kanban Board */}
                <div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
                  {/* TODO Column */}
                  <div 
                    className={`bg-gray-50 rounded-lg p-4 transition-all ${
                      draggedTask && 'ring-2 ring-blue-300 bg-blue-50'
                    }`}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, 'TODO')}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900 flex items-center">
                        <Circle className="w-5 h-5 mr-2 text-gray-400" />
                        Yapılacak ({project.tasks.filter(t => t.status === 'TODO').length})
                      </h3>
                    </div>
                    <div className="space-y-3 min-h-[400px]">
                      {project.tasks.filter(t => t.status === 'TODO').map((task) => (
                        <TaskCard key={task.id} task={task} />
                      ))}
                      {project.tasks.filter(t => t.status === 'TODO').length === 0 && (
                        <p className="text-gray-500 text-center py-8">Henüz yapılacak görev yok</p>
                      )}
                    </div>
                  </div>

                  {/* IN_PROGRESS Column */}
                  <div 
                    className={`bg-blue-50 rounded-lg p-4 transition-all ${
                      draggedTask && 'ring-2 ring-blue-300 bg-blue-100'
                    }`}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, 'IN_PROGRESS')}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900 flex items-center">
                        <AlertCircle className="w-5 h-5 mr-2 text-blue-600" />
                        Devam Eden ({project.tasks.filter(t => t.status === 'IN_PROGRESS').length})
                      </h3>
                    </div>
                    <div className="space-y-3 min-h-[400px]">
                      {project.tasks.filter(t => t.status === 'IN_PROGRESS').map((task) => (
                        <TaskCard key={task.id} task={task} />
                      ))}
                      {project.tasks.filter(t => t.status === 'IN_PROGRESS').length === 0 && (
                        <p className="text-gray-500 text-center py-8">Devam eden görev yok</p>
                      )}
                    </div>
                  </div>

                  {/* BLOCKED Column */}
                  <div 
                    className={`bg-red-50 rounded-lg p-4 transition-all ${
                      draggedTask && 'ring-2 ring-blue-300 bg-red-100'
                    }`}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, 'BLOCKED')}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900 flex items-center">
                        <X className="w-5 h-5 mr-2 text-red-600" />
                        Engellenen ({project.tasks.filter(t => t.status === 'BLOCKED').length})
                      </h3>
                    </div>
                    <div className="space-y-3 min-h-[400px]">
                      {project.tasks.filter(t => t.status === 'BLOCKED').map((task) => (
                        <TaskCard key={task.id} task={task} />
                      ))}
                      {project.tasks.filter(t => t.status === 'BLOCKED').length === 0 && (
                        <p className="text-gray-500 text-center py-8">Engellenen görev yok</p>
                      )}
                    </div>
                  </div>

                  {/* COMPLETED Column */}
                  <div 
                    className={`bg-green-50 rounded-lg p-4 transition-all ${
                      draggedTask && 'ring-2 ring-blue-300 bg-green-100'
                    }`}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, 'COMPLETED')}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900 flex items-center">
                        <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                        Tamamlanan ({project.tasks.filter(t => t.status === 'COMPLETED').length})
                      </h3>
                    </div>
                    <div className="space-y-3 min-h-[400px]">
                      {project.tasks.filter(t => t.status === 'COMPLETED').map((task) => (
                        <TaskCard key={task.id} task={task} />
                      ))}
                      {project.tasks.filter(t => t.status === 'COMPLETED').length === 0 && (
                        <p className="text-gray-500 text-center py-8">Tamamlanan görev yok</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Calendar Tab */}
            {activeTab === 'calendar' && (
              <EnhancedCalendar
                tasks={project.tasks.map(
                  (task) =>
                    ({
                      ...task,
                      description: task.description || undefined,
                      startDate: task.startDate || undefined,
                      endDate: task.endDate || undefined,
                      originalEndDate: task.originalEndDate || undefined,
                      assignedId: task.assignedId || undefined,
                      estimatedHours: task.estimatedHours || undefined,
                      actualHours: task.actualHours || undefined,
                      assignedUser: task.assignedUser
                        ? {
                            id: task.assignedUser.id,
                            name: task.assignedUser.name,
                            maxHoursPerDay:
                              task.assignedUser.maxHoursPerDay || 8,
                          }
                        : undefined,
                    } as any)
                )}
                project={{
                  id: project.id,
                  name: project.name,
                  startDate: project.startDate || undefined,
                  endDate: project.endDate || undefined,
                  originalEndDate: project.originalEndDate || undefined,
                  delayDays: project.delayDays || 0,
                  autoReschedule: project.autoReschedule || false,
                }}
                users={users}
                onTaskUpdate={handleTaskUpdate}
                onProjectReschedule={handleProjectReschedule}
              />
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div className='space-y-6'>
                {/* Project Overview Stats */}
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
                  <div className='bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white'>
                    <h3 className='text-sm font-medium opacity-90'>Tamamlanma Oranı</h3>
                    <p className='text-2xl font-bold'>{progressPercentage}%</p>
                    <p className='text-xs opacity-75'>{completedTasks}/{totalTasks} görev</p>
                  </div>
                  <div className='bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white'>
                    <h3 className='text-sm font-medium opacity-90'>Aktif Görevler</h3>
                    <p className='text-2xl font-bold'>{inProgressTasks}</p>
                    <p className='text-xs opacity-75'>Devam eden işler</p>
                  </div>
                  <div className='bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 text-white'>
                    <h3 className='text-sm font-medium opacity-90'>Bekleyen Görevler</h3>
                    <p className='text-2xl font-bold'>{todoTasks}</p>
                    <p className='text-xs opacity-75'>Başlanmamış işler</p>
                  </div>
                  <div className='bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white'>
                    <h3 className='text-sm font-medium opacity-90'>Toplam Süre</h3>
                    <p className='text-2xl font-bold'>
                      {project.tasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0)}h
                    </p>
                    <p className='text-xs opacity-75'>Tahmini toplam</p>
                  </div>
                </div>

                {/* Task Status Distribution */}
                <div className='bg-white rounded-lg border border-gray-200 p-6'>
                  <h3 className='text-lg font-semibold text-gray-900 mb-4'>Görev Durum Dağılımı</h3>
                  <div className='space-y-3'>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-3'>
                        <div className='w-4 h-4 bg-green-500 rounded'></div>
                        <span className='text-sm text-gray-700'>Tamamlanan</span>
                      </div>
                      <div className='flex items-center gap-2'>
                        <div className='w-32 bg-gray-200 rounded-full h-2'>
                          <div
                            className='bg-green-500 h-2 rounded-full'
                            style={{ width: `${totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}%` }}
                          ></div>
                        </div>
                        <span className='text-sm font-medium text-gray-900 w-12'>{completedTasks}</span>
                      </div>
                    </div>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-3'>
                        <div className='w-4 h-4 bg-blue-500 rounded'></div>
                        <span className='text-sm text-gray-700'>Devam Eden</span>
                      </div>
                      <div className='flex items-center gap-2'>
                        <div className='w-32 bg-gray-200 rounded-full h-2'>
                          <div
                            className='bg-blue-500 h-2 rounded-full'
                            style={{ width: `${totalTasks > 0 ? (inProgressTasks / totalTasks) * 100 : 0}%` }}
                          ></div>
                        </div>
                        <span className='text-sm font-medium text-gray-900 w-12'>{inProgressTasks}</span>
                      </div>
                    </div>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-3'>
                        <div className='w-4 h-4 bg-orange-500 rounded'></div>
                        <span className='text-sm text-gray-700'>Bekleyen</span>
                      </div>
                      <div className='flex items-center gap-2'>
                        <div className='w-32 bg-gray-200 rounded-full h-2'>
                          <div
                            className='bg-orange-500 h-2 rounded-full'
                            style={{ width: `${totalTasks > 0 ? (todoTasks / totalTasks) * 100 : 0}%` }}
                          ></div>
                        </div>
                        <span className='text-sm font-medium text-gray-900 w-12'>{todoTasks}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Team Performance */}
                <div className='bg-white rounded-lg border border-gray-200 p-6'>
                  <h3 className='text-lg font-semibold text-gray-900 mb-4'>Takım Performansı</h3>
                  <div className='space-y-4'>
                    {users.map(user => {
                      const userTasks = project.tasks.filter(task => task.assignedId === user.id)
                      const completedUserTasks = userTasks.filter(task => task.status === 'COMPLETED')
                      const userProgress = userTasks.length > 0 ? Math.round((completedUserTasks.length / userTasks.length) * 100) : 0
                      const userHours = userTasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0)
                      
                      return userTasks.length > 0 && (
                        <div key={user.id} className='p-4 border border-gray-100 rounded-lg'>
                          <div className='flex items-center justify-between mb-2'>
                            <h4 className='font-medium text-gray-900'>{user.name}</h4>
                            <span className='text-sm text-gray-500'>{userTasks.length} görev</span>
                          </div>
                          <div className='grid grid-cols-3 gap-4 text-sm'>
                            <div>
                              <span className='text-gray-500'>İlerleme:</span>
                              <div className='flex items-center gap-2 mt-1'>
                                <div className='flex-1 bg-gray-200 rounded-full h-2'>
                                  <div
                                    className='bg-blue-600 h-2 rounded-full'
                                    style={{ width: `${userProgress}%` }}
                                  ></div>
                                </div>
                                <span className='font-medium text-gray-900'>{userProgress}%</span>
                              </div>
                            </div>
                            <div>
                              <span className='text-gray-500'>Toplam Süre:</span>
                              <p className='font-medium text-gray-900 mt-1'>{userHours}h</p>
                            </div>
                            <div>
                              <span className='text-gray-500'>Tamamlanan:</span>
                              <p className='font-medium text-gray-900 mt-1'>{completedUserTasks.length}/{userTasks.length}</p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Project Timeline */}
                <div className='bg-white rounded-lg border border-gray-200 p-6'>
                  <h3 className='text-lg font-semibold text-gray-900 mb-4'>Proje Zaman Çizelgesi</h3>
                  <div className='space-y-3'>
                    <div className='flex items-center justify-between text-sm'>
                      <span className='text-gray-500'>Başlangıç Tarihi:</span>
                      <span className='font-medium text-gray-900'>
                        {project.startDate ? new Date(project.startDate).toLocaleDateString('tr-TR') : 'Belirtilmemiş'}
                      </span>
                    </div>
                    <div className='flex items-center justify-between text-sm'>
                      <span className='text-gray-500'>Bitiş Tarihi:</span>
                      <span className='font-medium text-gray-900'>
                        {project.endDate ? new Date(project.endDate).toLocaleDateString('tr-TR') : 'Belirtilmemiş'}
                      </span>
                    </div>
                    {project.startDate && project.endDate && (
                      <>
                        <div className='flex items-center justify-between text-sm'>
                          <span className='text-gray-500'>Toplam Süre:</span>
                          <span className='font-medium text-gray-900'>
                            {Math.ceil((new Date(project.endDate).getTime() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24))} gün
                          </span>
                        </div>
                        <div className='flex items-center justify-between text-sm'>
                          <span className='text-gray-500'>Kalan Süre:</span>
                          <span className='font-medium text-gray-900'>
                            {Math.max(0, Math.ceil((new Date(project.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))} gün
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Priority Distribution */}
                <div className='bg-white rounded-lg border border-gray-200 p-6'>
                  <h3 className='text-lg font-semibold text-gray-900 mb-4'>Öncelik Dağılımı</h3>
                  <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                    {['URGENT', 'HIGH', 'MEDIUM', 'LOW'].map(priority => {
                      const priorityTasks = project.tasks.filter(task => task.priority === priority)
                      const priorityCount = priorityTasks.length
                      const priorityPercent = totalTasks > 0 ? Math.round((priorityCount / totalTasks) * 100) : 0
                      
                      return (
                        <div key={priority} className='text-center p-3 border border-gray-100 rounded-lg'>
                          <div className={`w-8 h-8 mx-auto mb-2 rounded-full flex items-center justify-center ${
                            priority === 'URGENT' ? 'bg-red-100 text-red-600' :
                            priority === 'HIGH' ? 'bg-orange-100 text-orange-600' :
                            priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-600' :
                            'bg-green-100 text-green-600'
                          }`}>
                            {priority === 'URGENT' ? '🔥' :
                             priority === 'HIGH' ? '🔴' :
                             priority === 'MEDIUM' ? '🟡' : '🟢'}
                          </div>
                          <h4 className='font-medium text-gray-900 text-sm'>
                            {priority === 'URGENT' ? 'Acil' :
                             priority === 'HIGH' ? 'Yüksek' :
                             priority === 'MEDIUM' ? 'Orta' : 'Düşük'}
                          </h4>
                          <p className='text-2xl font-bold text-gray-900'>{priorityCount}</p>
                          <p className='text-xs text-gray-500'>{priorityPercent}%</p>
                        </div>
                      )
                    })}
                  </div>
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
