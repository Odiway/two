'use client'

import React, { useState } from 'react'
import { 
  GitBranch, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  ArrowRight, 
  Zap,
  Shield,
  BarChart3,
  Info
} from 'lucide-react'
import { 
  DependencyVisualization, 
  ScheduleChange, 
  TaskNode, 
  TaskEdge 
} from '@/lib/dependency-manager'

interface DependencyVisualizerProps {
  visualization: DependencyVisualization
  scheduleChanges: ScheduleChange[]
  onTaskClick?: (taskId: string) => void
}

function DependencyVisualizer({ 
  visualization, 
  scheduleChanges, 
  onTaskClick 
}: DependencyVisualizerProps) {
  const [selectedTask, setSelectedTask] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'graph' | 'timeline' | 'changes'>('graph')

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-500'
      case 'IN_PROGRESS': return 'bg-blue-500'
      case 'REVIEW': return 'bg-purple-500'
      default: return 'bg-gray-400'
    }
  }

  const getTaskTypeIcon = (taskType: 'INDEPENDENT' | 'CONNECTED') => {
    return taskType === 'CONNECTED' ? <GitBranch className="w-4 h-4" /> : <Zap className="w-4 h-4" />
  }

  const getScheduleTypeIcon = (scheduleType?: 'SECURE' | 'AUTO' | 'STANDARD') => {
    switch (scheduleType) {
      case 'SECURE': return <Shield className="w-4 h-4 text-blue-600" />
      case 'AUTO': return <BarChart3 className="w-4 h-4 text-green-600" />
      case 'STANDARD': return <Clock className="w-4 h-4 text-orange-600" />
      default: return null
    }
  }

  const formatDate = (date?: Date) => {
    if (!date) return 'N/A'
    return date.toLocaleDateString('tr-TR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    })
  }

  const formatDaysDifference = (days: number) => {
    if (days === 0) return 'Değişiklik yok'
    if (days > 0) return `${days} gün gecikti`
    return `${Math.abs(days)} gün erkenledi`
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <GitBranch className="w-6 h-6 text-blue-600" />
              Görev Bağımlılıkları ve Etki Analizi
            </h3>
            <p className="text-gray-600 mt-1">
              Görev tamamlanmasının diğer görevlere etkisini görüntüleyin
            </p>
          </div>
          
          {/* View Mode Selector */}
          <div className="flex bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <button
              onClick={() => setViewMode('graph')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                viewMode === 'graph' 
                  ? 'bg-blue-500 text-white' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Bağımlılık Grafiği
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                viewMode === 'timeline' 
                  ? 'bg-blue-500 text-white' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Zaman Çizelgesi
            </button>
            <button
              onClick={() => setViewMode('changes')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                viewMode === 'changes' 
                  ? 'bg-blue-500 text-white' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Değişiklikler
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Graph View */}
        {viewMode === 'graph' && (
          <div className="space-y-6">
            {/* Legend */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-3">Görev Türleri</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-blue-600" />
                  <span className="text-sm">Bağlı Görev</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-orange-600" />
                  <span className="text-sm">Bağımsız Görev</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-600" />
                  <span className="text-sm">Güvenli Program</span>
                </div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Otomatik Program</span>
                </div>
              </div>
            </div>

            {/* Task Nodes */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {visualization.nodes.map((node) => (
                <div
                  key={node.id}
                  onClick={() => {
                    setSelectedTask(node.id)
                    onTaskClick?.(node.id)
                  }}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                    selectedTask === node.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  } ${
                    node.isOnCriticalPath ? 'ring-2 ring-red-200' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getTaskTypeIcon(node.taskType)}
                      {getScheduleTypeIcon(node.scheduleType)}
                    </div>
                    <div className="flex items-center gap-1">
                      <div className={`w-3 h-3 rounded-full ${getTaskStatusColor(node.status)}`} />
                      {node.isOnCriticalPath && (
                        <div title="Kritik Yol">
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <h5 className="font-semibold text-gray-800 mb-2 line-clamp-2">
                    {node.title}
                  </h5>
                  
                  <div className="space-y-1 text-xs text-gray-600">
                    <div>Tür: {node.taskType === 'CONNECTED' ? 'Bağlı' : 'Bağımsız'}</div>
                    {node.scheduleType && (
                      <div>
                        Program: {
                          node.scheduleType === 'SECURE' ? 'Güvenli' :
                          node.scheduleType === 'AUTO' ? 'Otomatik' : 'Standart'
                        }
                      </div>
                    )}
                    <div>Etki: {
                      node.impactLevel === 'HIGH' ? 'Yüksek' :
                      node.impactLevel === 'MEDIUM' ? 'Orta' : 'Düşük'
                    }</div>
                    {node.startDate && (
                      <div>Başlangıç: {formatDate(node.startDate)}</div>
                    )}
                    {node.endDate && (
                      <div>Bitiş: {formatDate(node.endDate)}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Connections */}
            {visualization.edges.length > 0 && (
              <div className="mt-6">
                <h4 className="font-semibold text-gray-800 mb-3">Bağımlılık İlişkileri</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  {visualization.edges.map((edge, index) => {
                    const fromTask = visualization.nodes.find(n => n.id === edge.from)
                    const toTask = visualization.nodes.find(n => n.id === edge.to)
                    
                    return (
                      <div key={index} className="flex items-center gap-3 py-2">
                        <span className="text-sm font-medium truncate max-w-32">
                          {fromTask?.title || 'Bilinmeyen'}
                        </span>
                        <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-sm font-medium truncate max-w-32">
                          {toTask?.title || 'Bilinmeyen'}
                        </span>
                        {edge.delay > 0 && (
                          <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                            {edge.delay} gün gecikme
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Timeline View */}
        {viewMode === 'timeline' && (
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-800">Görev Zaman Çizelgesi</h4>
            <div className="space-y-3">
              {visualization.nodes
                .filter(node => node.startDate && node.endDate)
                .sort((a, b) => (a.startDate?.getTime() || 0) - (b.startDate?.getTime() || 0))
                .map((node) => (
                  <div key={node.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {getTaskTypeIcon(node.taskType)}
                      <span className="font-medium truncate">{node.title}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>{formatDate(node.startDate)}</span>
                      <ArrowRight className="w-4 h-4" />
                      <span>{formatDate(node.endDate)}</span>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${getTaskStatusColor(node.status)}`} />
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Changes View */}
        {viewMode === 'changes' && (
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-800">Program Değişiklikleri</h4>
            {scheduleChanges.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Info className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Henüz program değişikliği bulunmuyor.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {scheduleChanges.map((change, index) => {
                  const task = visualization.nodes.find(n => n.id === change.taskId)
                  return (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-start justify-between mb-2">
                        <h5 className="font-semibold text-gray-800">
                          {task?.title || 'Bilinmeyen Görev'}
                        </h5>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          change.impactDays > 0 
                            ? 'bg-red-100 text-red-800' 
                            : change.impactDays < 0
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {formatDaysDifference(change.impactDays)}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3">{change.reason}</p>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {change.oldStartDate && change.newStartDate && (
                          <div>
                            <span className="text-gray-500">Başlangıç:</span>
                            <div className="flex items-center gap-2">
                              <span className="line-through text-gray-400">
                                {formatDate(change.oldStartDate)}
                              </span>
                              <ArrowRight className="w-3 h-3 text-gray-400" />
                              <span className="font-medium">
                                {formatDate(change.newStartDate)}
                              </span>
                            </div>
                          </div>
                        )}
                        
                        {change.oldEndDate && change.newEndDate && (
                          <div>
                            <span className="text-gray-500">Bitiş:</span>
                            <div className="flex items-center gap-2">
                              <span className="line-through text-gray-400">
                                {formatDate(change.oldEndDate)}
                              </span>
                              <ArrowRight className="w-3 h-3 text-gray-400" />
                              <span className="font-medium">
                                {formatDate(change.newEndDate)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Critical Path Info */}
        {visualization.criticalPath.length > 0 && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <h4 className="font-semibold text-red-800">Kritik Yol</h4>
            </div>
            <p className="text-sm text-red-700 mb-3">
              Bu görevlerdeki gecikmeler projenin genel süresini etkileyecektir.
            </p>
            <div className="flex flex-wrap gap-2">
              {visualization.criticalPath.map(taskId => {
                const task = visualization.nodes.find(n => n.id === taskId)
                return (
                  <span 
                    key={taskId}
                    className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium"
                  >
                    {task?.title || 'Bilinmeyen'}
                  </span>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DependencyVisualizer
