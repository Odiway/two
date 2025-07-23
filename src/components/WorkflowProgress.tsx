'use client'

import { useState } from 'react'
import { Check, ChevronRight, Clock, AlertCircle } from 'lucide-react'

interface WorkflowStep {
  id: string
  name: string
  color: string
  order: number
}

interface Task {
  id: string
  title: string
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  workflowStepId: string | null
}

interface WorkflowProgressProps {
  workflowSteps: WorkflowStep[]
  tasks: Task[]
  projectId: string
  onStepComplete: (stepId: string) => void
}

export default function WorkflowProgress({
  workflowSteps,
  tasks,
  projectId,
  onStepComplete,
}: WorkflowProgressProps) {
  const [completingStep, setCompletingStep] = useState<string | null>(null)

  // Her adım için görev istatistikleri hesapla
  const getStepStats = (stepId: string) => {
    const stepTasks = tasks.filter((task) => task.workflowStepId === stepId)
    const completedTasks = stepTasks.filter(
      (task) => task.status === 'COMPLETED'
    )
    const inProgressTasks = stepTasks.filter(
      (task) => task.status === 'IN_PROGRESS'
    )

    return {
      total: stepTasks.length,
      completed: completedTasks.length,
      inProgress: inProgressTasks.length,
      percentage:
        stepTasks.length > 0
          ? (completedTasks.length / stepTasks.length) * 100
          : 100, // Boş aşamalar %100 kabul edilir
      isCompleted:
        stepTasks.length === 0 || completedTasks.length === stepTasks.length, // Boş aşamalar tamamlanmış sayılır
    }
  }

  // Adımın tamamlanıp tamamlanmadığını kontrol et
  const isStepCompleted = (stepId: string) => {
    return getStepStats(stepId).isCompleted
  }

  // Bir önceki adımın tamamlanıp tamamlanmadığını kontrol et
  const isPreviousStepCompleted = (currentOrder: number) => {
    if (currentOrder === 1) return true // İlk adım her zaman başlatılabilir

    const previousStep = workflowSteps.find(
      (step) => step.order === currentOrder - 1
    )
    return previousStep ? isStepCompleted(previousStep.id) : false
  }

  // Adımı tamamla
  const handleStepComplete = async (stepId: string) => {
    const stepStats = getStepStats(stepId)

    let confirmComplete = true

    if (stepStats.total === 0) {
      // Boş aşama için onay iste
      confirmComplete = confirm(
        'Bu adımda hiç görev bulunmamaktadır. Bu adımı tamamlandı olarak işaretlemek istiyor musunuz?'
      )
    } else if (stepStats.completed !== stepStats.total) {
      // Tamamlanmamış görevler varsa onay iste
      confirmComplete = confirm(
        `Bu adımda ${
          stepStats.total - stepStats.completed
        } görev henüz tamamlanmadı. ` +
          'Bu adımı tamamlandı olarak işaretlersek, tüm görevler otomatik olarak tamamlanacak. ' +
          'Devam etmek istiyor musunuz?'
      )
    }

    if (!confirmComplete) return

    setCompletingStep(stepId)

    try {
      const response = await fetch(
        `/api/projects/${projectId}/workflow/${stepId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ markAsCompleted: true }),
        }
      )

      if (response.ok) {
        await onStepComplete(stepId)
      } else {
        throw new Error('API call failed')
      }
    } catch (error) {
      console.error('Adım tamamlanırken hata oluştu:', error)
      alert('Adım tamamlanırken bir hata oluştu. Lütfen tekrar deneyin.')
    } finally {
      setCompletingStep(null)
    }
  }

  // Genel ilerleme hesapla
  const overallProgress = workflowSteps.reduce((acc, step) => {
    const stats = getStepStats(step.id)
    return acc + (stats.isCompleted ? 1 : 0)
  }, 0)

  const overallPercentage =
    workflowSteps.length > 0
      ? (overallProgress / workflowSteps.length) * 100
      : 0

  return (
    <div className='bg-white shadow rounded-lg p-6'>
      <div className='flex items-center justify-between mb-6'>
        <h2 className='text-lg font-medium text-gray-900'>
          İş Akışı İlerlemesi
        </h2>
        <div className='text-sm text-gray-500'>
          {overallProgress}/{workflowSteps.length} adım tamamlandı (%
          {Math.round(overallPercentage)})
        </div>
      </div>

      {/* Genel İlerleme Çubuğu */}
      <div className='mb-6'>
        <div className='w-full bg-gray-200 rounded-full h-2'>
          <div
            className='bg-green-600 h-2 rounded-full transition-all duration-300'
            style={{ width: `${overallPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* All Steps Completed Success Message */}
      {overallPercentage === 100 && (
        <div className='mb-6 bg-green-50 border border-green-200 rounded-lg p-4'>
          <div className='flex items-center'>
            <Check className='w-5 h-5 text-green-600 mr-2' />
            <div>
              <h3 className='text-sm font-medium text-green-900'>
                Tüm İş Akışı Adımları Tamamlandı! 🎉
              </h3>
              <p className='text-sm text-green-700 mt-1'>
                Artık projeyi &quot;Tamamlandı&quot; olarak
                işaretleyebilirsiniz.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Workflow Adımları */}
      <div className='space-y-4'>
        {workflowSteps.map((step, index) => {
          const stats = getStepStats(step.id)
          const isCompleted = stats.isCompleted
          const canStart = isPreviousStepCompleted(step.order)
          const isActive = canStart && !isCompleted
          const isBlocked = !canStart

          return (
            <div
              key={step.id}
              className={`relative flex items-center p-4 rounded-lg border-2 transition-all ${
                isCompleted
                  ? 'border-green-500 bg-green-50'
                  : isActive
                  ? 'border-blue-500 bg-blue-50'
                  : isBlocked
                  ? 'border-gray-300 bg-gray-50'
                  : 'border-gray-300 bg-white'
              }`}
            >
              {/* Adım Numarası / Checkbox */}
              <div className='flex-shrink-0 mr-4'>
                {isCompleted ? (
                  <div className='w-8 h-8 bg-green-500 rounded-full flex items-center justify-center'>
                    <Check className='w-5 h-5 text-white' />
                  </div>
                ) : isActive && stats.total === 0 ? (
                  // Sadece boş aşamalar için manuel checkbox
                  <button
                    onClick={() => handleStepComplete(step.id)}
                    disabled={completingStep === step.id}
                    className='w-8 h-8 border-2 border-blue-500 rounded-full flex items-center justify-center hover:bg-blue-500 hover:text-white transition-colors disabled:opacity-50'
                    title='Bu boş adımı tamamla'
                  >
                    {completingStep === step.id ? (
                      <div className='w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin'></div>
                    ) : (
                      <span className='text-sm font-medium text-blue-500'>
                        {step.order}
                      </span>
                    )}
                  </button>
                ) : isActive ? (
                  // Görevli aşamalar için sadece numara (otomatik tamamlanır)
                  <div className='w-8 h-8 border-2 border-blue-500 rounded-full flex items-center justify-center bg-blue-50'>
                    <span className='text-sm font-medium text-blue-500'>
                      {step.order}
                    </span>
                  </div>
                ) : (
                  <div className='w-8 h-8 border-2 border-gray-300 rounded-full flex items-center justify-center'>
                    <span className='text-sm font-medium text-gray-400'>
                      {step.order}
                    </span>
                  </div>
                )}
              </div>

              {/* Adım Detayları */}
              <div className='flex-1'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center'>
                    <h3
                      className={`font-medium ${
                        isCompleted
                          ? 'text-green-900'
                          : isActive
                          ? 'text-blue-900'
                          : 'text-gray-500'
                      }`}
                    >
                      {step.name}
                    </h3>
                    <div
                      className='w-3 h-3 rounded-full ml-2'
                      style={{ backgroundColor: step.color }}
                    ></div>
                  </div>

                  {/* Durum İkonu */}
                  <div className='flex items-center space-x-2'>
                    {isCompleted && (
                      <span className='text-xs text-green-600 font-medium'>
                        Tamamlandı
                      </span>
                    )}
                    {isActive && stats.inProgress > 0 && (
                      <div className='flex items-center text-xs text-blue-600'>
                        <Clock className='w-3 h-3 mr-1' />
                        Devam Ediyor
                      </div>
                    )}
                    {isBlocked && (
                      <div className='flex items-center text-xs text-gray-500'>
                        <AlertCircle className='w-3 h-3 mr-1' />
                        Bekliyor
                      </div>
                    )}
                  </div>
                </div>

                {/* Görev İstatistikleri */}
                <div className='mt-2'>
                  <div className='flex items-center justify-between text-sm text-gray-600'>
                    <span>
                      {stats.total === 0
                        ? 'Bu aşamada görev yok'
                        : `${stats.completed}/${stats.total} görev tamamlandı`}
                    </span>
                    <span>%{Math.round(stats.percentage)}</span>
                  </div>

                  {stats.total > 0 && (
                    <div className='mt-1 w-full bg-gray-200 rounded-full h-1'>
                      <div
                        className={`h-1 rounded-full transition-all duration-300 ${
                          isCompleted
                            ? 'bg-green-500'
                            : isActive
                            ? 'bg-blue-500'
                            : 'bg-gray-400'
                        }`}
                        style={{ width: `${stats.percentage}%` }}
                      ></div>
                    </div>
                  )}

                  {stats.total === 0 && (
                    <div className='mt-1 text-xs text-gray-500'>
                      Bu aşamayı tamamlandı olarak işaretleyebilirsiniz
                    </div>
                  )}
                </div>
              </div>

              {/* Bağlantı Oku */}
              {index < workflowSteps.length - 1 && (
                <div className='absolute -bottom-6 left-4 flex items-center justify-center'>
                  <ChevronRight
                    className={`w-4 h-4 ${
                      isCompleted ? 'text-green-500' : 'text-gray-300'
                    }`}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Özet */}
      <div className='mt-6 p-4 bg-gray-50 rounded-lg'>
        <div className='grid grid-cols-3 gap-4 text-center'>
          <div>
            <div className='text-lg font-bold text-green-600'>
              {overallProgress}
            </div>
            <div className='text-xs text-gray-500'>Tamamlanan Adım</div>
          </div>
          <div>
            <div className='text-lg font-bold text-blue-600'>
              {workflowSteps.length - overallProgress}
            </div>
            <div className='text-xs text-gray-500'>Kalan Adım</div>
          </div>
          <div>
            <div className='text-lg font-bold text-purple-600'>
              {tasks.filter((t) => t.status === 'COMPLETED').length}
            </div>
            <div className='text-xs text-gray-500'>Toplam Tamamlanan Görev</div>
          </div>
        </div>
      </div>
    </div>
  )
}
