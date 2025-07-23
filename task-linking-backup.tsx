// This is a backup of the working task linking interface component
// We'll use this to replace the broken section

import React from 'react'
import { GitBranch } from 'lucide-react'

interface Task {
  id: string
  title: string
  description?: string
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  startDate?: string
  endDate?: string
}

interface Project {
  id: string
  name: string
  tasks: Task[]
}

interface TaskLinkingInterfaceProps {
  project: Project
  taskSearchTerm: string
  setTaskSearchTerm: (term: string) => void
  taskStatusFilter: string
  setTaskStatusFilter: (filter: string) => void
  taskDependencies: Record<string, string[]>
  setTaskDependencies: React.Dispatch<React.SetStateAction<Record<string, string[]>>>
  taskDependents: Record<string, string[]>
  setTaskDependents: React.Dispatch<React.SetStateAction<Record<string, string[]>>>
  saveDependenciesToBackend: (taskId: string) => Promise<void>
}

const TaskLinkingInterface: React.FC<TaskLinkingInterfaceProps> = ({
  project,
  taskSearchTerm,
  setTaskSearchTerm,
  taskStatusFilter,
  setTaskStatusFilter,
  taskDependencies,
  setTaskDependencies,
  taskDependents,
  setTaskDependents,
  saveDependenciesToBackend
}) => {
  const filteredTasks = project.tasks.filter((task) => {
    const matchesSearch = taskSearchTerm === '' || 
      task.title.toLowerCase().includes(taskSearchTerm.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(taskSearchTerm.toLowerCase()));
    
    const matchesStatus = taskStatusFilter === '' || task.status === taskStatusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className='bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-4 sm:p-6 lg:p-8'>
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6'>
        <h3 className='text-xl font-bold text-gray-800 flex items-center gap-2'>
          🔗 Görev Bağlantı Matrisi
        </h3>
        
        {/* Quick filters and search */}
        <div className='flex flex-col sm:flex-row gap-2'>
          <select 
            value={taskStatusFilter}
            onChange={(e) => setTaskStatusFilter(e.target.value)}
            className='px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white'
          >
            <option value=''>Tüm Görevler</option>
            <option value='COMPLETED'>Tamamlanan</option>
            <option value='IN_PROGRESS'>Devam Eden</option>
            <option value='REVIEW'>İncelemede</option>
            <option value='TODO'>Bekleyen</option>
          </select>
          <input 
            type='text' 
            placeholder='Görev ara...' 
            value={taskSearchTerm}
            onChange={(e) => setTaskSearchTerm(e.target.value)}
            className='px-3 py-2 border border-gray-300 rounded-lg text-sm w-full sm:w-48'
          />
        </div>
      </div>

      <div className='space-y-4'>
        {filteredTasks.map((task) => {
          const dependencyCount = (taskDependencies[task.id] || []).length;
          const dependentCount = (taskDependents[task.id] || []).length;
          const hasConnections = dependencyCount > 0 || dependentCount > 0;
          
          return (
            <div
              key={task.id}
              className={`bg-white/80 rounded-xl border-2 transition-all duration-200 hover:shadow-lg p-4 sm:p-6 ${
                hasConnections 
                  ? 'border-blue-200 bg-blue-50/50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* Task Header */}
              <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4'>
                <div className='flex items-center gap-3 min-w-0 flex-1'>
                  <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full flex-shrink-0 ${
                    task.status === 'COMPLETED' ? 'bg-green-500' :
                    task.status === 'IN_PROGRESS' ? 'bg-blue-500' :
                    task.status === 'REVIEW' ? 'bg-yellow-500' : 'bg-gray-400'
                  }`} />
                  <h4 className='text-base sm:text-lg font-semibold text-gray-800 truncate'>
                    {task.title}
                  </h4>
                </div>
                <div className='flex items-center gap-2 flex-shrink-0'>
                  <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${
                    dependencyCount > 0 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    ⬆️ {dependencyCount}
                  </span>
                  <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${
                    dependentCount > 0 ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    ⬇️ {dependentCount}
                  </span>
                </div>
              </div>

              {/* Dependencies Grid */}
              <div className='grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6'>
                {/* Dependencies */}
                <div className='bg-blue-50/50 rounded-lg p-4'>
                  <h5 className='font-semibold text-gray-700 mb-3 flex items-center gap-2 text-sm sm:text-base'>
                    ⬆️ Bu görev şunlara bağımlı:
                  </h5>
                  <div className='space-y-2 max-h-32 sm:max-h-40 overflow-y-auto border border-blue-200 rounded-lg p-3 bg-white'>
                    {project.tasks.filter(t => t.id !== task.id).map(depTask => (
                      <label key={depTask.id} className='flex items-center gap-3 hover:bg-blue-50 p-2 rounded cursor-pointer'>
                        <input
                          type='checkbox'
                          checked={taskDependencies[task.id]?.includes(depTask.id) || false}
                          onChange={(e) => {
                            const current = taskDependencies[task.id] || [];
                            if (e.target.checked) {
                              setTaskDependencies(prev => ({
                                ...prev,
                                [task.id]: [...current, depTask.id]
                              }));
                            } else {
                              setTaskDependencies(prev => ({
                                ...prev,
                                [task.id]: current.filter(id => id !== depTask.id)
                              }));
                            }
                          }}
                        />
                        <div className='flex-1 min-w-0'>
                          <div className='text-sm font-medium text-gray-900 truncate'>{depTask.title}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Dependents */}
                <div className='bg-purple-50/50 rounded-lg p-4'>
                  <h5 className='font-semibold text-gray-700 mb-3 flex items-center gap-2 text-sm sm:text-base'>
                    ⬇️ Bu göreve bağlı görevler:
                  </h5>
                  <div className='space-y-2 max-h-32 sm:max-h-40 overflow-y-auto border border-purple-200 rounded-lg p-3 bg-white'>
                    {project.tasks.filter(t => t.id !== task.id).map(depTask => (
                      <label key={depTask.id} className='flex items-center gap-3 hover:bg-purple-50 p-2 rounded cursor-pointer'>
                        <input
                          type='checkbox'
                          checked={taskDependents[task.id]?.includes(depTask.id) || false}
                          onChange={(e) => {
                            const current = taskDependents[task.id] || [];
                            if (e.target.checked) {
                              setTaskDependents(prev => ({
                                ...prev,
                                [task.id]: [...current, depTask.id]
                              }));
                            } else {
                              setTaskDependents(prev => ({
                                ...prev,
                                [task.id]: current.filter(id => id !== depTask.id)
                              }));
                            }
                          }}
                        />
                        <div className='flex-1 min-w-0'>
                          <div className='text-sm font-medium text-gray-900 truncate'>{depTask.title}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className='mt-4 pt-4 border-t border-gray-200 flex justify-end'>
                <button
                  onClick={async () => {
                    try {
                      await saveDependenciesToBackend(task.id);
                      const deps = taskDependencies[task.id] || [];
                      const dependents = taskDependents[task.id] || [];
                      alert(`✅ "${task.title}" kaydedildi! Bağımlılık: ${deps.length}, Bağlı: ${dependents.length}`);
                    } catch (error) {
                      alert(`❌ Hata oluştu!`);
                    }
                  }}
                  className='px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm'
                >
                  💾 Kaydet
                </button>
              </div>
            </div>
          );
        })}

        {/* Empty State */}
        {filteredTasks.length === 0 && (
          <div className='text-center py-12 bg-white/50 rounded-xl border-2 border-dashed border-gray-300'>
            <div className='w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4'>
              <GitBranch className='w-8 h-8 text-gray-400' />
            </div>
            <h3 className='text-lg font-semibold text-gray-800 mb-2'>
              {taskSearchTerm || taskStatusFilter ? 'Filtreye uygun görev bulunamadı' : 'Henüz görev yok'}
            </h3>
            <p className='text-gray-600 mb-4'>
              {taskSearchTerm || taskStatusFilter 
                ? 'Arama kriterlerinizi değiştirmeyi deneyin'
                : 'Görev bağlantıları oluşturmak için önce görev eklemeniz gerekir'
              }
            </p>
            {(taskSearchTerm || taskStatusFilter) && (
              <button 
                onClick={() => {
                  setTaskSearchTerm('');
                  setTaskStatusFilter('');
                }}
                className='px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors'
              >
                Filtreleri Temizle
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskLinkingInterface;
