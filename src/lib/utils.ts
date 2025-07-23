import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string | null) {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function formatDateTime(date: Date | string | null) {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function getStatusColor(status: string) {
  switch (status) {
    case 'TODO':
      return 'bg-gray-100 text-gray-800'
    case 'IN_PROGRESS':
      return 'bg-blue-100 text-blue-800'
    case 'REVIEW':
      return 'bg-yellow-100 text-yellow-800'
    case 'COMPLETED':
      return 'bg-green-100 text-green-800'
    case 'PLANNING':
      return 'bg-purple-100 text-purple-800'
    case 'ON_HOLD':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export function getPriorityColor(priority: string) {
  switch (priority) {
    case 'LOW':
      return 'bg-green-100 text-green-800'
    case 'MEDIUM':
      return 'bg-yellow-100 text-yellow-800'
    case 'HIGH':
      return 'bg-orange-100 text-orange-800'
    case 'URGENT':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export function getStatusText(status: string) {
  switch (status) {
    case 'TODO':
      return 'Yapılacak'
    case 'IN_PROGRESS':
      return 'Devam Ediyor'
    case 'REVIEW':
      return 'İnceleme'
    case 'COMPLETED':
      return 'Tamamlandı'
    case 'PLANNING':
      return 'Planlama'
    case 'ON_HOLD':
      return 'Beklemede'
    default:
      return status
  }
}

export function getPriorityText(priority: string) {
  switch (priority) {
    case 'LOW':
      return 'Düşük'
    case 'MEDIUM':
      return 'Orta'
    case 'HIGH':
      return 'Yüksek'
    case 'URGENT':
      return 'Acil'
    default:
      return priority
  }
}
