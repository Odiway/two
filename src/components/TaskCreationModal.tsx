'use client'

import React, { useState } from 'react'
import { Plus, Users, Calendar, CheckSquare, Folder, List } from 'lucide-react'

interface TaskCreationModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateTask: (taskData: any) => void
  onCreateTaskGroup: (groupData: any) => void
  projectId: string
  users: any[]
}

export default function TaskCreationModal({
  isOpen,
  onClose,
  onCreateTask,
  onCreateTaskGroup,
  projectId,
  users
}: TaskCreationModalProps) {
  const [creationType, setCreationType] = useState<'individual' | 'group'>('individual')
  const [taskData, setTaskData] = useState({
    title: '',
    description: '',
    assignedId: '',
    priority: 'MEDIUM',
    estimatedHours: '',
    startDate: '',
    endDate: ''
  })
  
  const [groupData, setGroupData] = useState({
    groupTitle: '',
    groupDescription: '',
    tasks: [
      {
        title: '',
        description: '',
        assignedId: '',
        priority: 'MEDIUM',
        estimatedHours: '',
        order: 1
      }
    ]
  })

  if (!isOpen) return null

  const addTaskToGroup = () => {
    setGroupData(prev => ({
      ...prev,
      tasks: [
        ...prev.tasks,
        {
          title: '',
          description: '',
          assignedId: '',
          priority: 'MEDIUM',
          estimatedHours: '',
          order: prev.tasks.length + 1
        }
      ]
    }))
  }

  const removeTaskFromGroup = (index: number) => {
    setGroupData(prev => ({
      ...prev,
      tasks: prev.tasks.filter((_, i) => i !== index)
    }))
  }

  const updateGroupTask = (index: number, field: string, value: string) => {
    setGroupData(prev => ({
      ...prev,
      tasks: prev.tasks.map((task, i) => 
        i === index ? { ...task, [field]: value } : task
      )
    }))
  }

  // Validation helper functions
  const validateIndividualTask = () => {
    const errors = []
    
    if (!taskData.title.trim()) errors.push('Görev başlığı gereklidir')
    if (!taskData.assignedId) errors.push('Atanan kişi seçilmelidir')
    if (!taskData.estimatedHours || parseInt(taskData.estimatedHours) <= 0) {
      errors.push('Geçerli bir tahmini süre girilmelidir (minimum 1 saat)')
    }
    if (!taskData.startDate) errors.push('Başlangıç tarihi seçilmelidir')
    if (!taskData.endDate) errors.push('Bitiş tarihi seçilmelidir')
    
    if (taskData.startDate && taskData.endDate) {
      const start = new Date(taskData.startDate)
      const end = new Date(taskData.endDate)
      if (end <= start) {
        errors.push('Bitiş tarihi başlangıç tarihinden sonra olmalıdır')
      }
    }
    
    return errors
  }

  const validateTaskGroup = () => {
    const errors = []
    
    if (!groupData.groupTitle.trim()) errors.push('Grup başlığı gereklidir')
    
    groupData.tasks.forEach((task, index) => {
      if (!task.title.trim()) errors.push(`Alt görev #${index + 1}: Başlık gereklidir`)
      if (!task.assignedId) errors.push(`Alt görev #${index + 1}: Atanan kişi seçilmelidir`)
      if (!task.estimatedHours || parseInt(task.estimatedHours) <= 0) {
        errors.push(`Alt görev #${index + 1}: Geçerli bir tahmini süre girilmelidir`)
      }
    })
    
    return errors
  }

  const handleSubmit = () => {
    const errors = creationType === 'individual' 
      ? validateIndividualTask() 
      : validateTaskGroup()
    
    if (errors.length > 0) {
      alert('Lütfen aşağıdaki hataları düzeltin:\n\n' + errors.join('\n'))
      return
    }

    if (creationType === 'individual') {
      onCreateTask({
        ...taskData,
        projectId,
        taskType: 'INDIVIDUAL',
        isGroupParent: false,
        parentTaskId: null,
        groupOrder: 0,
        estimatedHours: parseInt(taskData.estimatedHours)
      })
    } else {
      onCreateTaskGroup({
        ...groupData,
        projectId,
        tasks: groupData.tasks.map(task => ({
          ...task,
          estimatedHours: parseInt(task.estimatedHours)
        }))
      })
    }
    
    // Reset form
    setTaskData({
      title: '',
      description: '',
      assignedId: '',
      priority: 'MEDIUM',
      estimatedHours: '',
      startDate: '',
      endDate: ''
    })
    setGroupData({
      groupTitle: '',
      groupDescription: '',
      tasks: [{
        title: '',
        description: '',
        assignedId: '',
        priority: 'MEDIUM',
        estimatedHours: '',
        order: 1
      }]
    })
    
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Yeni Görev Oluştur</h2>
            <button
              onClick={onClose}
              className="text-white hover:text-blue-200 transition-colors p-2 hover:bg-white/20 rounded-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Task Type Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Görev Türü Seçin
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setCreationType('individual')}
                className={`p-4 border-2 rounded-lg transition-all text-left ${
                  creationType === 'individual'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <CheckSquare className="w-6 h-6 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">Tekil Görev</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Bağımsız olarak çalışılabilecek tek bir görev oluşturun
                </p>
              </button>
              
              <button
                onClick={() => setCreationType('group')}
                className={`p-4 border-2 rounded-lg transition-all text-left ${
                  creationType === 'group'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <Folder className="w-6 h-6 text-green-600" />
                  <h3 className="font-semibold text-gray-900">Görev Grubu</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Birbiriyle ilişkili birden fazla alt görev oluşturun
                </p>
              </button>
            </div>
          </div>

          {/* Individual Task Form */}
          {creationType === 'individual' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Görev Başlığı *
                </label>
                <input
                  type="text"
                  value={taskData.title}
                  onChange={(e) => setTaskData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Görev başlığını yazın..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Açıklama
                </label>
                <textarea
                  value={taskData.description}
                  onChange={(e) => setTaskData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Görev detaylarını yazın..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Atanan Kişi *
                  </label>
                  <select
                    value={taskData.assignedId}
                    onChange={(e) => setTaskData(prev => ({ ...prev, assignedId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Seçiniz...</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>{user.name}</option>
                    ))}
                  </select>
                  {!taskData.assignedId && (
                    <p className="text-xs text-red-500 mt-1">Bu alan zorunludur</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Öncelik
                  </label>
                  <select
                    value={taskData.priority}
                    onChange={(e) => setTaskData(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="LOW">Düşük</option>
                    <option value="MEDIUM">Orta</option>
                    <option value="HIGH">Yüksek</option>
                    <option value="URGENT">Acil</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tahmini Süre (saat) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="200"
                    value={taskData.estimatedHours}
                    onChange={(e) => setTaskData(prev => ({ ...prev, estimatedHours: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="8"
                    required
                  />
                  {(!taskData.estimatedHours || parseInt(taskData.estimatedHours) <= 0) && (
                    <p className="text-xs text-red-500 mt-1">Bu alan zorunludur (min: 1 saat)</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Başlangıç Tarihi *
                  </label>
                  <input
                    type="date"
                    value={taskData.startDate}
                    onChange={(e) => setTaskData(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                  {!taskData.startDate && (
                    <p className="text-xs text-red-500 mt-1">Bu alan zorunludur</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bitiş Tarihi *
                  </label>
                  <input
                    type="date"
                    value={taskData.endDate}
                    onChange={(e) => setTaskData(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min={taskData.startDate}
                    required
                  />
                  {!taskData.endDate && (
                    <p className="text-xs text-red-500 mt-1">Bu alan zorunludur</p>
                  )}
                  {taskData.startDate && taskData.endDate && new Date(taskData.endDate) <= new Date(taskData.startDate) && (
                    <p className="text-xs text-red-500 mt-1">Bitiş tarihi başlangıçtan sonra olmalı</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Task Group Form */}
          {creationType === 'group' && (
            <div className="space-y-6">
              {/* Group Info */}
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Grup Başlığı *
                    </label>
                    <input
                      type="text"
                      value={groupData.groupTitle}
                      onChange={(e) => setGroupData(prev => ({ ...prev, groupTitle: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Örn: Kullanıcı Arayüzü Geliştirme"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Grup Açıklaması
                    </label>
                    <textarea
                      value={groupData.groupDescription}
                      onChange={(e) => setGroupData(prev => ({ ...prev, groupDescription: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={2}
                      placeholder="Bu görev grubunun amacını açıklayın..."
                    />
                  </div>
                </div>
              </div>

              {/* Group Tasks */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Alt Görevler</h3>
                  <button
                    onClick={addTaskToGroup}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Görev Ekle
                  </button>
                </div>

                <div className="space-y-4">
                  {groupData.tasks.map((task, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">Alt Görev #{index + 1}</h4>
                        {groupData.tasks.length > 1 && (
                          <button
                            onClick={() => removeTaskFromGroup(index)}
                            className="text-red-500 hover:text-red-700 transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div>
                          <input
                            type="text"
                            value={task.title}
                            onChange={(e) => updateGroupTask(index, 'title', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Alt görev başlığı..."
                          />
                        </div>

                        <div>
                          <textarea
                            value={task.description}
                            onChange={(e) => updateGroupTask(index, 'description', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            rows={2}
                            placeholder="Alt görev açıklaması..."
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <select
                            value={task.assignedId}
                            onChange={(e) => updateGroupTask(index, 'assignedId', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                          >
                            <option value="">Atanan Kişi *</option>
                            {users.map(user => (
                              <option key={user.id} value={user.id}>{user.name}</option>
                            ))}
                          </select>

                          <select
                            value={task.priority}
                            onChange={(e) => updateGroupTask(index, 'priority', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="LOW">Düşük</option>
                            <option value="MEDIUM">Orta</option>
                            <option value="HIGH">Yüksek</option>
                            <option value="URGENT">Acil</option>
                          </select>

                          <input
                            type="number"
                            min="1"
                            max="200"
                            value={task.estimatedHours}
                            onChange={(e) => updateGroupTask(index, 'estimatedHours', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Saat *"
                            required
                          />
                        </div>
                        
                        {/* Validation messages for group tasks */}
                        <div className="mt-2 space-y-1">
                          {!task.title.trim() && (
                            <p className="text-xs text-red-500">Başlık gereklidir</p>
                          )}
                          {!task.assignedId && (
                            <p className="text-xs text-red-500">Atanan kişi seçilmelidir</p>
                          )}
                          {(!task.estimatedHours || parseInt(task.estimatedHours) <= 0) && (
                            <p className="text-xs text-red-500">Geçerli bir tahmini süre girilmelidir</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              İptal
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {creationType === 'individual' ? 'Görev Oluştur' : 'Görev Grubu Oluştur'}
            </button>
          </div>

          {/* Validation Requirements Info */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-sm font-medium text-blue-800 mb-2">✋ Zorunlu Alanlar:</h4>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Görev başlığı</li>
              <li>• Atanan kişi</li>
              <li>• Tahmini süre (minimum 1 saat)</li>
              {creationType === 'individual' && (
                <>
                  <li>• Başlangıç ve bitiş tarihleri</li>
                  <li>• Bitiş tarihi başlangıçtan sonra olmalı</li>
                </>
              )}
            </ul>
            <p className="text-xs text-blue-600 mt-2 font-medium">
              Bu alanlar iş yükü hesaplaması için kritik öneme sahiptir.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
