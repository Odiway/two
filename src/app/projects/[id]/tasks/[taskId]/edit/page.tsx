'use client'

import { useEffect, useState, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { ArrowLeft, Save, Trash2 } from 'lucide-react'
import Link from 'next/link'

interface User {
  id: string
  name: string
  email: string
  department: string
  position: string
  maxHoursPerDay?: number
}

interface WorkflowStep {
  id: string
  name: string
  color: string
  order: number
}

interface Project {
  id: string
  name: string
  workflowSteps: WorkflowStep[]
}

interface Task {
  id: string
  title: string
  description: string | null
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  startDate: string | null
  endDate: string | null
  assignedUserId: string | null
  workflowStepId: string | null
  estimatedHours: number | null
  actualHours: number | null
  maxHoursPerDay: number | null
  project: Project
  assignedUser: User | null
}

export default function EditTaskPage({
  params,
}: {
  params: Promise<{ id: string; taskId: string }>
}) {
  const router = useRouter()
  const resolvedParams = use(params)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [allTasks, setAllTasks] = useState<any[]>([])
  const [task, setTask] = useState<Task | null>(null)
  const [formData, setFormData] = useState<{
    title: string
    description: string
    status: Task['status']
    priority: Task['priority']
    startDate: string
    endDate: string
    assignedUserId: string
    workflowStepId: string
    estimatedHours: string
    actualHours: string
    maxHoursPerDay: string
  }>({
    title: '',
    description: '',
    status: 'TODO',
    priority: 'MEDIUM',
    startDate: '',
    endDate: '',
    assignedUserId: '',
    workflowStepId: '',
    estimatedHours: '',
    actualHours: '',
    maxHoursPerDay: '',
  })

  // Workload calculation functions
  const calculateUserCurrentWorkload = (userId: string): number => {
    if (!allTasks.length) return 0
    
    const today = new Date()
    const userTasks = allTasks.filter(task => 
      task.assignedUserId === userId && 
      task.id !== resolvedParams.taskId && // Exclude current task being edited
      task.status !== 'COMPLETED' &&
      (!task.endDate || new Date(task.endDate) >= today)
    )
    
    // Calculate daily workload based on active tasks
    let totalDailyHours = 0
    userTasks.forEach(task => {
      if (task.estimatedHours && task.startDate && task.endDate) {
        const startDate = new Date(task.startDate)
        const endDate = new Date(task.endDate)
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        if (diffDays > 0) {
          const maxHours = task.maxHoursPerDay || 8
          totalDailyHours += Math.min(task.estimatedHours / diffDays, maxHours)
        }
      } else if (task.estimatedHours) {
        // If no dates, assume it's spread over 5 days
        const maxHours = task.maxHoursPerDay || 8
        totalDailyHours += Math.min(task.estimatedHours / 5, maxHours)
      }
    })
    
    return totalDailyHours
  }

  const getUserActiveTaskCount = (userId: string): number => {
    return allTasks.filter(task => 
      task.assignedUserId === userId && 
      task.id !== resolvedParams.taskId && // Exclude current task
      task.status !== 'COMPLETED'
    ).length
  }

  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true)
      const [taskResponse, usersResponse, tasksResponse] = await Promise.all([
        fetch(`/api/tasks/${resolvedParams.taskId}`),
        fetch('/api/users'),
        fetch('/api/tasks'), // Fetch all tasks for workload calculation
      ])

      if (taskResponse.ok) {
        const taskData = await taskResponse.json()
        setTask(taskData)
        setFormData({
          title: taskData.title,
          description: taskData.description || '',
          status: taskData.status,
          priority: taskData.priority,
          startDate: taskData.startDate ? taskData.startDate.split('T')[0] : '',
          endDate: taskData.endDate ? taskData.endDate.split('T')[0] : '',
          assignedUserId: taskData.assignedUserId || '',
          workflowStepId: taskData.workflowStepId || '',
          estimatedHours: taskData.estimatedHours?.toString() || '',
          actualHours: taskData.actualHours?.toString() || '',
          maxHoursPerDay: taskData.maxHoursPerDay?.toString() || '8',
        })
      }

      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        setUsers(usersData)
      }

      if (tasksResponse.ok) {
        const tasksData = await tasksResponse.json()
        setAllTasks(tasksData)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }, [resolvedParams.taskId])

  useEffect(() => {
    fetchInitialData()
  }, [fetchInitialData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch(`/api/tasks/${resolvedParams.taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          startDate: formData.startDate
            ? new Date(formData.startDate).toISOString()
            : null,
          endDate: formData.endDate
            ? new Date(formData.endDate).toISOString()
            : null,
          assignedUserId: formData.assignedUserId || null,
          workflowStepId: formData.workflowStepId || null,
          estimatedHours: formData.estimatedHours ? parseInt(formData.estimatedHours) : null,
          actualHours: formData.actualHours ? parseInt(formData.actualHours) : null,
          maxHoursPerDay: formData.maxHoursPerDay ? parseInt(formData.maxHoursPerDay) : 8,
        }),
      })

      if (response.ok) {
        router.push(`/projects/${resolvedParams.id}`)
      } else {
        console.error('Failed to update task')
      }
    } catch (error) {
      console.error('Error updating task:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Bu görevi silmek istediğinizden emin misiniz?')) {
      return
    }

    setDeleting(true)

    try {
      const response = await fetch(`/api/tasks/${resolvedParams.taskId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.push(`/projects/${resolvedParams.id}`)
      } else {
        console.error('Failed to delete task')
      }
    } catch (error) {
      console.error('Error deleting task:', error)
    } finally {
      setDeleting(false)
    }
  }

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

  if (!task) {
    return (
      <div className='min-h-screen bg-gray-50'>
        <Navbar />
        <div className='max-w-7xl mx-auto py-6 sm:px-6 lg:px-8'>
          <div className='px-4 py-6 sm:px-0'>
            <div className='text-center'>
              <div className='text-lg text-gray-600'>Görev bulunamadı</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <Navbar />

      <div className='max-w-3xl mx-auto py-6 sm:px-6 lg:px-8'>
        <div className='px-4 py-6 sm:px-0'>
          {/* Header */}
          <div className='flex items-center mb-6'>
            <Link
              href={`/projects/${resolvedParams.id}`}
              className='mr-4 p-2 text-gray-400 hover:text-gray-600'
            >
              <ArrowLeft className='w-5 h-5' />
            </Link>
            <div className='flex-1'>
              <h1 className='text-2xl font-bold text-gray-900'>
                Görev Düzenle
              </h1>
              <p className='text-gray-500 mt-1'>{task.project.name}</p>
            </div>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className='inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50'
            >
              <Trash2 className='w-4 h-4 mr-2' />
              {deleting ? 'Siliniyor...' : 'Sil'}
            </button>
          </div>

          {/* Form */}
          <div className='bg-white shadow rounded-lg'>
            <form onSubmit={handleSubmit} className='p-6 space-y-6'>
              {/* Title */}
              <div>
                <label
                  htmlFor='title'
                  className='block text-sm font-medium text-gray-700'
                >
                  Görev Başlığı *
                </label>
                <input
                  type='text'
                  id='title'
                  required
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className='mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                />
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor='description'
                  className='block text-sm font-medium text-gray-700'
                >
                  Açıklama
                </label>
                <textarea
                  id='description'
                  rows={4}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className='mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                />
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                {/* Status */}
                <div>
                  <label
                    htmlFor='status'
                    className='block text-sm font-medium text-gray-700'
                  >
                    Durum
                  </label>
                  <select
                    id='status'
                    value={formData.status}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        status: e.target.value as Task['status'],
                      }))
                    }
                    className='mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                  >
                    <option value='TODO'>Yapılacak</option>
                    <option value='IN_PROGRESS'>Devam Ediyor</option>
                    <option value='REVIEW'>İncelemede</option>
                    <option value='COMPLETED'>Tamamlandı</option>
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label
                    htmlFor='priority'
                    className='block text-sm font-medium text-gray-700'
                  >
                    Öncelik
                  </label>
                  <select
                    id='priority'
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        priority: e.target.value as Task['priority'],
                      }))
                    }
                    className='mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                  >
                    <option value='LOW'>Düşük</option>
                    <option value='MEDIUM'>Orta</option>
                    <option value='HIGH'>Yüksek</option>
                  </select>
                </div>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                {/* Start Date */}
                <div>
                  <label
                    htmlFor='startDate'
                    className='block text-sm font-medium text-gray-700'
                  >
                    Başlangıç Tarihi
                  </label>
                  <input
                    type='date'
                    id='startDate'
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        startDate: e.target.value,
                      }))
                    }
                    className='mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                  />
                </div>

                {/* End Date */}
                <div>
                  <label
                    htmlFor='endDate'
                    className='block text-sm font-medium text-gray-700'
                  >
                    Bitiş Tarihi
                  </label>
                  <input
                    type='date'
                    id='endDate'
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        endDate: e.target.value,
                      }))
                    }
                    className='mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                  />
                </div>
              </div>

              {/* Hour-based Workload Settings */}
              <div className='bg-blue-50 p-4 rounded-lg border border-blue-200'>
                <h3 className='text-sm font-medium text-blue-900 mb-3'>
                  ⏱️ İş Yükü ve Zaman Takibi
                </h3>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                  <div>
                    <label
                      htmlFor='estimatedHours'
                      className='block text-sm font-medium text-gray-700'
                    >
                      Tahmini Süre (Saat)
                    </label>
                    <input
                      type='number'
                      id='estimatedHours'
                      min='1'
                      max='1000'
                      value={formData.estimatedHours}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          estimatedHours: e.target.value,
                        }))
                      }
                      className='mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500'
                      placeholder='örn: 8'
                    />
                    <p className='mt-1 text-xs text-gray-500'>
                      Tamamlanması için gereken toplam saat
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor='actualHours'
                      className='block text-sm font-medium text-gray-700'
                    >
                      Harcanan Süre (Saat)
                    </label>
                    <input
                      type='number'
                      id='actualHours'
                      min='0'
                      max='1000'
                      value={formData.actualHours}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          actualHours: e.target.value,
                        }))
                      }
                      className='mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500'
                      placeholder='örn: 4'
                    />
                    <p className='mt-1 text-xs text-gray-500'>
                      Şu ana kadar harcanan gerçek saat
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor='maxHoursPerDay'
                      className='block text-sm font-medium text-gray-700'
                    >
                      Günlük Maksimum Saat
                    </label>
                    <input
                      type='number'
                      id='maxHoursPerDay'
                      min='1'
                      max='24'
                      value={formData.maxHoursPerDay}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          maxHoursPerDay: e.target.value,
                        }))
                      }
                      className='mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500'
                      placeholder='örn: 8'
                    />
                    <p className='mt-1 text-xs text-gray-500'>
                      Günde ayırılabilecek maksimum saat
                    </p>
                  </div>
                </div>

                {/* Progress and Analytics */}
                {formData.estimatedHours && formData.actualHours && (
                  <div className='mt-4 p-3 bg-white rounded border border-blue-200'>
                    <h4 className='text-xs font-medium text-gray-700 mb-2'>📊 İlerleme Analizi:</h4>
                    <div className='grid grid-cols-4 gap-4 text-xs'>
                      <div>
                        <span className='text-gray-500'>Tamamlanma:</span>
                        <div className='font-medium text-green-600'>
                          {((parseInt(formData.actualHours) / parseInt(formData.estimatedHours)) * 100).toFixed(1)}%
                        </div>
                      </div>
                      <div>
                        <span className='text-gray-500'>Kalan Saat:</span>
                        <div className='font-medium'>
                          {Math.max(0, parseInt(formData.estimatedHours) - parseInt(formData.actualHours))} saat
                        </div>
                      </div>
                      <div>
                        <span className='text-gray-500'>Durum:</span>
                        <div className={`font-medium ${
                          parseInt(formData.actualHours) <= parseInt(formData.estimatedHours) 
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }`}>
                          {parseInt(formData.actualHours) <= parseInt(formData.estimatedHours) 
                            ? 'Hedefte' 
                            : `+${parseInt(formData.actualHours) - parseInt(formData.estimatedHours)}h Aşım`}
                        </div>
                      </div>
                      <div>
                        <span className='text-gray-500'>Verimlilik:</span>
                        <div className={`font-medium ${
                          parseInt(formData.actualHours) <= parseInt(formData.estimatedHours) 
                            ? 'text-green-600' 
                            : 'text-orange-600'
                        }`}>
                          {parseInt(formData.actualHours) > 0 
                            ? (parseInt(formData.estimatedHours) / parseInt(formData.actualHours) * 100).toFixed(0) + '%'
                            : 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                {/* Assigned User with Workload */}
                <div>
                  <label
                    htmlFor='assignedUserId'
                    className='block text-sm font-medium text-gray-700 mb-2'
                  >
                    Atanan Kişi
                  </label>
                  <div className='space-y-3'>
                    {users?.map((user) => {
                      // Calculate current workload for this user
                      const userWorkload = calculateUserCurrentWorkload(user.id)
                      const maxHours = user.maxHoursPerDay || 8
                      const workloadPercent = (userWorkload / maxHours) * 100
                      const isSelected = formData.assignedUserId === user.id
                      
                      return (
                        <div 
                          key={user.id} 
                          className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                            isSelected 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'border-gray-200 hover:bg-gray-50'
                          }`}
                          onClick={() => setFormData(prev => ({ ...prev, assignedUserId: user.id }))}
                        >
                          <div className='flex items-start space-x-3'>
                            <input
                              type='radio'
                              name='assignedUserId'
                              value={user.id}
                              checked={isSelected}
                              onChange={() => setFormData(prev => ({ ...prev, assignedUserId: user.id }))}
                              className='mt-1 text-blue-600 focus:ring-blue-500'
                            />
                            <div className='flex-1 min-w-0'>
                              <div className='flex items-center justify-between'>
                                <div>
                                  <span className='text-sm font-medium text-gray-900'>
                                    {user.name}
                                  </span>
                                  <span className='text-xs text-gray-500 ml-2'>
                                    {user.department}
                                  </span>
                                </div>
                                <div className='flex items-center space-x-2'>
                                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                    workloadPercent > 100 ? 'bg-red-100 text-red-700' :
                                    workloadPercent > 80 ? 'bg-orange-100 text-orange-700' :
                                    workloadPercent > 60 ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-green-100 text-green-700'
                                  }`}>
                                    {workloadPercent.toFixed(0)}%
                                  </span>
                                  <span className='text-xs text-gray-500'>
                                    {userWorkload.toFixed(1)}/{maxHours}h
                                  </span>
                                </div>
                              </div>
                              
                              {/* Workload Progress Bar */}
                              <div className='mt-2'>
                                <div className='w-full bg-gray-200 rounded-full h-2'>
                                  <div
                                    className='h-2 rounded-full transition-all'
                                    style={{
                                      width: `${Math.min(workloadPercent, 100)}%`,
                                      backgroundColor: workloadPercent > 100 ? '#dc2626' : 
                                                     workloadPercent > 80 ? '#ea580c' :
                                                     workloadPercent > 60 ? '#d97706' : '#16a34a'
                                    }}
                                  />
                                </div>
                                <div className='flex justify-between text-xs text-gray-500 mt-1'>
                                  <span>Günlük İş Yükü</span>
                                  <span>
                                    {workloadPercent > 100 ? 'Aşırı Yüklü' :
                                     workloadPercent > 80 ? 'Yüksek' :
                                     workloadPercent > 60 ? 'Orta' : 'Düşük'}
                                  </span>
                                </div>
                              </div>
                              
                              {/* Active Tasks Count */}
                              <div className='mt-2 text-xs text-gray-500'>
                                Aktif görev sayısı: {getUserActiveTaskCount(user.id)}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    <div 
                      className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                        formData.assignedUserId === '' 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={() => setFormData(prev => ({ ...prev, assignedUserId: '' }))}
                    >
                      <div className='flex items-center space-x-3'>
                        <input
                          type='radio'
                          name='assignedUserId'
                          value=''
                          checked={formData.assignedUserId === ''}
                          onChange={() => setFormData(prev => ({ ...prev, assignedUserId: '' }))}
                          className='text-blue-600 focus:ring-blue-500'
                        />
                        <span className='text-sm text-gray-700'>Atanmamış</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Workflow Step */}
                <div>
                  <label
                    htmlFor='workflowStepId'
                    className='block text-sm font-medium text-gray-700'
                  >
                    İş Akışı Adımı
                  </label>
                  <select
                    id='workflowStepId'
                    value={formData.workflowStepId}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        workflowStepId: e.target.value,
                      }))
                    }
                    className='mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                  >
                    <option value=''>Seçiniz</option>
                    {task?.project?.workflowSteps?.map((step) => (
                      <option key={step.id} value={step.id}>
                        {step.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Submit Button */}
              <div className='flex justify-end'>
                <button
                  type='submit'
                  disabled={saving}
                  className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50'
                >
                  <Save className='w-4 h-4 mr-2' />
                  {saving ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
