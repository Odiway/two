'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import { WorkloadAnalyzer } from '@/lib/workload-analysis'

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

export default function NewTaskPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const resolvedParams = use(params)
  const [isLoading, setIsLoading] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [project, setProject] = useState<Project | null>(null)
  const [allTasks, setAllTasks] = useState<any[]>([])
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'TODO',
    priority: 'MEDIUM',
    assignedId: '', // Legacy field
    assignedUserIds: [] as string[], // New multiple users field
    workflowStepId: '',
    startDate: '',
    endDate: '',
    estimatedHours: '', // New: Estimated hours for completion
    maxHoursPerDay: '', // New: Maximum hours per day user can work on this task
  })

  // Workload calculation functions
  const calculateUserCurrentWorkload = (userId: string): number => {
    if (!allTasks.length) return 0

    const today = new Date()
    const userTasks = allTasks.filter(
      (task) =>
        task.assignedId === userId &&
        task.status !== 'COMPLETED' &&
        (!task.endDate || new Date(task.endDate) >= today)
    )

    // Calculate daily workload based on active tasks
    let totalDailyHours = 0
    userTasks.forEach((task) => {
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
    return allTasks.filter(
      (task) => task.assignedId === userId && task.status !== 'COMPLETED'
    ).length
  }

  useEffect(() => {
    // Fetch users, project data, and all tasks for workload calculation
    const fetchData = async () => {
      try {
        const [usersResponse, projectResponse, tasksResponse] =
          await Promise.all([
            fetch('/api/users'),
            fetch(`/api/projects/${resolvedParams.id}`),
            fetch('/api/tasks'), // Fetch all tasks for workload calculation
          ])

        if (usersResponse.ok) {
          const usersData = await usersResponse.json()
          setUsers(usersData)
        }

        if (projectResponse.ok) {
          const projectData = await projectResponse.json()
          setProject(projectData)
        }

        if (tasksResponse.ok) {
          const tasksData = await tasksResponse.json()
          setAllTasks(tasksData)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }

    fetchData()
  }, [resolvedParams.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          projectId: resolvedParams.id,
          createdById: users[0]?.id, // For demo purposes, using first user as creator
          assignedUserIds: formData.assignedUserIds, // Send multiple user IDs
          estimatedHours: formData.estimatedHours
            ? parseInt(formData.estimatedHours)
            : null,
          maxHoursPerDay: formData.maxHoursPerDay
            ? parseInt(formData.maxHoursPerDay)
            : 8, // Default to 8 hours
        }),
      })

      if (response.ok) {
        router.push(`/projects/${resolvedParams.id}`)
      } else {
        console.error('Failed to create task')
      }
    } catch (error) {
      console.error('Error creating task:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  if (!project) {
    return (
      <div className='min-h-screen bg-gray-50'>
        <Navbar />
        <div className='max-w-3xl mx-auto py-6 sm:px-6 lg:px-8'>
          <div className='text-center'>Yükleniyor...</div>
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
            <div>
              <h1 className='text-2xl font-bold text-gray-900'>
                Yeni Görev Oluştur
              </h1>
              <p className='text-gray-500 mt-1'>
                {project.name} projesine yeni görev ekleyin
              </p>
            </div>
          </div>

          {/* Form */}
          <div className='bg-white shadow rounded-lg'>
            <form onSubmit={handleSubmit} className='p-6 space-y-6'>
              {/* Task Title */}
              <div>
                <label
                  htmlFor='title'
                  className='block text-sm font-medium text-gray-700'
                >
                  Görev Başlığı *
                </label>
                <input
                  type='text'
                  name='title'
                  id='title'
                  required
                  value={formData.title}
                  onChange={handleChange}
                  className='mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500'
                  placeholder='Görev başlığını girin'
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
                  name='description'
                  id='description'
                  rows={4}
                  value={formData.description}
                  onChange={handleChange}
                  className='mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500'
                  placeholder='Görev açıklamasını girin'
                />
              </div>

              {/* Status and Priority */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div>
                  <label
                    htmlFor='status'
                    className='block text-sm font-medium text-gray-700'
                  >
                    Durum
                  </label>
                  <select
                    name='status'
                    id='status'
                    value={formData.status}
                    onChange={handleChange}
                    className='mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500'
                  >
                    <option value='TODO'>Yapılacak</option>
                    <option value='IN_PROGRESS'>Devam Ediyor</option>
                    <option value='REVIEW'>İnceleme</option>
                    <option value='COMPLETED'>Tamamlandı</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor='priority'
                    className='block text-sm font-medium text-gray-700'
                  >
                    Öncelik
                  </label>
                  <select
                    name='priority'
                    id='priority'
                    value={formData.priority}
                    onChange={handleChange}
                    className='mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500'
                  >
                    <option value='LOW'>Düşük</option>
                    <option value='MEDIUM'>Orta</option>
                    <option value='HIGH'>Yüksek</option>
                    <option value='URGENT'>Acil</option>
                  </select>
                </div>
              </div>

              {/* Assigned Users - Multiple Selection with Workload */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Atanan Kişiler
                </label>
                <div className='border border-gray-300 rounded-md p-3 max-h-60 overflow-y-auto'>
                  <div className='space-y-3'>
                    {users.map((user) => {
                      // Calculate current workload for this user
                      const userWorkload = calculateUserCurrentWorkload(user.id)
                      const maxHours = user.maxHoursPerDay || 8
                      const workloadPercent = (userWorkload / maxHours) * 100

                      return (
                        <div
                          key={user.id}
                          className='border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors'
                        >
                          <label className='flex items-start space-x-3 cursor-pointer'>
                            <input
                              type='checkbox'
                              checked={formData.assignedUserIds.includes(
                                user.id
                              )}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData((prev) => ({
                                    ...prev,
                                    assignedUserIds: [
                                      ...prev.assignedUserIds,
                                      user.id,
                                    ],
                                  }))
                                } else {
                                  setFormData((prev) => ({
                                    ...prev,
                                    assignedUserIds:
                                      prev.assignedUserIds.filter(
                                        (id) => id !== user.id
                                      ),
                                  }))
                                }
                              }}
                              className='mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                            />
                            <div className='flex-1 min-w-0'>
                              <div className='flex items-center justify-between'>
                                <div>
                                  <span className='text-sm font-medium text-gray-900'>
                                    {user.name}
                                  </span>
                                  <span className='text-xs text-gray-500 ml-2'>
                                    {user.position}
                                  </span>
                                </div>
                                <div className='flex items-center space-x-2'>
                                  <span
                                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                                      workloadPercent > 100
                                        ? 'bg-red-100 text-red-700'
                                        : workloadPercent > 80
                                        ? 'bg-orange-100 text-orange-700'
                                        : workloadPercent > 60
                                        ? 'bg-yellow-100 text-yellow-700'
                                        : 'bg-green-100 text-green-700'
                                    }`}
                                  >
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
                                      width: `${Math.min(
                                        workloadPercent,
                                        100
                                      )}%`,
                                      backgroundColor:
                                        workloadPercent > 100
                                          ? '#dc2626'
                                          : workloadPercent > 80
                                          ? '#ea580c'
                                          : workloadPercent > 60
                                          ? '#d97706'
                                          : '#16a34a',
                                    }}
                                  />
                                </div>
                                <div className='flex justify-between text-xs text-gray-500 mt-1'>
                                  <span>Günlük İş Yükü</span>
                                  <span>
                                    {workloadPercent > 100
                                      ? 'Aşırı Yüklü'
                                      : workloadPercent > 80
                                      ? 'Yüksek'
                                      : workloadPercent > 60
                                      ? 'Orta'
                                      : 'Düşük'}
                                  </span>
                                </div>
                              </div>

                              {/* Active Tasks Count */}
                              <div className='mt-2 text-xs text-gray-500'>
                                Aktif görev sayısı:{' '}
                                {getUserActiveTaskCount(user.id)}
                              </div>
                            </div>
                          </label>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Selected users preview */}
                {formData.assignedUserIds.length > 0 && (
                  <div className='mt-2'>
                    <div className='text-xs text-gray-500 mb-1'>
                      Seçilen kişiler ({formData.assignedUserIds.length}):
                    </div>
                    <div className='flex flex-wrap gap-1'>
                      {formData.assignedUserIds.map((userId) => {
                        const user = users.find((u) => u.id === userId)
                        return user ? (
                          <span
                            key={userId}
                            className='inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800'
                          >
                            {user.name}
                            <button
                              type='button'
                              onClick={() => {
                                setFormData((prev) => ({
                                  ...prev,
                                  assignedUserIds: prev.assignedUserIds.filter(
                                    (id) => id !== userId
                                  ),
                                }))
                              }}
                              className='ml-1 text-blue-600 hover:text-blue-800'
                            >
                              ×
                            </button>
                          </span>
                        ) : null
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Workflow Step */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div>
                  <label
                    htmlFor='workflowStepId'
                    className='block text-sm font-medium text-gray-700'
                  >
                    İş Akışı Aşaması
                  </label>
                  <select
                    name='workflowStepId'
                    id='workflowStepId'
                    value={formData.workflowStepId}
                    onChange={handleChange}
                    className='mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500'
                  >
                    <option value=''>Aşama seçin</option>
                    {project.workflowSteps.map((step) => (
                      <option key={step.id} value={step.id}>
                        {step.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dates */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div>
                  <label
                    htmlFor='startDate'
                    className='block text-sm font-medium text-gray-700'
                  >
                    Başlangıç Tarihi
                  </label>
                  <input
                    type='date'
                    name='startDate'
                    id='startDate'
                    value={formData.startDate}
                    onChange={handleChange}
                    className='mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500'
                  />
                </div>

                <div>
                  <label
                    htmlFor='endDate'
                    className='block text-sm font-medium text-gray-700'
                  >
                    Bitiş Tarihi
                  </label>
                  <input
                    type='date'
                    name='endDate'
                    id='endDate'
                    value={formData.endDate}
                    onChange={handleChange}
                    className='mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500'
                  />
                </div>
              </div>

              {/* Hour-based Workload Settings */}
              <div className='bg-blue-50 p-4 rounded-lg border border-blue-200'>
                <h3 className='text-sm font-medium text-blue-900 mb-3'>
                  ⏱️ İş Yükü ve Zaman Ayarları
                </h3>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <label
                      htmlFor='estimatedHours'
                      className='block text-sm font-medium text-gray-700'
                    >
                      Tahmini Süre (Saat)
                    </label>
                    <input
                      type='number'
                      name='estimatedHours'
                      id='estimatedHours'
                      min='1'
                      max='1000'
                      value={formData.estimatedHours}
                      onChange={handleChange}
                      className='mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500'
                      placeholder='örn: 8'
                    />
                    <p className='mt-1 text-xs text-gray-500'>
                      Bu görevin tamamlanması için gereken toplam saat
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
                      name='maxHoursPerDay'
                      id='maxHoursPerDay'
                      min='1'
                      max='24'
                      value={formData.maxHoursPerDay}
                      onChange={handleChange}
                      className='mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500'
                      placeholder='örn: 8'
                    />
                    <p className='mt-1 text-xs text-gray-500'>
                      Atanan kişinin bu göreve günde ayırabileceği maksimum saat
                    </p>
                  </div>
                </div>

                {/* Workload Preview */}
                {formData.estimatedHours &&
                  formData.maxHoursPerDay &&
                  formData.startDate && (
                    <div className='mt-4 p-3 bg-white rounded border border-blue-200'>
                      <h4 className='text-xs font-medium text-gray-700 mb-2'>
                        📊 İş Yükü Önizlemesi:
                      </h4>
                      <div className='grid grid-cols-3 gap-4 text-xs'>
                        <div>
                          <span className='text-gray-500'>Toplam Gün:</span>
                          <div className='font-medium'>
                            {Math.ceil(
                              parseInt(formData.estimatedHours) /
                                parseInt(formData.maxHoursPerDay)
                            )}{' '}
                            gün
                          </div>
                        </div>
                        <div>
                          <span className='text-gray-500'>Günlük Yük:</span>
                          <div className='font-medium'>
                            {(
                              (parseInt(formData.maxHoursPerDay) / 8) *
                              100
                            ).toFixed(0)}
                            %
                          </div>
                        </div>
                        <div>
                          <span className='text-gray-500'>Tahmini Bitiş:</span>
                          <div className='font-medium text-blue-600'>
                            {new Date(
                              new Date(formData.startDate).getTime() +
                                (Math.ceil(
                                  parseInt(formData.estimatedHours) /
                                    parseInt(formData.maxHoursPerDay)
                                ) -
                                  1) *
                                  24 *
                                  60 *
                                  60 *
                                  1000
                            ).toLocaleDateString('tr-TR')}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
              </div>

              {/* Actions */}
              <div className='flex justify-end space-x-3 pt-6 border-t border-gray-200'>
                <Link
                  href={`/projects/${resolvedParams.id}`}
                  className='px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50'
                >
                  İptal
                </Link>
                <button
                  type='submit'
                  disabled={isLoading}
                  className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50'
                >
                  <Save className='w-4 h-4 mr-2' />
                  {isLoading ? 'Oluşturuluyor...' : 'Görev Oluştur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
